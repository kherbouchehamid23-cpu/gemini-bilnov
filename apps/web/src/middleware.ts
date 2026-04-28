import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware d'authentification Edge
 * Protège toutes les routes /(app)/* sans cold start
 * Vérifie la présence du token JWT (pas sa validité — cela se fait côté API)
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Routes publiques — pas de vérification
  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
  const isCodeAccess = pathname.startsWith('/code/');
  const isTourPublic = pathname.startsWith('/tour/');
  const isApiRoute = pathname.startsWith('/api/');

  if (isPublicPath || isCodeAccess || isTourPublic || isApiRoute || pathname === '/') {
    return NextResponse.next();
  }

  // Routes protégées — vérifier le token dans les cookies ou localStorage
  // En edge, on vérifie juste la présence du cookie de session
  const refreshToken = request.cookies.get('refresh_token');
  const authPersist = request.cookies.get('bilnov-auth');

  const isAuthenticated = !!refreshToken || !!authPersist;

  if (!isAuthenticated && pathname.startsWith('/dashboard') || !isAuthenticated && pathname.startsWith('/projects')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};
