import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Se o usuário logado for JUIZ, redirecionar para o painel dedicado
    if (token?.role === "JUIZ") {
      // Permitir acesso ao painel do juiz e APIs do juiz
      if (pathname.startsWith("/juiz") || pathname.startsWith("/api/juiz")) {
        return NextResponse.next();
      }
      
      // Redirecionar qualquer acesso admin para o painel do juiz
      if (pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/juiz/dashboard", req.url));
      }
    }

    // Se o usuário for COMENTARISTA, bloquear configurações e lançamento de notas
    if (token?.role === "COMENTARISTA") {
      const blockedPaths = ["/admin/configuracoes", "/admin/execucao", "/admin/super"];
      const isBlocked = blockedPaths.some(path => pathname === path || pathname.startsWith(path));
      
      if (isBlocked) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/juiz/:path*"],
};

