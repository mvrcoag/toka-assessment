import argparse
import json
import math
import os
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from app.application.use_cases.query_agent import QueryAgentUseCase
from app.core.config import Settings
from app.infrastructure.chroma.vector_store import ChromaVectorStore
from app.infrastructure.openai.client import OpenAIChatClient, OpenAIEmbeddingClient

SYSTEM_PROMPT = (
    "You are a helpful operations assistant. Answer using only the provided context. "
    "If the answer is not in the context, say you do not have enough data. "
    "If the question is about audit logs, say whether any audit data appears in context. "
    "Suggest running ingestion to refresh the knowledge base when data is missing."
)

DEFAULT_INPUT_COST_PER_1K = float(os.getenv("OPENAI_INPUT_COST_PER_1K", "0"))
DEFAULT_OUTPUT_COST_PER_1K = float(os.getenv("OPENAI_OUTPUT_COST_PER_1K", "0"))


@dataclass(frozen=True)
class EvalMetrics:
    question: str
    top_k: int
    latency_ms: float
    prompt_tokens: int
    completion_tokens: int
    input_cost: float
    output_cost: float
    total_cost: float
    source_count: int
    answer_length: int
    keyword_overlap: float
    quality_pass: bool
    quality_notes: list[str]


class NoopEventBus:
    def publish(self, name: str, payload: dict) -> None:  # noqa: ARG002
        return None


def load_questions(args: argparse.Namespace) -> list[dict[str, Any]]:
    if args.questions:
        return [
            {"question": question, "top_k": args.top_k} for question in args.questions
        ]

    if not args.questions_file:
        raise SystemExit("Provide --question or --questions-file")

    path = Path(args.questions_file)
    if not path.exists():
        raise SystemExit(f"Questions file not found: {path}")

    content = path.read_text(encoding="utf-8").strip()
    if not content:
        return []

    if path.suffix.lower() == ".json":
        data = json.loads(content)
        if isinstance(data, list):
            return [normalize_question(item, args.top_k) for item in data]
        raise SystemExit("JSON file must contain a list")

    questions: list[dict[str, Any]] = []
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        questions.append({"question": stripped, "top_k": args.top_k})
    return questions


def normalize_question(item: Any, default_top_k: int) -> dict[str, Any]:
    if isinstance(item, str):
        return {"question": item, "top_k": default_top_k}
    if isinstance(item, dict):
        question = item.get("question") or item.get("q")
        top_k = item.get("top_k", default_top_k)
        if not question:
            raise SystemExit("Question entry missing 'question'")
        return {"question": str(question), "top_k": int(top_k)}
    raise SystemExit("Unsupported question entry")


def estimate_tokens(text: str, encoder: Any | None) -> int:
    if encoder:
        return len(encoder.encode(text))
    return max(1, math.ceil(len(text) / 4))


def get_token_encoder(model: str) -> Any | None:
    try:
        import tiktoken  # type: ignore
    except ModuleNotFoundError:
        return None

    try:
        return tiktoken.encoding_for_model(model)
    except KeyError:
        return tiktoken.get_encoding("cl100k_base")


def extract_keywords(text: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z0-9']+", text.lower())
    stopwords = {
        "the",
        "and",
        "or",
        "for",
        "with",
        "that",
        "this",
        "from",
        "are",
        "was",
        "were",
        "have",
        "has",
        "had",
        "your",
        "you",
        "but",
        "not",
        "can",
        "will",
        "may",
        "should",
        "could",
        "would",
        "about",
        "into",
        "when",
        "what",
        "which",
        "who",
        "how",
        "why",
        "any",
        "data",
        "context",
        "question",
        "answer",
    }
    return [token for token in tokens if token not in stopwords]


def evaluate_quality(
    question: str, answer: str, source_count: int
) -> tuple[bool, float, list[str]]:
    notes: list[str] = []
    answer_clean = answer.strip()
    has_answer = len(answer_clean) >= 12
    mentions_insufficient = bool(
        re.search(
            r"not enough data|insufficient data|cannot find|no data", answer_clean, re.I
        )
    )
    suggests_ingest = bool(re.search(r"ingest|ingestion|refresh", answer_clean, re.I))

    question_tokens = set(extract_keywords(question))
    answer_tokens = set(extract_keywords(answer_clean))
    overlap = 0.0
    if question_tokens:
        overlap = len(question_tokens & answer_tokens) / len(question_tokens)

    if source_count == 0:
        if not (mentions_insufficient or suggests_ingest):
            notes.append("no_sources_missing_disclaimer")
            return False, overlap, notes
        return True, overlap, notes

    if not has_answer:
        notes.append("answer_too_short")
    if overlap < 0.15:
        notes.append("low_keyword_overlap")
    if mentions_insufficient:
        notes.append("insufficient_data_with_sources")

    quality_pass = has_answer and overlap >= 0.15
    return quality_pass, overlap, notes


def build_context(sources: list[Any]) -> str:
    return "\n".join(
        f"[{index + 1}] {doc.content}" for index, doc in enumerate(sources)
    )


def run_evaluation(args: argparse.Namespace) -> list[EvalMetrics]:
    settings = Settings.from_env()
    if not settings.openai_api_key:
        raise SystemExit("OPENAI_API_KEY is required")

    encoder = get_token_encoder(settings.openai_chat_model)
    input_cost_per_1k = args.input_cost_per_1k
    output_cost_per_1k = args.output_cost_per_1k

    embeddings = OpenAIEmbeddingClient(settings)
    chat = OpenAIChatClient(settings)
    vector_store = ChromaVectorStore(settings)
    use_case = QueryAgentUseCase(embeddings, chat, vector_store, NoopEventBus())

    metrics: list[EvalMetrics] = []
    for item in load_questions(args):
        question = item["question"]
        top_k = int(item.get("top_k", args.top_k))
        start = time.perf_counter()
        result = use_case.execute(question, top_k)
        latency_ms = (time.perf_counter() - start) * 1000

        context = build_context(result.sources)
        user_prompt = f"Question: {question}\n\nContext:\n{context}"
        prompt_tokens = estimate_tokens(SYSTEM_PROMPT + user_prompt, encoder)
        completion_tokens = estimate_tokens(result.answer, encoder)

        input_cost = (prompt_tokens / 1000) * input_cost_per_1k
        output_cost = (completion_tokens / 1000) * output_cost_per_1k
        total_cost = input_cost + output_cost

        quality_pass, overlap, notes = evaluate_quality(
            question, result.answer, len(result.sources)
        )

        metrics.append(
            EvalMetrics(
                question=question,
                top_k=top_k,
                latency_ms=latency_ms,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                input_cost=input_cost,
                output_cost=output_cost,
                total_cost=total_cost,
                source_count=len(result.sources),
                answer_length=len(result.answer.strip()),
                keyword_overlap=overlap,
                quality_pass=quality_pass,
                quality_notes=notes,
            )
        )

    return metrics


def print_text_report(metrics: list[EvalMetrics]) -> None:
    if not metrics:
        print("No questions to evaluate.")
        return

    total_latency = sum(item.latency_ms for item in metrics)
    total_prompt_tokens = sum(item.prompt_tokens for item in metrics)
    total_completion_tokens = sum(item.completion_tokens for item in metrics)
    total_cost = sum(item.total_cost for item in metrics)

    print("Evaluation results")
    for item in metrics:
        print("-")
        print(f"question: {item.question}")
        print(f"top_k: {item.top_k}")
        print(f"latency_ms: {item.latency_ms:.2f}")
        print(f"tokens_prompt: {item.prompt_tokens}")
        print(f"tokens_completion: {item.completion_tokens}")
        print(f"cost_input: {item.input_cost:.6f}")
        print(f"cost_output: {item.output_cost:.6f}")
        print(f"cost_total: {item.total_cost:.6f}")
        print(f"source_count: {item.source_count}")
        print(f"answer_length: {item.answer_length}")
        print(f"keyword_overlap: {item.keyword_overlap:.2f}")
        print(f"quality_pass: {item.quality_pass}")
        if item.quality_notes:
            print(f"quality_notes: {', '.join(item.quality_notes)}")

    avg_latency = total_latency / len(metrics)
    print("-")
    print(f"avg_latency_ms: {avg_latency:.2f}")
    print(f"total_prompt_tokens: {total_prompt_tokens}")
    print(f"total_completion_tokens: {total_completion_tokens}")
    print(f"total_cost: {total_cost:.6f}")


def print_json_report(metrics: list[EvalMetrics]) -> None:
    payload = [asdict(item) for item in metrics]
    print(json.dumps(payload, indent=2))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Basic response evaluation for AI service"
    )
    parser.add_argument(
        "--question",
        dest="questions",
        action="append",
        help="Question to evaluate (repeatable)",
    )
    parser.add_argument(
        "--questions-file",
        help="Path to a text or JSON file of questions",
    )
    parser.add_argument("--top-k", type=int, default=5, help="Top K documents")
    parser.add_argument(
        "--input-cost-per-1k",
        type=float,
        default=DEFAULT_INPUT_COST_PER_1K,
        help="Input cost per 1K tokens",
    )
    parser.add_argument(
        "--output-cost-per-1k",
        type=float,
        default=DEFAULT_OUTPUT_COST_PER_1K,
        help="Output cost per 1K tokens",
    )
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    metrics = run_evaluation(args)
    if args.format == "json":
        print_json_report(metrics)
    else:
        print_text_report(metrics)


if __name__ == "__main__":
    main()
