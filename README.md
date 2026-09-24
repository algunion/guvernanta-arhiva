# guvernanta-arhiva

**Arhivă independentă și verificabilă a datelor publicate pe [guvernanta.gov.ro](https://guvernanta.gov.ro).**

Platforma Guvernului nu păstrează istoricul datelor. Fișierul cu datele poate fi modificat oricând, iar data generării înscrisă în el rămâne aceeași. Această arhivă păstrează fiecare versiune, exact așa cum a fost publicată. La fiecare 30 de minute:
- verifică site-ul;
- confirmă orice schimbare printr-o a doua descărcare;
- salvează noua versiune;
- cere arhivei Wayback Machine o copie independentă.

Ce trebuie știut:
- **Ce poate scăpa.** O versiune care rămâne online mai puțin de 30 de minute poate trece neobservată.
- **De când există istoric.** Istoricul începe cu copia salvată de Wayback Machine pe 24 septembrie 2026, la ora 08:48:02 UTC, în ziua lansării platformei. Cifrele din comunicatul de lansare nu se regăsesc în nicio versiune arhivată. Asta arată că a existat o versiune anterioară, care nu a fost păstrată.
- **Ce nu conține.** Documentele PDF (CV-uri, contracte) nu sunt copiate aici.

Proiect independent, fără legătură cu Guvernul României. Datele aparțin instituției care le publică.

---

## How it works (technical)

Every 30 minutes a scheduled GitHub Actions job ([`watch.yml`](.github/workflows/watch.yml)) runs these steps:

1. **Polls** `data/registry.json`, `top_companii.json` and the site's pages and scripts. It sends conditional requests carrying every ETag seen for the current content, because the site is served by at least two replicas whose ETags differ.
2. **Confirms** any changed content with a second download before accepting it. If the replicas disagree, it retries on the next run.
3. **Stores the exact bytes** in `data/` and `site/`. The git history is the archive.
4. **Appends a hash-chained observation** to [`log/observations.jsonl`](log/observations.jsonl). Each entry holds the SHA-256 of the previous one, so any later edit is detectable.
5. **Asks the Wayback Machine** (Save Page Now 2) for an independent capture. It then downloads the captured bytes and records whether they match ours (`capture_matches`). Versions without a successful capture are backfilled on later runs, within a per-run time budget.
6. **Writes a daily heartbeat** (`status/heartbeat.json`), so the log shows the checks continued even when nothing changed.

## Verify

```sh
git log -p -- data/registry.json              # every version, with diffs
uv run python -m guvernanta_arhiva verify      # checks the hash chain and the stored files
```

Each observation records:
- the content's SHA-256;
- when the version was observed and confirmed;
- the HTTP ETag and Last-Modified;
- the Wayback capture URL, and whether its bytes match ours.

## Limits

- **Short-lived versions.** A version that lives for less than one polling interval can be missed, and GitHub's scheduled runs may start late.
- **Start of history.** The history starts at the Wayback capture of 2026-09-24 08:48:02 UTC. An earlier launch-day version existed and was not archived by anyone.
- **Scope.** PDFs (CVs, contracts) are not archived here.

## Maintainers

- **Wayback captures** need archive.org S3 keys, set as the repository secrets `IA_S3_ACCESS` and `IA_S3_SECRET`.
- **Licence.** The code is MIT-licensed; the data belongs to its publisher.
