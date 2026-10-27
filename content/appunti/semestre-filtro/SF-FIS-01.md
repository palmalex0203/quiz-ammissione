---
codice: SF-FIS-01
percorso: SEMESTRE_FILTRO
materia: Fisica
titolo: "Introduzione ai metodi della fisica"
stato: bozza
fonti:
  - "Syllabus MUR Fisica 2026/2027, unità didattica 1 (0,2 CFU, di cui almeno il 20% di esercitazioni) — content/semestre-filtro/syllabus/fisica-2026-2027.txt"
  - "Prove ufficiali 1º e 2º appello 2025/2026 (Fisica), domande 1 e 10 del primo appello e 3, 4, 5, 13, 15 del secondo"
---

# Introduzione ai metodi della fisica

Sulla carta questa unità vale **0,2 CFU su 6**, la più piccola del programma: una domanda su trentuno, forse. In pratica ne vale molte di più, perché **unità di misura, ordini di grandezza e vettori compaiono dentro le domande di tutte le altre unità**. Chi sbaglia una conversione non sbaglia questa unità: sbaglia l'esercizio sui fluidi, quello sulla termodinamica e quello sull'elettricità.

L'appunto parte da zero: ogni concetto viene spiegato prima di essere usato, e non si dà per scontato nulla di quello che hai fatto o non hai fatto al liceo.

Una cosa sul taglio. In Fisica il syllabus chiede esplicitamente **esercitazioni** — almeno il 20% per questa unità — e le prove ufficiali sono fatte in buona parte di **esercizi numerici**, non di definizioni. Quindi qui si impara facendo: ogni concetto finisce in un conto.

---

## 1. Che cos'è la fisica, e perché si misura

La fisica studia **come si comportano le cose**, e lo fa con un metodo preciso: osserva un fenomeno, lo descrive con dei numeri, e cerca una regola che leghi quei numeri fra loro. Quella regola, scritta in forma matematica, è una **legge fisica**, e serve a **prevedere**: se so quanto pesa un corpo e quanta forza gli applico, so quanto accelererà, anche senza provarci.

Perché misurare sia possibile serve un accordo. Dire «questa stanza è lunga» non è una misura; dire «questa stanza è lunga 4» nemmeno, perché 4 di cosa? Una misura è sempre **un numero più un'unità**: 4 metri. Il numero dice quante volte la cosa misurata contiene il campione scelto, l'unità dice qual è il campione.

Questa è la prima regola pratica del corso: **in fisica un numero senza unità non è una risposta**. Negli esercizi del test, le alternative sbagliate sono spesso il numero giusto con l'unità sbagliata.

---

## 2. Grandezza, dimensione, unità: tre cose diverse

Sono tre parole che vengono usate come sinonimi nel parlato e che invece in fisica significano cose distinte. Conviene separarle subito, perché il test ci costruisce sopra delle domande.

**La grandezza fisica** è la *proprietà* che stai misurando: la lunghezza, la massa, il tempo, la velocità, la temperatura. È il «che cosa».

**La dimensione** dice *di che tipo* è quella grandezza, indipendentemente da come la misuri. Si scrive fra parentesi quadre. La lunghezza ha dimensione **[L]**, la massa **[M]**, il tempo **[T]**.

**L'unità di misura** è il campione concreto che hai scelto per esprimerla: metro, centimetro, piede, miglio. È una scelta convenzionale: potresti cambiarla domani e la fisica non cambierebbe.

Un esempio chiarisce tutto. La velocità è una lunghezza divisa per un tempo, quindi ha dimensioni **[L][T]⁻¹**. Puoi misurarla in metri al secondo, in chilometri all'ora, in nodi: l'**unità** cambia, la **dimensione** resta [L][T]⁻¹ sempre. Se invece una cosa ha dimensioni diverse, è una grandezza diversa — non la stessa espressa in modo diverso.

Le dimensioni si combinano come potenze: se una grandezza è un prodotto, le dimensioni si moltiplicano; se è un rapporto, si dividono. L'esponente negativo significa «al denominatore»: [T]⁻¹ vuol dire «diviso un tempo», [T]⁻² «diviso un tempo al quadrato».

Nella stragrande maggioranza degli esercizi ti bastano tre dimensioni fondamentali: **[M]** massa, **[L]** lunghezza, **[T]** tempo.

---

## 3. Il Sistema Internazionale

Perché tutti misurino nello stesso modo esiste un accordo mondiale, il **Sistema Internazionale di unità di misura** (abbreviato **SI**). Funziona così: si scelgono **sette grandezze fondamentali**, si definisce un'unità per ciascuna, e **tutte le altre grandezze si costruiscono da queste** combinandole. Le unità così costruite si chiamano **derivate**.

### Le sette fondamentali

| Grandezza | Unità | Simbolo | Dimensione |
|---|---|---|---|
| lunghezza | metro | m | [L] |
| massa | chilogrammo | kg | [M] |
| tempo | secondo | s | [T] |
| intensità di corrente | ampere | A | [I] |
| temperatura termodinamica | kelvin | K | [Θ] |
| quantità di sostanza | mole | mol | [N] |
| intensità luminosa | candela | cd | [J] |

Due trappole classiche:

- l'unità di massa è il **chilogrammo**, non il grammo. È l'unica unità fondamentale che porta già un prefisso dentro il nome, e questo crea confusione nelle conversioni;
- la temperatura fondamentale è il **kelvin**, e si scrive **senza il simbolo di grado**: si scrive 300 K, non 300 °K. Il kelvin ha la stessa ampiezza del grado Celsius ma parte dallo zero assoluto: **T(K) = t(°C) + 273,15**.

### Le derivate che servono

Ogni unità derivata, per quanto abbia un nome proprio, **è solo un'abbreviazione** di una combinazione di unità fondamentali. Conoscere quella combinazione è più utile che conoscere il nome, perché ti permette di ricavarti le dimensioni al volo.

| Grandezza | Unità | In unità fondamentali | Dimensioni |
|---|---|---|---|
| forza | newton (N) | kg·m/s² | [M][L][T]⁻² |
| energia, lavoro, calore | joule (J) | N·m = kg·m²/s² | [M][L]²[T]⁻² |
| potenza | watt (W) | J/s = kg·m²/s³ | [M][L]²[T]⁻³ |
| pressione | pascal (Pa) | N/m² = kg/(m·s²) | [M][L]⁻¹[T]⁻² |
| frequenza | hertz (Hz) | 1/s | [T]⁻¹ |
| carica elettrica | coulomb (C) | A·s | [I][T] |
| differenza di potenziale | volt (V) | J/C | [M][L]²[T]⁻³[I]⁻¹ |

Da dove vengono. Il **newton** esce dalla seconda legge della dinamica, F = ma: una massa (kg) per un'accelerazione (m/s²). Il **joule** esce dalla definizione di lavoro, L = F·s: una forza per uno spostamento, quindi N·m. Il **watt** è lavoro diviso tempo, J/s. Il **pascal** è forza diviso superficie, N/m².

Non c'è niente da imparare a memoria se hai capito da dove nascono.

> **Cosa ti chiedono.** 1º appello, domanda 1: che dimensioni ha una forza. Si parte da F = ma: la massa è [M], l'accelerazione è una velocità divisa per un tempo, cioè [L][T]⁻¹/[T] = [L][T]⁻². Quindi **[M][L][T]⁻²**.
> 2º appello, domanda 3: in che cosa si misura l'energia cinetica. L'energia cinetica è ½mv², cioè [M]·([L][T]⁻¹)² = [M][L]²[T]⁻², che è il **joule**.

---

## 4. La notazione scientifica

### A cosa serve

In fisica si incontrano numeri enormi e numeri piccolissimi: la massa della Terra è circa 5 970 000 000 000 000 000 000 000 kg, la massa di un elettrone 0,000 000 000 000 000 000 000 000 000 000 911 kg. Scriverli così è scomodo, si contano male gli zeri e i conti diventano impossibili.

La **notazione scientifica** li scrive in modo compatto: ogni numero diventa **un numero fra 1 e 10, moltiplicato per una potenza di dieci**.

In simboli: **a × 10ⁿ**, con **1 ≤ |a| < 10**.

Il vincolo su *a* fa parte della definizione, non è un consiglio: **35 × 10³ non è in notazione scientifica**, perché 35 è maggiore di 10. La forma corretta è 3,5 × 10⁴. Le domande del test su questo punto si giocano esattamente lì.

La massa della Terra diventa 5,97 × 10²⁴ kg, quella dell'elettrone 9,11 × 10⁻³¹ kg.

### Come si fanno i conti

- **prodotto**: si moltiplicano i numeri davanti e **si sommano** gli esponenti.
  (2 × 10³) · (4 × 10⁵) = 8 × 10⁸
- **quoziente**: si dividono i numeri davanti e **si sottraggono** gli esponenti.
  (8 × 10⁶) / (2 × 10²) = 4 × 10⁴
- **potenza**: si eleva il numero davanti e **si moltiplica** l'esponente.
  (3 × 10²)³ = 27 × 10⁶ = 2,7 × 10⁷
- **somma e sottrazione**: qui c'è una regola in più. Si possono sommare **solo numeri con lo stesso esponente**. Se sono diversi, prima si portano allo stesso:
  3 × 10⁵ + 4 × 10⁴ = 3 × 10⁵ + 0,4 × 10⁵ = **3,4 × 10⁵**

È l'errore più frequente: sommare direttamente i numeri davanti quando gli esponenti sono diversi.

---

## 5. Multipli, sottomultipli e conversioni

### I prefissi

Invece di scrivere 0,000001 metri si scrive 1 micrometro. I **prefissi** sono abbreviazioni per le potenze di dieci, e si attaccano davanti al nome dell'unità.

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

Attenzione al maiuscolo e al minuscolo: **M** è mega (un milione di volte), **m** è milli (un millesimo). Sbagliare il carattere sbaglia il risultato di un fattore un miliardo.

### Il metodo sicuro per convertire

Non si impara a memoria «si sposta la virgola di tre posti»: si **moltiplica per frazioni che valgono 1**, scritte in modo che l'unità da eliminare si semplifichi. Siccome 1000 m e 1 km sono la stessa cosa, la frazione (1000 m / 1 km) vale 1, e moltiplicare per 1 non cambia il valore — cambia solo come lo scrivi.

Esempio:

> **72 km/h** = 72 · (1000 m / 3600 s) = **20 m/s**

Il km si semplifica con il km e l'ora con i secondi; restano metri al secondo.

Da tenere a mente, perché torna di continuo: **da km/h a m/s si divide per 3,6**; **da m/s a km/h si moltiplica per 3,6**.

### Aree e volumi: dove quasi tutti sbagliano

Se converti una **lunghezza** il fattore si usa così com'è. Se converti un'**area** il fattore va **al quadrato**, se converti un **volume** va **al cubo**. Il motivo è che un'area è una lunghezza per una lunghezza, e un volume tre lunghezze.

Un quadrato di lato 1 m è lo stesso quadrato di lato 100 cm: la sua area è 1 m², oppure 100 · 100 = 10 000 cm². Non 100 cm².

- 1 m = 10² cm  →  **1 m² = 10⁴ cm²**  →  **1 m³ = 10⁶ cm³**
- **1 dm³ = 1 litro**, e **1 cm³ = 1 mL**
- quindi **1 m³ = 1000 litri**

E per la **densità**, che è massa su volume: **1 g/cm³ = 1000 kg/m³**. L'acqua ha densità 1 g/cm³, cioè **1000 kg/m³**: questo numero va saputo a memoria, perché compare in ogni esercizio sul galleggiamento.

> **Cosa ti chiedono.** 1º appello, domanda 10: è vero che 10⁻⁹ km = 1 μm? Verifichiamo: 10⁻⁹ km = 10⁻⁹ · 10³ m = 10⁻⁶ m, e 10⁻⁶ m è esattamente 1 μm. **Vero.**
> 2º appello, domanda 4: a quanto corrispondono 10 dm³? A **10 litri**, perché 1 dm³ = 1 litro.

---

## 6. Gli ordini di grandezza

L'**ordine di grandezza** di un numero è la potenza di dieci che gli sta più vicino. Serve quando non interessa il valore esatto ma la **scala**: stiamo parlando di millimetri o di chilometri? di secondi o di anni?

La convenzione pratica: scritto il numero come a × 10ⁿ, se **a < 5** l'ordine di grandezza è 10ⁿ, se **a > 5** si sale a 10ⁿ⁺¹. Così 3 × 10⁴ ha ordine di grandezza 10⁴, mentre 7 × 10⁴ ha ordine di grandezza 10⁵.

**Perché è una tecnica da test e non solo una curiosità.** In una domanda a risposta multipla le cinque alternative spesso differiscono di ordini di grandezza. Se riesci a stimare la scala del risultato in dieci secondi, ne elimini tre o quattro senza fare il conto esatto — e nel semestre filtro hai 50 minuti per 31 domande, poco più di un minuto e mezzo ciascuna.

Una stima si fa arrotondando tutto brutalmente: π diventa 3, 9,8 diventa 10, 365 diventa 400. L'errore che accumuli è piccolo rispetto a un fattore dieci.

---

## 7. L'analisi dimensionale

È lo strumento più utile dell'intera unità, e si basa su due regole semplici.

**Prima regola: si possono sommare solo grandezze con le stesse dimensioni.** Non puoi sommare una lunghezza a un tempo, come non puoi sommare tre mele a due minuti. Se in un'equazione compare una somma fra grandezze di tipo diverso, l'equazione è sbagliata — senza bisogno di sapere di cosa parla.

**Seconda regola: i due membri di un'equazione hanno sempre le stesse dimensioni.** Se a sinistra c'è un tempo, a destra deve venire fuori un tempo.

Da queste due regole nasce un trucco potentissimo per il test: davanti a cinque formule candidate, **controlla le dimensioni e scarta quelle che non tornano**. Spesso ne resta una sola, e non hai dovuto ricordare nulla.

**Esempio.** Il periodo di oscillazione di un pendolo: è **T = 2π·√(L/g)** oppure **T = 2π·√(g/L)**? Il periodo è un tempo, quindi deve venire [T]. Sapendo che L è una lunghezza [L] e g un'accelerazione [L][T]⁻²:

> √( [L] / ([L][T]⁻²) ) = √( [T]² ) = [T]  ✓

Torna la prima. La seconda darebbe [T]⁻¹, che è una frequenza, non un tempo. Non serve ricordare la formula: basta ricostruirla.

**Una regola che discende dalle prime due**: gli **argomenti delle funzioni e degli esponenti sono sempre adimensionali**, cioè numeri puri senza unità. In e^(−t/τ) il rapporto t/τ deve essere un numero puro, il che ti dice che τ è un tempo; in sen(ωt) il prodotto ωt deve essere puro, il che ti dice che ω si misura in 1/s.

**Le grandezze adimensionali.** Alcune grandezze fisiche **non hanno unità**, perché sono rapporti fra due grandezze dello stesso tipo, e le unità si semplificano. Esempi: l'**indice di rifrazione**, il **coefficiente di attrito**, le deformazioni relative, e il **numero di Reynolds** (un rapporto fra due forze, usato nei fluidi).

> **Cosa ti chiedono.** 2º appello, domanda 13: qual è l'unità di misura del numero di Reynolds. Risposta: **nessuna, è adimensionale**. Nelle alternative mettono kg·m/s², ohm e pascal·s/m proprio perché sembrano plausibili.

---

## 8. Grandezze estensive e intensive

È una distinzione che divide tutte le grandezze in due famiglie, in base a cosa succede se **raddoppi la quantità di materia**.

**Estensiva**: dipende da quanta roba c'è. Se unisci due sistemi uguali, **si somma**. Sono estensive la massa, il volume, il numero di moli, l'energia, la capacità termica.

**Intensiva**: non dipende da quanta roba c'è. Se unisci due sistemi uguali, **resta la stessa**. Sono intensive la temperatura, la pressione, la densità, la concentrazione, il calore specifico.

La prova pratica che chiarisce tutto: prendi due bicchieri d'acqua identici, entrambi a 20 °C, e versali in un recipiente solo. Il **volume raddoppia** — è estensivo. La **temperatura resta 20 °C** — è intensiva. Non ottieni acqua a 40 °C.

Una regola che fa risparmiare memoria: **il rapporto fra due grandezze estensive è una grandezza intensiva**. La densità è massa diviso volume, due estensive, e infatti è intensiva: mezzo litro d'acqua ha la stessa densità di dieci litri. Lo stesso vale per il calore specifico, che è capacità termica diviso massa.

---

## 9. Trigonometria essenziale

### Cosa sono seno e coseno

Prendi un triangolo rettangolo e fissa uno dei due angoli acuti, chiamiamolo θ. I tre lati hanno nomi rispetto a quell'angolo: l'**ipotenusa** è il lato lungo opposto all'angolo retto, il **cateto opposto** è quello che sta di fronte a θ, il **cateto adiacente** è quello che lo tocca.

Seno, coseno e tangente sono semplicemente **tre rapporti fra questi lati**:

> **sen θ** = cateto opposto / ipotenusa
> **cos θ** = cateto adiacente / ipotenusa
> **tg θ** = sen θ / cos θ = cateto opposto / cateto adiacente

La cosa notevole, ed è il motivo per cui esistono, è che **questi rapporti dipendono solo dall'angolo**, non dalla dimensione del triangolo. Due triangoli rettangoli con lo stesso angolo θ, uno grande e uno piccolo, hanno lo stesso seno. Per questo si possono tabulare una volta per tutte.

Essendo rapporti fra lunghezze, **seno e coseno sono adimensionali** e valgono sempre fra −1 e 1.

### I valori da sapere a memoria

Nei test i numeri sono scelti apposta perché vengano angoli «belli»:

| θ | 0° | 30° | 45° | 60° | 90° |
|---|---|---|---|---|---|
| sen | 0 | 1/2 | √2/2 | √3/2 | 1 |
| cos | 1 | √3/2 | √2/2 | 1/2 | 0 |
| tg | 0 | √3/3 | 1 | √3 | non definita |

Con √2 ≈ 1,41 e √3 ≈ 1,73, quindi √2/2 ≈ 0,71 e √3/2 ≈ 0,87.

Nota la simmetria: il seno di 30° è il coseno di 60° e viceversa. Vale in generale, perché i due angoli acuti di un triangolo rettangolo sono complementari.

L'identità fondamentale, che discende dal teorema di Pitagora: **sen²θ + cos²θ = 1**.

### Dove serve in fisica

Ovunque ci sia da **scomporre** qualcosa in due direzioni perpendicolari:
- un corpo su un **piano inclinato**: la forza peso si divide in una componente che lo fa scivolare giù, mg·sen θ, e una che lo schiaccia contro il piano, mg·cos θ;
- le **componenti di un vettore** lungo gli assi (punto 10);
- il **lavoro** di una forza non allineata allo spostamento, L = F·s·cos θ;
- la **legge di Snell** per la rifrazione della luce.

---

## 10. Scalari e vettori

### Perché non bastano i numeri

Alcune grandezze sono completamente descritte da un numero con la sua unità: se dico che una stanza è a 20 °C, ho detto tutto. Queste si chiamano **grandezze scalari**. Sono scalari la massa, il tempo, la temperatura, l'energia, il lavoro, la carica elettrica, la pressione, la densità, il volume.

Per altre il numero non basta. Se dico «sul corpo agisce una forza di 10 newton», non ho detto abbastanza: una forza di 10 N verso l'alto e una di 10 N verso il basso fanno cose opposte. Serve sapere **dove è orientata**. Queste si chiamano **grandezze vettoriali**, e per descriverle servono tre informazioni: **modulo**, **direzione** e **verso**.

Sono vettoriali lo spostamento, la velocità, l'accelerazione, la forza, la quantità di moto, il campo elettrico, il campo magnetico.

### Modulo, direzione, verso: le parole esatte

Il test italiano usa queste tre parole con precisione, e confonderle costa punti.

- il **modulo** (o intensità) è il «quanto»: un numero positivo con la sua unità. Il modulo del vettore **a** si scrive *a* oppure |**a**|;
- la **direzione** è la **retta** lungo cui il vettore giace. Orizzontale, verticale, inclinata di 30°: quella è la direzione;
- il **verso** è **quale dei due sensi** di percorrenza su quella retta. Su una retta orizzontale, verso destra o verso sinistra.

Da qui la conseguenza che il test verifica: **due vettori opposti hanno la stessa direzione e verso contrario**. Non «direzione opposta» — la retta è la stessa, cambia solo da che parte punti. Se un'alternativa dice «direzione opposta», quasi sempre è quella sbagliata messa lì apposta.

Un vettore si disegna come una freccia: la lunghezza è il modulo, la retta su cui sta è la direzione, la punta indica il verso.

### Le componenti

Lavorare con le frecce disegnate è scomodo. Il modo pratico è **scomporre** ogni vettore in due pezzi perpendicolari, uno lungo l'asse x e uno lungo l'asse y, chiamati **componenti**. È qui che serve la trigonometria.

Se il vettore ha modulo *a* e forma un angolo θ con l'asse x:

> aₓ = a·cos θ  ·  a_y = a·sen θ  ·  a = √(aₓ² + a_y²)  ·  tg θ = a_y / aₓ

Le prime due formule scompongono, la terza ricompone (è Pitagora), la quarta ritrova l'angolo.

La strategia che funziona quasi sempre negli esercizi: **scomponi tutti i vettori in componenti, lavora separatamente sulle x e sulle y come se fossero numeri normali, e solo alla fine ricomponi**. Così si evitano i disegni e gli errori di geometria.

---

## 11. Le operazioni fra vettori

### Somma e differenza

Sommare due vettori **non** significa sommare i loro moduli: il risultato dipende da come sono orientati.

Graficamente ci sono due metodi equivalenti. Col **metodo punta-coda** si disegna il secondo vettore facendo partire la sua coda dalla punta del primo: la somma è la freccia che va dalla coda del primo alla punta del secondo. Con la **regola del parallelogramma** si disegnano i due vettori con la stessa origine, si completa il parallelogramma, e la somma è la diagonale.

Per componenti è molto più semplice: **(a+b)ₓ = aₓ + bₓ** e **(a+b)_y = a_y + b_y**. Si sommano separatamente.

La **differenza** **a** − **b** è la somma **a** + (−**b**), dove −**b** è il vettore **b** ribaltato, cioè con verso contrario.

### Quanto può valere il modulo della somma

Questo è il punto che il test verifica più spesso, quindi conviene tenerlo in testa come un insieme di casi:

- vettori **concordi** (stessa direzione, stesso verso): |**a**+**b**| = a + b, il **massimo** possibile;
- vettori **opposti** (stessa direzione, verso contrario): |**a**+**b**| = |a − b|, il **minimo** possibile;
- vettori **perpendicolari**: |**a**+**b**| = √(a² + b²), cioè Pitagora;
- in generale, con θ fra i due: |**a**+**b**| = √(a² + b² + 2ab·cos θ).

Quindi il modulo della somma è **sempre compreso fra |a − b| e a + b**. Due forze da 3 N e 4 N danno una risultante che può valere da 1 N a 7 N, e vale esattamente 5 N se sono perpendicolari.

### Il prodotto scalare

È il primo dei due modi di «moltiplicare» due vettori, e **dà come risultato un numero**, non un vettore — da cui il nome.

> **a** · **b** = ab·cos θ = aₓbₓ + a_y b_y

**Che cosa significa.** Misura **quanto due vettori sono allineati**. Se puntano nella stessa direzione il prodotto è massimo; man mano che l'angolo cresce diminuisce; **a 90° vale zero**, perché cos 90° = 0; oltre i 90° diventa negativo.

Il fatto che si annulli per vettori perpendicolari è il modo più rapido per **verificare la perpendicolarità**: se il prodotto scalare è zero, i vettori sono perpendicolari (purché nessuno dei due sia nullo).

**A cosa serve in fisica.** Il **lavoro** di una forza è il prodotto scalare fra la forza e lo spostamento: L = **F** · **s** = F·s·cos θ. La conseguenza è importante: **una forza perpendicolare allo spostamento non compie lavoro**. È il motivo per cui nel moto circolare uniforme la forza centripeta, sempre perpendicolare alla velocità, non cambia l'energia cinetica del corpo — lo fa girare senza accelerarlo.

### Il prodotto vettoriale

È il secondo modo, e **dà come risultato un vettore**.

> |**a** × **b**| = ab·sen θ

Il vettore risultante è **perpendicolare al piano** su cui giacciono i due vettori di partenza, e il suo verso si trova con la **regola della mano destra**: dita che si chiudono andando dal primo vettore al secondo, pollice che indica il verso del risultato.

**Che cosa significa.** Misura **quanto due vettori sono perpendicolari** — l'opposto esatto del prodotto scalare. Vale zero quando sono **paralleli** (sen 0° = 0) ed è massimo quando sono perpendicolari.

**Non è commutativo**: **a** × **b** = −(**b** × **a**). Scambiando l'ordine il risultato cambia verso. Il prodotto scalare invece è commutativo.

**A cosa serve in fisica.** Il **momento di una forza** (quanto una forza fa ruotare qualcosa) è **M** = **r** × **F**, e la **forza di Lorentz** su una carica in moto in un campo magnetico è **F** = q(**v** × **B**).

### Le due operazioni a confronto

| | prodotto scalare | prodotto vettoriale |
|---|---|---|
| risultato | uno scalare (numero) | un vettore |
| formula | ab·cos θ | ab·sen θ |
| è nullo se | perpendicolari | paralleli |
| è massimo se | paralleli | perpendicolari |
| commutativo | sì | no |
| esempio fisico | lavoro | momento, forza di Lorentz |

---

## 12. Esercizi svolti

**1. Due vettori la cui somma ha modulo |a − b|.**
*La somma di due vettori **a** e **b** produce un vettore di modulo |**a** − **b**|. Cosa puoi dire dei due vettori?*

Il testo dice che il modulo della **somma** è uguale al modulo della **differenza**. Uguagliamo ed eleviamo al quadrato entrambi i membri (si può, perché i moduli sono positivi):

> |**a**+**b**|² = |**a**−**b**|²
> a² + 2(**a**·**b**) + b² = a² − 2(**a**·**b**) + b²
> 4(**a**·**b**) = 0  →  **a**·**b** = 0

Il prodotto scalare è nullo, quindi **i due vettori sono perpendicolari**.

> È la domanda 5 di Fisica del 2º appello. Il tranello sta nel leggere «|a − b|» come la *differenza dei moduli* invece che il *modulo della differenza*: in quel caso la risposta sarebbe «stessa direzione e versi opposti», che è infatti una delle alternative. Guarda dove sono le barre del valore assoluto.

**2. Spostamento risultante.**
*Una nave percorre in successione 10 km verso Nord, 6 km verso Est e infine 18 km verso Sud. Quanto vale il modulo dello spostamento risultante?*

Si scompone tutto in componenti. Prendiamo Nord ed Est come versi positivi:

- componente Est–Ovest: +6 km
- componente Nord–Sud: +10 − 18 = −8 km (cioè 8 km verso Sud)

Il segno negativo dice solo il verso; per il modulo si usa Pitagora:

> s = √(6² + 8²) = √(36 + 64) = √100 = **10 km**

Due osservazioni che valgono più dell'esercizio. Primo: lo **spostamento** (10 km) non è il **cammino percorso** (10 + 6 + 18 = 34 km) — il primo è un vettore che dipende solo da dove parti e dove arrivi, il secondo è uno scalare che dipende da tutta la strada fatta. Secondo: il triangolo 6-8-10 è il triangolo 3-4-5 raddoppiato, e nei test i numeri sono quasi sempre scelti così, per far venire radici esatte.

**3. Dimensioni di una costante.**
*Nella legge di Hooke F = −kx, che dimensioni ha la costante elastica k?*

Si usa la seconda regola dell'analisi dimensionale: i due membri hanno le stesse dimensioni. Quindi [k][L] = [F], da cui:

> [k] = [F] / [L] = [M][L][T]⁻² / [L] = **[M][T]⁻²**

In unità SI: N/m, cioè kg/s².

**4. Conversione composta.**
*Una densità di 0,8 g/cm³ quanto vale in kg/m³?*

Si moltiplica per due frazioni che valgono 1, una per la massa e una per il volume:

> 0,8 g/cm³ · (10⁻³ kg / 1 g) · (10⁶ cm³ / 1 m³) = 0,8 · 10³ = **800 kg/m³**

Nota che il fattore del volume è 10⁶ e non 10², perché è un volume. La scorciatoia da ricordare: **da g/cm³ a kg/m³ si moltiplica per 1000**. Serve in ogni esercizio sul galleggiamento, dove la densità dell'acqua va usata come 1000 kg/m³.

**5. Scomposizione di una forza.**
*Un corpo di massa 10 kg sta su un piano inclinato di 30°. Quanto vale la componente del peso parallela al piano? (g = 9,8 m/s²)*

Il peso è mg = 10 · 9,8 = 98 N, diretto verticalmente verso il basso. Scomponendolo lungo il piano e perpendicolarmente a esso:

> F∥ = mg·sen θ = 10 · 9,8 · sen 30° = 10 · 9,8 · 0,5 = **49 N**

La componente perpendicolare è mg·cos 30° = 98 · 0,866 ≈ 85 N.

**Come non confondersi fra seno e coseno**: lungo il piano va il **seno** dell'angolo di inclinazione. Il controllo di buon senso: se l'inclinazione è zero (piano orizzontale) non deve esserci nessuna componente che fa scivolare, e infatti sen 0° = 0. Se fosse il coseno verrebbe 98 N su un piano piatto, che è assurdo.

**6. Stima per ordini di grandezza.**
*Quante volte batte il cuore in una vita di 80 anni?*

Si arrotonda tutto. Circa 70 battiti al minuto, diciamo 10² al minuto come ordine di grandezza.
Minuti in 80 anni: 80 · 365 · 24 · 60 ≈ 4 × 10⁷.
Prodotto: 10² · 4 × 10⁷ = 4 × 10⁹, cioè **qualche miliardo**.

Non serve il numero esatto: serve escludere le alternative che stanno tre ordini di grandezza più in là.

---

## 13. Parole da saper scrivere

In Fisica, delle 31 domande della prova, **16 sono a completamento**: la risposta la scrivi tu nella griglia, e un errore di ortografia la annulla. Spesso sono numeri o unità, ma non sempre. Da questa unità:

`adimensionale` · `scalare` · `vettoriale` · `modulo` · `direzione` · `verso` · `componente` · `perpendicolari` · `paralleli` · `joule` · `newton` · `pascal` · `watt` · `kelvin` · `ampere` · `candela` · `estensiva` · `intensiva` · `ipotenusa` · `cateto` · `densità` · `spostamento`

Occhio ai nomi delle unità: si scrivono **minuscoli** quando sono parole (un newton, dieci joule) ma con il **simbolo maiuscolo** quando derivano da un nome proprio (N, J, W, K, A). Il metro e il secondo, che non vengono da nomi di persona, hanno il simbolo minuscolo (m, s).

---

## 14. Errori tipici

**Convertire aree e volumi con il fattore lineare.** 1 m² non è 100 cm², è 10 000 cm². Il fattore va al quadrato per le aree e al cubo per i volumi. È l'errore numero uno di tutta la fisica di base.

**Confondere direzione e verso.** Due vettori opposti hanno la **stessa** direzione.

**Scrivere °K.** Il kelvin non vuole il simbolo di grado: si scrive 300 K.

**Confondere M e m nei prefissi.** M è mega (10⁶), m è milli (10⁻³).

**Credere che il prodotto scalare dia un vettore.** Dà un numero: «scalare» è già nel nome.

**Sommare i moduli invece dei vettori.** 3 N + 4 N non fa sempre 7 N: fa 7 N solo se sono allineati e concordi.

**Confondere spostamento e cammino percorso.** Su un percorso chiuso lo spostamento è zero, il cammino no.

**Invertire seno e coseno sul piano inclinato.** Lungo il piano va il **seno**. Il controllo: a inclinazione zero la componente che fa scivolare deve essere nulla.

**Sommare numeri in notazione scientifica con esponenti diversi** senza prima uniformarli.

**Scrivere 35 × 10³ e chiamarla notazione scientifica.** Il numero davanti deve stare fra 1 e 10.

**Dare un'unità a grandezze adimensionali.** Numero di Reynolds, indice di rifrazione e coefficiente di attrito non ne hanno.

**Dimenticare l'unità di misura nella risposta.** Un numero nudo, in fisica, non è una risposta.

---

## Da verificare prima di pubblicare

- **Formule matematiche**: il sito non ha un motore per le formule — il convertitore markdown in uso (marked con GFM) non le interpreta e per di più elimina le barre rovesciate, quindi il LaTeX uscirebbe illeggibile. Le formule di questo appunto sono scritte con caratteri normali (π, √, ², ⁻², θ, ·), che si leggono bene anche su telefono. Se in futuro servissero formule più complesse — integrali, frazioni su più righe, matrici — bisognerà aggiungere KaTeX al convertitore: **è una decisione che vale per tutta Fisica e Chimica**, non per questo appunto soltanto.
- **Valore di g**: ho usato 9,8 m/s². Le prove ufficiali a volte usano 9,81 e a volte approssimano a 10. Da chiedere alla professoressa quale convenzione adottare negli esercizi, per non confondere.
- **Tavola dei prefissi**: ho incluso da femto a tera. Verificare se il corso ne chiede altri (atto, exa) o se è già sovrabbondante.
- **Esercizio 1 (vettori perpendicolari)**: è la domanda 5 di Fisica del 2º appello, e la nostra chiave nel database **era sbagliata** — diceva «stessa direzione e versi opposti». È stata corretta il 2026-10-14 dopo il confronto con la correzione commentata di Alpha Test. Vale la pena che la professoressa riguardi proprio questa, perché il testo si presta a due letture a seconda di dove si mettono le barre del valore assoluto.
- Le sezioni «Cosa ti chiedono» citano domande reali dei due appelli 2025/2026, ma **le risposte corrette sono state ricavate da noi** e non sono chiavi ministeriali.
