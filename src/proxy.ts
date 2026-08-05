import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthPage = pathname === "/login";
  const isTeacherPage = pathname.startsWith("/teacher");
  const isStudentPage = pathname.startsWith("/student");

  if (!session && (isTeacherPage || isStudentPage)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && isAuthPage) {
    const dest = session.user.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (session && isTeacherPage && session.user.role !== "TEACHER") {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  if (session && isStudentPage && session.user.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
