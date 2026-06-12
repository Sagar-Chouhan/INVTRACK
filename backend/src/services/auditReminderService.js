import { IssuedStock } from '../models/IssuedStock.js'
import { User } from '../models/User.js'
import { sendAuditReminderEmail } from '../utils/notifications.js'
import { AUDIT_REMINDER_HOUR } from '../config.js'

const DAY_MS = 24 * 60 * 60 * 1000
const REMINDER_HOUR = AUDIT_REMINDER_HOUR

function isSameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

async function sendPendingAuditReminders() {
  try {
    const now = new Date()
    const pendingIssues = await IssuedStock.find({ status: 'pending-audit' })
      .populate({ path: 'stock_id', populate: { path: 'category_id' } })

    if (!pendingIssues.length) {
      return
    }

    const auditors = await User.find({ role: 'auditor' })
      .select('full_name email assigned_categories last_audit_reminder_sent_at')

    for (const auditor of auditors) {
      if (!auditor.email) continue
      if (auditor.last_audit_reminder_sent_at && isSameDay(auditor.last_audit_reminder_sent_at, now)) {
        continue
      }

      const assigned = (auditor.assigned_categories || []).map((id) => id.toString())
      if (!assigned.length) continue

      const matchingIssues = pendingIssues.filter((issue) => {
        const categoryId = issue.stock_id?.category_id?._id?.toString()
        return !!categoryId && assigned.includes(categoryId)
      })

      if (!matchingIssues.length) continue

      const pendingItems = matchingIssues.map((issue) => {
        const diffMs = issue.verification_deadline.getTime() - now.getTime()
        const daysRemaining = Math.ceil(diffMs / DAY_MS)
        return {
          productName: issue.stock_id?.product_name || 'Product',
          categoryName: issue.stock_id?.category_id?.name || 'Category',
          recipientName: issue.recipient_name,
          issuedQty: issue.issued_qty,
          verification_deadline: issue.verification_deadline,
          daysRemaining,
        }
      })

      const result = await sendAuditReminderEmail({
        to: auditor.email,
        auditorName: auditor.full_name,
        pendingItems,
      })

      if (result.success) {
        auditor.last_audit_reminder_sent_at = now
        await auditor.save()
      }
    }
  } catch (error) {
    console.error('Audit reminder job failed:', error.message)
  }
}

export function startAuditReminderScheduler() {
  // Run once shortly after server starts.
  setTimeout(() => {
    sendPendingAuditReminders()
  }, 15 * 1000)

  const now = new Date()
  const nextRun = new Date(now)
  nextRun.setHours(REMINDER_HOUR, 0, 0, 0)
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1)
  }

  const initialDelay = nextRun.getTime() - now.getTime()

  setTimeout(() => {
    sendPendingAuditReminders()
    setInterval(sendPendingAuditReminders, DAY_MS)
  }, initialDelay)

  console.log(`Audit reminder scheduler started. Daily reminders at ${REMINDER_HOUR}:00 server time.`)
}
