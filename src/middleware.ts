import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Se o usuário logado for JUIZ, restringir certas rotas de administração
    if (token?.role === "JUIZ") {
      const allowedPaths = ["/admin", "/admin/execucao", "/admin/ranking"];
      const isAllowed = allowedPaths.some(path => pathname === path || pathname.startsWith("/admin/execucao") || pathname.startsWith("/admin/ranking"));
      
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/admin/execucao", req.url));
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
  matcher: ["/admin/:path*"],
};
