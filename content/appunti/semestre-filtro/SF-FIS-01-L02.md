---
codice: SF-FIS-01-L02
percorso: SEMESTRE_FILTRO
materia: Fisica
titolo: "Grandezze fisiche, misura ed errori · Scalari e vettori"
stato: bozza
fonti:
  - "Presentazione del docente: GrandezzeFisiche1.ppt (novembre 2026), convertita per il sito"
  - "Syllabus MUR Fisica 2026/2027, unità didattica 1 — content/semestre-filtro/syllabus/fisica-2026-2027.txt"
---

**Che cosa significa misurare, quanto ci si può fidare di una misura, e perché per certe grandezze un numero non basta.** Lezione 2 del corso di Fisica.

**Come usare questa dispensa:** è più breve della prima e si legge tutta d'un fiato, ma le sezioni 7, 8 e 9 vanno rifatte con la calcolatrice in mano: sono conti che all'esame si chiedono. Alla fine, le domande della sezione 13 e le soluzioni nella 14. Se non hai ancora letto **Basi matematica 1**, leggila prima: qui si danno per noti le potenze e il calcolo con le lettere.

## 1. La fisica è una scienza sperimentale

La fisica non parte dalle formule. Parte da un fenomeno che si osserva, e procede così:

**osservazione** → **ipotesi** → **misura delle grandezze in gioco** → **verifica** → **legge fisica**

Una legge fisica è una relazione matematica fra grandezze misurabili, e resta valida finché nessuna misura la smentisce. Questo spiega una frase che a lezione torna spesso: *in fisica si usa un linguaggio matematico*. Non è una scelta di stile. È che una legge deve dire **quanto**, non soltanto **che cosa**, e «quanto» si scrive con i numeri.

Tutto il resto di questa dispensa è dentro quel terzo passaggio, la misura: che cosa si misura, con quali unità, e con quanta incertezza.

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

Le dimensioni servono a due cose, e sono due cose che all'esame fanno guadagnare punti:

**1. Controllare un risultato.** I due membri di una formula devono avere le stesse dimensioni. Se da un calcolo esce una velocità in kg·s, il calcolo è sbagliato: non serve ricontrollarlo, si sa già.

**2. Ricostruire una formula dimenticata.** Se non ricordi l'unità della pressione, non impararla a memoria: ricavala. Pressione = forza/superficie = (kg·m·s⁻²)/m² = kg·m⁻¹·s⁻².

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

> **Attenzione all'esame · Le aree e i volumi**
>
> 1 km = 10³ m, ma **1 km² = 10⁶ m²** e **1 km³ = 10⁹ m³**: il fattore va elevato alla stessa potenza dell'unità. Allo stesso modo 1 cm = 10⁻² m, ma 1 cm³ = 10⁻⁶ m³. È l'errore di conversione più frequente in assoluto, e si evita sempre con lo stesso gesto: convertire **prima** la lunghezza, elevare **dopo**.

## 6. Perché ogni misura ha un errore

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

## 7. Misure ripetute: media e deviazione standard

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
2. si eleva ogni scarto al quadrato (così i segni non si cancellano fra loro);
3. si fa la media di questi quadrati;
4. se ne prende la radice quadrata.

Nel nostro esempio si ottiene **σ = 0,012 cm**.

Il passaggio 2 è il motivo del nome: se si sommassero gli scarti così come sono, il risultato sarebbe sempre zero, perché per costruzione gli scarti in più e quelli in meno si equivalgono. Elevandoli al quadrato diventano tutti positivi e si sommano davvero.

**Il risultato si scrive** come valore medio seguito dall'incertezza:

l = l̄ ± σ = (2,146 ± 0,012) cm, che approssimando si scrive **(2,15 ± 0,01) cm**

> **Attenzione all'esame · Media e deviazione standard dicono due cose diverse**
>
> La **media** dice *dove* sta il valore. La **deviazione standard** dice *quanto ci si può fidare*. Due serie di misure possono avere la stessa media e affidabilità completamente diversa: σ piccola significa misure concordi fra loro e quindi errore piccolo; σ grande significa misure sparpagliate ed errore grande.

## 8. La distribuzione gaussiana

Se le misure sono molte e gli errori sono soltanto casuali, l'istogramma assume una forma caratteristica: simmetrica, con un massimo in corrispondenza del valore medio e due code che scendono ai lati. È la **curva a campana**, o **distribuzione gaussiana**.

La deviazione standard è la larghezza della campana, e divide la curva in fasce di cui si conosce il significato:

| intervallo | quante misure vi cadono |
|---|---|
| fra l̄ − σ e l̄ + σ | circa il **68%** |
| fra l̄ − 2σ e l̄ + 2σ | circa il **95%** |
| fra l̄ − 3σ e l̄ + 3σ | circa il **99%** |

Ecco perché scrivere (2,15 ± 0,01) cm ha un significato preciso: significa che circa due misure su tre cadono in quell'intervallo, e che è molto improbabile — meno dell'1% — che il valore vero stia fuori da 2,15 ± 0,03.

Una campana **stretta** (σ piccola) corrisponde a un errore piccolo; una campana **larga** (σ grande) a un errore grande.

## 9. Come si scrive una misura

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

## 10. Scalari e vettori

Per alcune grandezze un numero e un'unità bastano. Per altre no.

**Grandezze scalari**: sono completamente determinate da un numero con la sua unità. Tempo, temperatura, massa, volume, energia.

**Grandezze vettoriali**: per essere determinate ne servono tre cose insieme. Spostamento, velocità, accelerazione, forza.

- il **modulo**: quanto vale, cioè un numero con la sua unità. Si indica con |v⃗| oppure semplicemente v;
- la **direzione**: la retta lungo cui agisce;
- il **verso**: quale dei due sensi su quella retta.

Spesso si aggiunge il **punto di applicazione**, cioè dove il vettore agisce: due forze uguali applicate in punti diversi di un corpo producono effetti diversi.

Un vettore si disegna come una freccia: la lunghezza è il modulo, l'inclinazione la direzione, la punta il verso.

Due vettori sono **uguali** se hanno lo stesso modulo, la stessa direzione e lo stesso verso. Sono **opposti** se hanno stesso modulo e stessa direzione ma verso contrario.

> **Attenzione all'esame · Direzione non è verso**
>
> Nel linguaggio comune «direzione» e «verso» si usano come sinonimi; in fisica no. La **direzione** è la retta: nord-sud è una direzione sola. Il **verso** sceglie fra i due sensi di percorrenza: verso nord e verso sud sono due versi della stessa direzione. Una domanda che chiede «due vettori con la stessa direzione e verso opposto» sta descrivendo vettori paralleli che puntano da parti contrarie.

## 11. Il prodotto scalare

Fra due vettori si definiscono due prodotti diversi, che danno risultati di tipo diverso. Il primo dà un numero.

Il **prodotto scalare** di a⃗ e b⃗ è il numero

a⃗ · b⃗ = |a⃗| |b⃗| cos θ

dove θ è l'angolo compreso fra i due vettori.

Si legge così: |b⃗| cos θ è la **componente di b⃗ lungo la direzione di a⃗**. Il prodotto scalare è quindi il modulo di a⃗ moltiplicato per quanto di b⃗ «va nella stessa direzione» di a⃗. Tutto ciò che di b⃗ è perpendicolare ad a⃗ non conta.

| angolo | valore | significato |
|---|---|---|
| θ = 0° | a⃗ · b⃗ = ab | vettori concordi: prodotto massimo |
| θ = 90° | a⃗ · b⃗ = 0 | vettori perpendicolari: prodotto nullo |
| θ = 180° | a⃗ · b⃗ = −ab | vettori opposti: prodotto minimo, negativo |

Il caso θ = 90° è quello che si usa più spesso, al contrario: se il prodotto scalare di due vettori non nulli è zero, allora i due vettori **sono perpendicolari**.

Il prodotto scalare compare nella definizione di lavoro: una forza perpendicolare allo spostamento non compie lavoro, ed è esattamente la riga di mezzo della tabella.

## 12. Il prodotto vettoriale

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

## 13. Mettiti alla prova

Rispondi senza guardare le soluzioni, poi controlla nella sezione 14.

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

## 14. Soluzioni

**1.** **Indiretta.** Non si confronta la velocità con un campione di velocità: si misurano una lunghezza e un tempo, e si ricava la velocità dalla relazione v = s/t.

**2.** Forza = massa × accelerazione = **[M][L][t]⁻²**. Densità = massa / volume = **[M][L]⁻³**.

**3.** È un errore **sistematico**: avviene sempre nello stesso verso. **Ripetere non serve a niente** — tutte le pesate saranno sbagliate di 2 g e la media anche. Si scopre solo cambiando bilancia o azzerandola.

**4.** l = (2,146 ± 0,012) cm, che approssimato si scrive **(2,15 ± 0,01) cm**. Valore e incertezza devono avere la stessa ultima cifra decimale.

**5.** **± 0,01 m.** Senza errore esplicito si intende una unità sull'ultima cifra scritta, e l'ultima cifra è il centesimo. Attenzione: 3,40 m non è la stessa misura di 3,4 m, che varrebbe ± 0,1 m.

**6.** Errori percentuali: (0,01/1)×100 = 1% e (0,1/100)×100 = 0,1%. **La seconda**, pur avendo un errore assoluto dieci volte maggiore.

**7.** Circa il **68%**. Entro 2σ circa il 95%, entro 3σ circa il 99%.

**8.** La temperatura è **scalare**: basta un numero con l'unità. La velocità è **vettoriale**: 50 km/h verso nord e 50 km/h verso sud sono due velocità diverse, anche se il tachimetro segna lo stesso numero.

**9.** Che sono **perpendicolari**. Se a⃗ · b⃗ = |a⃗||b⃗| cos θ è zero e nessuno dei due moduli lo è, allora cos θ = 0, cioè θ = 90°.

**10.** Prodotto vettoriale: |c⃗| = 3 · 4 · sen 90° = 3 · 4 · 1 = **12**. Prodotto scalare: 3 · 4 · cos 90° = **0**. È la regola della sezione 12: dove uno è massimo, l'altro è nullo.

**11.** 72 km/h = 72 × 1000 m / 3600 s = 72000/3600 = **20 m/s**. In pratica si divide per 3,6: è una conversione che conviene saper fare a mente, perché ricorre in tutti i problemi di cinematica.

**12.** Pressione = forza / superficie = (kg·m·s⁻²) / m² = **kg·m⁻¹·s⁻²**, che si chiama **pascal (Pa)**. Dividendo per m² l'esponente della m passa da +1 a −1.

## Da verificare prima di pubblicare

Note per l'insegnante, non visibili agli studenti.

- **Un errore nelle slide, da correggere.** Nella tabella delle grandezze derivate (diapositiva 5) la pressione ha dimensioni [M][L]⁻¹[t]⁻², che sono corrette, ma l'unità è scritta **kg·m⁻²·s⁻²**, che non lo è: la riga si contraddice da sola. L'unità giusta è kg·m⁻¹·s⁻² (il pascal). Nella dispensa ho messo la versione corretta, e la domanda 12 dell'autoverifica fa ricavare l'unità da forza/superficie proprio per fissarla. **Converrebbe correggere la slide** prima di riproiettarla.
- **Le grandezze fondamentali sono cinque nella slide, sette qui.** La diapositiva 4 elenca lunghezza, tempo, massa, corrente e temperatura. Ho aggiunto mole e candela per completezza, segnalando che le ultime due in questo corso si usano poco: la mole però serve, sia in chimica sia quando si parla di gas. Da valutare se è la scelta che preferisci.
- **«Grado Kelvin».** La slide scrive «grado Kelvin (K)». Il «grado» è stato tolto dalla definizione nel 1967: la dispensa lo segnala in un riquadro. Anche questa è una riga da aggiornare nelle slide.
- **Formule mancanti.** Media, deviazione standard ed errore percentuale, nelle slide, sono immagini: nella conversione il testo non si recupera. Le ho riscritte a parole e come procedimento passo per passo, invece che in simboli, perché così si leggono meglio senza un motore di formule. **Da confrontare con le slide** se la forma simbolica è importante per l'esame.
- **I numeri dell'esempio sono stati verificati.** Dalle venti misure della diapositiva 7 ho ricalcolato media (2,146 cm) e deviazione standard (0,0116 cm come deviazione di popolazione, 0,0119 come deviazione campionaria): entrambe arrotondano a 0,012 cm, come scrive la slide. La dispensa non specifica quale delle due definizioni si usa, perché a questo livello la differenza non si vede: se a lezione è stata data una formula precisa, va allineata.
- **Figure non importate.** L'istogramma e la curva gaussiana nelle slide sono disegni. Nella dispensa l'istogramma è reso come tabella delle frequenze, che si legge bene anche da telefono, e la gaussiana è descritta a parole con la tabella 68/95/99. Se vuoi i disegni veri vanno aggiunti a parte.
- **Nessuna esercitazione collegata.** La prima dispensa rimanda a «Equazioni e sistemi»; per questa non c'è ancora un'esercitazione in piattaforma. Le dodici domande della sezione 13 sono scritte da me e coprono i punti principali, ma non sostituiscono un compito del docente.
- **Sovrapposizione con la bozza SF-FIS-01.** Esiste già un appunto SF-FIS-01 «Introduzione ai metodi della fisica», scritto prima e rimasto in bozza, che tratta gli stessi argomenti più notazione scientifica, analisi dimensionale e trigonometria. Non l'ho toccato. Da decidere se pubblicare questa dispensa al suo posto, o se tenere l'altra come ripasso più ampio.
