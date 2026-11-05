import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "TEACHER" | "STUDENT";
      // Il percorso a cui lo studente è bloccato, se lo è (vedi User.trackLocked).
      lockedTrack?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: "TEACHER" | "STUDENT";
    lockedTrack?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "TEACHER" | "STUDENT";
    lockedTrack?: string | null;
  }
}
