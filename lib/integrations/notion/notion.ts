export async function getNotionDatabases(accessToken: string) {
    const response = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filter: {
                property: 'object',
                value: 'database'
            }
        })
    })

    const data = await response.json()

    if (!response.ok) {
        console.error('Notion API error:', data)
        throw new Error('Failed to fetch Notion databases')
    }

    const databases = data.results.map((db: any) => ({
        id: db.id,
        name: db.title[0]?.plain_text || 'Untitled'
    }))

    return databases
}

export async function createNotionPage(accessToken: string, databaseId: string, title: string, content: any) {
    const titleProperty = await getNotionDatabaseTitleProperty(accessToken, databaseId)

    const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            parent: { database_id: databaseId },
            properties: {
                [titleProperty]: {
                    title: [
                        {
                            text: {
                                content: title
                            }
                        }
                    ]
                }
            },
            children: content
        })
    })

    const data = await response.json()

    if (!response.ok) {
        console.error('Notion API error:', data)
        throw new Error('Failed to create Notion page')
    }

    return data
}

async function getNotionDatabaseTitleProperty(accessToken: string, databaseId: string) {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Notion-Version': '2022-06-28'
        }
    })
    const db = await response.json()
    if (!response.ok) {
        console.error('Notion API error:', db)
        throw new Error('Failed to retrieve Notion database')
    }

    for (const propName in db.properties) {
        if (db.properties[propName].type === 'title') {
            return propName
        }
    }

    throw new Error('Could not find title property in Notion database')
}


export async function createNotionActionItem(accessToken: string, databaseId: string, actionItem: {
    title: string,
    assignee?: string,
    dueDate?: string
}) {
    const content = [
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            content: `Assignee: ${actionItem.assignee || 'Not assigned'}`
                        }
                    }
                ]
            }
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            content: `Due Date: ${actionItem.dueDate || 'Not set'}`
                        }
                    }
                ]
            }
        }
    ]
    return createNotionPage(accessToken, databaseId, actionItem.title, content)
}
