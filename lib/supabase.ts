import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function saveManyVectors(vectors: Array<{
    id: string
    embedding: number[]
    content: string
    metadata: any
}>) {
    const documents = vectors.map(v => ({
        content: v.content,
        metadata: v.metadata,
        embedding: v.embedding,
    }))

    const { error } = await supabase.from('documents').insert(documents)

    if (error) {
        console.error('error saving vectors:', error)
        throw error
    }
}

export async function searchVectors(
    embedding: number[],
    filter: any = {},
    topK: number = 5
) {
    const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_count: topK,
    })

    if (error) {
        console.error('error searching vectors:', error)
        throw error
    }

    return data.map((d: any) => ({
        ...d,
        metadata: d.metadata,
        score: d.similarity
    }))
}
