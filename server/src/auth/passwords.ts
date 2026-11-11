import bycrpt from 'bcryptjs'

const COST = 12

export function hashPassword(password: string): Promise<string> {
    return bycrpt.hash(password, COST)
}

export function verifyPassword(password: string, hash: string) : Promise<boolean> {
    return bycrpt.compare(password, hash)
}