# guvernanta-arhiva

**Arhivă independentă și verificabilă a datelor publicate pe [guvernanta.gov.ro](https://guvernanta.gov.ro).**

Platforma Guvernului publică datele despre conducerea companiilor de stat fără istoric: fișierul de date poate fi modificat pe loc, fără ca data de generare din fișier să se schimbe. Această arhivă păstrează fiecare versiune.

Proiect neoficial, fără legătură cu Guvernul României. Datele aparțin publicatorului lor, iar noi le arhivăm exact cum au fost publicate.

## Ce face

La fiecare 30 de minute, un job GitHub Actions ([`watch.yml`](.github/workflows/watch.yml)):

1. descarcă `data/registry.json`, `top_companii.json` și paginile și scripturile site-ului, folosind cereri condiționate, ca să nu încarce serverul;
2. când conținutul s-a schimbat, **confirmă schimbarea cu o a doua descărcare**, pentru că site-ul rulează pe cel puțin două servere care se pot desincroniza;
3. salvează **octeții exacți** în `data/` și `site/`, iar istoricul git devine arhiva;
4. adaugă o intrare în [`log/observations.jsonl`](log/observations.jsonl), un jurnal **înlănțuit criptografic**: fiecare intrare conține hash-ul celei anterioare, deci orice modificare ulterioară se detectează;
5. cere **Wayback Machine** o captură independentă a noii versiuni, ca martor extern. Serviciul Save Page Now cere un cont archive.org; cheile se configurează ca secrete ale depozitului (`IA_S3_ACCESS`, `IA_S3_SECRET`). Fără ele, fiecare intrare din jurnal notează că martorul lipsește și de ce;
6. o dată pe zi scrie un „semn de viață” (`status/heartbeat.json`), ca să se vadă că verificarea a continuat și când nu s-a schimbat nimic.

## Cum verifici

```sh
git log -p -- data/registry.json                  # toate versiunile, cu diferențele dintre ele
uv run python -m guvernanta_arhiva verify          # verifică lanțul și fișierele stocate
```

Fiecare intrare din jurnal conține SHA-256-ul conținutului, momentul observării, antetele HTTP (ETag, Last-Modified) și linkul capturii Wayback.

## Limite, spuse direct

- O versiune care stă publicată mai puțin de ~30 de minute poate să ne scape. GitHub nu garantează punctualitatea job-urilor programate.
- Istoricul începe cu captura Wayback din 24.09.2026, 08:48:02 UTC, adică ziua lansării. Cifrele din comunicatul de lansare nu corespund niciunei versiuni arhivate, deci a existat o versiune anterioară, care s-a pierdut.
- Documentele PDF (CV-uri, contracte) nu sunt copiate aici.

## In English

This is an independent, verifiable archive of guvernanta.gov.ro, the Romanian Government's registry of state-owned-company leadership. The official site keeps no history and edits its data file in place.

Every 30 minutes, a scheduled job does the following:

1. it polls the data and the site with conditional requests;
2. it confirms each change with a second download;
3. it commits the exact bytes;
4. it appends a hash-chained observation;
5. it asks the Wayback Machine for an independent capture.

The job is unofficial and not affiliated with the Government.

Code is MIT-licensed; the data belongs to its publisher.
