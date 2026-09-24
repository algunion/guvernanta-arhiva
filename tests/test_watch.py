"""What the watcher must archive, and what it must never archive, against a fake server."""

import json
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path

import httpx
import pytest

from guvernanta_arhiva.__main__ import main
from guvernanta_arhiva.archive import HEARTBEAT_PATH, LOG_PATH, Archive, IntegrityError, Json, sha256_hex
from guvernanta_arhiva.watch import RunReport, Target, run, wayback_witness

URL = "https://guvernanta.gov.ro/data/registry.json"
TARGETS = (Target("data/registry.json", "data/registry.json", "json", min_bytes=10),)


def registry(version: str = "2.0", n: int = 1) -> bytes:
    doc = {"schema_version": version, "generated_at": "2026-09-23T08:48:57Z", "appointments": list(range(n))}
    return json.dumps(doc).encode()


def ok(body: bytes, etag: str = 'W/"a"', ctype: str = "application/json") -> httpx.Response:
    return httpx.Response(200, content=body, headers={"content-type": ctype, "etag": etag})


@dataclass
class Env:
    archive: Archive
    queue: list[httpx.Response] = field(default_factory=list[httpx.Response])
    seen: list[httpx.Request] = field(default_factory=list[httpx.Request])
    now: datetime = datetime(2026, 9, 25, 8, 0, tzinfo=UTC)

    def respond(self, *responses: httpx.Response) -> None:
        self.queue = list(responses)

    def handler(self, request: httpx.Request) -> httpx.Response:
        self.seen.append(request)
        return self.queue.pop(0) if len(self.queue) > 1 else self.queue[0]

    def poll(self, witness: Callable[[str], Json] | None = None, backfill: bool = False) -> RunReport:
        with httpx.Client(transport=httpx.MockTransport(self.handler)) as client:
            return run(
                self.archive,
                client,
                now=lambda: self.now,
                sleep=lambda _s: None,
                witness=witness or (lambda url: {"ok": True, "capture": f"wb:{url}"}),
                backfill_witness=backfill,
                targets=TARGETS,
            )

    def files(self) -> dict[str, bytes]:
        root = self.archive.root
        return {str(p.relative_to(root)): p.read_bytes() for p in root.rglob("*") if p.is_file()}


@pytest.fixture
def env(tmp_path: Path) -> Env:
    return Env(Archive(tmp_path))


def test_first_capture_archives_exact_bytes_with_witness(env: Env) -> None:
    env.respond(ok(registry()))
    report = env.poll()
    assert [e["event"] for e in report.new_versions] == ["first_capture"]
    assert env.archive.read("data/registry.json") == registry()
    assert report.new_versions[0]["wayback"] == {"ok": True, "capture": f"wb:{URL}"}
    assert env.archive.verify() == 1


def test_unchanged_server_answer_changes_nothing(env: Env) -> None:
    env.respond(ok(registry()))
    env.poll()
    before = env.files()
    env.now += timedelta(minutes=30)
    env.respond(httpx.Response(304))
    report = env.poll()
    assert env.seen[-1].headers["if-none-match"] == 'W/"a"'
    assert (report.new_versions, report.heartbeat_written) == ([], False)
    assert env.files() == before


def test_new_version_is_confirmed_then_chained(env: Env) -> None:
    env.respond(ok(registry()))
    env.poll()
    env.now += timedelta(hours=1)
    env.respond(ok(registry(n=2), etag='W/"b"'), ok(registry(n=2), etag='W/"c"'))
    (entry,) = env.poll().new_versions
    assert entry["previous_sha256"] == sha256_hex(registry())
    assert entry["facts"] == {
        "schema_version": "2.0",
        "generated_at": "2026-09-23T08:48:57Z",
        "n_appointments": 2,
        "schema_changed": False,
    }
    assert env.archive.read_state()[URL].etags == ('W/"b"', 'W/"c"')
    assert env.archive.verify() == 2


def test_replica_disagreement_is_not_archived(env: Env) -> None:
    env.respond(ok(registry()))
    env.poll()
    env.respond(ok(registry(n=2)), ok(registry()))  # second download returns the old content
    report = env.poll()
    assert report.new_versions == [] and len(report.unconfirmed) == 1
    assert env.archive.read("data/registry.json") == registry()


@pytest.mark.parametrize(
    ("response", "problem"),
    [
        (ok(b"<html>mentenanta</html>", ctype="text/html"), "content-type"),
        (ok(b'{"schema_version": "2.0", "appoint'), "invalid JSON"),
        (ok(b"{}"), "too small"),
        (httpx.Response(403), "HTTP 403"),
    ],
)
def test_bad_answers_are_errors_not_versions(env: Env, response: httpx.Response, problem: str) -> None:
    env.respond(response)
    report = env.poll()
    assert report.new_versions == []
    assert len(report.errors) == 1 and problem in report.errors[0]
    assert env.archive.read("data/registry.json") is None


def test_editing_the_log_or_a_stored_file_is_detected(env: Env) -> None:
    env.respond(ok(registry()))
    env.poll()
    log = env.archive.root / LOG_PATH
    original = log.read_text(encoding="utf-8")
    log.write_text(original.replace('"bytes":', '"bytes":1', 1), encoding="utf-8")
    with pytest.raises(IntegrityError, match="hash"):
        env.archive.verify()
    log.write_text(original, encoding="utf-8")
    env.archive.store("data/registry.json", registry(n=9))
    with pytest.raises(IntegrityError, match="stored bytes"):
        env.archive.verify()


def test_heartbeat_is_written_once_a_day_without_log_entries(env: Env) -> None:
    env.respond(ok(registry()))
    env.poll()
    env.respond(httpx.Response(304))
    env.now += timedelta(hours=22)
    assert env.poll().heartbeat_written is False
    env.now += timedelta(hours=2)
    assert env.poll().heartbeat_written is True
    assert (env.archive.root / HEARTBEAT_PATH).exists()
    assert env.archive.verify() == 1


def test_record_imports_an_external_capture_with_provenance(env: Env, tmp_path: Path) -> None:
    capture = tmp_path / "wayback.json"
    capture.write_bytes(registry())
    code = main(
        [
            "record",
            "--root", str(env.archive.root),
            "--path", "data/registry.json",
            "--file", str(capture),
            "--url", URL,
            "--source", "wayback",
            "--observed-at", "2026-09-24T08:48:02Z",
            "--evidence", '{"capture": "https://web.archive.org/web/20260924084802/x"}',
        ]
    )  # fmt: skip
    assert code == 0
    (entry,) = env.archive.entries()
    assert entry["source"] == "wayback" and entry["sha256"] == sha256_hex(registry())
    assert env.archive.verify() == 1


def test_every_default_target_accepts_its_real_minimum_size() -> None:
    from guvernanta_arhiva.watch import TARGETS

    robots = next(t for t in TARGETS if t.store_path == "site/robots.txt")
    assert robots.min_bytes <= 52  # the live robots.txt is 52 bytes


def _spn(*responses: httpx.Response) -> tuple[httpx.Client, list[httpx.Request]]:
    seen: list[httpx.Request] = []
    queue = list(responses)

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return queue.pop(0)

    return httpx.Client(transport=httpx.MockTransport(handler)), seen


def test_spn2_capture_is_recorded_with_its_wayback_url() -> None:
    client, seen = _spn(
        httpx.Response(200, json={"url": URL, "job_id": "spn2-abc"}),
        httpx.Response(200, json={"status": "pending"}),
        httpx.Response(200, json={"status": "success", "timestamp": "20260925081500", "original_url": URL}),
        httpx.Response(200, content=registry()),  # the archived bytes, fetched back for comparison
    )
    save = wayback_witness(client, "key", "secret", sleep=lambda _s: None)
    assert save(URL) == {
        "ok": True,
        "job_id": "spn2-abc",
        "capture": f"https://web.archive.org/web/20260925081500/{URL}",
        "capture_sha256": sha256_hex(registry()),
    }
    assert str(seen[3].url) == f"https://web.archive.org/web/20260925081500id_/{URL}"
    assert seen[0].headers["authorization"] == "LOW key:secret"


def test_spn2_refusal_is_recorded_not_raised() -> None:
    refusal = {"message": "You need to be logged in to use Save Page Now."}
    client, _ = _spn(httpx.Response(401, json=refusal))
    save = wayback_witness(client, "k", "s", sleep=lambda _s: None)
    assert save(URL) == {"ok": False, "error": refusal["message"]}


def test_slow_witness_is_skipped_with_a_reason_instead_of_timing_out(env: Env) -> None:
    two = (Target("a.json", "data/a.json", "json", 10), Target("b.json", "data/b.json", "json", 10))
    env.respond(ok(registry()), ok(registry()), ok(registry(n=2)), ok(registry(n=2)))

    def slow_witness(url: str) -> Json:
        env.now += timedelta(minutes=9)
        return {"ok": True, "capture": f"wb:{url}"}

    with httpx.Client(transport=httpx.MockTransport(env.handler)) as client:
        report = run(
            env.archive, client, now=lambda: env.now, sleep=lambda _s: None, witness=slow_witness, targets=two
        )
    first, second = report.new_versions
    assert first["wayback"] == {"ok": True, "capture": "wb:https://guvernanta.gov.ro/a.json"}
    assert second["wayback"] == {"skipped": True, "reason": "bugetul de timp pentru martor s-a epuizat"}


def test_backfill_witnesses_a_stored_version_exactly_once(env: Env) -> None:
    env.respond(ok(registry()))
    env.poll(witness=lambda _url: {"ok": False, "error": "HTTP 401"})
    env.respond(httpx.Response(304))

    def good(url: str) -> Json:
        return {"ok": True, "capture": f"wb:{url}", "capture_sha256": sha256_hex(registry())}

    (entry,) = env.poll(witness=good, backfill=True).witnessed
    assert entry["event"] == "witness" and entry["wayback"] == {
        "ok": True,
        "capture": f"wb:{URL}",
        "capture_sha256": sha256_hex(registry()),
        "capture_matches": True,
    }
    assert env.poll(witness=good, backfill=True).witnessed == []  # already witnessed
    assert env.archive.verify() == 2


def test_failed_backfill_is_reported_but_not_logged(env: Env) -> None:
    env.respond(ok(registry()))
    env.poll(witness=lambda _url: {"ok": False, "error": "HTTP 401"})
    env.respond(httpx.Response(304))
    report = env.poll(witness=lambda _url: {"ok": False, "error": "busy"}, backfill=True)
    assert report.witnessed == [] and len(report.unconfirmed) == 1
    assert env.archive.verify() == 1


def test_capture_with_different_bytes_is_flagged(env: Env) -> None:
    env.respond(ok(registry()))
    report = env.poll(witness=lambda url: {"ok": True, "capture": "wb", "capture_sha256": "0" * 64})
    assert report.new_versions[0]["wayback"] == {
        "ok": True,
        "capture": "wb",
        "capture_sha256": "0" * 64,
        "capture_matches": False,
    }
