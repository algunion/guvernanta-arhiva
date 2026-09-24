"""Poll guvernanta.gov.ro, confirm real changes, archive exact bytes, ask Wayback to witness."""

import json
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Final, Literal, cast
from urllib.parse import urljoin

import httpx

from guvernanta_arhiva.archive import Archive, Json, UrlState, sha256_hex, utc_iso

BASE_URL: Final = "https://guvernanta.gov.ro/"
USER_AGENT: Final = "guvernanta-arhiva/0.1 (+https://github.com/algunion/guvernanta-arhiva)"
CONFIRM_DELAY_S: Final = 8.0
HEARTBEAT_EVERY: Final = timedelta(hours=23)  # one "still watching" commit per day, cron jitter tolerated
WITNESS_BUDGET: Final = timedelta(minutes=8)  # keeps a burst of new versions inside the job timeout
SPN_ENDPOINT: Final = "https://web.archive.org/save"

type Kind = Literal["json", "html", "js", "css", "text"]
type Witness = Callable[[str], Json]

_EXPECTED_TYPE: Final[dict[Kind, str]] = {
    "json": "application/json",
    "html": "text/html",
    "js": "javascript",
    "css": "text/css",
    "text": "text/plain",
}


@dataclass(frozen=True, slots=True)
class Target:
    url_path: str
    store_path: str
    kind: Kind
    min_bytes: int = 64  # guards against truncated or placeholder bodies

    @property
    def url(self) -> str:
        return urljoin(BASE_URL, self.url_path)


def _site(name: str) -> Target:
    kind: Kind = "html" if name.endswith(".html") else "js" if name.endswith(".js") else "css"
    if name.endswith(".txt"):
        return Target(name, f"site/{name}", "text", min_bytes=16)  # robots.txt is ~50 B
    return Target(name, f"site/{name}", kind)


TARGETS: Final[tuple[Target, ...]] = (
    Target("data/registry.json", "data/registry.json", "json", 500_000),
    Target("top_companii.json", "data/top_companii.json", "json", 50_000),
    Target("", "site/index.html", "html"),
    *(
        _site(name)
        for name in (
            "politic.html",
            "top-companii.html",
            "cv-uri.html",
            "venituri.html",
            "mai-multe-ca.html",
            "app.js",
            "politic.js",
            "top-companii.js",
            "people-data.js",
            "cookie-consent.js",
            "styles.css",
            "robots.txt",
        )
    ),
)


def facts_about(target: Target, body: bytes, content_type: str) -> tuple[str | None, Json]:
    """Validate a 200 response; return (problem, descriptive facts)."""
    if _EXPECTED_TYPE[target.kind] not in content_type:
        return f"unexpected content-type {content_type!r}", {}
    if len(body) < target.min_bytes:
        return f"body too small ({len(body)} B < {target.min_bytes} B)", {}
    if target.kind != "json":
        return None, {}
    try:
        parsed: object = json.loads(body)
    except ValueError as exc:
        return f"invalid JSON: {exc}", {}
    if isinstance(parsed, list):
        return None, {"rows": len(cast(list[object], parsed))}
    if isinstance(parsed, dict):
        obj = cast(Json, parsed)
        facts: Json = {k: obj[k] for k in ("schema_version", "generated_at") if k in obj}
        facts |= {f"n_{k}": len(cast(list[object], v)) for k, v in obj.items() if isinstance(v, list)}
        return None, facts
    return "JSON is neither an object nor an array", {}


@dataclass(slots=True)
class RunReport:
    started_at: str
    new_versions: list[Json] = field(default_factory=list[Json])
    unconfirmed: list[str] = field(default_factory=list[str])
    errors: list[str] = field(default_factory=list[str])
    heartbeat_written: bool = False

    def commit_message(self) -> str:
        if not self.new_versions:
            return f"Semn de viață: nicio schimbare pe guvernanta.gov.ro (verificat {self.started_at})"
        paths = ", ".join(str(e["path"]) for e in self.new_versions)
        lines = [f"Versiune nouă: {paths}", ""]
        for e in self.new_versions:
            wayback = cast(Json, e["wayback"])
            if wayback.get("capture"):
                witness = f"martor Wayback: {wayback['capture']}"
            elif wayback.get("skipped"):
                witness = f"fără martor Wayback ({wayback.get('reason', 'omis')})"
            else:
                witness = f"martor Wayback eșuat ({wayback.get('error', 'necunoscut')})"
            lines.append(
                f"- {e['path']}: sha256 {e['sha256']} ({e['bytes']} B), observat {e['observed_at']}; "
                f"{witness}"
            )
        return "\n".join(lines)


def _get(client: httpx.Client, url: str, etags: Sequence[str] = ()) -> httpx.Response:
    headers = {"If-None-Match": ", ".join(etags)} if etags else {}
    return client.get(url, headers=headers)


def run(
    archive: Archive,
    client: httpx.Client,
    *,
    now: Callable[[], datetime],
    sleep: Callable[[float], None],
    witness: Witness,
    targets: Sequence[Target] = TARGETS,
) -> RunReport:
    """One polling pass. Stores a version only after a second download confirms it."""
    report = RunReport(started_at=utc_iso(now()))
    state = archive.read_state()
    witness_spent = timedelta()
    for t in targets:
        stored = archive.stored_sha(t.store_path)
        known = state.get(t.url)
        etags = known.etags if known is not None and known.sha256 == stored else ()
        try:
            first = _get(client, t.url, etags)
        except httpx.HTTPError as exc:
            report.errors.append(f"{t.url}: {type(exc).__name__}: {exc}")
            continue
        if first.status_code == 304:
            continue
        if first.status_code != 200:
            report.errors.append(f"{t.url}: HTTP {first.status_code}")
            continue
        problem, facts = facts_about(t, first.content, first.headers.get("content-type", ""))
        if problem is not None:
            report.errors.append(f"{t.url}: {problem}")
            continue
        sha = sha256_hex(first.content)
        etag = first.headers.get("etag")
        if sha == stored:  # same content, possibly from another replica with another ETag
            known_tags: set[str] = set(known.etags) if known is not None else set()
            if etag:
                known_tags.add(etag)
            state[t.url] = UrlState(sha, tuple(sorted(known_tags)))
            continue
        fetched_at = utc_iso(now())
        sleep(CONFIRM_DELAY_S)
        try:
            second = _get(client, t.url)
        except httpx.HTTPError as exc:
            report.unconfirmed.append(f"{t.url}: confirmation failed: {type(exc).__name__}")
            continue
        if second.status_code != 200 or sha256_hex(second.content) != sha:
            report.unconfirmed.append(f"{t.url}: second download differs (replicas out of sync?)")
            continue
        previous = archive.read(t.store_path)
        if previous is not None and "schema_version" in facts:
            _, old_facts = facts_about(t, previous, _EXPECTED_TYPE[t.kind])
            facts["schema_changed"] = old_facts.get("schema_version") != facts["schema_version"]
        archive.store(t.store_path, first.content)
        confirmed_at = utc_iso(now())
        if witness_spent >= WITNESS_BUDGET:
            testimony: Json = {"skipped": True, "reason": "bugetul de timp pentru martor s-a epuizat"}
        else:
            began = now()
            testimony = witness(t.url)
            witness_spent += now() - began
        entry = archive.append(
            {
                "event": "first_capture" if stored is None else "new_version",
                "source": "live",
                "url": t.url,
                "path": t.store_path,
                "sha256": sha,
                "bytes": len(first.content),
                "previous_sha256": stored,
                "observed_at": fetched_at,
                "confirmed_at": confirmed_at,
                "http": {
                    "etag": etag,
                    "last_modified": first.headers.get("last-modified"),
                    "confirm_etag": second.headers.get("etag"),
                },
                "facts": facts,
                "wayback": testimony,
            }
        )
        tags = {x for x in (etag, second.headers.get("etag")) if x}
        state[t.url] = UrlState(sha, tuple(sorted(tags)))
        report.new_versions.append(entry)

    last = archive.last_heartbeat()
    if report.new_versions or last is None or now() - last >= HEARTBEAT_EVERY:
        archive.write_state(state)
        archive.write_heartbeat(
            now(),
            {
                "targets": len(targets),
                "new_versions": len(report.new_versions),
                "unconfirmed": report.unconfirmed,
                "errors": report.errors,
            },
        )
        report.heartbeat_written = True
    return report


def skipped_witness(reason: str) -> Witness:
    """A witness that records why no external capture was requested."""

    def skip(_url: str) -> Json:
        return {"skipped": True, "reason": reason}

    return skip


def _json_object(response: httpx.Response) -> Json:
    try:
        value: object = response.json()
    except ValueError:
        return {}
    return cast(Json, value) if isinstance(value, dict) else {}


def wayback_witness(
    client: httpx.Client,
    access_key: str,
    secret: str,
    *,
    sleep: Callable[[float], None],
    polls: int = 24,
) -> Witness:
    """Save Page Now 2 (requires archive.org S3 keys): submit, then poll the job. Never raises."""
    headers = {"Accept": "application/json", "Authorization": f"LOW {access_key}:{secret}"}

    def save(url: str) -> Json:
        try:
            submitted = client.post(SPN_ENDPOINT, data={"url": url}, headers=headers)
            job = _json_object(submitted)
            job_id = job.get("job_id")
            if not isinstance(job_id, str):
                reason = job.get("message") or f"HTTP {submitted.status_code}"
                return {"ok": False, "error": str(reason)}
            for _ in range(polls):
                sleep(5.0)
                status = _json_object(client.get(f"{SPN_ENDPOINT}/status/{job_id}", headers=headers))
                if status.get("status") == "success":
                    original = status.get("original_url") or url
                    capture = f"https://web.archive.org/web/{status.get('timestamp')}/{original}"
                    return {"ok": True, "job_id": job_id, "capture": capture}
                if status.get("status") == "error":
                    detail = status.get("message") or status.get("status_ext") or "error"
                    return {"ok": False, "job_id": job_id, "error": str(detail)}
            return {"ok": False, "job_id": job_id, "error": "capture not finished in time"}
        except httpx.HTTPError as exc:
            return {"ok": False, "error": type(exc).__name__}

    return save
