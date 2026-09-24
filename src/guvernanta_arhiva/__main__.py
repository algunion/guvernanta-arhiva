"""CLI: `watch` (one polling pass), `verify` (check the evidence chain), `record` (import a capture)."""

import argparse
import json
import os
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import httpx

from guvernanta_arhiva.archive import Archive, IntegrityError, Json, as_object, parse_utc, sha256_hex
from guvernanta_arhiva.watch import USER_AGENT, Witness, run, skipped_witness, wayback_witness


def _client(timeout_s: float) -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": USER_AGENT},
        timeout=timeout_s,
        follow_redirects=False,  # a redirect on a data URL is itself an anomaly worth seeing
    )


def _watch(args: argparse.Namespace) -> int:
    archive = Archive(args.root)
    access, secret = os.environ.get("IA_S3_ACCESS"), os.environ.get("IA_S3_SECRET")
    with _client(60.0) as site, _client(60.0) as wayback:
        witness: Witness
        if args.no_witness:
            witness = skipped_witness("dezactivat la rulare")
        elif access and secret:
            witness = wayback_witness(wayback, access, secret, sleep=time.sleep)
        else:
            witness = skipped_witness("lipsesc cheile archive.org")
        report = run(
            archive,
            site,
            now=lambda: datetime.now(UTC),
            sleep=time.sleep,
            witness=witness,
            backfill_witness=bool(access and secret) and not args.no_witness,
        )
    for entry in report.new_versions:
        print(f"NEW {entry['path']} sha256={entry['sha256']} wayback={entry['wayback']}")
    for entry in report.witnessed:
        print(f"WITNESS {entry['path']} sha256={entry['sha256']} wayback={entry['wayback']}")
    for note in report.unconfirmed:
        print(f"::warning::{note}")
    for err in report.errors:
        print(f"::error::{err}")
    if args.commit_message_file is not None:
        args.commit_message_file.write_text(report.commit_message() + "\n", encoding="utf-8")
    if args.errors_file is not None:
        args.errors_file.write_text("".join(f"{e}\n" for e in report.errors), encoding="utf-8")
    print(
        f"checked {report.started_at}: {len(report.new_versions)} new, {len(report.witnessed)} witnessed, "
        f"{len(report.unconfirmed)} unconfirmed, {len(report.errors)} errors, "
        f"heartbeat={'written' if report.heartbeat_written else 'not due'}"
    )
    return 0


def _verify(args: argparse.Namespace) -> int:
    try:
        n = Archive(args.root).verify()
    except IntegrityError as exc:
        print(f"::error::integrity check failed: {exc}", file=sys.stderr)
        return 1
    print(f"ok: {n} observations chain correctly and match the stored files")
    return 0


def _record(args: argparse.Namespace) -> int:
    archive = Archive(args.root)
    body = args.file.read_bytes()
    parse_utc(args.observed_at)  # reject malformed timestamps before writing anything
    evidence: Json = as_object(json.loads(args.evidence), "--evidence") if args.evidence else {}
    archive.store(args.path, body)
    entry = archive.append(
        {
            "event": "imported_capture",
            "source": args.source,
            "url": args.url,
            "path": args.path,
            "sha256": sha256_hex(body),
            "bytes": len(body),
            "previous_sha256": args.previous,
            "observed_at": args.observed_at,
            "evidence": evidence,
        }
    )
    print(f"recorded seq={entry['seq']} {args.path} sha256={entry['sha256']}")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="guvernanta_arhiva")
    sub = ap.add_subparsers(dest="cmd", required=True)

    w = sub.add_parser("watch", help="poll once; archive confirmed new versions")
    w.add_argument("--root", type=Path, default=Path())
    w.add_argument("--commit-message-file", type=Path)
    w.add_argument("--errors-file", type=Path)
    w.add_argument("--no-witness", action="store_true", help="skip Wayback Save Page Now")
    w.set_defaults(func=_watch)

    v = sub.add_parser("verify", help="verify the observation chain and stored files")
    v.add_argument("--root", type=Path, default=Path())
    v.set_defaults(func=_verify)

    r = sub.add_parser("record", help="import bytes captured elsewhere, with provenance")
    r.add_argument("--root", type=Path, default=Path())
    r.add_argument("--path", required=True, help="archive path, e.g. data/registry.json")
    r.add_argument("--file", type=Path, required=True)
    r.add_argument("--url", required=True)
    r.add_argument("--source", required=True, help="e.g. wayback, manual")
    r.add_argument("--observed-at", required=True, help="UTC, YYYY-MM-DDTHH:MM:SSZ")
    r.add_argument("--previous", default=None, help="sha256 of the version this one follows")
    r.add_argument("--evidence", help="JSON object with provenance details")
    r.set_defaults(func=_record)

    args = ap.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
