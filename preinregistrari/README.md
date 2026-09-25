# Preînregistrări

Aici publicăm, înainte de evenimentele analizate, metodele și pragurile după care vom evalua rezultatele. Textele publicate nu se mai modifică. Completările se adaugă separat și sunt marcate explicit.

| Document | Publicat | Commit | SHA-256 al fișierului | Copie independentă (Wayback Machine) |
|---|---|---|---|---|
| [Conducerea companiilor de stat în primele 100 de zile ale noului Guvern](2026-09-29-primele-100-de-zile.md) | 25.09.2026, înaintea votului din 29.09.2026 | [`f3911fd`](https://github.com/algunion/guvernanta-arhiva/commit/f3911fdc143ab41c6cef4db36b8abed830b9a797) | `10b4da4d4180fef86f32a36eaecc147ee2af506b4dfb61c6da5dca25ec2e2b9c` | [fișierul, 25.09.2026 05:07:11 UTC](https://web.archive.org/web/20260925050711/https://raw.githubusercontent.com/algunion/guvernanta-arhiva/f3911fdc143ab41c6cef4db36b8abed830b9a797/preinregistrari/2026-09-29-primele-100-de-zile.md) · [pagina GitHub, 05:07:20 UTC](https://web.archive.org/web/20260925050720/https://github.com/algunion/guvernanta-arhiva/blob/f3911fdc143ab41c6cef4db36b8abed830b9a797/preinregistrari/2026-09-29-primele-100-de-zile.md) |
| [Completarea 1: cum numărăm înlocuirile înainte de termen (H1)](2026-09-29-primele-100-de-zile-completarea-1.md) | 25.09.2026, înaintea votului din 29.09.2026 | [`18db2b6`](https://github.com/algunion/guvernanta-arhiva/commit/18db2b6977442777b95e5a808868ee5e0b015b4e) | `de909e97c0fee9c4de740aa9274ad2f312716f844af1f96f272c68b84e83cc66` | [fișierul, 25.09.2026 16:18:53 UTC](https://web.archive.org/web/20260925161853/https://raw.githubusercontent.com/algunion/guvernanta-arhiva/18db2b6977442777b95e5a808868ee5e0b015b4e/preinregistrari/2026-09-29-primele-100-de-zile-completarea-1.md) |

## Verification

- The Wayback capture of the raw file was downloaded again, and its SHA-256 equals the file's own SHA-256 (`10b4da4d…`), so the archived bytes are identical to the published ones.
- Both captures pin commit `f3911fd` in their URL, so later edits to the repository cannot change what was captured.

To check it yourself:

The Wayback Machine serves this file gzip-compressed. Use `--compressed` (or pipe through `gunzip`), otherwise you hash the compressed bytes.

```sh
git show f3911fdc143ab41c6cef4db36b8abed830b9a797:preinregistrari/2026-09-29-primele-100-de-zile.md | shasum -a 256
curl -sL --compressed "https://web.archive.org/web/20260925050711id_/https://raw.githubusercontent.com/algunion/guvernanta-arhiva/f3911fdc143ab41c6cef4db36b8abed830b9a797/preinregistrari/2026-09-29-primele-100-de-zile.md" | shasum -a 256
```

### Addendum 1

- The Wayback capture of the raw file (16:18:53 UTC) was downloaded again with `curl --compressed`. Its SHA-256 equals the file's own (`de909e97…`), so the archived bytes are identical to the published ones.
- The capture pins commit `18db2b6` in its URL.

```sh
git show 18db2b6977442777b95e5a808868ee5e0b015b4e:preinregistrari/2026-09-29-primele-100-de-zile-completarea-1.md | shasum -a 256
curl -sL --compressed "https://web.archive.org/web/20260925161853id_/https://raw.githubusercontent.com/algunion/guvernanta-arhiva/18db2b6977442777b95e5a808868ee5e0b015b4e/preinregistrari/2026-09-29-primele-100-de-zile-completarea-1.md" | shasum -a 256
```
