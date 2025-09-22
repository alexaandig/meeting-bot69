export function getAttendeeList(attendees: any): string[] {
    if (!attendees) {
        return []
    }

    try {
        const parsed = JSON.parse(String(attendees))
        if (Array.isArray(parsed)) {
            return parsed.map(item => {
                if (typeof item === 'object' && item !== null && 'email' in item) {
                    return String(item.email).trim()
                }
                return String(item).trim()
            })
        }
        if (typeof parsed === 'object' && parsed !== null && 'email' in parsed) {
            return [String(parsed.email).trim()]
        }
        return [String(parsed).trim()]
    } catch {
        const attendeeString = String(attendees)
        return attendeeString.split(',').map(name => name.trim()).filter(Boolean)
    }
}
