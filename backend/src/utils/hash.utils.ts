import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SALT_ROUNDS = 12

async function hashPassword(password: string): Promise<string> {
return bcrypt.hash(password, SALT_ROUNDS)
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
return bcrypt.compare(password, hash)
}

function generateRefreshToken(): string {
return crypto.randomBytes(64).toString('hex')
}

function hashRefreshToken(token: string): string {
return crypto.createHash('sha256').update(token).digest('hex')
}

export { hashPassword, comparePassword, generateRefreshToken, hashRefreshToken }