# guvernanta-arhiva

**Arhivă independentă și verificabilă a datelor publicate pe [guvernanta.gov.ro](https://guvernanta.gov.ro).**

Platforma Guvernului nu păstrează istoricul datelor. Fișierul cu datele poate fi modificat oricând, iar data generării înscrisă în el rămâne aceeași. Această arhivă păstrează fiecare versiune.

Proiect independent, fără legătură cu Guvernul României. Datele aparțin instituției care le publică; noi le păstrăm exact așa cum au fost publicate.

## Cum funcționează

La fiecare 30 de minute, o sarcină programată în GitHub Actions ([`watch.yml`](.github/workflows/watch.yml)):

1. verifică `data/registry.json`, `top_companii.json` și paginile site-ului. Descarcă un fișier din nou numai dacă s-a schimbat, ca să nu încarce serverul;
2. confirmă orice schimbare printr-o a doua descărcare, deoarece site-ul rulează pe cel puțin două servere, care se pot desincroniza;
3. salvează fișierele exact așa cum au fost publicate, în `data/` și `site/`. Istoricul git este, de fapt, arhiva;
4. adaugă o înregistrare în [`log/observations.jsonl`](log/observations.jsonl), un jurnal protejat criptografic. Fiecare înregistrare conține amprenta (hash-ul) celei anterioare, așa că orice modificare ulterioară poate fi depistată;
5. solicită arhivei Wayback Machine o copie independentă a noii versiuni, apoi compară conținutul copiei cu fișierul nostru. Dacă nu se poate face copia, jurnalul consemnează motivul;
6. o dată pe zi, actualizează `status/heartbeat.json`, ca dovadă că verificarea a continuat chiar și atunci când nu s-a schimbat nimic.

## Verificare

```sh
git log -p -- data/registry.json               # toate versiunile, cu diferențele dintre ele
uv run python -m guvernanta_arhiva verify       # verifică jurnalul și fișierele păstrate
```

Fiecare înregistrare din jurnal conține:
- amprenta SHA-256 a conținutului;
- momentul în care a fost observată versiunea;
- antetele HTTP primite de la server (ETag, Last-Modified);
- adresa copiei din Wayback Machine.

## Limitări

- O versiune care rămâne online mai puțin de 30 de minute poate trece neobservată. În plus, GitHub nu garantează că sarcinile programate pornesc exact la timp.
- Istoricul începe cu copia salvată de Wayback Machine pe 24 septembrie 2026, la ora 08:48:02 UTC, în ziua lansării platformei. Cifrele din comunicatul de lansare nu se regăsesc în nicio versiune arhivată. Asta arată că a existat o versiune anterioară, care nu a fost păstrată.
- Documentele PDF (CV-uri, contracte) nu sunt copiate în această arhivă.

## In English

This is an independent, verifiable archive of guvernanta.gov.ro, the Romanian Government's registry of state-owned-company leadership. The official site keeps no history and edits its data file in place.

Every 30 minutes, a scheduled job:
1. polls the data and the site with conditional requests;
2. confirms each change with a second download;
3. commits the exact bytes;
4. appends a hash-chained observation;
5. asks the Wayback Machine for an independent capture, and checks that the captured bytes match ours.

The project is unofficial and not affiliated with the Government. The code is MIT-licensed; the data belongs to its publisher.

**Maintainers:** Wayback captures need archive.org S3 keys. Set them as the repository secrets `IA_S3_ACCESS` and `IA_S3_SECRET`.
