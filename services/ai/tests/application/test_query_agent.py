from app.application.ports.vector_store import RetrievedDocument
from app.application.use_cases.query_agent import QueryAgentUseCase


class StubEmbeddings:
    def __init__(self) -> None:
        self.calls = []

    def embed_texts(self, inputs):
        self.calls.append(list(inputs))
        return [[0.1, 0.2, 0.3]]


class StubChat:
    def __init__(self) -> None:
        self.calls = []

    def generate(self, system_prompt, user_prompt):
        self.calls.append((system_prompt, user_prompt))
        return "answer"


class StubVectorStore:
    def __init__(self, docs) -> None:
        self.docs = docs
        self.calls = []

    def query(self, embedding, top_k):
        self.calls.append((embedding, top_k))
        return self.docs


class StubEventBus:
    def __init__(self) -> None:
        self.events = []

    def publish(self, name, payload):
        self.events.append((name, payload))


def test_query_agent_executes_and_publishes() -> None:
    docs = [
        RetrievedDocument(
            doc_id="doc-1",
            content="User u1: name=Ada",
            metadata={"source": "users"},
            distance=0.1,
        ),
        RetrievedDocument(
            doc_id="doc-2",
            content="Role Admin",
            metadata={"source": "roles"},
            distance=0.2,
        ),
    ]
    embeddings = StubEmbeddings()
    chat = StubChat()
    vector_store = StubVectorStore(docs)
    event_bus = StubEventBus()

    use_case = QueryAgentUseCase(
        embeddings=embeddings,
        chat=chat,
        vector_store=vector_store,
        event_bus=event_bus,
    )

    result = use_case.execute(
        question="Who is Ada?",
        top_k=2,
        actor_id="actor",
        actor_role="ops",
    )

    assert result.answer == "answer"
    assert result.sources == docs
    assert embeddings.calls == [["Who is Ada?"]]
    assert vector_store.calls == [([0.1, 0.2, 0.3], 2)]
    assert "[1] User u1: name=Ada" in chat.calls[0][1]
    assert event_bus.events[0][0] == "AiQueried"
    assert event_bus.events[0][1]["sourceCount"] == 2
