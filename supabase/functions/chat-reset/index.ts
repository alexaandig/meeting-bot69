import { PrismaClient } from 'https://esm.sh/@prisma/client'
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const prisma = new PrismaClient()

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const result = await prisma.user.updateMany({
      where: {
        subscriptionStatus: 'active'
      },
      data: {
        chatMessagesToday: 0
      }
    })

    return new Response(JSON.stringify({
      message: 'daily chat reset completed successfully',
      usersReset: result.count,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('chat reset error:', error)
    return new Response(JSON.stringify({
      error: 'failed to reset the chat messages',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  } finally {
    await prisma.$disconnect()
  }
})
