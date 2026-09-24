"""Evidence store: exact bytes on disk, a hash-chained observation log, HTTP state.

Git history is the archive; this module guarantees that every stored version has
exactly one log entry, and that the log cannot be edited without detection.
"""

import hashlib
import json
import os
import tempfile
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Final, cast

LOG_PATH: Final = "log/observations.jsonl"
STATE_PATH: Final = "state/http.json"
HEARTBEAT_PATH: Final = "status/heartbeat.json"
GENESIS: Final = "0" * 64

type Json = dict[str, object]


class IntegrityError(RuntimeError):
    """The log chain or a stored file does not match the recorded evidence."""


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical(obj: object) -> bytes:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()


def utc_iso(ts: datetime) -> str:
    return ts.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_utc(text: str) -> datetime:
    return datetime.strptime(text, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)


def as_object(value: object, where: str) -> Json:
    if not isinstance(value, dict):
        raise IntegrityError(f"{where}: expected a JSON object")
    return cast(Json, value)  # JSON object keys are always strings


def _atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.")
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(data)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


@dataclass(frozen=True, slots=True)
class UrlState:
    sha256: str
    etags: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class Archive:
    root: Path

    def stored_sha(self, rel: str) -> str | None:
        path = self.root / rel
        return sha256_hex(path.read_bytes()) if path.exists() else None

    def read(self, rel: str) -> bytes | None:
        path = self.root / rel
        return path.read_bytes() if path.exists() else None

    def store(self, rel: str, body: bytes) -> None:
        _atomic_write(self.root / rel, body)

    def entries(self) -> list[Json]:
        path = self.root / LOG_PATH
        if not path.exists():
            return []
        lines = path.read_text(encoding="utf-8").splitlines()
        return [as_object(json.loads(line), f"{LOG_PATH}:{n}") for n, line in enumerate(lines, 1)]

    def append(self, entry: Mapping[str, object]) -> Json:
        """Append one observation, chained to the previous entry's hash."""
        prior = self.entries()
        record: Json = {**entry, "seq": len(prior) + 1, "prev": prior[-1]["hash"] if prior else GENESIS}
        record["hash"] = sha256_hex(canonical(record))
        path = self.root / LOG_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as fh:
            fh.write(canonical(record).decode() + "\n")
            fh.flush()
            os.fsync(fh.fileno())
        return record

    def verify(self) -> int:
        """Check the chain and that each stored file equals its latest logged version.

        Returns the number of verified entries; raises IntegrityError on any mismatch.
        """
        prev = GENESIS
        latest: dict[str, str] = {}
        entries = self.entries()
        for i, rec in enumerate(entries, 1):
            body = {k: v for k, v in rec.items() if k != "hash"}
            if rec.get("seq") != i:
                raise IntegrityError(f"entry {i}: seq is {rec.get('seq')!r}")
            if rec.get("prev") != prev:
                raise IntegrityError(f"entry {i}: does not chain to the previous entry")
            if sha256_hex(canonical(body)) != rec.get("hash"):
                raise IntegrityError(f"entry {i}: content does not match its hash")
            prev = str(rec["hash"])
            latest[str(rec["path"])] = str(rec["sha256"])
        for rel, sha in sorted(latest.items()):
            if self.stored_sha(rel) != sha:
                raise IntegrityError(f"{rel}: stored bytes differ from the last logged version")
        return len(entries)

    def read_state(self) -> dict[str, UrlState]:
        raw = self.read(STATE_PATH)
        if raw is None:
            return {}
        state: dict[str, UrlState] = {}
        for url, value in as_object(json.loads(raw), STATE_PATH).items():
            obj = as_object(value, f"{STATE_PATH}:{url}")
            tags = cast(list[object], obj.get("etags", []))
            state[url] = UrlState(str(obj["sha256"]), tuple(str(t) for t in tags))
        return state

    def write_state(self, state: Mapping[str, UrlState]) -> None:
        data = {u: {"sha256": s.sha256, "etags": list(s.etags)} for u, s in sorted(state.items())}
        _atomic_write(self.root / STATE_PATH, json.dumps(data, indent=2).encode() + b"\n")

    def last_heartbeat(self) -> datetime | None:
        raw = self.read(HEARTBEAT_PATH)
        if raw is None:
            return None
        return parse_utc(str(as_object(json.loads(raw), HEARTBEAT_PATH)["checked_at"]))

    def write_heartbeat(self, at: datetime, summary: Mapping[str, object]) -> None:
        data = {"checked_at": utc_iso(at), **summary}
        text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
        _atomic_write(self.root / HEARTBEAT_PATH, text.encode())
