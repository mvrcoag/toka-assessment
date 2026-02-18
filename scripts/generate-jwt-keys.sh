#!/usr/bin/env bash
set -euo pipefail

tmp_dir="$(mktemp -d)"
private_key="$tmp_dir/jwt-private.pem"
public_key="$tmp_dir/jwt-public.pem"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

openssl genrsa -out "$private_key" 2048 >/dev/null 2>&1
openssl rsa -in "$private_key" -pubout -out "$public_key" >/dev/null 2>&1

encode_key() {
  local key_file="$1"
  awk 'BEGIN{printf ""} {printf "%s\\n", $0} END{printf ""}' "$key_file"
}

echo "JWT_KID=toka-key-1"
echo "JWT_PRIVATE_KEY=$(encode_key "$private_key")"
echo "JWT_PUBLIC_KEY=$(encode_key "$public_key")"
