import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const TOKEN_SECRET = new TextEncoder().encode(process.env.TOKEN_SECRET!);
const ACCESS_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || process.env.TOKEN_SECRET!);

async function tryVerify(token: string, secret: Uint8Array) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isPublicPath = ['/login', '/admin/login'].includes(path);

    const accessToken = request.cookies.get('access_token')?.value;
    const legacyToken = request.cookies.get('token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    const payload =
        (accessToken ? await tryVerify(accessToken, ACCESS_SECRET) : null) ??
        (legacyToken ? await tryVerify(legacyToken, TOKEN_SECRET) : null);

    
    // Middleware logic:
    const hasRefreshSession = !!refreshToken;

    if (isPublicPath) {
        if (payload?.role) {
            const redirectPath = payload.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
            return NextResponse.redirect(new URL(redirectPath, request.url));
        }
        return NextResponse.next();
    }

    // No tokens at all → redirect to login
    if (!payload && !hasRefreshSession) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // ✅ FIX: Access token expire, refresh valid — let client handle refresh
    if (!payload && hasRefreshSession) {
        return NextResponse.next();
    }

    // Role check — but only if we have a verified payload
    if (payload) {
        const wrongRole =
            (path.startsWith('/admin') && payload.role !== 'admin') ||
            (path.startsWith('/user') && payload.role !== 'user');

        if (wrongRole) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/user/:path*', '/login', '/admin/login'],
};