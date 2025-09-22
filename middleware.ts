import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
    '/',
    '/home(.*)',
    '/meeting(.*)',
    '/integrations(.*)',
    '/chat(.*)',
    '/settings(.*)',
    '/workspace(.*)',
])

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/select-org(.*)',
    '/api/webhooks/clerk',
    '/api/webhooks/stripe',
])

export default clerkMiddleware((auth, req) => {
    if (isPublicRoute(req)) {
        return NextResponse.next()
    }

    const { userId, orgId, sessionClaims } = auth()

    if (!userId && isProtectedRoute(req)) {
        return auth().redirectToSignIn()
    }

    if (userId && !orgId && req.nextUrl.pathname !== '/select-org') {
        const selectOrgUrl = new URL('/select-org', req.url)
        return NextResponse.redirect(selectOrgUrl)
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}