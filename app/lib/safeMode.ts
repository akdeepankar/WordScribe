
export const SENSITIVE_TYPES = [
    "credit_card", "credit_card_number", "card_number",
    "dob", "date_of_birth", "birth_date",
    "phone_number", "phone",
    "ssn", "social_security_number",
    "passport_number", "passport",
    "email", "email_address",
    "address", "location_address",
    "person_name"
];

export function maskText(text: string, entities: any[]): string {
    if (!text || !entities) return text;

    // Filter sensitive entities
    const sensitive = entities.filter(e =>
        // Check if type exists and is in sensitive list
        e.entity_type && SENSITIVE_TYPES.includes(e.entity_type.toLowerCase())
    );

    if (sensitive.length === 0) return text;

    let masked = text;

    // Sort by length desc to replace longest matches first (avoids partial replacements)
    sensitive.sort((a, b) => (b.text?.length || 0) - (a.text?.length || 0));

    for (const ent of sensitive) {
        if (ent.text && ent.text.length > 2) {
            try {
                // Escape regex special characters
                const escaped = ent.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Replace spaces with flexible whitespace/separator matcher to catch formatted numbers
                // e.g. "1234 5678" matches "12345678" or "1234-5678"
                const pattern = escaped.replace(/\s+/g, '[\\s\\W]*');

                // global, case-insensitive
                const regex = new RegExp(pattern, 'gi');
                masked = masked.replace(regex, "••••");
            } catch (e) {
                // Fallback to simple split/join
                masked = masked.split(ent.text).join("••••");
            }
        }
    }

    return masked;
}
