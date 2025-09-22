import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from '@prisma/client'
import { getAttendeeList } from "@/lib/attendees";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
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
        const searchTerm = searchParams.get('search')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const duration = searchParams.get('duration')
        const participant = searchParams.get('participant')

        const whereClauses: Prisma.Sql[] = [Prisma.sql`"userId" = ${user.id}`, Prisma.sql`"meetingEnded" = true`]

        if (workspaceId) {
            const workspace = await prisma.workspace.findUnique({ where: { clerkOrgId: workspaceId } })
            if (workspace) {
                whereClauses.push(Prisma.sql`"workspaceId" = ${workspace.id}`)
            }
        }

        if (searchTerm) {
            whereClauses.push(Prisma.sql`"title" ILIKE ${'%' + searchTerm + '%'}`)
        }

        if (startDate) {
            whereClauses.push(Prisma.sql`"startTime" >= ${new Date(startDate)}`)
        }

        if (endDate) {
            whereClauses.push(Prisma.sql`"endTime" <= ${new Date(endDate)}`)
        }

        if (duration) {
            let minDuration = 0;
            let maxDuration = Infinity;

            switch (duration) {
                case '30':
                    maxDuration = 30 * 60; // in seconds
                    break;
                case '60':
                    minDuration = 30 * 60;
                    maxDuration = 60 * 60;
                    break;
                case '61':
                    minDuration = 60 * 60;
                    break;
            }

            if (maxDuration !== Infinity) {
                whereClauses.push(Prisma.sql`EXTRACT(EPOCH FROM ("endTime" - "startTime")) < ${maxDuration}`)
            }
            if (minDuration > 0) {
                whereClauses.push(Prisma.sql`EXTRACT(EPOCH FROM ("endTime" - "startTime")) >= ${minDuration}`)
            }
        }

        const where = Prisma.join(whereClauses, ' AND ')

        let pastMeetings: any[] = await prisma.$queryRaw`SELECT * FROM "Meeting" WHERE ${where} ORDER BY "endTime" DESC LIMIT 50`

        if (participant) {
            pastMeetings = pastMeetings.filter(meeting => {
                const attendees = getAttendeeList(meeting.attendees)
                return attendees.some(attendee => attendee.toLowerCase().includes(participant.toLowerCase()))
            })
        }

        return NextResponse.json({ meetings: pastMeetings })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'failed to fetch past meetings', meetings: [] }, { status: 500 })
    }
}