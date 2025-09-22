import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from 'svix'

export async function POST(request: NextRequest) {
    try {
        const payload = await request.text()
        const headers = {
            'svix-id': request.headers.get('svix-id') || '',
            'svix-timestamp': request.headers.get('svix-timestamp') || '',
            'svix-signature': request.headers.get('svix-signature') || '',
        }

        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
        if (webhookSecret) {
            const wh = new Webhook(webhookSecret)
            try {
                wh.verify(payload, headers)
            } catch (err) {
                return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 })
            }
        }

        const event = JSON.parse(payload)
        console.log('clerk webhook received', event.type)

        const eventType = event.type

        if (eventType === 'user.created') {
            const { id, email_addresses, first_name, last_name } = event.data
            const primaryEmail = email_addresses?.find((email: any) =>
                email.id === event.data.primary_email_address_id
            )?.email_address

            await prisma.user.create({
                data: {
                    id: id,
                    clerkId: id,
                    email: primaryEmail || null,
                    name: `${first_name} ${last_name}`
                }
            })
        } else if (eventType === 'organization.created') {
            const { id, name } = event.data
            await prisma.workspace.create({
                data: {
                    clerkOrgId: id,
                    name: name,
                }
            })
        } else if (eventType === 'organization.updated') {
            const { id, name } = event.data
            await prisma.workspace.update({
                where: { clerkOrgId: id },
                data: { name: name }
            })
        } else if (eventType === 'organization.deleted') {
            const { id } = event.data
            await prisma.workspace.delete({
                where: { clerkOrgId: id }
            })
        } else if (eventType === 'organizationMembership.created') {
            const { organization, public_user_data, role } = event.data
            const workspace = await prisma.workspace.findUnique({
                where: { clerkOrgId: organization.id }
            })
            if (workspace) {
                await prisma.workspaceUser.create({
                    data: {
                        workspaceId: workspace.id,
                        userId: public_user_data.user_id,
                        role: role === 'org:admin' ? 'ADMIN' : 'MEMBER'
                    }
                })
            }
        } else if (eventType === 'organizationMembership.deleted') {
            const { organization, public_user_data } = event.data
            const workspace = await prisma.workspace.findUnique({
                where: { clerkOrgId: organization.id }
            })
            if (workspace) {
                await prisma.workspaceUser.delete({
                    where: {
                        userId_workspaceId: {
                            userId: public_user_data.user_id,
                            workspaceId: workspace.id
                        }
                    }
                })
            }
        } else if (eventType === 'organizationMembership.updated') {
            const { organization, public_user_data, role } = event.data
            const workspace = await prisma.workspace.findUnique({
                where: { clerkOrgId: organization.id }
            })
            if (workspace) {
                await prisma.workspaceUser.update({
                    where: {
                        userId_workspaceId: {
                            userId: public_user_data.user_id,
                            workspaceId: workspace.id
                        }
                    },
                    data: {
                        role: role === 'org:admin' ? 'ADMIN' : 'MEMBER'
                    }
                })
            }
        }

        return NextResponse.json({ message: 'webhook received' })
    } catch (error) {
        console.error('webhook error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}