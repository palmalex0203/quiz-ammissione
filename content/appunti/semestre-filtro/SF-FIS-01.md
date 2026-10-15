---
codice: SF-FIS-01
percorso: SEMESTRE_FILTRO
materia: Fisica
titolo: "Introduzione ai metodi della fisica"
stato: bozza
fonti:
  - "Syllabus MUR Fisica 2026/2027, unità didattica 1 (0,2 CFU, di cui almeno il 20% di esercitazioni) — content/semestre-filtro/syllabus/fisica-2026-2027.txt"
  - "Prove ufficiali 1º e 2º appello 2025/2026 (Fisica), domande 1 e 10 del primo appello e 4, 5, 13, 15 del secondo"
---

# Introduzione ai metodi della fisica

Sulla carta vale **0,2 CFU su 6**, l'unità più piccola del programma: una domanda su trentuno, forse. In pratica ne vale molte di più, perché **le unità di misura, gli ordini di grandezza e i vettori compaiono dentro le domande di tutte le altre unità**. Chi sbaglia una conversione sbaglia l'esercizio sui fluidi, non questa unità.

E attenzione al taglio: in Fisica il syllabus chiede esplicitamente **esercitazioni** (almeno il 20% per questa unità, fino al 30% per altre) e le prove ufficiali sono in buona parte **esercizi numerici**, non definizioni. Perciò questo appunto è fatto di conti svolti.

**Indice**
1. Grandezze fisiche, dimensioni, unità
2. Il Sistema Internazionale
3. Notazione scientifica e ordini di grandezza
4. Multipli, sottomultipli e conversioni
5. L'analisi dimensionale, e come ti salva
6. Grandezze estensive e intensive
7. Trigonometria essenziale
8. Vettori
9. Esercizi svolti
10. Errori tipici

---

## 1. Grandezze fisiche, dimensioni, unità

Una **grandezza fisica** è una proprietà misurabile. Misurarla significa confrontarla con un campione: il risultato è sempre **un numero più un'unità**. Un numero da solo, in fisica, non è una risposta.

Vanno tenuti distinti tre concetti che si confondono di continuo:

- la **grandezza**: la lunghezza;
- la **dimensione**: [L], cioè *di che tipo* è quella grandezza, indipendentemente da come la misuri;
- l'**unità di misura**: metro, centimetro, miglio — scelte convenzionali per esprimerla.

Una velocità ha dimensioni [L][T]⁻¹ sempre: che la misuri in m/s, in km/h o in nodi, la dimensione non cambia. Le dimensioni si scrivono fra parentesi quadre e si combinano come potenze.

Le tre dimensioni fondamentali che servono quasi sempre sono **[M]** massa, **[L]** lunghezza, **[T]** tempo.

---

## 2. Il Sistema Internazionale

Sette **grandezze fondamentali**, da cui tutte le altre si derivano:

| Grandezza | Unità | Simbolo | Dimensione |
|---|---|---|---|
| lunghezza | metro | m | [L] |
| massa | chilogrammo | kg | [M] |
| tempo | secondo | s | [T] |
| intensità di corrente | ampere | A | [I] |
| temperatura termodinamica | kelvin | K | [Θ] |
| quantità di sostanza | mole | mol | [N] |
| intensità luminosa | candela | cd | [J] |

Due cose su cui si sbaglia: l'unità di massa è il **chilogrammo**, non il grammo — è l'unica fondamentale che porta già un prefisso. E la temperatura fondamentale è il **kelvin**, che si scrive **senza il grado**: 300 K, non 300 °K.

Le **unità derivate** più utili, con la loro definizione in unità fondamentali:

| Grandezza | Unità | In unità fondamentali | Dimensioni |
|---|---|---|---|
| forza | newton (N) | kg·m/s² | [M][L][T]⁻² |
| energia, lavoro, calore | joule (J) | N·m = kg·m²/s² | [M][L]²[T]⁻² |
| potenza | watt (W) | J/s = kg·m²/s³ | [M][L]²[T]⁻³ |
| pressione | pascal (Pa) | N/m² = kg/(m·s²) | [M][L]⁻¹[T]⁻² |
| frequenza | hertz (Hz) | s⁻¹ | [T]⁻¹ |
| carica | coulomb (C) | A·s | [I][T] |
| differenza di potenziale | volt (V) | J/C | [M][L]²[T]⁻³[I]⁻¹ |

> **Cosa ti chiedono.** 1º appello, domanda 1: che dimensioni ha una forza. Si ricava da *F = ma*: [M] · [L][T]⁻² = **[M][L][T]⁻²**. 2º appello, domanda 3: in cosa si misura l'energia cinetica — **joule**, perché ½mv² ha dimensioni [M]·([L][T]⁻¹)² = [M][L]²[T]⁻².

---

## 3. Notazione scientifica e ordini di grandezza

Ogni numero si scrive come **a × 10ⁿ** con **1 ≤ |a| < 10**. Il vincolo su *a* è parte della definizione: 35 × 10³ non è in notazione scientifica, 3,5 × 10⁴ sì.

Le regole dei conti:
- **prodotto**: si moltiplicano i coefficienti e **si sommano** gli esponenti → (2 × 10³)(4 × 10⁵) = 8 × 10⁸;
- **quoziente**: si dividono i coefficienti e **si sottraggono** gli esponenti → (8 × 10⁶)/(2 × 10²) = 4 × 10⁴;
- **potenza**: (3 × 10²)³ = 27 × 10⁶ = 2,7 × 10⁷;
- **somma**: si possono sommare solo numeri **con lo stesso esponente** → 3 × 10⁵ + 4 × 10⁴ = 3 × 10⁵ + 0,4 × 10⁵ = 3,4 × 10⁵.

L'**ordine di grandezza** è la potenza di dieci più vicina. Convenzione pratica: se il coefficiente è minore di 5 si tiene l'esponente, se è maggiore si sale di uno. 3 × 10⁴ ha ordine di grandezza 10⁴; 7 × 10⁴ ha ordine di grandezza 10⁵.

Serve per le **stime**: quante cellule in un corpo umano, quanti respiri in una vita. In un test a risposta multipla una stima dell'ordine di grandezza spesso elimina tre alternative su cinque in cinque secondi, senza fare il conto esatto.

---

## 4. Multipli, sottomultipli e conversioni

| Prefisso | Simbolo | Fattore |
|---|---|---|
| tera | T | 10¹² |
| giga | G | 10⁹ |
| mega | M | 10⁶ |
| chilo | k | 10³ |
| etto | h | 10² |
| deca | da | 10¹ |
| deci | d | 10⁻¹ |
| centi | c | 10⁻² |
| milli | m | 10⁻³ |
| micro | μ | 10⁻⁶ |
| nano | n | 10⁻⁹ |
| pico | p | 10⁻¹² |
| femto | f | 10⁻¹⁵ |

Il metodo sicuro per convertire è **moltiplicare per frazioni che valgono 1**, scritte in modo che l'unità da togliere si semplifichi:

> **72 km/h** = 72 · (1000 m / 3600 s) = **20 m/s**

Da ricordare a memoria: **km/h → m/s si divide per 3,6**; **m/s → km/h si moltiplica per 3,6**.

**Aree e volumi**: il fattore va elevato alla potenza giusta. È l'errore più frequente in assoluto.

- 1 m = 10² cm, quindi **1 m² = 10⁴ cm²** e **1 m³ = 10⁶ cm³**;
- **1 dm³ = 1 litro**, e **1 cm³ = 1 mL**;
- quindi **1 m³ = 1000 litri**.

**Densità**: 1 g/cm³ = **1000 kg/m³**. Da usare a memoria in tutti gli esercizi sui fluidi — l'acqua è 1 g/cm³ cioè 1000 kg/m³.

> **Cosa ti chiedono.** 1º appello, domanda 10: *«10⁻⁹ km = 1 μm»*. Verifica: 10⁻⁹ km = 10⁻⁹ · 10³ m = 10⁻⁶ m = 1 μm. Vero.
> 2º appello, domanda 4: 10 dm³ corrisponde a **10 litri**.

---

## 5. L'analisi dimensionale, e come ti salva

Due regole, e sono potenti:

1. **si possono sommare solo grandezze con le stesse dimensioni**. Un'equazione in cui sommi una lunghezza a un tempo è sbagliata, punto;
2. **i due membri di un'equazione hanno sempre le stesse dimensioni**.

Da qui il trucco da test: davanti a cinque formule candidate, **controlla le dimensioni e scarta quelle che non tornano**. Spesso ne resta una sola, e non hai dovuto ricordare nulla.

*Esempio.* Il periodo di un pendolo: è **T = 2π·√(L/g)** oppure **T = 2π·√(g/L)**?

> √( [L] / ([L][T]⁻²) ) = √( [T]² ) = [T]  ✓

La prima. L'altra darebbe [T]⁻¹, cioè una frequenza.

**Argomenti di funzioni e esponenti sono sempre adimensionali.** In e^(−t/τ) il rapporto t/τ deve essere un numero puro; in sen(ωt) il prodotto ωt pure. Se un esercizio ti dà una costante dentro un esponenziale, le sue dimensioni sono già determinate.

Esistono grandezze **adimensionali**: il numero di Reynolds, l'indice di rifrazione, i coefficienti di attrito, le deformazioni relative. Non hanno unità perché sono rapporti fra grandezze omogenee.

> **Cosa ti chiedono.** 2º appello, domanda 13: l'unità di misura del numero di Reynolds. **È una grandezza adimensionale** — nessuna unità. Nelle alternative mettono kg·m/s², ohm e pascal·s/m apposta.

---

## 6. Grandezze estensive e intensive

- **Estensiva**: dipende dalla quantità di materia, e se unisci due sistemi **si somma**. Massa, volume, numero di moli, energia, capacità termica.
- **Intensiva**: non dipende dalla quantità, e unendo due sistemi uguali **resta la stessa**. Temperatura, pressione, densità, concentrazione, calore specifico.

La prova pratica: prendi due bicchieri d'acqua identici a 20 °C e versali in uno solo. Il **volume raddoppia** (estensivo), la **temperatura resta 20 °C** (intensiva).

Osservazione utile: **il rapporto fra due grandezze estensive è intensivo**. La densità è massa su volume, due estensive, e il risultato è intensivo. Allo stesso modo il calore specifico è capacità termica su massa.

---

## 7. Trigonometria essenziale

In un triangolo rettangolo, rispetto all'angolo θ:

> **sen θ** = cateto opposto / ipotenusa
> **cos θ** = cateto adiacente / ipotenusa
> **tg θ** = sen θ / cos θ

I valori da sapere a memoria, perché nei test i numeri sono scelti apposta:

| θ | 0° | 30° | 45° | 60° | 90° |
|---|---|---|---|---|---|
| sin | 0 | 1/2 | √2/2 | √3/2 | 1 |
| cos | 1 | √3/2 | √2/2 | 1/2 | 0 |
| tan | 0 | √3/3 | 1 | √3 | — |

Con √2 ≈ 1,41 e √3 ≈ 1,73.

L'identità fondamentale: **sen²θ + cos²θ = 1**.

**Dove serve in fisica**: scomporre una forza su un piano inclinato (componente lungo il piano mg·sen θ, perpendicolare mg·cos θ), trovare le componenti di un vettore, calcolare il lavoro L = F·s·cos θ, e nella legge di Snell per la rifrazione.

---

## 8. Vettori

Una grandezza **scalare** è completamente descritta da un numero con unità: massa, tempo, temperatura, energia, lavoro, carica, pressione, densità.

Una grandezza **vettoriale** ha bisogno anche di **direzione** e **verso**: spostamento, velocità, accelerazione, forza, quantità di moto, campo elettrico, campo magnetico.

Attenzione al lessico italiano, che il test usa con precisione: la **direzione** è la retta su cui giace il vettore, il **verso** è uno dei due sensi di percorrenza su quella retta. Due vettori opposti hanno **la stessa direzione e verso contrario** — non «direzione opposta».

### Componenti

Dato un vettore **a** di modulo *a* che forma un angolo θ con l'asse x:

> aₓ = a·cos θ  ·  aᵧ = a·sen θ  ·  a = √(aₓ² + aᵧ²)  ·  tg θ = aᵧ / aₓ

Lavorare per componenti è quasi sempre la strada più rapida: si sommano separatamente le x e le y, e solo alla fine si ricompone il modulo.

### Somma e differenza

Graficamente: **regola del parallelogramma** o metodo punta-coda. Per componenti: (a+b)ₓ = aₓ + bₓ e (a+b)ᵧ = aᵧ + bᵧ.

La **differenza** **a** − **b** è la somma **a** + (−**b**), cioè si ribalta il secondo vettore e si somma.

**Quanto può valere il modulo della somma.** Questo è il punto che il test verifica più spesso:

- vettori **concordi** (stessa direzione, stesso verso): |**a**+**b**| = a + b, il **massimo** possibile;
- vettori **opposti** (stessa direzione, verso contrario): |**a**+**b**| = |a − b|, il **minimo** possibile;
- vettori **perpendicolari**: |**a**+**b**| = √(a² + b²), per Pitagora;
- in generale, con θ fra i due: |**a**+**b**| = √(a² + b² + 2ab·cos θ).

Quindi il modulo della somma è sempre compreso fra |a − b| e a + b.

### Prodotto scalare

> **a** · **b** = ab·cos θ = aₓbₓ + aᵧbᵧ

Il risultato è uno **scalare**, non un vettore. Vale **zero quando i vettori sono perpendicolari**, perché cos 90° = 0 — ed è il modo più rapido per verificare la perpendicolarità.

Esempio fisico: il **lavoro** è il prodotto scalare di forza e spostamento, L = **F** · **s** = F·s·cos θ. Una forza perpendicolare allo spostamento **non compie lavoro**: è il motivo per cui la forza centripeta, nel moto circolare uniforme, non cambia l'energia cinetica.

### Prodotto vettoriale

> |**a** × **b**| = ab·sen θ

Il risultato è un **vettore**, **perpendicolare al piano** dei due, con verso dato dalla regola della mano destra. Vale **zero quando i vettori sono paralleli** (sin 0° = 0) — l'opposto del prodotto scalare.

**Non è commutativo**: **a** × **b** = −(**b** × **a**). Il prodotto scalare invece lo è.

Esempi fisici: il **momento di una forza** **M** = **r** × **F**, e la **forza di Lorentz** **F** = q(**v** × **B**).

| | prodotto scalare | prodotto vettoriale |
|---|---|---|
| risultato | scalare | vettore |
| formula | ab·cos θ | ab·sen θ |
| è nullo se | perpendicolari | paralleli |
| è massimo se | paralleli | perpendicolari |
| commutativo | sì | no |

---

## 9. Esercizi svolti

**1. Due vettori la cui somma ha modulo |a − b|.**
*La somma di due vettori **a** e **b** produce un vettore di modulo |**a** − **b**|. Cosa puoi dire dei due vettori?*

Uguagliamo i moduli ed eleviamo al quadrato:

> |**a**+**b**|² = |**a**−**b**|²
> a² + 2(**a**·**b**) + b² = a² − 2(**a**·**b**) + b²
> 4(**a**·**b**) = 0  →  **a**·**b** = 0

Prodotto scalare nullo: **i due vettori sono perpendicolari**.

> È la domanda 5 di Fisica del 2º appello. Il tranello è leggere «|a − b|» come la differenza dei *moduli* invece che il modulo della *differenza*: in quel caso la risposta sarebbe «stessa direzione e versi opposti», che è l'alternativa messa lì apposta.

**2. Spostamento risultante.**
*Una nave percorre 10 km verso Nord, 6 km verso Est e infine 18 km verso Sud. Quanto vale il modulo dello spostamento risultante?*

Si lavora per componenti, con Nord ed Est positivi:

- componente Est–Ovest: +6 km
- componente Nord–Sud: +10 − 18 = −8 km

> s = √(6² + 8²) = √(36 + 64) = √100 = **10 km**

Nota due cose: lo **spostamento** (10 km) non è il **cammino percorso** (34 km), e il triangolo 6-8-10 è il 3-4-5 raddoppiato — nei test i numeri sono quasi sempre scelti così.

**3. Dimensioni di una costante.**
*Nella legge di Hooke F = −kx, che dimensioni ha k?*

> [k] = [F] / [L] = [M][L][T]⁻² / [L] = **[M][T]⁻²**

In unità SI: N/m, cioè kg/s².

**4. Conversione composta.**
*Una densità di 0,8 g/cm³ quanto vale in kg/m³?*

> 0,8 g/cm³ · (10⁻³ kg / 1 g) · (10⁶ cm³ / 1 m³) = 0,8 · 10³ = **800 kg/m³**

La scorciatoia: **g/cm³ → kg/m³ si moltiplica per 1000**. Serve in ogni esercizio sul galleggiamento.

**5. Scomposizione di una forza.**
*Un corpo di massa 10 kg sta su un piano inclinato di 30°. Quanto vale la componente del peso parallela al piano? (g = 9,8 m/s²)*

> F∥ = mg·sen θ = 10 · 9,8 · sen 30° = 10 · 9,8 · 0,5 = **49 N**

La componente perpendicolare è mg·cos 30° = 98 · 0,866 ≈ 85 N. Il seno va con la componente **lungo** il piano: è l'errore più comune invertirli.

**6. Stima per ordini di grandezza.**
*Quante volte batte il cuore in una vita di 80 anni?*

Circa 70 battiti al minuto → ~10² al minuto come ordine di grandezza.
Minuti in 80 anni: 80 · 365 · 24 · 60 ≈ 4 × 10⁷.
Prodotto: 10² · 4 × 10⁷ = 4 × 10⁹, cioè **qualche miliardo**.

Non serve il numero esatto: serve escludere le alternative sbagliate di tre ordini di grandezza.

---

## 10. Errori tipici

**Convertire aree e volumi col fattore lineare.** 1 m² non è 100 cm², è 10 000 cm². Il fattore va al quadrato per le aree, al cubo per i volumi. È l'errore numero uno.

**Confondere direzione e verso.** Due vettori opposti hanno la **stessa** direzione.

**Scrivere °K.** Il kelvin non vuole il simbolo di grado.

**Credere che il prodotto scalare dia un vettore.** Dà un numero. «Scalare» è nel nome.

**Dimenticare che la somma vettoriale non è la somma dei moduli.** Due forze da 3 N e 4 N danno una risultante fra 1 N e 7 N: 5 N se sono perpendicolari.

**Confondere spostamento e cammino percorso.** Il primo è un vettore e dipende solo da partenza e arrivo; il secondo è uno scalare e dipende dal percorso. Su un giro completo lo spostamento è zero, il cammino no.

**Invertire seno e coseno sul piano inclinato.** Lungo il piano va il **seno** dell'angolo di inclinazione.

**Sommare numeri in notazione scientifica con esponenti diversi** senza prima uniformarli.

**Dare unità a grandezze adimensionali.** Reynolds, indice di rifrazione e coefficiente di attrito non ne hanno.

---

## Da verificare prima di pubblicare

- **Formule matematiche**: il sito non ha un motore per le formule — il convertitore markdown in uso (marked con GFM) non le interpreta e per di più elimina le barre rovesciate, quindi il LaTeX uscirebbe illeggibile. Le formule di questo appunto sono state riscritte in caratteri normali (π, √, ², ⁻², θ, ·), che si leggono bene anche su telefono. Se in futuro servissero formule più complesse — integrali, frazioni su più righe, matrici — bisognerà aggiungere KaTeX al convertitore: **è una decisione che vale per tutta Fisica e Chimica**, non per questo appunto soltanto.
- **Valore di g**: ho usato 9,8 m/s². Le prove ufficiali a volte usano 9,81 e a volte approssimano a 10. Da chiedere alla professoressa quale convenzione adottare negli esercizi, per non confondere.
- **Tavola dei prefissi**: ho incluso da femto a tera. Verificare se il corso ne chiede altri (atto, exa) o se è sovrabbondante.
- **Esercizio 1 (vettori perpendicolari)**: è la domanda 5 di Fisica del 2º appello, e la nostra chiave nel database **era sbagliata** — diceva «stessa direzione e versi opposti». È stata corretta il 2026-10-14 dopo il confronto con la correzione di Alpha Test. Vale la pena che la professoressa riguardi proprio questa, perché è il caso in cui il testo si presta a due letture.
- Le sezioni «Cosa ti chiedono» citano domande reali dei due appelli 2025/2026, ma **le risposte corrette sono state ricavate da noi** e non sono chiavi ministeriali.
