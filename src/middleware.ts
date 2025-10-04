import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar se é uma rota de organização (formato /[org] ou /[org]/...)
  const orgPathMatch = pathname.match(/^\/([^\/]+)(?:\/.*)?$/)
  
  if (orgPathMatch) {
    const orgSlug = orgPathMatch[1]
    
    // Páginas que não precisam de autenticação
    const publicPages = [
      '/',
      '/login',
      '/register',
      '/debug'
    ]
    
    // Se for uma página pública, permitir acesso
    if (publicPages.includes(pathname)) {
      return NextResponse.next()
    }
    
    // Se for a página de login da organização, permitir acesso
    if (pathname === `/${orgSlug}/login`) {
      return NextResponse.next()
    }
    
    // Para todas as outras páginas de organização, verificar autenticação
    // Como não podemos acessar localStorage no middleware, vamos redirecionar
    // e deixar o cliente verificar a autenticação
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
