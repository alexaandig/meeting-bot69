import { prisma } from "@/lib/db";
import { getNotionDatabases } from "@/lib/integrations/notion/notion";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    try {
        const integration = await prisma.userIntegration.findUnique({
            where: {
                userId_platform: {
                    userId,
                    platform: 'notion'
                }
            }
        })

        if (!integration) {
            return NextResponse.json({ error: "notion integration not found" }, { status: 404 })
        }

        const databases = await getNotionDatabases(integration.accessToken)
        return NextResponse.json(databases)

    } catch (error) {
        console.error('error fetching notion setup data:', error)
        return NextResponse.json({ error: 'failed to fetch setup data' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const { userId } = await auth()
    const { databaseId, databaseName } = await request.json()

    if (!userId) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    if (!databaseId || !databaseName) {
        return NextResponse.json({ error: "missing database id or name" }, { status: 400 })
    }

    try {
        await prisma.userIntegration.update({
            where: {
                userId_platform: {
                    userId,
                    platform: 'notion'
                }
            },
            data: {
                boardId: databaseId,
                boardName: databaseName
            }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('error saving notion setup:', error)
        return NextResponse.json({ error: 'failed to save setup' }, { status: 500 })
    }
}
