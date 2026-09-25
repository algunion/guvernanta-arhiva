# Completarea 1 la preînregistrare: cum numărăm înlocuirile înainte de termen (H1)

> **Publicată pe 25 septembrie 2026, înainte de votul de învestire din 29 septembrie 2026 și înainte să existe vreo listă a Oficiului Național al Registrului Comerțului (ONRC) din perioada analizată.** Completează [preînregistrarea din 25 septembrie 2026](2026-09-29-primele-100-de-zile.md) (versiunea `f3911fd` din istoricul git), al cărei text rămâne neschimbat. Data publicării se poate verifica la fel ca pentru preînregistrare: prin istoricul git al acestui depozit și prin copiile din Wayback Machine (arhiva publică a paginilor web, archive.org) enumerate în [`README.md`](README.md).
>
> *Redactat cu ajutorul inteligenței artificiale · verificat de un om.*

**English abstract.** Addendum 1 to the pre-registration of 25 September 2026.
- **The problem.** Hypothesis H1 (a wave of early replacements) cannot be computed exactly as registered. The registry lists current holders only, so the published end date of the mandate is missing for 73 of the 76 departures observed so far in the comparison period.
- **What stays.** The hypothesis and the verdict thresholds.
- **What changes, announced before any data from the analysed period exist:**
  - end dates come from a closed list of four official sources, collected by fixed rules and read without knowing when each person left;
  - only departures are counted, each confirmed by the next monthly list;
  - the monthly rate is estimated with an allowance for departures whose end date cannot be found;
  - the p-value is computed on groups of departures from the same company in the same monthly interval, not on persons, because departures come in groups and the registered test assumes they do not;
  - H1 is inconclusive if fewer than 70% of departures in either period have an end date;
  - the interval that contains the day of the vote is not counted.
- **The baseline freeze.**
  - **Before the vote, in every case,** we publish the fingerprints of everything that shapes the baseline's result: the protocol; the extraction configuration and prompts, with exact model versions; the code that finds departures in the monthly lists; the crawler; the classifier code; the software environment; and the frozen list of the baseline's departures.
  - **The baseline's documents and extracted acts** are frozen before the vote if possible, and at the latest before the first monthly list published after it, with the time published.
  - **After that,** the only step for the baseline is the same mechanical next-list check that applies to every interval.
- **Also:** one secondary analysis without a verdict, and one erratum (105 mandates, not 161, reach their end date in the analysed period). Section 3 explains every change. The annex gives the full procedure.

Textul are două părți: secțiunile 1–7 sunt pentru toți cititorii, iar anexa descrie procedura completă.

## Pe scurt

- **Ce rămâne neschimbat.** Ipoteza H1 și pragurile de verdict, așa cum au fost publicate.
- **Problema.** Registrul de pe guvernanta.gov.ro arată doar persoanele aflate în funcție la 24 septembrie 2026. Pentru 73 din cele 76 de plecări din funcții de conducere găsite până acum în perioada de comparație (care începe pe 5 mai 2026), nu avem data de încheiere a mandatului. De această dată depinde dacă o înlocuire este „înainte de termen”.
- **Ce se schimbă** (detaliile și motivele, în secțiunea 3):
  1. Căutăm data de încheiere în patru surse oficiale, după reguli fixe, la fel în ambele perioade. Modelul de inteligență artificială care citește documentele nu primește data plecării.
  2. Pentru H1 numărăm doar plecările: numai despre o plecare se poate spune dacă a fost înainte de termen.
  3. O plecare se confirmă prin lista ONRC următoare, nu prin registru.
  4. Estimăm rata lunară a înlocuirilor înainte de termen ținând cont de plecările pentru care nu găsim data.
  5. Calculăm valoarea p pe grupuri de plecări (plecările de la aceeași companie dintre aceleași două liste ONRC), nu pe persoane. Valoarea p spune în câte cazuri dintr-o sută ar apărea întâmplător o creștere cel puțin atât de mare dacă, de fapt, nu s-ar schimba nimic. Motivul: testul publicat presupune plecări independente unele de altele, dar când se schimbă un consiliu pleacă deodată mai multe persoane.
  6. Dacă, în oricare dintre perioade, găsim data de încheiere pentru mai puțin de 70% din plecări, H1 este neconcludentă.
  7. Intervalul dintre listele ONRC care cuprinde ziua învestirii nu se numără. Așa putem fixa rezultatele căutării pentru perioada de comparație înainte de ziua învestirii (cel târziu înainte de prima listă ONRC de după ea). Programele și instrucțiunile care decid rezultatul le fixăm oricum înainte de ziua învestirii.
  8. Verdictul final pentru H1 vine mai târziu, probabil în februarie 2027, pentru că fiecare plecare se confirmă abia cu lista ONRC următoare.
- **Cum se citește „infirmată”.** Înseamnă că testul nu a găsit un val, nu că nu a existat unul: chiar dacă rata reală s-ar dubla, ipoteza ar ieși „susținută” doar în 5 până la 35 de cazuri din 100 (secțiunea 4).
- **Analiză secundară.** Raportăm și numărul lunar al tuturor plecărilor, nu doar al celor înainte de termen. Acest rezultat nu primește verdict.
- **Erată.** Potrivit registrului, 105 mandate (nu 161) au data de încheiere în perioada analizată, dacă Guvernul este învestit pe 29 septembrie 2026.
- **Ce am văzut înainte să scriem.** Listele ONRC până pe 2 septembrie 2026, registrul din 24 septembrie 2026 și o căutare de probă pentru 15 plecări din perioada de comparație (secțiunea 1). Încă nu există date din perioada analizată.

## 1. De ce e nevoie de această completare

H1 compară numărul lunar de înlocuiri înainte de termen din perioada analizată (W), adică primele 100 de zile ale noului Guvern, cu cel din perioada de comparație (B), care începe pe 5 mai 2026. Preînregistrarea definește înlocuirea înainte de termen ca o schimbare de titular „făcută înainte de data de încheiere a mandatului publicată pentru funcția respectivă”.

Am pregătit calculul pornind de la listele deja publicate de ONRC și am constatat că această dată lipsește pentru aproape toate plecările din B:

- între listele ONRC din 6 mai și 2 septembrie 2026 am găsit 76 de plecări din funcții de conducere, la cele 121 de companii;
- registrul de pe guvernanta.gov.ro a fost publicat abia în septembrie 2026 (prima versiune pe care o avem este din 24 septembrie) și arată doar persoanele aflate atunci în funcție;
- pentru 73 dintre cele 76 de plecări, nu avem nicio dată de încheiere a mandatului.

În W, situația va fi probabil alta: lista ONRC din 2 septembrie 2026 arăta 652 de persoane în funcții de conducere la aceste companii, iar registrul avea data de încheiere pentru 501 dintre ele. (O persoană cu funcții la două companii e numărată de două ori.) Fără date comparabile în B, testul nu poate fi calculat așa cum a fost scris.

Secțiunea 5 a preînregistrării cere ca orice schimbare față de plan să fie anunțată explicit, cu motivul ei. Tot acolo scrie că pragurile nu se modifică. Asta facem aici: anunțăm schimbările și motivele lor înainte să existe date din W, fără să modificăm pragurile.

**Ce am văzut înainte să scriem această completare.**

- **Listele ONRC publicate până pe 2 septembrie 2026.** Ele arată câte plecări au fost în B, dar nu și datele lor de încheiere.
- **Registrul din 24 septembrie 2026.**
- **O căutare de probă**, făcută cu ajutorul inteligenței artificiale după ce am scris regulile, pentru 15 plecări din B alese la întâmplare.
  - Am găsit data de încheiere pentru toate cele 15. Căutarea ne-a arătat deci și cum s-ar clasifica aceste plecări, dar nu am numărat câte ar fi înainte de termen și câte nu.
  - Rezultatele ei nu se folosesc: și cele 15 plecări trec prin regulile finale.
  - Ce am schimbat după ea este în Anexa 8.
- **O verificare critică a primei versiuni**, făcută tot cu ajutorul inteligenței artificiale, separat de redactare, înainte de publicare. Corecturile ei sunt incluse în această versiune (Anexa 8).

Încă nu există date din W.

## 2. Ce rămâne neschimbat

- **Întrebarea:** „Aduce învestirea unui nou Guvern un val neobișnuit de schimbări în conducerea companiilor de stat?”
- **Ipoteza H1:** „val de înlocuiri înainte de termen”.
- **Pragurile de verdict** (în preînregistrare, „praguri de infirmare”):
  - ipoteza este susținută dacă raportul (rata lunară din W împărțită la cea din B) este cel puțin 2 și p < 0,01. Pragul pentru p înseamnă: dacă învestirea n-ar schimba nimic, o creștere cel puțin atât de mare ar apărea întâmplător în mai puțin de 1 caz din 100;
  - este infirmată dacă raportul este sub 1,5 sau p ≥ 0,05;
  - în orice altă situație este neconcludentă.
- **Definițiile** lui T0, W și B din secțiunea 2 a preînregistrării (Anexa 1).
- **Companiile:** cele 121 de companii din versiunea registrului din 24 septembrie 2026.
- **Identificarea persoanelor:** numele nu este niciodată suficient.
- **H2 și H3**, așa cum au fost publicate.

## 3. Ce se schimbă și de ce

1. **De unde vine data de încheiere.** Preînregistrarea cere o dată „publicată”, fără să numească sursa, iar până acum am folosit doar registrul. Acum căutăm data de încheiere în patru surse oficiale, după reguli fixe, la fel pentru toate plecările. Motivul: registrul nu are datele plecărilor din B (Anexele 2 și 3).
2. **Ce numărăm.** Pentru H1 numărăm doar plecările, nu și intrările în funcție, pe care preînregistrarea le cuprindea în „schimbare de titular”. Motivul: numai despre o plecare se poate spune dacă a fost înainte de termen (regula A6, Anexa 5).
3. **Cum confirmăm o schimbare.** Textul lui H1 cere „diferențele dintre listele lunare ONRC, confirmate prin registru acolo unde se poate”. Confirmăm în schimb o plecare prin lista ONRC următoare (regula A12). Motivul: registrul nu există pentru intervalele numărate în B, care se încheie pe 2 septembrie 2026. În W raportăm, separat, în câte cazuri confirmă și arhiva registrului.
4. **Cum calculăm rata.** O estimăm, ținând cont de plecările pentru care nu găsim data. Motivul: dacă am număra doar plecările înainte de termen găsite, perioada în care găsim mai multe date ar părea să aibă mai multe înlocuiri (Anexa 4).
5. **Cum calculăm testul.** Valoarea p se calculează pe grupuri, nu pe persoane. Durata fiecărei perioade se înmulțește cu ponderea grupurilor în care am găsit cel puțin o dată de încheiere. Motivul: testul publicat presupune plecări independente unele de altele, dar ele vin în grupuri, iar atunci un test pe persoane face dovezile să pară mai puternice decât sunt. Raportăm separat și valoarea p a testului publicat, calculată pe persoane; ea nu intră în verdict (Anexa 4).
6. **O condiție nouă pentru „neconcludentă”.** Dacă, în oricare dintre perioade, găsim data de încheiere pentru mai puțin de 70% din plecări, H1 este neconcludentă. Motivul: fără această regulă, datele negăsite ar duce la numere mici, iar numerele mici duc adesea la verdictul „infirmată” (Anexa 4).
7. **Intervalul dintre două liste ONRC consecutive care cuprinde ziua T0 nu se numără** în nicio perioadă. Motivul: așa putem încheia căutarea pentru B și fixa rezultatele ei înainte de T0, deci înainte să existe date din W. Dacă nu reușim până la T0, le fixăm cel târziu înainte de prima listă ONRC publicată după T0 și spunem de ce (Anexa 3, pasul 7; regula A3).
8. **Verdictul final pentru H1 vine mai târziu**, probabil în februarie 2027. Motivul: uneori o persoană lipsește dintr-o listă ONRC și reapare în următoarea, așa că fiecare plecare se confirmă abia cu lista următoare (regula A12).

Pragurile de verdict (2; 1,5; 0,01; 0,05) nu se schimbă.

## 4. Cum se citește rezultatul

- **„Infirmată”** înseamnă că testul nu a găsit un val. Nu înseamnă că nu a existat unul.
  - Testul găsește greu un val de mărime moderată.
  - În simulare, dacă rata reală s-ar dubla, ipoteza ar ieși „susținută” doar în 5 până la 35 de cazuri din 100, după cât de mare este rata din B. Dacă s-ar tripla, în 23 până la 87 de cazuri din 100.
- **„Susținută”** descrie, cum spune preînregistrarea, un tipar statistic; nu dovedește nicio faptă.
- **Ce presupune estimarea.** Că plecările pentru care nu găsim data seamănă cu cele pentru care o găsim. Nu putem verifica asta direct, așa că raportăm și două calcule care nu schimbă verdictul: cazurile extreme și punctul de basculare (Anexa 4).
- **Ce poate înclina rezultatul.** Anexa 7 enumeră fiecare limitare cunoscută și direcția ei. Spre „susținută” pot înclina grupurile de plecări, o șansă diferită de a găsi data, regula A10 și actele pe care nu le găsim.

## 5. Calendarul pentru H1

| Când | Ce facem și ce publicăm |
|---|---|
| Înainte de T0, în orice caz | Publicăm amprentele programelor și ale instrucțiunilor care decid rezultatul, precum și pe cea a listei plecărilor din B și din perioada dinaintea lui (Anexa 3, pasul 7). |
| Înainte de T0 sau, dacă nu reușim, înainte de prima listă ONRC publicată după T0 | Încheiem colectarea și citirea documentelor pentru aceste plecări. Publicăm amprenta fișierului care le conține, cu ora publicării; copia din Wayback Machine dovedește data. |
| După prima listă ONRC publicată după T0 (probabil la începutul lui octombrie 2026) | Codul aplică automat regula A12 ultimului interval din B, ca oricărui alt interval. |
| T0 + 30 de zile | Valoarea de referință din B: rata lunară estimată a înlocuirilor înainte de termen, ponderea plecărilor cu dată găsită și rezultatul verificării. Probabil nicio listă ONRC nu va fi atribuită încă lui W; o vom spune. |
| T0 + 60 și T0 + 100 de zile | Rezultate intermediare pentru W, marcate ca atare, pentru că ultimul interval nu e încă verificat cu lista următoare (regula A12). |
| După lista ONRC care confirmă ultimul interval din W (probabil în februarie 2027) | Verdictul final pentru H1. |

H2 și H3 păstrează calendarul din secțiunea 5 a preînregistrării.

## 6. Erată

În secțiunea 2 a preînregistrării, la „Înlocuire la termen”, textul spune: „în perioada analizată, 161 de mandate ajung la termen”. Cifra corectă este **105**, dacă T0 este 29 septembrie 2026: potrivit registrului din 24 septembrie 2026, 105 mandate au data de încheiere în W.

Cele 161 de mandate erau toate mandatele cu data de încheiere înainte de T0 + 100 de zile. Printre ele erau și:
- 49 de mandate a căror dată de încheiere trecuse înainte de 24 septembrie 2026, dar care apăreau încă în registru;
- 7 mandate cu data de încheiere între 26 și 28 septembrie 2026, deci înainte de T0.

Cifra este doar context: nu intră în niciun test și în niciun prag. Dacă T0 se schimbă, o recalculăm cu aceeași regulă.

Poți verifica cifra din copia registrului păstrată în arhivă (comanda de mai jos cere git și Python):

```sh
git show 3b7c4ac:data/registry.json | python3 -c 'import json,sys; a=json.load(sys.stdin)["appointments"]; print(sum(1 for x in a if x["mandate_end_date"] and "2026-09-29" <= x["mandate_end_date"] < "2027-01-07"))'
```

## 7. Ce nu facem

- Nu schimbăm pragurile de verdict.
- Nu adăugăm și nu scoatem surse după publicarea acestei completări.
- Nu schimbăm, după T0, programele și instrucțiunile care decid rezultatul.
- Nu schimbăm, după ce le fixăm, documentele și actele găsite pentru B. Singura regulă aplicată apoi rezultatelor din B este confirmarea automată prin lista ONRC următoare (regula A12), aceeași ca pentru orice interval.
- Nu folosim pentru verdict valoarea p calculată pe persoane.
- Nu dăm verdict analizei secundare și nu o folosim ca să interpretăm H1.
- Ca în secțiunea 6 a preînregistrării, nu facem afirmații despre legalitatea, oportunitatea sau motivele vreunei numiri.

# Anexă: procedura completă

## Anexa 1. Termeni

| Termen | Definiție |
|---|---|
| **T0** | Data votului de încredere prin care este învestit noul Guvern, ca în preînregistrare: 29.09.2026 dacă votul trece, altfel data primului vot de învestire reușit. |
| **Perioada analizată (W)** | Primele 100 de zile de la T0, începând cu ziua T0. |
| **Perioada de comparație (B)** | De la 05.05.2026, data de la care Guvernul a rămas interimar, până în ziua dinaintea lui T0. |
| **Listă ONRC** | Lista lunară a reprezentanților legali publicată de ONRC pe data.gov.ro. Data listei este cea din titlul ei. |
| **Interval** | Zilele dintre două liste ONRC consecutive: de la ziua de după prima listă până la ziua celei de-a doua, inclusiv. |
| **Plecare** | Situația în care o persoană are cel puțin o funcție de conducere la o companie într-o listă ONRC și niciuna la aceeași companie în lista următoare. În preînregistrare: o persoană „iese dintr-o funcție de conducere”. Plecarea aparține intervalului dintre cele două liste. |
| **Grup** | Toate plecările de la aceeași companie din același interval. |
| **Data de încheiere** | Data de încheiere a mandatului din care pleacă persoana, stabilită după regulile din Anexa 2. |
| **Data unui act** | Ziua în care s-a hotărât: data ședinței sau a ordinului. Pentru un contract sau un act adițional, data semnării. Pentru o încheiere a registratorului, data ei. Dacă un document are mai multe date, folosim data hotărârii, așa cum o numește documentul. |
| **Listă publicată** | O listă ONRC este publicată în momentul în care apare pe data.gov.ro, așa cum îl înregistrăm la prima descărcare. |
| **Plecare cu dată găsită** | O plecare pentru care avem data de încheiere. |
| **Plecare înainte de termen** | O plecare cu dată găsită, a cărei dată de încheiere este după data primei liste ONRC în care persoana nu mai apare. |
| **Clasificare** | Încadrarea unei plecări, după regulile din Anexa 2: înainte de termen sau nu. |
| **Ponderea plecărilor cu dată găsită** | Partea din plecările unei perioade pentru care am găsit data de încheiere. Pe ea se aplică pragul de 70%. |
| **Ponderea grupurilor cu dată găsită** | Partea din grupurile unei perioade în care am găsit data de încheiere pentru cel puțin o plecare. Cu ea se înmulțește durata perioadei în calculul valorii p. |
| **Raport** | Rata lunară estimată din W împărțită la cea din B (Anexa 4). |
| **Valoarea p** | Probabilitatea ca o creștere cel puțin atât de mare să apară întâmplător dacă, de fapt, nu s-ar schimba nimic. De exemplu, p = 0,01 înseamnă 1 caz din 100. |

ONRC nu arată cine pe cine a înlocuit. De aceea, în locul înlocuirilor înainte de termen, numărăm plecările înainte de termen.

## Anexa 2. De unde luăm data de încheiere

**Unde căutăm.** Folosim numai următoarele patru surse oficiale, pentru fiecare plecare, din ambele perioade. Lista este închisă: după publicarea acestei completări nu mai adăugăm și nu mai scoatem surse.

1. **Registrul de pe guvernanta.gov.ro** (prin arhiva noastră) și documentele publicate în el: contractele de mandat și rapoartele de remunerare.
2. **Site-ul companiei**, inclusiv copiile din Wayback Machine: hotărârile adunării generale și ale consiliului, paginile despre conducere, rapoartele anuale, de guvernanță și de remunerare.
3. **Bursa de Valori București** (bvb.ro), pentru companiile listate: rapoartele curente, adică anunțurile publicate de companiile listate la bursă.
4. **Site-ul autorității tutelare** (ministerul sau instituția care coordonează compania), inclusiv copiile din Wayback Machine: ordinele și anunțurile de numire.

**Ce informații folosim.** Folosim o informație despre mandat numai dacă provine dintr-una dintre aceste surse și este:
- **din act:** hotărârea, ordinul sau contractul dă data de încheiere, ori data de început și durata mandatului;
- **din publicație:** o pagină, un raport sau registrul dă aceleași informații, fără actul însuși.

Nu folosim presa, CV-urile, site-urile comerciale cu informații despre firme și nici durata obișnuită a mandatelor prevăzută de lege.

**De la durată la dată.**
- Când sursa dă data de început și durata în luni sau ani, mandatul se încheie în ziua cu același număr din ultima lună a duratei. Dacă acea lună nu are ziua respectivă, mandatul se încheie în ultima ei zi.
- De exemplu, un mandat de 4 ani început pe 15 martie 2022 se încheie pe 15 martie 2026, iar unul de 6 luni început pe 31 august 2025 se încheie pe 28 februarie 2026.
- Pentru un act care stabilește o durată fără dată de început, considerăm că produce efecte de la data lui, deci numărăm de la data actului.

**Ce dată de încheiere folosim (regula A10).** O singură regulă, pentru toate plecările:
- **Pentru o persoană aflată în funcție la începutul perioadei** (5 mai 2026 pentru B, T0 pentru W), adică prezentă în ultima listă ONRC a cărei dată este cel târziu ziua respectivă, folosim data de încheiere valabilă în acea zi. O stabilește cel mai recent act adoptat sau semnat înainte de acea zi. Dacă o publicație de după acel act, dar tot dinaintea zilei respective, arată o dată de încheiere mai târzie, folosim publicația, pentru că ea arată o prelungire al cărei act nu l-am găsit. Registrul nu poate avea acest rol (vezi mai jos). Dacă nu găsim niciun act, o stabilește cea mai recentă publicație de dinainte de acea zi.
- **Pentru o persoană care nu apare în acea listă**, folosim data de încheiere stabilită la numirea care a adus-o în funcție: prima numire de după listă sau, dacă nu există, ultima numire de dinaintea ei, pentru că ONRC poate înregistra o numire abia mai târziu.
- **Actele de mai târziu nu schimbă clasificarea** (plecare înainte de termen sau nu). Nici prelungirile, nici scurtările de mandat și nici o nouă numire a aceleiași persoane. Astfel, clasificarea nu depinde de hotărârile luate în timpul perioadei în care numărăm plecarea. O scurtare de mandat hotărâtă înainte de începutul perioadei contează ca orice alt act.
- **Dacă nu găsim nimic de dinaintea perioadei**, folosim cea mai veche publicație de după începutul ei și marcăm cazul. Un act hotărât după începutul perioadei nu poate ține locul acesteia.
- **O revocare hotărâtă înainte de începutul perioadei**, pe care listele ONRC o arată abia în timpul perioadei, se numără tot în perioada listei (regula A4). Raportăm separat câte astfel de cazuri sunt.

**Când două surse nu se potrivesc.** Actul are prioritate față de publicație, cu excepția de mai sus: o publicație mai nouă decât actul, care arată o dată de încheiere mai târzie. Dacă două surse de același fel, cu aceeași dată, duc la clasificări diferite, plecarea rămâne fără dată găsită și o raportăm separat.

**Registrul.** Informațiile din registrul de pe guvernanta.gov.ro (persoana, funcția și data de încheiere) nu au prioritate nici față de acte, nici față de alte publicații. Le folosim doar pentru o plecare la care nicio altă sursă nu dă data de încheiere și marcăm cazul. Motivul: registrul a apărut abia în septembrie 2026. Pentru W există deci înainte de începutul perioadei, dar pentru B abia după. Dacă i-am da prioritate față de acte, ar scoate la iveală numai în W prelungirile ale căror acte nu le-am găsit, iar rezultatul ar înclina spre „susținută”. Documentele publicate în registru, cum sunt contractele de mandat, se folosesc ca oricare altele.

## Anexa 3. Cum căutăm

Pașii de mai jos sunt aceiași pentru fiecare plecare, din ambele perioade. Instrucțiunile complete, în engleză, se publică odată cu această completare, cu amprenta fișierului (SHA-256): un cod calculat din conținutul fișierului, care se schimbă la orice modificare.

1. **Colectarea.**
   - Un program strânge paginile și documentele fiecărei companii din cele patru surse, după reguli fixe: aceleași pagini de pornire, aceleași cuvinte-cheie și aceleași limite pentru numărul de pagini, de documente și de copii din Wayback Machine.
   - Păstrăm lista tuturor adreselor web verificate, fiecare cu rezultatul și cu amprenta fișierului.
2. **Citirea.**
   - Un model de inteligență artificială, cu aceeași configurație (același model, aceleași instrucțiuni) pentru ambele perioade, citește fiecare pasaj în care apare numele persoanei.
   - Notează toate actele despre mandatele ei la acea companie, pentru toate funcțiile: numiri, prelungiri, noi numiri, revocări.
   - Nu se oprește la primul act găsit.
   - Nu primește data plecării și nu are acces la internet: citește doar documentele colectate. Documentele pot conține totuși revocarea sau numirea succesorului, așa că nu putem garanta că modelul nu află când a plecat persoana. De aceea clasificarea o face codul, nu modelul.
3. **Documentele scanate.** Multe hotărâri sunt publicate ca imagini. Textul obținut automat din ele ajută doar la găsirea pasajului. Modelul citește data de pe imaginea paginii, nu din acest text.
4. **Clasificarea** o face codul, după regulile din Anexa 2.
5. **Verificarea.**
   - Pentru un eșantion din fiecare perioadă, citirea se reface independent, cu aceleași instrucțiuni, de un alt model de inteligență artificială.
   - Eșantionul are cel puțin 20 de plecări sau o zecime din plecările perioadei, dacă o zecime e mai mult de 20. O perioadă cu mai puțin de 20 de plecări se verifică în întregime.
   - Eșantionul îl tragem la sorți după o regulă fixată dinainte, pornind de la amprenta fișierului acestei completări (SHA-256). Astfel, alegerea e fixată înainte de căutare.
   - Raportăm în câte cazuri cele două citiri duc la aceeași clasificare. Un om notează cauza fiecărei diferențe.
   - Clasificarea rămâne cea din prima citire.
   - Dacă cele două citiri duc la aceeași clasificare în mai puțin de 80 de cazuri din 100, o spunem lângă verdict, ca semn că citirea e nesigură. Verdictul nu se schimbă.
   - Dacă modelul principal nu mai e disponibil înainte de citirea pentru W, modelul de verificare devine principal pentru ambele perioade. Recitim atunci B din documentele fixate și raportăm ambele rezultate. Regula e fixată acum, în instrucțiunile publicate.
6. **Identitatea.** Documentul oficial care numește persoana în acea funcție, la acea companie, este elementul care confirmă identitatea, pe lângă nume. Codul verifică și dacă mandatul din document se suprapune cu perioada în care persoana apare în listele ONRC la acea companie sau dacă s-a încheiat cu cel mult 18 luni înainte de prima listă în care apare. Motivul: listele ONRC arată uneori o persoană multe luni după încheierea mandatului. În registrul din 24 septembrie 2026, cele 49 de funcții trecute de data de încheiere o depășiseră cu cel mult 16,6 luni.
7. **Ce fixăm înainte de T0 și ce fixăm apoi.**
   - **Înainte de T0, în orice caz,** publicăm amprentele a tot ce decide rezultatul. După T0 nu le mai schimbăm. Lista lor completă este în instrucțiunile în engleză. Ele sunt:
     - aceste reguli și instrucțiunile în engleză;
     - configurația modelelor, cu versiunea exactă a fiecăruia, nu doar cu un nume care mai târziu poate desemna alt model;
     - programul care găsește plecările în listele ONRC, programul de colectare, programul care alege pasajele și programul care clasifică;
     - mediul în care rulează programele: versiunea Python, versiunile exacte ale bibliotecilor folosite și versiunea programului care recunoaște textul din paginile scanate;
     - lista plecărilor din B și din perioada dinaintea lui.
   - **Tot înainte de T0, dacă reușim,** încheiem colectarea și citirea pentru toate aceste plecări. Publicăm atunci, în acest depozit, lângă preînregistrare, amprenta fișierului care conține documentele colectate și actele găsite.
     - Dacă nu reușim, o facem cel târziu înainte de prima listă ONRC publicată după T0 și spunem de ce.
     - În ambele cazuri publicăm ora, iar copia din Wayback Machine dovedește data.
   - **După ce le fixăm, nu mai schimbăm aceste documente și acte.** Tot ce urmează este mecanic: codul clasifică plecările după regulile din Anexa 2, iar a doua citire (pasul 5) doar măsoară acordul.
   - **O singură regulă se aplică apoi rezultatelor din B:** confirmarea prin lista următoare (regula A12).
     - Ultimul interval numărat în B se încheie cu ultima listă ONRC publicată înainte de T0: lista din 2 septembrie 2026, dacă T0 este 29 septembrie 2026. Lista următoare este prima publicată după T0.
     - Codul verifică, cu ea, dacă persoanele plecate în acel interval reapar, exact ca pentru orice alt interval.
     - Intervalul acestei liste cuprinde ziua T0, așa că nu se numără în nicio perioadă (regula A3). Lista servește aici doar la această verificare.

## Anexa 4. Cum calculăm rata și testul

Pentru fiecare perioadă numărăm, după regulile din Anexa 5:
- toate plecările, plecările cu dată găsită și plecările înainte de termen;
- zilele intervalelor atribuite perioadei (regula A3);
- grupurile, grupurile cu cel puțin o plecare cu dată găsită și grupurile cu cel puțin o plecare înainte de termen.

**Primul pas: pragul minim de date.** Dacă în oricare dintre perioade ponderea plecărilor cu dată găsită este sub 70%, H1 este neconcludentă, pentru că avem prea puține date, iar calculul se oprește aici.
- Fără această regulă, puține date găsite ar însemna numere mici. Numerele mici duc adesea la p ≥ 0,05, iar după pragurile publicate asta ar însemna „infirmată”. Nu vrem ca datele negăsite să ducă la verdictul „infirmată”.
- Preînregistrarea are deja, la H2, o regulă pentru date prea puține: sub 20 de numiri noi, rezultatul este neconcludent.
- O perioadă fără nicio plecare are rata zero. Pentru ea, ponderea plecărilor cu dată găsită se socotește 100%.

**Rata lunară estimată** a înlocuirilor înainte de termen este numărul lunar al tuturor plecărilor, înmulțit cu ponderea plecărilor înainte de termen printre plecările cu dată găsită. Socotim luna la 30,44 zile (lungimea medie a unei luni).

De exemplu, cu numere inventate:
- într-o perioadă de 3 luni au fost 60 de plecări, adică 20 pe lună;
- am găsit data pentru 50 dintre ele; dintre acestea, 10 au fost înainte de termen, adică o cincime;
- rata estimată este 20 × 1/5 = 4 înlocuiri înainte de termen pe lună.

Exemplul arată și presupunerea: printre cele 10 plecări fără dată găsită, ponderea celor înainte de termen ar fi tot o cincime.

**Raportul** este rata estimată din W împărțită la cea din B, ambele calculate pe persoane, ca în preînregistrare. Pe el îl comparăm cu pragurile de 2 și 1,5.

**Valoarea p se calculează pe grupuri.**
- Numărăm, în fiecare perioadă, grupurile cu cel puțin o plecare înainte de termen. Un grup contează o singură dată, oricâte persoane ar fi plecat atunci.
- Durata fiecărei perioade se înmulțește cu ponderea grupurilor cu dată găsită.
- Apoi aplicăm testul Poisson exact, unilateral, din preînregistrare: un test statistic care compară numărul de evenimente din două perioade, ținând cont de durata lor. „Unilateral” înseamnă că verifică doar o creștere.
- Pentru că ponderea este estimată din date, testul nu mai este exact, ci aproximativ.

**De ce pe grupuri.**
- Testul publicat presupune că plecările sunt independente unele de altele. Nu sunt: când adunarea generală schimbă un consiliu, pleacă deodată mai multe persoane de la aceeași companie. În B, cele 76 de plecări au venit în 35 de grupuri.
- Numărul de persoane plecate diferă de la un interval la altul mai mult decât ar fi de așteptat dacă plecările ar fi independente. Numărul de grupuri, nu.
- Am verificat efectul printr-o simulare: am generat pe calculator, de multe ori, perioade fictive în care grupurile aveau mărimile observate în B, iar șansa de a găsi data nu depindea de clasificarea plecării.
  - Fără nicio schimbare reală, testul pe persoane a dat „susținută” în aproximativ 5 până la 8 cazuri din 100.
  - Testul pe grupuri a dat „susținută” în mai puțin de un caz din 100.
  - În schimb, testul pe grupuri găsește mai greu un val real.
- Raportăm separat și valoarea p a testului publicat, calculată pe persoane. Ea nu intră în verdict.

**De ce ajustăm durata.**
- Dacă am compara direct plecările înainte de termen găsite, perioada în care găsim mai multe date ar părea să aibă mai multe înlocuiri.
- În W vom găsi probabil mai multe date decât în B, pentru că registrul le are pe cele ale persoanelor aflate în funcție la 24 septembrie 2026.
- Am simulat și o situație cu plecări independente, fără nicio schimbare reală, în care data se găsea pentru jumătate din plecările din B și pentru 85 din 100 de plecări din W.
  - Comparația directă a dat „susținută” în 9 până la 23 de cazuri din 100.
  - Cu durata ajustată, testul a dat „susținută” în mai puțin de un caz din 100.

**Cazurile extreme și punctul de basculare.** Le raportăm pentru că estimarea presupune că plecările fără dată găsită seamănă cu celelalte. Nu schimbă verdictul.
- **cazurile extreme:** cel mai mic raport posibil (toate plecările fără dată găsită din B ar fi fost înainte de termen, niciuna din W) și cel mai mare (situația inversă);
- **punctul de basculare:** cât de mare ar trebui să fie, printre plecările fără dată găsită, ponderea celor înainte de termen, ca raportul să treacă de 2 sau de 1,5.

**Testul retroactiv** din secțiunea 4 a preînregistrării folosește aceleași reguli. În el, B este perioada analizată, iar perioada dinaintea lui este perioada de comparație (regula A9).

## Anexa 5. Reguli pentru punctele pe care preînregistrarea nu le lămurea

| | Întrebarea | Regula |
|---|---|---|
| A1 | Ce facem cu plecările din B fără dată de încheiere? | Anexele 2–4. |
| A2 | Ce sursă decide dacă a avut loc o schimbare? | Pentru H1, listele ONRC, în ambele perioade. Confirmarea prin registru, cerută de textul lui H1, e înlocuită cu confirmarea prin lista ONRC următoare (secțiunea 3, punctul 3; regula A12). Pentru H2 și H3 rămâne regula din secțiunea 2 a preînregistrării. |
| A3 | Unde numărăm un interval care cuprinde începutul sau sfârșitul unei perioade? | **Intervalul care cuprinde ziua T0 nu se numără în nicio perioadă.** Nu se numără nici un interval dinaintea lui T0 încheiat cu o listă publicată după T0, pentru că rezultatele din B trebuie fixate înainte de T0. Un interval care cuprinde începutul lui B sau sfârșitul lui W se numără în perioada în care cad cele mai multe zile ale lui, dacă de cealaltă parte cad cel mult 15 zile. Altfel nu se numără nicăieri și îl raportăm separat. În test, durata unei perioade este numărul total de zile din intervalele atribuite ei. Pentru B, dacă ONRC nu publică altă listă înainte de T0, asta înseamnă intervalele dintre 6 mai și 2 septembrie 2026, adică 119 zile. |
| A4 | Cum datăm o schimbare? | Cu intervalul dintre ultima listă ONRC în care persoana apare și prima în care nu mai apare. Nu folosim data hotărârii: nu o avem pentru toate plecările, iar două feluri de a data schimbările ar face perioadele greu de comparat. |
| A5 | Ce facem dacă data de încheiere cade în interiorul intervalului? | Plecarea nu se numără ca plecare înainte de termen. Înainte de termen înseamnă că data de încheiere este după data primei liste în care persoana nu mai apare. |
| A6 | Ce numărăm? | Plecările (secțiunea 3, punctul 2). O persoană, la o companie, într-un interval, înseamnă o singură plecare, oricâte funcții ar fi avut acolo. Dacă funcțiile au date de încheiere diferite, contează cea mai târzie: dacă și ea este după data primei liste în care persoana nu mai apare, persoana a plecat înainte de termen din cel puțin o funcție, chiar dacă pentru altă funcție documentele se contrazic. Dacă persoana trece de la o funcție de conducere la alta, la aceeași companie, nu numărăm o plecare. |
| A7 | Ce calități (rolurile trecute în listele ONRC) sunt funcții de conducere? | În consiliu: „administrator”, „administrator provizoriu”, „membru în consiliul de supraveghere”. În conducerea executivă: „director general unic”, „membru în directorat”, „administrator si conducator”, „administrator si reprezentant” (etichetele sunt redate ca în sursă). Nu socotim funcții de conducere: „reprezentant al persoanei juridice”, „administrator special” și calitățile din insolvență, cum sunt administratorul judiciar și lichidatorul. „Reprezentant al persoanei juridice” nu intră pentru că, pe 02.09.2026, nicio persoană cu această calitate nu avea, potrivit registrului, o funcție de conducere la aceeași companie. Directorii care nu sunt reprezentanți legali nu apar în listele ONRC, așa că H1 surprinde mai ales schimbările din consilii, la fel în ambele perioade. |
| A8 | Ce facem cu faptul că listele ONRC s-au schimbat începând cu cea din 2 martie 2026? | Folosim doar intervalele de după lista din 02.03.2026. Listele mai vechi nu conțin calitatea „administrator”, deci nu îi arată pe majoritatea membrilor consiliilor. |
| A9 | Care este „perioada dinaintea” lui B, în testul retroactiv? | Perioada de după lista ONRC din 02.03.2026 până pe 04.05.2026, ziua dinaintea lui B. Intervalele i se atribuie după regula A3, ceea ce dă aproximativ 65 de zile. Testul retroactiv are deci putere statistică mică: poate rata ușor un val real. O vom spune odată cu rezultatul. |
| A10 | Ce dată de încheiere folosim? | Data valabilă la începutul perioadei sau, pentru o persoană numită după ultima listă ONRC de dinaintea perioadei, data de încheiere stabilită la acea numire (Anexa 2). |
| A11 | Ce facem cu funcțiile fără dată de încheiere în registru? | Căutăm data după regulile din Anexele 2 și 3. Dacă nu o găsim, plecarea rămâne fără dată găsită. Dacă o sursă oficială arată că mandatul nu are termen, plecarea nu poate fi înainte de termen: nu o numărăm în H1 și o raportăm separat. |
| A12 | Ce facem cu persoanele care dispar dintr-o listă ONRC și reapar în următoarea? | O plecare se numără doar dacă persoana lipsește și din lista următoare. Fiecare număr devine deci definitiv abia după încă o listă ONRC. |
| A13 | Ce facem cu cifra de 161 de mandate? | Erata din secțiunea 6. |
| A14 | Unde încep și unde se termină perioadele? | W începe în ziua T0 și are 100 de zile: dacă T0 este 29.09.2026, ultima zi a lui W este 06.01.2027. B începe pe 05.05.2026 și se termină în ziua dinaintea lui T0. |
| A15 | Ce facem dacă o companie lipsește dintr-o listă? | Dacă o companie nu are niciun rând într-una dintre două liste consecutive, nu numărăm intervalul acela pentru ea. |
| A16 | Ce facem cu un nume scris altfel? | Aceeași dată a nașterii și un nume compatibil, la aceeași companie, înseamnă aceeași persoană. Nu numărăm o plecare și o intrare. |
| A17 | Ce facem dacă data nașterii apare într-o listă și lipsește din cealaltă? | Legătura s-ar sprijini doar pe nume, așa că nu o facem. Nu numărăm nici plecare, nici intrare. Raportăm cazul separat. |

## Anexa 6. Analiza secundară (fără verdict)

Raportăm și numărul lunar al tuturor plecărilor, nu doar al celor înainte de termen, în W față de B. Folosim aceleași liste, aceleași reguli și același test pe grupuri, dar fără ajustarea cu ponderea datelor găsite. Rezultatul nu primește verdict și nu schimbă verdictul lui H1.

Nu îl folosim ca test al ipotezei, din două motive:
- **În W se încheie multe mandate.**
  - Potrivit registrului din 24 septembrie 2026, 105 mandate au data de încheiere în W, dacă T0 este 29 septembrie 2026.
  - Pentru B nu putem face același calcul, pentru că registrul arată doar persoanele aflate în funcție la 24 septembrie 2026, nu și pe cele care au plecat. Nu știm deci dacă în W se încheie mai multe mandate decât în B.
  - Plecările la termen pot face ca numărul tuturor plecărilor să difere între perioade, fără legătură cu înlocuirile înainte de termen.
- **Listele ONRC reflectă uneori o plecare foarte târziu.**
  - Uneori, o persoană dispare din liste abia la multe luni după încheierea mandatului ei. În căutarea de probă (secțiunea 1) am găsit decalaje de până la aproximativ 15 luni.
  - Astfel de actualizări făcute târziu pot apărea în oricare perioadă și cresc numărul tuturor plecărilor, fără să spună ceva despre înlocuirile înainte de termen.

Alături de rezultat, raportăm câte dintre plecările cu dată găsită din fiecare perioadă au avut loc la termen sau după.

## Anexa 7. Ce nu știm și cum ar putea influența rezultatul

| Limitarea | Spre ce înclină rezultatul | Ce facem |
|---|---|---|
| Plecările vin în grupuri. Testul publicat, pe persoane, ar face dovezile să pară mai puternice decât sunt. | Spre „susținută” | Calculăm valoarea p pe grupuri. Rămâne presupunerea că grupurile sunt independente între ele. Datele din B nu o contrazic, dar verificarea are putere statistică mică. Dacă în W sunt mult mai multe plecări la termen, amestecate în aceleași grupuri cu cele înainte de termen, rezultatele „susținută” fără nicio schimbare reală pot urca, în simulare, până la aproximativ 2 din 100. |
| Șansa de a găsi data poate depinde de clasificarea plecării. Dacă datele plecărilor la termen se găsesc mai ușor, de exemplu la mandatele provizorii, rata din B iese prea mică. | Spre „susținută” | În scenariile simulate, cu valoarea p calculată pe grupuri, cazurile în care testul dă „susținută” fără nicio schimbare reală ajung până la aproximativ 6 din 100, iar într-un scenariu extrem până la aproximativ 15 din 100. Când șansa nu depinde de clasificare, sunt mai puțin de un caz din 100. Pragul de 70% nu elimină acest risc. Raportăm cazurile extreme și punctul de basculare. |
| Regula A10 folosește data valabilă la începutul perioadei. B (119 zile numărate) e mai lungă decât W (aproximativ 95 de zile numărate). Într-o perioadă mai lungă, mai multe mandate pot ajunge la data de încheiere și pot fi prelungite în timpul perioadei, iar plecările de după o astfel de prelungire se numără ca plecări la termen. | Spre „susținută” | Raportăm câte plecări și-ar schimba clasificarea dacă am folosi data valabilă la ultima listă în care apare persoana. |
| O prelungire hotărâtă înainte de începutul perioadei, dar negăsită, face ca data de încheiere să pară mai devreme, iar plecarea pare la termen. Riscul e mai mare în B, unde datele vin din documente mai vechi. | Spre „susținută” | Căutăm toate actele, pentru toate funcțiile, fără să ne oprim la primul act găsit. |
| Dacă nu găsim o a doua funcție a persoanei la aceeași companie, putem rata o dată de încheiere mai târzie (regula A6). Riscul e mai mare în B. | Spre „susținută” | Căutăm actele pentru toate funcțiile persoanei la acea companie. |
| Uneori o persoană lipsește dintr-o listă ONRC și reapare în următoarea. | Mai multe plecări false „înainte de termen”, în ambele perioade | Regula A12. |
| O schimbare apare în listele ONRC de obicei la câteva săptămâni după hotărâre, dar uneori la multe luni după încheierea mandatului. Listele atribuite lui W vor conține și schimbări hotărâte înainte de T0 și vor rata unele hotărâte la sfârșitul lui W. | Spre „infirmată” sau „neconcludentă” | În W măsurăm acest decalaj cu ajutorul arhivei registrului și îl raportăm. |
| Plecările la care data de încheiere cade în interval nu se numără ca plecări înainte de termen (regula A5). | Nu știm: efectul e mai mare în perioada în care se încheie mai multe mandate, iar pentru B nu știm câte se încheie | – |
| Și invers: dacă datele plecărilor înainte de termen se găsesc mai ușor, rata din B iese prea mare. | Spre „infirmată” | Cazurile extreme și punctul de basculare. |
| Plecările pentru care data de încheiere vine doar dintr-o publicație de după începutul perioadei (de exemplu, din registrul din 24.09.2026, pentru B) pot reflecta prelungiri hotărâte în perioadă. | Spre „infirmată” (puține cazuri) | Le marcăm și le raportăm. |
| Un mandat încheiat cu cel mult 18 luni înainte ca persoana să apară în listele ONRC este acceptat; unul mai vechi, nu. Pragul vine din registru: cea mai lungă depășire a datei de încheiere era de 16,6 luni. Dacă persoana a primit între timp un mandat nou, al cărui act nu l-am găsit, plecarea pare la termen. | Spre „susținută”, ca la prelungirile negăsite (riscul e mai mare în B) | Raportăm câte plecări trec doar datorită acestei reguli. |
| O publicație mai nouă decât ultimul act găsit, care arată o dată de încheiere mai târzie, are prioritate (registrul nu are acest rol). Dacă publicația greșește, plecarea pare înainte de termen. | Mai multe plecări înainte de termen, în ambele perioade; efectul net nu îl știm | Raportăm câte astfel de cazuri sunt în fiecare perioadă. |
| Plecările din funcții fără termen rămân printre plecările din B fără dată găsită, dacă nicio sursă nu arată că funcția e fără termen. | Spre „infirmată” (efect mic) | – |
| Testul găsește greu un val de mărime moderată (secțiunea 4). | „Infirmată” înseamnă că testul nu a găsit un val, nu că nu a existat unul | – |
| Registrul dă data de încheiere doar pentru plecările la care nicio altă sursă nu o dă. Asta se întâmplă aproape numai în W, pentru că registrul a apărut abia în septembrie 2026. Data din registru e cea valabilă atunci, pe când un document mai vechi poate să nu arate o prelungire ulterioară. Registrul poate și greși. | Spre „susținută”, puțin. În simulare, fără nicio schimbare reală, cazurile „susținută” cresc cu cel mult aproximativ un caz din 200, chiar dacă 5 din 100 de rânduri ale registrului ar da o dată prea târzie. | Marcăm aceste plecări și raportăm câte sunt în fiecare perioadă. Raportăm și rezultatul calculat ca și cum ele nu ar avea dată găsită. Pentru plecările din W la care avem data atât din registru, cât și din documente, comparăm clasificările. |
| Căutarea pentru W se face după ce apar listele din W. | Nu știm | Colectarea și citirea urmează reguli fixe, cu aceleași limite pentru numărul de pagini și de documente, așa că nu putem căuta mai mult sau mai puțin în funcție de rezultat. |
| Directorii care nu sunt reprezentanți legali nu apar în listele ONRC. | Fără direcție | H1 surprinde mai ales schimbările din consilii, la fel în ambele perioade. |

## Anexa 8. Ce am schimbat după căutarea de probă și după verificarea critică

**Căutarea de probă** (secțiunea 1). Am găsit data de încheiere pentru toate cele 15 plecări, în documentele publicate în registru și pe site-urile companiilor, uneori în copiile din Wayback Machine. După căutare am schimbat trei lucruri:
- am adăugat căutarea prelungirilor de mandat, pe care această versiune o înlocuiește cu regula A10 (Anexa 2);
- datele din documentele scanate se citesc de pe imagine (Anexa 3, pasul 3);
- am trecut printre limitări actualizările făcute târziu în listele ONRC (Anexa 7).

Pentru fiecare regulă, direcția în care poate înclina rezultatul este în Anexa 7.

**Verificarea critică a primei versiuni.** Ea a arătat că plecările vin în grupuri, că regula A10 era neclară și că regulile de căutare lăsau loc de alegeri. În această versiune:
- valoarea p se calculează pe grupuri (Anexa 4);
- regula A10 este una singură, aplicată de cod (Anexa 2);
- căutarea urmează reguli fixe (Anexa 3);
- rezultatele căutării pentru B se fixează înainte de T0 (Anexa 3, pasul 7);
- lista limitărilor este completă (Anexa 7).

**A doua verificare critică**, pe versiunea următoare, a găsit câteva reguli care puteau decide clasificarea în mod neclar:
- verificarea identității respingea mandatele încheiate înainte ca persoana să apară în listele ONRC;
- o regulă lăsa un act din timpul perioadei să decidă, contrar textului public;
- un act mai vechi avea întâietate față de o publicație mai nouă.

Le-am corectat (Anexele 2 și 3). Codul care clasifică și celelalte programe se fixează înainte de T0 (Anexa 3, pasul 7).

**A treia verificare critică**, pe versiunea următoare, a găsit două lucruri:
- registrul putea corecta, numai în W, o dată de încheiere luată dintr-un act mai vechi;
- lista programelor și a fișierelor pe care le fixăm înainte de T0 nu cuprindea programul care găsește plecările, versiunile exacte ale modelelor și mediul în care rulează programele.

Acum registrul dă data doar când nicio altă sursă nu o dă (Anexa 2), iar lista le cuprinde și pe acestea (Anexa 3, pasul 7).

