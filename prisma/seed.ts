import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function upsertUser(name: string, email: string, password: string, role: "TEACHER" | "STUDENT") {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role },
    create: { name, email, passwordHash, role },
  });
}

async function main() {
  const teacherEmail = process.env.TEACHER_EMAIL ?? "insegnante@example.com";
  const teacherPassword = process.env.TEACHER_PASSWORD ?? "cambiami123";
  const teacherName = process.env.TEACHER_NAME ?? "Insegnante";

  const teacher = await upsertUser(teacherName, teacherEmail, teacherPassword, "TEACHER");
  console.log(`Insegnante pronto: ${teacher.email}`);

  const students = await Promise.all([
    upsertUser("Studente Uno", "studente1@example.com", "studente123", "STUDENT"),
    upsertUser("Studente Due", "studente2@example.com", "studente123", "STUDENT"),
    upsertUser("Studente Tre", "studente3@example.com", "studente123", "STUDENT"),
  ]);
  console.log(`Studenti pronti: ${students.map((s) => s.email).join(", ")}`);

  const existingTest = await prisma.test.findFirst({
    where: { title: "Simulazione di Prova - Ammissione Professioni Sanitarie" },
  });

  if (existingTest) {
    console.log("Test di esempio gia presente, salto la creazione.");
  } else {
    const test = await prisma.test.create({
      data: {
        title: "Simulazione di Prova - Ammissione Professioni Sanitarie",
        description: "Test di esempio con domande miste per verificare il funzionamento della piattaforma.",
        createdById: teacher.id,
        isPublished: true,
        questions: {
          create: [
            {
              type: "MULTIPLE_CHOICE",
              subject: "Biologia",
              text: "Quale organello cellulare è responsabile della produzione di energia (ATP)?",
              order: 1,
              options: {
                create: [
                  { text: "Mitocondrio", isCorrect: true, order: 1 },
                  { text: "Ribosoma", isCorrect: false, order: 2 },
                  { text: "Apparato di Golgi", isCorrect: false, order: 3 },
                  { text: "Lisosoma", isCorrect: false, order: 4 },
                ],
              },
            },
            {
              type: "TRUE_FALSE",
              subject: "Biologia",
              text: "Il DNA si trova esclusivamente nel nucleo della cellula.",
              order: 2,
              options: {
                create: [
                  { text: "Vero", isCorrect: false, order: 1 },
                  { text: "Falso", isCorrect: true, order: 2 },
                ],
              },
            },
            {
              type: "MULTIPLE_CHOICE",
              subject: "Chimica",
              text: "Qual è il numero atomico dell'ossigeno?",
              order: 3,
              options: {
                create: [
                  { text: "6", isCorrect: false, order: 1 },
                  { text: "8", isCorrect: true, order: 2 },
                  { text: "16", isCorrect: false, order: 3 },
                  { text: "12", isCorrect: false, order: 4 },
                ],
              },
            },
            {
              type: "TRUE_FALSE",
              subject: "Chimica",
              text: "Un acido ha pH maggiore di 7.",
              order: 4,
              options: {
                create: [
                  { text: "Vero", isCorrect: false, order: 1 },
                  { text: "Falso", isCorrect: true, order: 2 },
                ],
              },
            },
            {
              type: "MULTIPLE_CHOICE",
              subject: "Logica",
              text: "Se tutti i gatti sono mammiferi e Argo è un gatto, allora:",
              order: 5,
              options: {
                create: [
                  { text: "Argo è un mammifero", isCorrect: true, order: 1 },
                  { text: "Argo non è un mammifero", isCorrect: false, order: 2 },
                  { text: "Non si può stabilire", isCorrect: false, order: 3 },
                  { text: "Argo è un cane", isCorrect: false, order: 4 },
                ],
              },
            },
            {
              type: "MULTIPLE_CHOICE",
              subject: "Cultura Generale",
              text: "Quanti sono i continenti sulla Terra?",
              order: 6,
              options: {
                create: [
                  { text: "5", isCorrect: false, order: 1 },
                  { text: "6", isCorrect: false, order: 2 },
                  { text: "7", isCorrect: true, order: 3 },
                  { text: "8", isCorrect: false, order: 4 },
                ],
              },
            },
          ],
        },
      },
    });
    console.log(`Test di esempio creato: ${test.title}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
