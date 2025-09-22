import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "not authed" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: {
                clerkId: userId
            }
        })

        if (!user) {
            return NextResponse.json({ error: "user not found" }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const workspaceId = searchParams.get('orgId')

        const whereClause: any = {
            userId: user.id,
            meetingEnded: true
        }

        if (workspaceId) {
            const workspace = await prisma.workspace.findUnique({
                where: {
                    clerkOrgId: workspaceId
                }
            })
            if (workspace) {
                whereClause.workspaceId = workspace.id
            }
        }

        const pastMeetings = await prisma.meeting.findMany({
            where: whereClause,
            orderBy: {
                endTime: 'desc'
            },
            take: 10
        })

        return NextResponse.json({ meetings: pastMeetings })

    } catch (error) {
        return NextResponse.json({ error: 'failed to fetch past meetings', meetings: [] }, { status: 500 })
    }
}