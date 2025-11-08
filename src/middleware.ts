import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Middleware simplificado - não gerencia locale
  // O idioma será gerenciado 100% no client-side
  return NextResponse.next()
}

export const config = {
  // Aplica middleware em todas as rotas exceto _next, api, etc
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
