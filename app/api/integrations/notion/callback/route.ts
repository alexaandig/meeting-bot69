import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { userId } = await auth()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!userId) {
        return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL))
    }

    if (!code) {
        return NextResponse.redirect(new URL('/integrations?error=notion_auth_failed', process.env.NEXT_PUBLIC_APP_URL))
    }

    const clientId = process.env.NOTION_CLIENT_ID
    const clientSecret = process.env.NOTION_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    try {
        const response = await fetch('https://api.notion.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Notion OAuth error:', data)
            return NextResponse.redirect(new URL('/integrations?error=notion_auth_failed', process.env.NEXT_PUBLIC_APP_URL))
        }

        await prisma.userIntegration.upsert({
            where: {
                userId_platform: {
                    userId,
                    platform: 'notion'
                }
            },
            update: {
                accessToken: data.access_token,
                updatedAt: new Date()
            },
            create: {
                userId,
                platform: 'notion',
                accessToken: data.access_token
            }
        })

        return NextResponse.redirect(new URL('/integrations?success=notion_connected&setup=notion', process.env.NEXT_PUBLIC_APP_URL))

    } catch (error) {
        console.error('Error during Notion OAuth callback:', error)
        return NextResponse.redirect(new URL('/integrations?error=notion_auth_failed', process.env.NEXT_PUBLIC_APP_URL))
    }
}
