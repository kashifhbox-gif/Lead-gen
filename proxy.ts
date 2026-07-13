import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export default async function proxy(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = !!token;
  const path = req.nextUrl.pathname;

  // If user is NOT authenticated, redirect EVERYTHING to /login (except /login itself)
  if (!isAuth && !path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If user IS authenticated, and they visit Login, redirect to /leads
  if (isAuth && path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/leads', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
