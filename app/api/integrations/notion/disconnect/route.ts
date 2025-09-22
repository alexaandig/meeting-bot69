import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    try {
        await prisma.userIntegration.delete({
            where: {
                userId_platform: {
                    userId,
                    platform: 'notion'
                }
            }
        })
        return NextResponse.json({ success: true })
    }
    catch (error) {
        console.error('error disconnecting notion integration:', error)
        return NextResponse.json({ error: 'failed to disconnect' }, { status: 500 })
    }
}
