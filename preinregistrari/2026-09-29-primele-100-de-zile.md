# Preînregistrare: conducerea companiilor de stat în primele 100 de zile ale noului Guvern

> **Publicată pe 25 septembrie 2026, înainte de votul de învestire din 29 septembrie 2026.** Textul nu se mai modifică. Eventualele completări se adaugă separat și sunt marcate explicit. Data publicării se poate verifica prin istoricul git al acestui depozit și prin copiile din Wayback Machine enumerate în [`README.md`](README.md).

**English abstract.** Before the investiture vote, we register the measures, data, analysis and refutation thresholds for one question: does a new government bring an unusual wave of leadership changes in state-owned companies? The test is fixed in advance, so neither outcome can be explained away. The same test is applied retroactively to the previous (caretaker) period.

## 1. Întrebarea

Aduce învestirea unui nou Guvern un val neobișnuit de schimbări în conducerea companiilor de stat? Ne interesează în special:
- înlocuirile făcute înainte de termen;
- numirile provizorii;
- potrivirea dintre partidul declarat de persoanele numite și partidul ministrului care coordonează compania.

Rezultatul nu spune nimic despre legalitatea sau motivele vreunei numiri. Măsoară doar un tipar, cu o metodă stabilită dinainte.

## 2. Definiții stabilite dinainte

| Termen | Definiție |
|---|---|
| **T0** | Data votului de încredere prin care este învestit noul Guvern. Dacă votul din 29.09.2026 nu trece, T0 devine data primului vot de învestire reușit, iar textul se aplică acelui Guvern. |
| **Perioada analizată (W)** | Primele 100 de zile de la T0. |
| **Perioada de comparație (B)** | De la 05.05.2026, data de la care Guvernul a rămas interimar, până la T0. |
| **Companiile incluse** | Cele 121 de companii din registrul guvernanta.gov.ro, în versiunea din 24.09.2026 (amprenta SHA-256 `d2dde3eb…`). Companiile adăugate ulterior se raportează separat. |
| **Schimbare de titular** | O persoană iese dintr-o funcție de conducere (în consiliu sau în conducerea executivă), sau o persoană nouă intră într-o astfel de funcție. Schimbările se constată din arhiva noastră a registrului, verificat la fiecare 30 de minute, și se confirmă cu lista lunară a reprezentanților legali publicată de ONRC (date deschise). |
| **Înlocuire înainte de termen** | O schimbare de titular făcută înainte de data de încheiere a mandatului publicată pentru funcția respectivă. |
| **Înlocuire la termen** | O schimbare de titular făcută la data de încheiere a mandatului sau după ea. Acestea sunt oricum de așteptat: în perioada analizată, 161 de mandate ajung la termen. |
| **Identificarea persoanelor** | Numele nu este niciodată suficient. Folosim cel puțin un element sigur, independent de nume: data nașterii din evidența ONRC la același CUI, CV-ul persoanei sau un document oficial. |

## 3. Ipoteze, măsuri și praguri de infirmare

Fiecare ipoteză poate fi infirmată. Pragurile de mai jos decid, fără alte interpretări, dacă ipoteza este **susținută**, **infirmată** sau **neconcludentă**.

### H1: val de înlocuiri înainte de termen

- **Ce măsurăm.** Numărul lunar de înlocuiri înainte de termen în perioada analizată, comparat cu cel din perioada de comparație. Ambele se calculează cu același cod și din aceeași sursă: diferențele dintre listele lunare ONRC, confirmate prin registru acolo unde se poate.
- **Testul.** Raportul dintre cele două rate lunare, cu test Poisson exact, unilateral.

| Verdict | Condiție |
|---|---|
| Susținută | Raportul este cel puțin 2, iar p < 0,01 |
| Infirmată | Raportul este sub 1,5, sau p ≥ 0,05 |
| Neconcludentă | Orice altă situație |

### H2: mai multe numiri provizorii

- **Ce măsurăm.** Ponderea numirilor provizorii sau interimare printre numirile noi din perioada analizată. Referința este ponderea din 24.09.2026: 103 din 698 de funcții, adică 14,8%.

| Verdict | Condiție |
|---|---|
| Susținută | Ponderea este de cel puțin 30%, cu minimum 20 de numiri noi |
| Infirmată | Ponderea este de cel mult 15% |
| Neconcludentă | Orice altă situație, inclusiv sub 20 de numiri noi |

### H3: potrivire politică

- **Ce măsurăm.** Printre persoanele numite în perioada analizată care declară un partid, ponderea celor care declară partidul ministrului coordonator la data numirii.
- **Valoarea așteptată.** Se calculează prin permutări, pornind de la distribuția partidelor declarate în registru la 24.09.2026. Este aceeași metodă pe care am folosit-o în analiza perioadei anterioare.

| Verdict | Condiție |
|---|---|
| Susținută | Ponderea observată este de cel puțin două ori cea așteptată, iar p < 0,01 |
| Infirmată | Ponderea observată nu o depășește pe cea așteptată |
| Neconcludentă | Orice altă situație |

**Limitări asumate dinainte.** Folosim doar apartenența politică **declarată**. Câmpurile necompletate și împărțirea funcțiilor între partidele unei coaliții nu pot fi surprinse de această măsură.

## 4. Același test pentru toți

Aceleași măsuri, cu aceleași praguri, se aplică retroactiv și perioadei de comparație, raportată la perioada dinaintea ei. Nicio ipoteză nu vizează un anumit partid. Rezultatele se publică pentru toate partidele și toate ministerele, cu numitorii lor.

## 5. Ce publicăm și când

- **La 30, 60 și 100 de zile de la T0:** rezultate intermediare, marcate ca atare.
- **După 100 de zile:** verdictul final, oricare ar fi el.
- **Codul și datele necesare pentru reproducere.** Arhiva are amprente criptografice, iar diferențele ONRC au sursă și dată.
- **Orice abatere de la acest plan** (de exemplu, o sursă indisponibilă) se anunță explicit, cu motivul ei. Pragurile nu se modifică.

## 6. Ce nu vom afirma

Nu vom face afirmații despre legalitatea, oportunitatea sau motivele vreunei numiri anume. Un rezultat „susținut” descrie un tipar statistic; nu dovedește nicio faptă.
