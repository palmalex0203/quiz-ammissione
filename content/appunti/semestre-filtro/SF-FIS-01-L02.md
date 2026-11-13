---
codice: SF-FIS-01-L02
percorso: SEMESTRE_FILTRO
materia: Fisica
titolo: "Grandezze fisiche, misura ed errori · Scalari e vettori"
stato: bozza
fonti:
  - "Presentazione del docente: GrandezzeFisiche1.ppt (novembre 2026), convertita per il sito"
  - "Syllabus MUR Fisica 2026/2027, unità didattica 1 — content/semestre-filtro/syllabus/fisica-2026-2027.txt"
  - "Prove ufficiali 1º e 2º appello 2025/2026 (Fisica), per i riquadri «Cosa ti chiedono»"
---

**Che cosa significa misurare, quanto ci si può fidare di una misura, e perché per certe grandezze un numero non basta.** Lezione 2 del corso di Fisica.

**Come usare questa dispensa:** le sezioni 10, 11 e 12 vanno rifatte con la calcolatrice in mano, perché sono conti che all'esame si chiedono; le sezioni 7 e 13 sono strumenti che tornano utili per tutto il resto del corso. Alla fine, le domande della sezione 18 e le soluzioni nella 19. Se non hai ancora letto **Basi matematica 1**, leggila prima: qui si danno per noti le potenze e il calcolo con le lettere.

## 1. La fisica è una scienza sperimentale

La fisica non parte dalle formule. Parte da un fenomeno che si osserva, e procede così:

**osservazione** → **ipotesi** → **misura delle grandezze in gioco** → **verifica** → **legge fisica**

Una legge fisica è una relazione matematica fra grandezze misurabili, e resta valida finché nessuna misura la smentisce. Questo spiega una frase che a lezione torna spesso: *in fisica si usa un linguaggio matematico*. Non è una scelta di stile. È che una legge deve dire **quanto**, non soltanto **che cosa**, e «quanto» si scrive con i numeri.

Tutto il resto di questa dispensa sta dentro quel terzo passaggio, la misura: che cosa si misura, con quali unità, e con quanta incertezza.

## 2. Che cos'è una grandezza fisica

Una **grandezza fisica** è una proprietà che si può misurare, cioè confrontare con una grandezza dello stesso tipo presa come riferimento, detta **campione**.

Questa definizione si chiama **operativa** perché non descrive la grandezza a parole: la definisce attraverso il procedimento con cui la si misura. «Lunghezza» non è «quanto è lungo un oggetto»; è «il rapporto fra l'oggetto e il metro campione».

Da qui segue una cosa che vale **sempre**, dalla prima all'ultima lezione del corso:

> **Concetto chiave**
>
> Una grandezza fisica si esprime con **un numero e un'unità di misura**. Un numero da solo non è una misura. «La distanza è 5» non significa niente: 5 metri, 5 chilometri e 5 anni luce sono tre risposte diverse. All'esame, un risultato senza unità è un risultato sbagliato.

### Misura diretta e misura indiretta

- **Diretta**: si confronta la grandezza con il campione. Misurare una lunghezza con un metro graduato.
- **Indiretta**: si misura un'altra grandezza, legata a quella cercata da una relazione nota. Misurare un intervallo di tempo con una clessidra significa in realtà guardare quanta sabbia è passata.

La maggior parte delle misure di laboratorio è indiretta: un termometro misura una dilatazione, una bilancia misura una forza, un tachimetro misura la rotazione di una ruota.

## 3. Le grandezze fondamentali e il Sistema Internazionale

Non tutte le grandezze hanno bisogno di un campione proprio. Si sceglie un piccolo gruppo di grandezze **fondamentali**, si definisce un campione per ciascuna, e tutte le altre si ricavano da quelle.

Il **Sistema Internazionale (S.I.)** è l'insieme di queste scelte. Le grandezze fondamentali sono sette:

| grandezza | simbolo dimensionale | unità | simbolo |
|---|---|---|---|
| lunghezza | [L] | metro | m |
| tempo | [t] | secondo | s |
| massa | [M] | chilogrammo | kg |
| intensità di corrente | [i] | ampere | A |
| temperatura assoluta | [T] | kelvin | K |
| quantità di sostanza | [n] | mole | mol |
| intensità luminosa | [J] | candela | cd |

Le prime cinque sono quelle che si useranno in questo corso. La **mole** serve soprattutto in chimica, ma compare anche qui quando si parla di gas; la candela quasi mai.

> **Attenzione all'esame · Il kelvin**
>
> Si dice e si scrive «kelvin», non «grado Kelvin»: il grado è stato tolto dalla definizione nel 1967. E il simbolo è **K**, senza il simbolo di grado. Una differenza di temperatura vale lo stesso numero in kelvin e in gradi Celsius, ma i valori assoluti sono diversi: T(K) = t(°C) + 273,15.

## 4. Le grandezze derivate e le dimensioni

Tutte le altre grandezze sono **derivate**: si ottengono dalle fondamentali con moltiplicazioni e divisioni. Il modo in cui ciascuna si ottiene si chiama **equazione dimensionale** e si scrive con le parentesi quadre.

| grandezza | come si ottiene | dimensioni | unità S.I. |
|---|---|---|---|
| superficie | lunghezza² | [L]² | m² |
| volume | lunghezza³ | [L]³ | m³ |
| velocità | lunghezza / tempo | [L][t]⁻¹ | m·s⁻¹ |
| accelerazione | velocità / tempo | [L][t]⁻² | m·s⁻² |
| forza | massa × accelerazione | [M][L][t]⁻² | kg·m·s⁻² (newton, N) |
| densità | massa / volume | [M][L]⁻³ | kg·m⁻³ |
| pressione | forza / superficie | [M][L]⁻¹[t]⁻² | kg·m⁻¹·s⁻² (pascal, Pa) |

Attenzione al simbolo del tempo: in questa dispensa è **[t]** minuscolo, perché **[T]** maiuscolo è riservato alla temperatura. Alcuni testi usano [T] per il tempo; l'importante è non mescolare le due convenzioni dentro lo stesso conto.

> **Attenzione all'esame · Gli esponenti negativi**
>
> m·s⁻¹ e m/s sono la stessa cosa, scritta in due modi. Allo stesso modo kg·m⁻³ è kg/m³. La scrittura con gli esponenti negativi è più compatta quando le unità sono tre o quattro, ed è quella che si trova nei testi: conviene abituarsi a leggerla.

## 5. Scrivere i numeri: notazione scientifica e prefissi

In fisica i numeri sono spesso enormi o minuscoli, e scriverli per esteso è una fonte di errori. Si usano due strumenti.

**Notazione scientifica.** Ogni numero si scrive come un numero fra 1 e 10 moltiplicato per una potenza di dieci:

- 0,00000012 m = 1,2 × 10⁻⁷ m
- 384 000 000 m = 3,84 × 10⁸ m

Nei prodotti si moltiplicano i numeri e si **sommano** gli esponenti; nelle divisioni si dividono i numeri e si **sottraggono** gli esponenti. È lo stesso calcolo letterale della prima dispensa, con 10 al posto della lettera.

**Prefissi.** Un prefisso davanti all'unità sostituisce una potenza di dieci:

| prefisso | simbolo | fattore | | prefisso | simbolo | fattore |
|---|---|---|---|---|---|---|
| tera | T | 10¹² | | deci | d | 10⁻¹ |
| giga | G | 10⁹ | | centi | c | 10⁻² |
| mega | M | 10⁶ | | milli | m | 10⁻³ |
| chilo | k | 10³ | | micro | μ | 10⁻⁶ |
| etto | h | 10² | | nano | n | 10⁻⁹ |
| deca | da | 10¹ | | pico | p | 10⁻¹² |

### Il metodo sicuro per convertire

Si moltiplica per una frazione che vale 1, costruita in modo che l'unità da togliere si semplifichi. Per passare da 5 km a metri: 5 km × (10³ m / 1 km) = 5 × 10³ m. La frazione vale 1 perché numeratore e denominatore sono la stessa lunghezza scritta in due modi, quindi moltiplicare per essa non cambia la grandezza, solo l'unità.

Sembra macchinoso rispetto a «sposto la virgola», ma è l'unico metodo che non sbaglia mai il verso, e funziona identico per le unità composte: 72 km/h × (10³ m / 1 km) × (1 h / 3600 s) = 20 m/s.

> **Attenzione all'esame · Le aree e i volumi**
>
> 1 km = 10³ m, ma **1 km² = 10⁶ m²** e **1 km³ = 10⁹ m³**: il fattore va elevato alla stessa potenza dell'unità. Allo stesso modo 1 cm = 10⁻² m, ma 1 cm³ = 10⁻⁶ m³. È l'errore di conversione più frequente in assoluto, e si evita sempre con lo stesso gesto: convertire **prima** la lunghezza, elevare **dopo**.

## 6. Gli ordini di grandezza

L'**ordine di grandezza** di un numero è la potenza di dieci che gli sta più vicino. Serve quando non interessa il valore esatto ma la **scala**: stiamo parlando di millimetri o di chilometri? di secondi o di anni?

La convenzione pratica: scritto il numero come a × 10ⁿ, se a è minore di 5 l'ordine di grandezza è 10ⁿ, se è maggiore o uguale a 5 si sale a 10ⁿ⁺¹. Così 3 × 10⁴ ha ordine di grandezza 10⁴, mentre 7 × 10⁴ ha ordine di grandezza 10⁵.

**Perché è una tecnica da test e non una curiosità.** In una domanda a risposta multipla le cinque alternative spesso differiscono di ordini di grandezza. Se riesci a stimare la scala del risultato in dieci secondi, ne elimini tre o quattro senza fare il conto esatto — e nel semestre filtro hai 50 minuti per 31 domande, poco più di un minuto e mezzo ciascuna.

Una stima si fa arrotondando tutto brutalmente: π diventa 3, 9,8 diventa 10, 365 diventa 400. L'errore che accumuli è piccolo rispetto a un fattore dieci.

## 7. L'analisi dimensionale

È lo strumento più utile dell'intera unità, e si basa su due regole semplici.

**Prima regola: si possono sommare solo grandezze con le stesse dimensioni.** Non puoi sommare una lunghezza a un tempo, come non puoi sommare tre mele a due minuti. Se in un'equazione compare una somma fra grandezze di tipo diverso, l'equazione è sbagliata — senza bisogno di sapere di che cosa parla.

**Seconda regola: i due membri di un'equazione hanno sempre le stesse dimensioni.** Se a sinistra c'è un tempo, a destra deve venire fuori un tempo.

Da queste due regole nasce un metodo potente: davanti a cinque formule candidate, **controlla le dimensioni e scarta quelle che non tornano**. Spesso ne resta una sola, e non hai dovuto ricordare nulla.

**Esempio.** Il periodo di oscillazione di un pendolo: è T = 2π·√(L/g) oppure T = 2π·√(g/L)? Il periodo è un tempo, quindi a destra deve venire [t]. Sapendo che L è una lunghezza [L] e g un'accelerazione [L][t]⁻²:

√( [L] / ([L][t]⁻²) ) = √( [t]² ) = [t] ✓

Torna la prima. La seconda darebbe [t]⁻¹, che è una frequenza, non un tempo. Non serve ricordare la formula: basta ricostruirla.

**Una regola che discende dalle prime due:** gli **argomenti delle funzioni e degli esponenti sono sempre adimensionali**, cioè numeri puri senza unità. In e^(−t/τ) il rapporto t/τ dev'essere un numero puro, il che ti dice che τ è un tempo; in sen(ωt) il prodotto ωt dev'essere puro, il che ti dice che ω si misura in 1/s.

**Le grandezze adimensionali.** Alcune grandezze fisiche **non hanno unità**, perché sono rapporti fra due grandezze dello stesso tipo e le unità si semplificano: l'**indice di rifrazione**, il **coefficiente di attrito**, le deformazioni relative, il **numero di Reynolds** (un rapporto fra due forze, usato nei fluidi). Anche l'errore percentuale della sezione 12 è di questa famiglia.

> **Cosa ti chiedono**
>
> 2º appello 2025/2026, domanda 13: qual è l'unità di misura del numero di Reynolds. Risposta: **nessuna, è adimensionale**. Fra le alternative mettono kg·m/s², ohm e pascal·s/m proprio perché sembrano plausibili.

## 8. Grandezze estensive e intensive

È una distinzione che divide tutte le grandezze in due famiglie, in base a che cosa succede se **raddoppi la quantità di materia**.

**Estensiva**: dipende da quanta roba c'è. Se unisci due sistemi uguali, **si somma**. Sono estensive la massa, il volume, il numero di moli, l'energia, la capacità termica.

**Intensiva**: non dipende da quanta roba c'è. Se unisci due sistemi uguali, **resta la stessa**. Sono intensive la temperatura, la pressione, la densità, la concentrazione, il calore specifico.

La prova pratica che chiarisce tutto: prendi due bicchieri d'acqua identici, entrambi a 20 °C, e versali in un recipiente solo. Il **volume raddoppia** — è estensivo. La **temperatura resta 20 °C** — è intensiva. Non ottieni acqua a 40 °C.

Una regola che fa risparmiare memoria: **il rapporto fra due grandezze estensive è una grandezza intensiva**. La densità è massa diviso volume, due estensive, e infatti è intensiva: mezzo litro d'acqua ha la stessa densità di dieci litri. Lo stesso vale per il calore specifico, che è capacità termica diviso massa.

## 9. Perché ogni misura ha un errore

> **Concetto chiave**
>
> **La misura di una grandezza fisica è sempre affetta da errore.** Non per disattenzione di chi misura: per com'è fatto il mondo e per come sono fatti gli strumenti. Il valore «vero» di una grandezza non si conosce mai; si conosce un intervallo dentro cui sta.

«Errore», qui, non vuol dire sbaglio. Vuol dire **stima di quanto la misura si discosta dal valore vero**. Un risultato senza questa stima è un risultato incompleto.

Le cause sono di tre tipi.

**Limiti dello strumento.** Ogni strumento ha una **sensibilità**: la più piccola variazione che riesce a rilevare. Un righello da disegno arriva al millimetro; sotto quella soglia non può dire niente. L'incertezza non può mai essere più piccola della sensibilità dello strumento.

**Errori casuali** (o statistici). Misurando più volte la stessa grandezza con uno strumento sensibile si ottengono valori leggermente diversi, per piccole perturbazioni che chi misura non può controllare né prevedere. Avvengono **sia in eccesso sia in difetto** rispetto al valore vero, e proprio per questo si possono ridurre: ripetendo la misura molte volte, gli scarti in più e quelli in meno tendono a compensarsi.

**Errori sistematici.** Avvengono **sempre nello stesso verso**, o sempre in eccesso o sempre in difetto. Nascono da uno strumento mal tarato, da un metodo di misura sbagliato, da un modello teorico inadeguato, o da una perturbazione di cui non si è tenuto conto. Una bilancia che segna 2 g anche da scarica darà sempre 2 g in più, e ripetere la pesata mille volte non serve a niente.

> **Attenzione all'esame · La differenza che si chiede quasi sempre**
>
> Gli errori **casuali** si riducono ripetendo la misura; quelli **sistematici** no. Ripetere mille volte una misura con uno strumento scalibrato dà mille valori sbagliati nello stesso modo, con una media altrettanto sbagliata — e per di più con una dispersione piccola, che dà la falsa impressione di una misura precisa. Un errore sistematico si scopre solo cambiando strumento o metodo.

## 10. Misure ripetute: media e deviazione standard

Quando gli errori sono casuali, il modo di trattarli è misurare molte volte e guardare come si distribuiscono i risultati.

**L'esempio della lezione.** Si misura venti volte la stessa lunghezza e si ottiene:

| valore (cm) | quante volte |
|---|---|
| 2,12 | 1 |
| 2,13 | 2 |
| 2,14 | 6 |
| 2,15 | 7 |
| 2,16 | 3 |
| 2,17 | 1 |

Questa tabella è un **istogramma delle frequenze**: su un asse i valori ottenuti, sull'altro quante volte ciascuno si è presentato. Si vede subito che i valori si addensano attorno a 2,15 e si diradano allontanandosi.

**Il valore medio** è la somma di tutte le misure divisa per il loro numero. È la migliore stima del valore vero che si può dare a partire da quei dati:

l̄ = (l₁ + l₂ + … + lₙ) / n = 42,92 / 20 = **2,146 cm**

**La deviazione standard** (o scarto quadratico medio, σ) misura **quanto i dati sono sparpagliati** attorno alla media. Si calcola così:

1. per ogni misura, lo scarto dalla media: lᵢ − l̄;
2. si eleva ogni scarto al quadrato, così i segni non si cancellano fra loro;
3. si fa la media di questi quadrati;
4. se ne prende la radice quadrata.

Nel nostro esempio si ottiene **σ = 0,012 cm**.

Il passaggio 2 è il motivo del nome: se si sommassero gli scarti così come sono, il risultato sarebbe sempre zero, perché per costruzione gli scarti in più e quelli in meno si equivalgono. Elevandoli al quadrato diventano tutti positivi e si sommano davvero.

**Il risultato si scrive** come valore medio seguito dall'incertezza:

l = l̄ ± σ = (2,146 ± 0,012) cm, che approssimando si scrive **(2,15 ± 0,01) cm**

> **Attenzione all'esame · Media e deviazione standard dicono due cose diverse**
>
> La **media** dice *dove* sta il valore. La **deviazione standard** dice *quanto ci si può fidare*. Due serie di misure possono avere la stessa media e affidabilità completamente diversa: σ piccola significa misure concordi fra loro e quindi errore piccolo; σ grande significa misure sparpagliate ed errore grande.

## 11. La distribuzione gaussiana

Se le misure sono molte e gli errori sono soltanto casuali, l'istogramma assume una forma caratteristica: simmetrica, con un massimo in corrispondenza del valore medio e due code che scendono ai lati. È la **curva a campana**, o **distribuzione gaussiana**.

La deviazione standard è la larghezza della campana, e divide la curva in fasce di cui si conosce il significato:

| intervallo | quante misure vi cadono |
|---|---|
| fra l̄ − σ e l̄ + σ | circa il **68%** |
| fra l̄ − 2σ e l̄ + 2σ | circa il **95%** |
| fra l̄ − 3σ e l̄ + 3σ | circa il **99%** |

Ecco perché scrivere (2,15 ± 0,01) cm ha un significato preciso: significa che circa due misure su tre cadono in quell'intervallo, e che è molto improbabile — meno dell'1% — che il valore vero stia fuori da 2,15 ± 0,03.

Una campana **stretta** (σ piccola) corrisponde a un errore piccolo; una campana **larga** (σ grande) a un errore grande.

## 12. Come si scrive una misura

### Le cifre significative

Il numero di cifre con cui si scrive una misura **non è una scelta estetica**: dichiara l'incertezza.

Quando una misura è data senza errore esplicito, si intende che l'incertezza vale **una unità sull'ultima cifra scritta**:

- l = 6,8 m significa l = (6,8 ± 0,1) m
- l = 6,80 m significa l = (6,80 ± 0,01) m

Sono due misure diverse: lo zero finale non è decorativo, dice che lo strumento arrivava al centimetro. Per lo stesso motivo non si possono scrivere più cifre di quante lo strumento ne garantisca: un risultato di calcolatrice come 2,14666667 cm, ottenuto da misure al centesimo, è falso proprio perché promette una precisione che non c'è.

### L'errore percentuale

L'errore assoluto (σ, oppure la sensibilità dello strumento) ha la stessa unità della grandezza. Per confrontare la qualità di misure diverse serve invece un numero puro, l'**errore percentuale**:

errore % = (errore assoluto / valore medio) × 100

È **adimensionale**, quindi si può usare per confrontare misure di grandezze completamente diverse.

**Esempio.** Due misure di massa:

- m = 1 kg ± 10 g = (1 ± 0,01) kg → errore % = (0,01/1) × 100 = **1%**
- m = 100 kg ± 100 g = (100 ± 0,1) kg → errore % = (0,1/100) × 100 = **0,1%**

La seconda ha un errore assoluto dieci volte più grande (100 g contro 10 g) ed è dieci volte **più precisa**. Confrontare gli errori assoluti avrebbe dato la risposta opposta.

## 13. Trigonometria essenziale

Serve da qui in avanti: scomporre un vettore, e più avanti studiare un piano inclinato, vuol dire usare seno e coseno. Bastano poche cose.

### Che cosa sono seno e coseno

Prendi un triangolo rettangolo e fissa uno dei due angoli acuti, chiamiamolo θ. I tre lati hanno un nome rispetto a quell'angolo: l'**ipotenusa** è il lato lungo, opposto all'angolo retto; il **cateto opposto** è quello che sta di fronte a θ; il **cateto adiacente** è quello che lo tocca.

Seno, coseno e tangente sono semplicemente **tre rapporti fra questi lati**:

- **sen θ** = cateto opposto / ipotenusa
- **cos θ** = cateto adiacente / ipotenusa
- **tg θ** = sen θ / cos θ = cateto opposto / cateto adiacente

La cosa notevole, ed è il motivo per cui esistono, è che **questi rapporti dipendono solo dall'angolo**, non dalla dimensione del triangolo. Due triangoli rettangoli con lo stesso angolo θ, uno grande e uno piccolo, hanno lo stesso seno. Per questo si possono tabulare una volta per tutte.

Essendo rapporti fra lunghezze, **seno e coseno sono adimensionali** — un altro esempio per la sezione 7 — e valgono sempre fra −1 e 1.

### I valori da sapere a memoria

Nei test i numeri sono scelti apposta perché vengano angoli «belli»:

| θ | 0° | 30° | 45° | 60° | 90° |
|---|---|---|---|---|---|
| sen | 0 | 1/2 | √2/2 | √3/2 | 1 |
| cos | 1 | √3/2 | √2/2 | 1/2 | 0 |
| tg | 0 | √3/3 | 1 | √3 | non definita |

Con √2 ≈ 1,41 e √3 ≈ 1,73, quindi √2/2 ≈ 0,71 e √3/2 ≈ 0,87.

Nota la simmetria: il seno di 30° è il coseno di 60°, e viceversa. Vale in generale, perché i due angoli acuti di un triangolo rettangolo sono complementari.

L'identità fondamentale, che discende dal teorema di Pitagora: **sen²θ + cos²θ = 1**.

### Dove serve in fisica

Ovunque ci sia da **scomporre** qualcosa in due direzioni perpendicolari:

- le **componenti di un vettore** lungo gli assi, qui sotto alla sezione 14;
- un corpo su un **piano inclinato**: la forza peso si divide in una componente che lo fa scivolare giù, mg·sen θ, e una che lo schiaccia contro il piano, mg·cos θ;
- il **lavoro** di una forza non allineata allo spostamento, L = F·s·cos θ;
- la **legge di Snell** per la rifrazione della luce.

## 14. Scalari e vettori

Per alcune grandezze un numero e un'unità bastano. Per altre no.

**Grandezze scalari**: sono completamente determinate da un numero con la sua unità. Tempo, temperatura, massa, volume, energia.

**Grandezze vettoriali**: per essere determinate ne servono tre cose insieme.

- il **modulo**: quanto vale, cioè un numero con la sua unità. Si indica con |v⃗| oppure semplicemente v;
- la **direzione**: la retta lungo cui agisce;
- il **verso**: quale dei due sensi su quella retta.

Sono vettoriali lo spostamento, la velocità, l'accelerazione, la forza. Spesso si aggiunge il **punto di applicazione**, cioè dove il vettore agisce: due forze uguali applicate in punti diversi di un corpo producono effetti diversi.

Un vettore si disegna come una freccia: la lunghezza è il modulo, l'inclinazione la direzione, la punta il verso.

Due vettori sono **uguali** se hanno lo stesso modulo, la stessa direzione e lo stesso verso. Sono **opposti** se hanno stesso modulo e stessa direzione ma verso contrario.

> **Attenzione all'esame · Direzione non è verso**
>
> Nel linguaggio comune «direzione» e «verso» si usano come sinonimi; in fisica no. La **direzione** è la retta: nord-sud è una direzione sola. Il **verso** sceglie fra i due sensi di percorrenza: verso nord e verso sud sono due versi della stessa direzione. Una domanda che chiede «due vettori con la stessa direzione e verso opposto» sta descrivendo vettori paralleli che puntano da parti contrarie.

### Le componenti

Lavorare con le frecce disegnate è scomodo. Il modo pratico è **scomporre** ogni vettore in due pezzi perpendicolari, uno lungo l'asse x e uno lungo l'asse y, chiamati **componenti**. È qui che serve la trigonometria della sezione 13.

Se il vettore ha modulo a e forma un angolo θ con l'asse x:

- aₓ = a·cos θ
- a_y = a·sen θ
- a = √(aₓ² + a_y²) — è il teorema di Pitagora, e ricompone il modulo
- tg θ = a_y / aₓ — ritrova l'angolo

La strategia che funziona quasi sempre negli esercizi: **scomponi tutti i vettori in componenti, lavora separatamente sulle x e sulle y come se fossero numeri normali, e solo alla fine ricomponi.** Così si evitano i disegni e gli errori di geometria.

## 15. Sommare e sottrarre vettori

Sommare due vettori **non** significa sommare i loro moduli: il risultato dipende da come sono orientati.

Graficamente ci sono due metodi equivalenti. Col **metodo punta-coda** si disegna il secondo vettore facendo partire la sua coda dalla punta del primo: la somma è la freccia che va dalla coda del primo alla punta del secondo. Con la **regola del parallelogramma** si disegnano i due vettori con la stessa origine, si completa il parallelogramma, e la somma è la diagonale.

Per componenti è molto più semplice: si sommano separatamente, (a⃗+b⃗)ₓ = aₓ + bₓ e (a⃗+b⃗)_y = a_y + b_y.

La **differenza** a⃗ − b⃗ è la somma a⃗ + (−b⃗), dove −b⃗ è il vettore b⃗ ribaltato, cioè con verso contrario.

### Quanto può valere il modulo della somma

È il punto che il test verifica più spesso, quindi conviene tenerlo in testa come un elenco di casi:

| configurazione | modulo della somma |
|---|---|
| **concordi** (stessa direzione e verso) | a + b, il **massimo** possibile |
| **opposti** (stessa direzione, verso contrario) | \|a − b\|, il **minimo** possibile |
| **perpendicolari** | √(a² + b²), cioè Pitagora |
| angolo θ qualsiasi | √(a² + b² + 2ab·cos θ) |

Quindi il modulo della somma è **sempre compreso fra |a − b| e a + b**. Due forze da 3 N e 4 N danno una risultante che può valere da 1 N a 7 N, e vale esattamente 5 N se sono perpendicolari.

## 16. Il prodotto scalare

Fra due vettori si definiscono due prodotti diversi, che danno risultati di tipo diverso. Il primo dà un numero.

Il **prodotto scalare** di a⃗ e b⃗ è il numero

a⃗ · b⃗ = |a⃗| |b⃗| cos θ

dove θ è l'angolo compreso fra i due vettori.

Si legge così: |b⃗| cos θ è la **componente di b⃗ lungo la direzione di a⃗** — è la stessa scomposizione della sezione 14. Il prodotto scalare è quindi il modulo di a⃗ moltiplicato per quanto di b⃗ «va nella stessa direzione» di a⃗. Tutto ciò che di b⃗ è perpendicolare ad a⃗ non conta.

| angolo | valore | significato |
|---|---|---|
| θ = 0° | a⃗ · b⃗ = ab | vettori concordi: prodotto massimo |
| θ = 90° | a⃗ · b⃗ = 0 | vettori perpendicolari: prodotto nullo |
| θ = 180° | a⃗ · b⃗ = −ab | vettori opposti: prodotto minimo, negativo |

Il caso θ = 90° è quello che si usa più spesso, al contrario: se il prodotto scalare di due vettori non nulli è zero, allora i due vettori **sono perpendicolari**.

Il prodotto scalare compare nella definizione di lavoro, L = F·s·cos θ: una forza perpendicolare allo spostamento non compie lavoro, ed è esattamente la riga di mezzo della tabella.

## 17. Il prodotto vettoriale

Il secondo prodotto dà invece un **vettore**. Il prodotto vettoriale di a⃗ e b⃗ è il vettore c⃗ = a⃗ × b⃗ definito da tre cose:

- **modulo**: |c⃗| = |a⃗| |b⃗| sen θ. Stavolta conta la componente di b⃗ **perpendicolare** ad a⃗, cioè l'opposto del prodotto scalare;
- **direzione**: perpendicolare **al piano** che contiene a⃗ e b⃗, quindi perpendicolare a entrambi;
- **verso**: il verso di avanzamento di una vite destrorsa che ruota portando a⃗ su b⃗.

Quando i due vettori sono **paralleli o opposti** (θ = 0° o 180°) il seno vale zero e il prodotto vettoriale è nullo. Quando sono **perpendicolari** (θ = 90°) il seno vale 1 e il modulo è massimo, pari ad ab.

> **Concetto chiave · I due prodotti sono complementari**
>
> | | prodotto scalare | prodotto vettoriale |
> |---|---|---|
> | risultato | un numero | un vettore |
> | formula del modulo | ab cos θ | ab sen θ |
> | si annulla quando | i vettori sono perpendicolari | i vettori sono paralleli |
> | è massimo quando | i vettori sono paralleli | i vettori sono perpendicolari |
>
> Dove uno è massimo, l'altro è nullo. Se ricordi questa riga non puoi confondere le due formule.

## 18. Mettiti alla prova

Rispondi senza guardare le soluzioni, poi controlla nella sezione 19.

1. Misurare la velocità media di un'auto cronometrando il tempo impiegato a percorrere un chilometro: misura diretta o indiretta?
2. Quali sono le dimensioni della forza? E quelle della densità?
3. Una bilancia è tarata male e segna sempre 2 g in più. Che tipo di errore produce? Ripetere la pesata serve?
4. Da venti misure si ottiene un valore medio di 2,146 cm e una deviazione standard di 0,012 cm. Come si scrive il risultato?
5. Una misura è scritta l = 3,40 m, senza errore esplicito. Quanto vale l'incertezza sottintesa?
6. Quale delle due misure è più precisa: (1 ± 0,01) kg oppure (100 ± 0,1) kg?
7. In una distribuzione gaussiana, che percentuale delle misure cade fra l̄ − σ e l̄ + σ?
8. La temperatura è una grandezza scalare o vettoriale? E la velocità?
9. Il prodotto scalare di due vettori non nulli vale zero. Che cosa puoi dire dei due vettori?
10. Due vettori hanno moduli 3 e 4 e sono perpendicolari. Quanto vale il modulo del loro prodotto vettoriale? E il loro prodotto scalare?
11. Converti 72 km/h in metri al secondo.
12. Ricava l'unità di misura S.I. della pressione partendo da forza diviso superficie.
13. Qual è l'ordine di grandezza di 7,2 × 10⁵?
14. La formula v = √(2gh) è dimensionalmente corretta per una velocità?
15. La densità è una grandezza estensiva o intensiva? E la massa?
16. Quanto valgono sen 30° e cos 60°? E quanto fa sen²θ + cos²θ?
17. Un vettore ha modulo 10 e forma un angolo di 30° con l'asse x. Quanto valgono le sue componenti?
18. Due forze di 3 N e 4 N agiscono sullo stesso corpo. Fra quali valori può stare il modulo della risultante?

## 19. Soluzioni

**1.** **Indiretta.** Non si confronta la velocità con un campione di velocità: si misurano una lunghezza e un tempo, e si ricava la velocità dalla relazione v = s/t.

**2.** Forza = massa × accelerazione = **[M][L][t]⁻²**. Densità = massa / volume = **[M][L]⁻³**.

**3.** È un errore **sistematico**: avviene sempre nello stesso verso. **Ripetere non serve a niente** — tutte le pesate saranno sbagliate di 2 g e la media anche. Si scopre solo cambiando bilancia o azzerandola.

**4.** l = (2,146 ± 0,012) cm, che approssimato si scrive **(2,15 ± 0,01) cm**. Valore e incertezza devono avere la stessa ultima cifra decimale.

**5.** **± 0,01 m.** Senza errore esplicito si intende una unità sull'ultima cifra scritta, e l'ultima cifra è il centesimo. Attenzione: 3,40 m non è la stessa misura di 3,4 m, che varrebbe ± 0,1 m.

**6.** Errori percentuali: (0,01/1)×100 = 1% e (0,1/100)×100 = 0,1%. **La seconda**, pur avendo un errore assoluto dieci volte maggiore.

**7.** Circa il **68%**. Entro 2σ circa il 95%, entro 3σ circa il 99%.

**8.** La temperatura è **scalare**: basta un numero con l'unità. La velocità è **vettoriale**: 50 km/h verso nord e 50 km/h verso sud sono due velocità diverse, anche se il tachimetro segna lo stesso numero.

**9.** Che sono **perpendicolari**. Se a⃗ · b⃗ = |a⃗||b⃗| cos θ è zero e nessuno dei due moduli lo è, allora cos θ = 0, cioè θ = 90°.

**10.** Prodotto vettoriale: |c⃗| = 3 · 4 · sen 90° = 3 · 4 · 1 = **12**. Prodotto scalare: 3 · 4 · cos 90° = **0**. È la regola del riquadro della sezione 17: dove uno è massimo, l'altro è nullo.

**11.** 72 km/h × (10³ m / 1 km) × (1 h / 3600 s) = 72000/3600 = **20 m/s**. In pratica si divide per 3,6: è una conversione che conviene saper fare a mente, perché ricorre in tutti i problemi di cinematica.

**12.** Pressione = forza / superficie = (kg·m·s⁻²) / m² = **kg·m⁻¹·s⁻²**, che si chiama **pascal (Pa)**. Dividendo per m² l'esponente della m passa da +1 a −1.

**13.** Il coefficiente è 7,2, maggiore di 5, quindi si sale di una potenza: l'ordine di grandezza è **10⁶**.

**14.** Sì. g è un'accelerazione, [L][t]⁻², e h una lunghezza, [L]. Il 2 è un numero puro e non ha dimensioni. Quindi √([L][t]⁻² · [L]) = √([L]²[t]⁻²) = **[L][t]⁻¹**, che sono proprio le dimensioni di una velocità.

**15.** La densità è **intensiva**: mezzo litro d'acqua e dieci litri hanno la stessa densità. La massa è **estensiva**: se unisci due corpi, si somma. Coerente con la regola: densità = massa/volume, cioè il rapporto fra due estensive.

**16.** sen 30° = **1/2** e cos 60° = **1/2**: sono uguali perché 30° e 60° sono complementari. sen²θ + cos²θ = **1**, per qualunque θ.

**17.** aₓ = 10 · cos 30° = 10 · 0,87 ≈ **8,7**; a_y = 10 · sen 30° = 10 · 0,5 = **5**. Controllo con Pitagora: √(8,7² + 5²) = √(75,7 + 25) ≈ √100,7 ≈ 10 ✓.

**18.** Fra **1 N e 7 N**: il minimo |4 − 3| = 1 N quando sono opposte, il massimo 4 + 3 = 7 N quando sono concordi. Se fossero perpendicolari varrebbe √(9 + 16) = 5 N.

## Da verificare prima di pubblicare

Note per l'insegnante, non visibili agli studenti.

- **Un errore nelle slide, da correggere.** Nella tabella delle grandezze derivate (diapositiva 5) la pressione ha dimensioni [M][L]⁻¹[t]⁻², che sono corrette, ma l'unità è scritta **kg·m⁻²·s⁻²**, che non lo è: la riga si contraddice da sola. L'unità giusta è kg·m⁻¹·s⁻² (il pascal). Nella dispensa ho messo la versione corretta, e la domanda 12 dell'autoverifica fa ricavare l'unità da forza/superficie proprio per fissarla. **Converrebbe correggere la slide** prima di riproiettarla.
- **Le grandezze fondamentali sono cinque nella slide, sette qui.** La diapositiva 4 elenca lunghezza, tempo, massa, corrente e temperatura. Ho aggiunto mole e candela per completezza, segnalando che le ultime due in questo corso si usano poco: la mole però serve, sia in chimica sia quando si parla di gas. Da valutare se è la scelta che preferisci.
- **«Grado Kelvin».** La slide scrive «grado Kelvin (K)». Il «grado» è stato tolto dalla definizione nel 1967: la dispensa lo segnala in un riquadro. Anche questa è una riga da aggiornare nelle slide.
- **Il simbolo del tempo.** Le slide usano [t] per il tempo e [T] per la temperatura, e la dispensa segue questa convenzione: è segnalato esplicitamente alla fine della sezione 4, perché molti testi usano invece [T] per il tempo e lo studente lo incontrerà.
- **Formule mancanti.** Media, deviazione standard ed errore percentuale, nelle slide, sono immagini: nella conversione il testo non si recupera. Le ho riscritte a parole e come procedimento passo per passo, invece che in simboli, perché così si leggono meglio senza un motore di formule. **Da confrontare con le slide** se la forma simbolica è importante per l'esame.
- **I numeri dell'esempio sono stati verificati.** Dalle venti misure della diapositiva 7 ho ricalcolato media (2,146 cm) e deviazione standard (0,0116 cm come deviazione di popolazione, 0,0119 come deviazione campionaria): entrambe arrotondano a 0,012 cm, come scrive la slide. La dispensa non specifica quale delle due definizioni si usa, perché a questo livello la differenza non si vede: se a lezione è stata data una formula precisa, va allineata.
- **Figure non importate.** L'istogramma e la curva gaussiana nelle slide sono disegni. Nella dispensa l'istogramma è reso come tabella delle frequenze, che si legge bene anche da telefono, e la gaussiana è descritta a parole con la tabella 68/95/99. Mancano anche lo schema del triangolo rettangolo (sezione 13) e il disegno della somma punta-coda (sezione 15), che a parole si capiscono ma con una figura si capirebbero meglio. Se vuoi i disegni vanno aggiunti a parte.
- **Che cosa è stato fuso dalla bozza SF-FIS-01.** Le sezioni **6 (ordini di grandezza), 7 (analisi dimensionale), 8 (estensive e intensive), 13 (trigonometria)**, la sottosezione **Le componenti** e la sezione **15 (somma e differenza di vettori)**, più il metodo di conversione della sezione 5, vengono dall'appunto SF-FIS-01 scritto in precedenza, non dalle slide del docente. Sono argomenti che il syllabus richiede e che servono al resto del corso — senza trigonometria non si scompone un vettore — ma **vanno riletti sapendo che non sono farina del sacco del docente**, e tagliati se a lezione non sono stati trattati.
- **La bozza SF-FIS-01 ora è ridondante.** Dopo questa fusione contiene solo materiale già presente qui, più alcuni esercizi svolti. Resta in bozza e non l'ho toccata: da decidere se archiviarla o tenerla come raccolta di esercizi.
- **Nessuna esercitazione collegata.** La prima dispensa rimanda a «Equazioni e sistemi»; per questa non c'è ancora un'esercitazione in piattaforma. Le diciotto domande della sezione 18 sono scritte da me e coprono i punti principali, ma non sostituiscono un compito del docente.
