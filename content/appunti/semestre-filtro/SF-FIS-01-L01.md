---
codice: SF-FIS-01-L01
percorso: SEMESTRE_FILTRO
materia: Fisica
titolo: "Basi matematica 1 · Calcolo letterale ed equazioni"
stato: bozza
fonti:
  - "Presentazioni del docente: monomiepolinomi.pptx, Equazioni.ppt, EQUAZIONIDI2GRADO.ppt (novembre 2026), convertite per il sito"
---

**Il linguaggio con cui si scrive la fisica: lettere al posto dei numeri, e uguaglianze da risolvere.** Lezione 1 del corso di Fisica, parte di matematica.

**Come usare questa dispensa:** leggila una sezione alla volta, con carta e penna accanto — la matematica non si impara guardandola. Alla fine di ogni sezione rifai da solo gli esempi, coprendo il procedimento. Poi rispondi alle domande della sezione 16 senza guardare le soluzioni, e controllale nella 17. Quando hai finito, fai l'esercitazione **«Equazioni e sistemi»** che trovi in Esercitati.

## 1. Perché la matematica in un corso di fisica

In fisica non si descrivono i fenomeni a parole: si scrivono relazioni fra grandezze. «La forza è il prodotto della massa per l'accelerazione» diventa F = ma, e da lì si ricava a = F/m oppure m = F/a a seconda di quello che si cerca.

Per farlo servono due cose, e sono le due metà di questa dispensa:

1. **Maneggiare espressioni con le lettere** — sommarle, moltiplicarle, dividerle, riconoscerne la forma. È il calcolo letterale: sezioni 3–6.
2. **Risolvere un'uguaglianza**, cioè trovare il valore che la rende vera. Sono le equazioni: sezioni 7–15.

Nessuna delle due è fisica. Sono lo strumento. Ma uno strumento che non si maneggia bene rende impossibile il lavoro vero: alla prova d'esame si perdono punti su problemi capiti benissimo, solo perché a metà conto si sbaglia un segno o si semplifica male una frazione.

## 2. Obiettivi

Al termine dello studio sarai in grado di:

1. **riconoscere** un monomio e un polinomio e scriverli in forma normale;
2. **eseguire** somma, prodotto, potenza e quoziente di monomi;
3. **applicare a memoria** i prodotti notevoli (quadrato di binomio e di trinomio, somma per differenza, cubo di binomio);
4. **dividere** un polinomio per un binomio, in colonna o con la regola di Ruffini;
5. **distinguere** equazione determinata, indeterminata e impossibile;
6. **usare** i due principi di equivalenza e le regole che ne derivano;
7. **risolvere** equazioni di primo grado intere, frazionarie e letterali, determinando il dominio;
8. **risolvere** un sistema di due o tre equazioni per sostituzione, somma o confronto;
9. **risolvere** un'equazione di secondo grado e **prevedere** la natura delle soluzioni dal discriminante;
10. **usare** somma e prodotto delle radici per scomporre un trinomio o per trovare le soluzioni a mente.

**Che cosa non tratta questa dispensa.** Disequazioni, radicali, potenze a esponente frazionario, esponenziali e logaritmi: sono materia della seconda dispensa di basi matematiche.

## 3. I monomi

### Che cos'è

Un **monomio** è un'espressione in cui numeri e lettere sono legati soltanto da moltiplicazioni, e in cui gli esponenti delle lettere sono numeri naturali.

Sono monomi: 2ab², −3x²y, 5, a.

Non sono monomi: 4x − 2y, perché c'è una sottrazione; 2b/a, perché c'è una lettera al denominatore.

### Forma normale, coefficiente, parte letterale

Un monomio è in **forma normale** quando è scritto come un numero moltiplicato per lettere tutte diverse fra loro, ciascuna con il suo esponente.

3b²y³ è in forma normale. 3b²y³b non lo è: la b compare due volte, e va raccolta in 3b³y³.

In un monomio in forma normale si distinguono:

- il **coefficiente**, la parte numerica: in −3x²y è −3;
- la **parte letterale**, le lettere con i loro esponenti: in −3x²y è x²y.

Un monomio con coefficiente 0 è il **monomio nullo**, e si scrive 0.

### Grado

- **Grado rispetto a una lettera**: l'esponente con cui quella lettera compare. In 3x²y il grado rispetto a x è 2, rispetto a y è 1.
- **Grado complessivo**: la somma di tutti gli esponenti. In 3x²y è 2 + 1 = 3.

Un numero da solo, per esempio +12, ha grado 0: non contiene lettere.

### Monomi simili e monomi opposti

Due monomi sono **simili** se hanno la stessa parte letterale. −5ay e 4ay sono simili. Lo sono anche −5az⁴y² e 2z⁴ay²: l'ordine delle lettere non conta, perché la moltiplicazione è commutativa.

Sono **opposti** se sono simili e hanno coefficienti opposti: 8a²b e −8a²b.

> **Concetto chiave · Perché «simili» è la parola che conta**
>
> Si possono sommare **soltanto** monomi simili. Tutto il resto del calcolo letterale — ridurre un'espressione, risolvere un'equazione — consiste nel raccogliere i termini simili e poi sommarli. Se due monomi non sono simili, la loro somma resta scritta com'è: non esiste nessun modo di «finire il conto».

### Le operazioni

**Somma algebrica.** Si sommano i coefficienti e si lascia la parte letterale:

−2b²y⁵ + 12b²y⁵ = (−2 + 12)b²y⁵ = 10b²y⁵

Se i monomi non sono simili la somma non si può scrivere come un monomio solo: ab + x² resta ab + x².

**Sottrazione.** Si somma al primo l'opposto del secondo:

(+2a³y) − (−6ax) = 2a³y + 6ax

**Prodotto.** Si moltiplicano i coefficienti e si **sommano** gli esponenti delle lettere uguali:

(+3a³x²) · (+7abx³) = 21a⁴bx⁵

**Potenza.** Si eleva il coefficiente e si **moltiplicano** gli esponenti:

(−½x²y³)³ = (−½)³ · x⁶ · y⁹ = −⅛x⁶y⁹

**Quoziente.** Si dividono i coefficienti e si **sottraggono** gli esponenti:

8x³y² : (−⅔xy) = −12x²y

La divisione non sempre si può fare. Per esempio −⁶⁄₅a²xy² : (¾ax²y) non si esegue: nel divisore la x ha grado 2 e nel dividendo grado 1, quindi resterebbe un esponente negativo e il risultato non sarebbe più un monomio.

> **Attenzione all'esame**
>
> Nella potenza l'esponente va dato **a tutto, segno compreso**: (−2x)³ = −8x³, ma (−2x)² = +4x². Un esponente pari cancella il meno, uno dispari lo conserva. È l'errore più frequente in assoluto.

### M.C.D. e m.c.m. fra monomi

Servono per sommare frazioni algebriche e per semplificare.

- **M.C.D.**: i fattori **comuni**, una volta sola, con il **minimo** esponente. M.C.D.(9a²b², 3a²b⁴c², 12a²b²) = 3a²b².
- **m.c.m.**: **tutti** i fattori, comuni e non, una volta sola, con il **massimo** esponente. m.c.m.(9a²b², 3a²b⁴c², 12a⁶b²) = 36a⁶b⁴c².

Se i coefficienti non sono tutti interi, la parte numerica si pone uguale a 1. Il segno è sempre positivo.

## 4. I polinomi

### Che cos'è

Un **polinomio** è la somma algebrica di più monomi, detti **termini**.

3xy + ab + 2 è un polinomio di tre termini. L'ultimo, che non ha parte letterale, si chiama **termine noto**.

Un polinomio è in **forma normale** quando non contiene monomi simili, cioè quando le somme possibili sono già state fatte:

3xy + 4ab − 5xy + 6ab = (3 − 5)xy + (4 + 6)ab = −2xy + 10ab

### Come si descrive un polinomio

- **Grado complessivo**: il grado del suo termine di grado più alto.
- **Grado rispetto a una lettera**: il massimo esponente con cui quella lettera compare.
- **Omogeneo**: tutti i termini hanno lo stesso grado.
- **Ordinato** rispetto a una lettera: i termini sono scritti con le potenze di quella lettera in ordine decrescente, o crescente.
- **Completo** rispetto a una lettera: quella lettera compare con tutte le potenze, dalla più alta fino a 0.

3x³y + 2x² + x + 6 è ordinato e completo rispetto a x, ma non è omogeneo.

> **Attenzione all'esame**
>
> «Completo» serve davvero in un momento solo: la divisione fra polinomi (sezione 6). Se un polinomio non è completo, prima di dividere bisogna **scrivere gli zeri mancanti**, altrimenti i termini si incolonnano sbagliati. x³ − 1 va trattato come x³ + 0x² + 0x − 1.

### Prodotto e quoziente

Il **prodotto** di due polinomi si esegue con la proprietà distributiva: ogni termine del primo per ogni termine del secondo.

(3x − b)(1 + 2x) = 3x + 6x² − b − 2bx

Il **quoziente di un polinomio per un monomio** si esegue dividendo ogni termine:

(9x²y − 18xy² + 2xy) : (−3xy) = −3x + 6y − ⅔

## 5. I prodotti notevoli

Sono prodotti che ricorrono così spesso che conviene saperne il risultato a memoria, invece di rifare ogni volta la distributiva. Vanno saputi **nei due versi**: dal prodotto allo sviluppo, per fare i conti, e dallo sviluppo al prodotto, per scomporre.

**Quadrato di un binomio**

(a + b)² = a² + 2ab + b²

(a − b)² = a² − 2ab + b²

A parole: il quadrato del primo, più il quadrato del secondo, più il doppio prodotto del primo per il secondo.

Esempio: (½ab + x)² = ¼a²b² + abx + x²

**Quadrato di un trinomio**

(a + b + c)² = a² + b² + c² + 2ab + 2ac + 2bc

A parole: i quadrati di tutti e tre, più tutti i doppi prodotti possibili.

Esempio: (2x + y + z)² = 4x² + y² + z² + 4xy + 4xz + 2yz

**Somma per differenza**

(a + b)(a − b) = a² − b²

Esempio: (−x + 2y)(−x − 2y) = x² − 4y²

**Cubo di un binomio**

(a + b)³ = a³ + 3a²b + 3ab² + b³

Esempio: (3a − x)³ = 27a³ − 27a²x + 9ax² − x³

**Triangolo di Tartaglia.** Per potenze più alte i coefficienti si leggono dal triangolo, in cui ogni numero è la somma dei due che gli stanno sopra:

| potenza | coefficienti |
|---|---|
| (a + b)⁰ | 1 |
| (a + b)¹ | 1 · 1 |
| (a + b)² | 1 · 2 · 1 |
| (a + b)³ | 1 · 3 · 3 · 1 |
| (a + b)⁴ | 1 · 4 · 6 · 4 · 1 |
| (a + b)⁵ | 1 · 5 · 10 · 10 · 5 · 1 |

Esempio: (a + 2)⁵ = a⁵ + 5·2a⁴ + 10·4a³ + 10·8a² + 5·16a + 32 = a⁵ + 10a⁴ + 40a³ + 80a² + 80a + 32

> **Attenzione all'esame · L'errore che costa più punti di tutti**
>
> **(a + b)² non è a² + b².** Manca il doppio prodotto. Lo stesso vale per la radice: √(a² + b²) non è a + b. Quando in un problema di fisica compare una somma dentro un quadrato o sotto radice — il teorema di Pitagora, il modulo di un vettore — è lì che si sbaglia.

## 6. Dividere i polinomi

### Divisione in colonna

Si procede come nella divisione fra numeri. Calcoliamo (8x² + 7x + 2) : (2x + 3).

1. **Si ordinano** entrambi i polinomi secondo le potenze decrescenti di x, completandoli con gli zeri se mancano termini.
2. Si divide il primo termine del dividendo per il primo del divisore: 8x² : 2x = 4x. È il primo termine del quoziente.
3. Si moltiplica 4x per tutto il divisore e si **sottrae** dal dividendo: 8x² + 7x − (8x² + 12x) = −5x. Resta −5x + 2.
4. Il resto parziale ha grado ancora maggiore o uguale a quello del divisore, quindi si ripete il procedimento: −5x : 2x = −5/2, e così via.

Si ottiene quoziente Q(x) = 4x − 5/2 e resto R = 19/2.

### I due teoremi che evitano il lavoro

**Teorema del resto.** Il resto della divisione di P(x) per (x − a) è uguale a **P(a)**: basta sostituire, non serve dividere.

Esempio: P(x) = x³ − 2x² + 4 diviso per (x − 1) dà resto P(1) = 1 − 2 + 4 = 3.

**Teorema di Ruffini.** P(x) è divisibile per (x − a) **se e solo se P(a) = 0**. In questo caso si dice che a è uno **zero**, o una radice, del polinomio.

È il criterio con cui si scompongono i polinomi di grado alto: si cercano per tentativi gli zeri fra i divisori del termine noto, e ogni zero trovato stacca un fattore (x − a).

### Regola di Ruffini

Quando il divisore ha la forma (x − a), la divisione si può fare in forma abbreviata, lavorando solo sui coefficienti. Calcoliamo (3x² − 2x + 5) : (x − 2).

Si scrivono i coefficienti del dividendo e, a sinistra, il valore a = 2:

| a = 2 | 3 | −2 | 5 |
|---|---|---|---|
| | | 6 | 8 |
| **risultato** | **3** | **4** | **13** |

Si abbassa il primo coefficiente (3); lo si moltiplica per 2 e si somma al successivo (−2 + 6 = 4); si ripete (5 + 8 = 13). I numeri della riga in basso, tranne l'ultimo, sono i coefficienti del quoziente; l'ultimo è il resto.

Quindi il quoziente è 3x + 4 e il resto è 13.

> **Attenzione all'esame · Il segno di a**
>
> Per dividere per (x − 2) si scrive **2**; per dividere per (x + 2) si scrive **−2**, perché x + 2 = x − (−2). Sbagliare questo segno è l'errore classico della regola di Ruffini.

## 7. Che cos'è un'equazione

Un'**equazione** è un'uguaglianza fra due espressioni che è vera **soltanto per certi valori** delle lettere che vi compaiono.

In 2x − 3 = x + 1:

- l'espressione a sinistra dell'uguale è il **primo membro**, quella a destra il **secondo membro**;
- la lettera x è l'**incognita**: il valore che non conosciamo e che vogliamo trovare;
- il **dominio** è l'insieme dei valori che si possono attribuire a x senza che l'espressione perda significato;
- una **soluzione** è un valore di x che rende vera l'uguaglianza. Qui è x = 4: infatti 2·4 − 3 = 5 e 4 + 1 = 5.

Un'equazione può contenere anche altre lettere, che non sono incognite: si chiamano **parametri** e si considerano numeri fissi, anche se non noti. In ax − 2 = 3x + a l'incognita è x e il parametro è a.

Per convenzione le incognite si indicano con le ultime lettere dell'alfabeto (x, y, z) e i parametri con le prime (a, b, c, k).

### Determinata, indeterminata, impossibile

| tipo | quante soluzioni | esempio |
|---|---|---|
| **determinata** | un numero finito | x − 2 = 3, che ha come unica soluzione 5 |
| **indeterminata** | infinite | 1 − 2x = (x − 1)² − x², vera per ogni x |
| **impossibile** | nessuna | x + 4 = x, perché nessun numero sommato a 4 resta sé stesso |

### Come si classificano

- **Numerica**: oltre all'incognita non contiene altre lettere. **Letterale**: contiene anche parametri.
- **Intera**: l'incognita non compare al denominatore. **Frazionaria**: l'incognita sta in almeno un denominatore.

Il **grado** di un'equazione intera è il grado del polinomio che si ottiene portando tutto a primo membro: 2x − 3 = 0 è di primo grado, 4x² − 6x + 3 = 0 di secondo, 6x³ − 7x + 1 = 0 di terzo.

## 8. I principi di equivalenza

Due equazioni sono **equivalenti** se hanno le stesse soluzioni. 3x = 6 e x + 3 = 5 sono diverse nella forma ma hanno entrambe la sola soluzione x = 2.

Risolvere un'equazione vuol dire proprio questo: passare da quella data a una più semplice **equivalente**, e poi a un'altra ancora più semplice, fino ad arrivare a x = k. I due principi dicono quali passaggi conservano le soluzioni.

**Primo principio.** Se si aggiunge ai due membri una stessa espressione, si ottiene un'equazione equivalente.

Da qui discendono due regole pratiche:

- **Regola del trasporto**: si può spostare un termine da un membro all'altro **cambiandogli segno**.
- **Regola di cancellazione**: se lo stesso addendo compare in entrambi i membri, si può togliere da tutti e due.

Esempio: 2x − 5 = x − 2 → 2x − x = −2 + 5 → x = 3.

**Secondo principio.** Se si moltiplicano i due membri per una stessa espressione **sempre diversa da zero** nel dominio, si ottiene un'equazione equivalente.

Da qui:

- **Regola di semplificazione**: si possono dividere tutti i termini per uno stesso fattore, purché diverso da zero. 3x − 6 = 9 diventa x − 2 = 3.
- **Regola del cambio dei segni**: cambiando segno a tutti i termini di entrambi i membri si ottiene un'equazione equivalente. −2x − 3 = x − 1 diventa 2x + 3 = −x + 1.
- **Riduzione a coefficienti interi**: da un'equazione a coefficienti frazionari si passa a una a coefficienti interi moltiplicando entrambi i membri per il m.c.m. dei denominatori.

> **Attenzione all'esame · Il «diverso da zero» non è un dettaglio**
>
> Moltiplicare o dividere per zero distrugge le soluzioni. È il motivo per cui, nelle equazioni frazionarie e in quelle letterali, prima di semplificare bisogna **sempre** chiedersi se il fattore per cui si sta dividendo può valere zero. Quasi tutti gli errori di queste due sezioni nascono qui.

## 9. Equazioni di primo grado

Un'equazione di primo grado si dice anche **lineare** e, portata in forma normale, si scrive

ax + b = 0

dove a è il coefficiente dell'incognita e b il termine noto. Il dominio è tutto R.

Si porta il termine noto a secondo membro, ax = −b, e poi si guarda **il coefficiente a**:

| caso | risultato |
|---|---|
| a ≠ 0 | una sola soluzione: x = −b/a |
| a = 0 e b ≠ 0 | impossibile: nessuna soluzione |
| a = 0 e b = 0 | indeterminata: ogni x va bene |

Il caso a = 0 sembra una stranezza, ma è esattamente quello che capita nelle equazioni letterali, dove a dipende da un parametro: vedi la sezione 11.

## 10. Equazioni frazionarie

Qui l'incognita compare al denominatore, e il dominio **non è più tutto R**: vanno esclusi i valori che annullano un denominatore, perché una divisione per zero non ha significato.

**Procedimento, nell'ordine:**

1. Si scompongono, se serve, i polinomi ai denominatori.
2. Si impone che ogni fattore a denominatore sia diverso da zero, e si risolvono queste **condizioni di esistenza**. Il dominio è R privato dei valori trovati.
3. Si risolve l'equazione con i principi di equivalenza.
4. **Si confronta la soluzione con i valori esclusi.** Se coincide con uno di essi, va scartata.

**Esempio.** 1/(x² − 4) − 3/(x − 2) = 5/(x + 2)

Si scompone: x² − 4 = (x − 2)(x + 2). Le condizioni sono x ≠ 2 e x ≠ −2, quindi D = R − {−2, 2}.

Si porta tutto allo stesso denominatore e si semplifica:

1 − 3(x + 2) = 5(x − 2) → 1 − 3x − 6 = 5x − 10 → −8x = −5 → x = 5/8

5/8 non è fra i valori esclusi, quindi è accettabile: S = {5/8}.

> **Attenzione all'esame · Il passaggio 4 è quello che si dimentica**
>
> La domanda 13 dell'esercitazione è costruita apposta su questo: (x² − 5x + 6)/(x − 2) = 0. Il numeratore si annulla per x = 2 e x = 3, ma x = 2 annulla anche il denominatore ed è escluso dal dominio. La risposta è x = 3 soltanto. Chi salta il controllo risponde «x = 2 e x = 3» e sbaglia.

## 11. Equazioni letterali

Sono equazioni che contengono, oltre all'incognita, uno o più **parametri**. Qui bisogna tenere separate due cose:

- il **dominio**, che riguarda l'incognita x;
- le **condizioni sul parametro**, che dicono quando certi passaggi sono leciti.

In un'equazione letterale si può sempre trasportare termini, cambiare tutti i segni, moltiplicare o dividere per un numero diverso da zero. **Non** si può invece dividere per un coefficiente letterale senza prima aver posto che sia diverso da zero.

**Discutere** un'equazione letterale significa dire come cambia l'insieme delle soluzioni al variare del parametro.

**Esempio.** x(3a − 1) = a

Per ricavare x bisogna dividere per 3a − 1, che però può valere zero. Due casi:

- se a ≠ ⅓, allora 3a − 1 ≠ 0 e si ottiene x = a/(3a − 1);
- se a = ⅓, l'equazione diventa x · 0 = ⅓, cioè 0 = ⅓, che è falsa: l'equazione è impossibile.

## 12. Sistemi di equazioni

### Che cos'è

Un **sistema** è un insieme di due o più equazioni che devono valere **contemporaneamente**, con due o più incognite. Risolverlo significa trovare la coppia (o la terna) di valori che soddisfa tutte le equazioni insieme.

Una sola equazione con due incognite, come 2x + y = 7, ha infinite soluzioni: scelto un x qualsiasi si ricava il corrispondente y. È la seconda equazione a selezionarne una sola.

### Tre metodi

**Sostituzione** — il più usato, e l'unico che serve sempre. Si ricava un'incognita da un'equazione e la si sostituisce nell'altra.

Risolviamo 2x + y = 7 e x − y = 2.

Dalla seconda: x = y + 2. Sostituendo nella prima: 2(y + 2) + y = 7 → 2y + 4 + y = 7 → 3y = 3 → y = 1. Quindi x = 3.

La soluzione è la coppia x = 3, y = 1. **Si verifica sempre** in entrambe le equazioni: 2·3 + 1 = 7 ✓ e 3 − 1 = 2 ✓.

**Somma (o riduzione)** — conviene quando una stessa incognita ha coefficienti opposti, o facili da rendere tali. Sommando membro a membro le due equazioni di sopra, le y si elidono: 3x = 9, da cui x = 3.

**Confronto** — si ricava la stessa incognita da entrambe e si uguagliano le espressioni ottenute.

### Sistemi di tre equazioni

Si procede allo stesso modo, riducendo un'incognita alla volta.

**Esempio** (domanda 2 dell'esercitazione):

x = z + 3

x + 7 − y = 0

x + y + z = 28

Dalla prima: z = x − 3. Dalla seconda: y = x + 7. Si sostituiscono entrambe nella terza:

x + (x + 7) + (x − 3) = 28 → 3x + 4 = 28 → x = 8

e quindi y = 15, z = 5.

> **Attenzione all'esame · Il modo più veloce di rispondere**
>
> Quando le risposte sono già date, come nei quiz, non serve risolvere: **si verificano le opzioni**. Sostituisci i valori di ciascuna risposta nelle equazioni e scarta quelle che non le soddisfano tutte. Su un sistema di tre incognite fa risparmiare minuti, e minuti all'esame sono punti.

### Dal problema all'equazione

Metà delle domande d'esame non sono equazioni già scritte: sono problemi a parole da tradurre. Il procedimento è sempre lo stesso.

1. **Dai un nome** a ciò che non conosci: «sia x il numero di …».
2. **Traduci ogni frase** del testo in un'uguaglianza.
3. Risolvi.
4. **Torna alla domanda**: controlla di rispondere a quello che è stato chiesto, non a quello che hai calcolato per ultimo.

**Esempio.** Tre biglietti per adulti e due per bambini costano 34 euro; due per adulti e tre per bambini costano 31 euro. Quanto costa un biglietto per adulti?

Sia a il prezzo del biglietto per adulti e b quello per bambini.

3a + 2b = 34

2a + 3b = 31

Sommando: 5a + 5b = 65, cioè a + b = 13. Sottraendo: a − b = 3. Quindi a = 8 e b = 5. La risposta alla domanda è **8 euro**.

Il punto 4 non è pedanteria: in questo problema chi calcola b per ultimo e risponde «5» ha fatto tutti i conti giusti e sbagliato la domanda.

## 13. Equazioni di secondo grado

### Forma normale e formula risolutiva

Un'equazione è di **secondo grado** se, ridotta a forma normale, si scrive

ax² + bx + c = 0, con a ≠ 0

Se a fosse 0 non ci sarebbe il termine in x² e l'equazione sarebbe di primo grado.

Si definisce **discriminante** il numero

Δ = b² − 4ac

e le soluzioni, quando esistono, si trovano con la **formula risolutiva**:

x = (−b ± √Δ) / (2a)

### Il discriminante decide tutto

Il segno di Δ sta sotto una radice quadrata, e una radice quadrata di un numero negativo non esiste fra i numeri reali. Da qui:

| Δ | soluzioni |
|---|---|
| Δ > 0 | due soluzioni reali e **distinte**, x₁ e x₂ |
| Δ = 0 | due soluzioni reali e **coincidenti**, x₁ = x₂ (si dice «radice doppia») |
| Δ < 0 | **nessuna** soluzione reale: l'equazione è impossibile in R |

Questa tabella va saputa a memoria: molte domande d'esame chiedono solo la **natura** delle soluzioni, e si rispondono calcolando Δ senza risolvere nulla.

### I casi particolari

Non sempre serve la formula completa. Quando manca un termine si fa prima:

**Equazione pura** (manca il termine in x): ax² + c = 0

Si isola x²: x² = −c/a. Se −c/a è positivo ci sono due soluzioni opposte, x = ±√(−c/a); se è negativo non ce ne sono.

Esempio: 3x² − 12 = 0 → x² = 4 → x = ±2.

**Equazione spuria** (manca il termine noto): ax² + bx = 0

Si raccoglie la x: x(ax + b) = 0. Un prodotto è zero quando lo è uno dei fattori, quindi x = 0 oppure x = −b/a. **Una soluzione è sempre zero.**

Esempio: 2x² − 8x = 0 → 2x(x − 4) = 0 → x = 0 oppure x = 4.

**Equazione monomia**: ax² = 0, che dà x = 0 come radice doppia.

> **Attenzione all'esame · Non dividere per x**
>
> In 2x² − 8x = 0 la tentazione è dividere tutto per x e ottenere 2x − 8 = 0, cioè x = 4. Ma dividendo per x si è diviso per una quantità che **può valere zero**, e così si è persa la soluzione x = 0. Si raccoglie, non si divide: è esattamente il secondo principio di equivalenza della sezione 8.

## 14. Somma e prodotto delle soluzioni

Dalla formula risolutiva si ricavano due relazioni molto utili. Se x₁ e x₂ sono le soluzioni di ax² + bx + c = 0, allora

s = x₁ + x₂ = −b/a

p = x₁ · x₂ = c/a

Si possono quindi conoscere somma e prodotto delle soluzioni **senza risolvere l'equazione**. E vale anche il contrario: un'equazione che abbia per soluzioni due numeri di somma s e prodotto p si scrive

x² − sx + p = 0

### Tre usi pratici

**1. Risolvere a mente.** Per x² − 5x + 6 = 0 si cercano due numeri con somma 5 e prodotto 6: sono 2 e 3. Fatto, senza formula.

**2. Trovare due numeri dati somma e prodotto.** Due numeri di somma 7 e prodotto 12 sono le soluzioni di x² − 7x + 12 = 0, cioè 3 e 4.

**3. Scomporre un trinomio di secondo grado.** Se x₁ e x₂ sono le soluzioni di ax² + bx + c = 0, allora

ax² + bx + c = a(x − x₁)(x − x₂)

Esempio: scomporre 2x² + 3x − 2. L'equazione associata 2x² + 3x − 2 = 0 ha Δ = 9 + 16 = 25 e soluzioni x = (−3 ± 5)/4, cioè x₁ = ½ e x₂ = −2. Quindi

2x² + 3x − 2 = 2(x − ½)(x + 2) = (2x − 1)(x + 2)

Se Δ < 0 il trinomio **non è scomponibile** in fattori reali: è il caso di x² − x + 1, di x² + x + 1, e di ogni somma di due quadrati come x² + 1 o x² + 3.

## 15. Due approfondimenti

Queste due cose il docente le ha trattate a lezione. Non compaiono quasi mai nei quiz d'ammissione, ma servono a capire meglio quello che c'è sopra.

### Regola di Cartesio

Permette di conoscere il **segno** delle radici senza calcolarle, quando Δ ≥ 0. Si guardano i segni di a, b e c nell'ordine:

- si ha una **permanenza** se due coefficienti consecutivi hanno lo stesso segno;
- si ha una **variazione** se hanno segno opposto.

A ogni permanenza corrisponde una radice negativa, a ogni variazione una radice positiva.

Esempio: 3x² − 5x − 1 = 0. I segni sono +, −, −: una variazione (da + a −) e una permanenza (da − a −). Quindi una radice positiva e una negativa.

### Equazioni parametriche

Sono equazioni di secondo grado in cui i coefficienti dipendono da un parametro, di solito k. Ogni valore di k dà un'equazione diversa: si sta studiando una **famiglia** di infinite equazioni.

Studiare un'equazione parametrica significa trovare per quali valori di k l'equazione corrispondente ha una certa proprietà. Il metodo è sempre lo stesso: si traduce la richiesta in una condizione algebrica e la si risolve in k.

| richiesta | condizione da imporre |
|---|---|
| soluzioni reali e distinte | Δ > 0 |
| soluzioni reali e coincidenti | Δ = 0 |
| nessuna soluzione reale | Δ < 0 |
| una soluzione nulla | c = 0 (equazione spuria) |
| soluzioni opposte | s = 0, cioè b = 0 |
| soluzioni reciproche | p = 1, cioè a = c |
| somma dei quadrati uguale a q | s² − 2p = q |

Esempio: per quali k l'equazione x² = k + 2 ha due radici reali distinte? È un'equazione pura: x² − (k + 2) = 0 ha due soluzioni opposte quando k + 2 > 0, cioè k > −2.

## 16. Mettiti alla prova

Rispondi senza guardare le soluzioni, poi controlla nella sezione 17.

1. Riduci in forma normale: 5a²b − 3ab² + 2a²b
2. Calcola (−3x²y)³
3. Sviluppa (2a − 3b)²
4. Scomponi 9x² − 25
5. Qual è il resto della divisione (x³ + 2x − 3) : (x − 1)? Il polinomio è divisibile?
6. Risolvi: 3(x − 2) = 5x + 4
7. Determina il dominio e risolvi: 2/(x − 3) = 1
8. Risolvi il sistema: 3x + y = 10 e x − 2y = −6
9. Risolvi: 2x² − 7x + 3 = 0
10. Senza risolverla, di' quante soluzioni reali ha x² − 4x + 7 = 0
11. Due numeri hanno somma 7 e prodotto 12. Quali sono?
12. Discuti al variare di a: (a − 2)x = a² − 4

## 17. Soluzioni

**1.** 5a²b e 2a²b sono simili, perché hanno la stessa parte letterale a²b, e si sommano; −3ab² non è simile a nessuno dei due e resta dove sta. Quindi **7a²b − 3ab²**.

**2.** Esponente a tutto, segno compreso: (−3)³ = −27, e gli esponenti si moltiplicano. **−27x⁶y³**.

**3.** Quadrato del primo, quadrato del secondo, doppio prodotto col segno: **4a² − 12ab + 9b²**.

**4.** È una differenza di quadrati, 9x² = (3x)² e 25 = 5²: **(3x − 5)(3x + 5)**.

**5.** Per il teorema del resto basta calcolare P(1) = 1 + 2 − 3 = **0**. Resto zero, quindi **sì, è divisibile** per (x − 1).

**6.** 3x − 6 = 5x + 4 → 3x − 5x = 4 + 6 → −2x = 10 → **x = −5**.

**7.** Condizione di esistenza: x ≠ 3, quindi D = R − {3}. Moltiplicando per (x − 3): 2 = x − 3 → **x = 5**, che è accettabile perché diverso da 3.

**8.** Dalla prima: y = 10 − 3x. Sostituendo: x − 2(10 − 3x) = −6 → x − 20 + 6x = −6 → 7x = 14 → **x = 2**, e quindi **y = 4**. Verifica: 3·2 + 4 = 10 ✓ e 2 − 8 = −6 ✓.

**9.** Δ = 49 − 24 = 25, √25 = 5. x = (7 ± 5)/4, cioè **x = 3** e **x = ½**.

**10.** Δ = 16 − 28 = −12, negativo: **nessuna soluzione reale**. Non serve calcolare altro.

**11.** Sono le soluzioni di x² − 7x + 12 = 0, cioè **3 e 4**.

**12.** Per ricavare x bisogna dividere per (a − 2), che può valere zero. Se a ≠ 2, allora x = (a² − 4)/(a − 2) = ((a − 2)(a + 2))/(a − 2) = **a + 2**. Se a = 2, l'equazione diventa 0 · x = 0, vera per ogni x: è **indeterminata**.

## Da verificare prima di pubblicare

Note per l'insegnante, non visibili agli studenti.

- **Formule mancanti nelle slide.** Nelle tre presentazioni le formule principali (forma normale, discriminante, formula risolutiva, relazioni somma-prodotto) sono immagini o oggetti equazione: nella conversione il testo non è stato recuperato. Le ho riscritte io nella forma standard. **Da confrontare con le slide proiettate a lezione**, in particolare le formule della sezione 14 e la tabella delle equazioni parametriche (sezione 15), dove nelle slide alcune righe erano solo immagini.
- **Sezione 12, i sistemi, non viene dalle slide.** Nelle tre presentazioni i sistemi non ci sono, ma l'esercitazione del docente ne ha tre domande su quindici, e nessuno studente può rispondere senza averli visti. L'ho scritta da zero sul modello delle domande dell'esercitazione: va riletta con attenzione, ed eventualmente confrontata con quello che è stato detto a lezione.
- **Figure.** Non ne ho importata nessuna: nelle slide sono quasi tutte formule composte, che in questa dispensa sono già scritte come testo. Se a lezione sono stati usati schemi che vale la pena avere (per esempio lo schema della divisione in colonna o il triangolo di Tartaglia disegnato), vanno aggiunti a parte.
- **Materiale escluso.** `GrandezzeFisiche1.ppt` non è stato usato: tratta grandezze fisiche, unità di misura ed errori di misura, cioè l'argomento SF-FIS-01 vero e proprio. È il contenuto naturale della dispensa successiva.
- **Argomenti del docente lasciati fuori.** Dalla presentazione sulle equazioni di secondo grado non ho ripreso per esteso lo studio completo delle equazioni parametriche (gli esempi svolti sulle diapositive 26–29), che sono fuori dal livello richiesto dalla prova: della parte parametrica resta la tabella riassuntiva della sezione 15. Da valutare se reintrodurli.
- **Collegamento con l'esercitazione.** La dispensa rimanda all'esercitazione «Equazioni e sistemi» (14 domande, sezione Fisica). Due riquadri «Attenzione all'esame» (sezioni 10 e 12) si riferiscono esplicitamente a sue domande.
