import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

export const PORT = process.env.PORT || 4000
export const MONGODB_URI = process.env.MONGODB_URI
export const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

// Email configuration for OTP
export const EMAIL_USER = process.env.EMAIL_USER
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD
export const AUDIT_REMINDER_HOUR = Number(process.env.AUDIT_REMINDER_HOUR || 9)

// Fixed admin credentials (used only for seeding one admin user)
export const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Admin'
export const ADMIN_MOBILE = process.env.ADMIN_MOBILE || '9999999999'
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234'

