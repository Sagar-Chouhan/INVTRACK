import { IssuedStock } from '../models/IssuedStock.js'

const DAY_MS = 24 * 60 * 60 * 1000

function buildDeadline(issue) {
  const createdAt = issue.created_at || issue._id?.getTimestamp?.() || new Date()
  return new Date(createdAt.getTime() + 30 * DAY_MS)
}

export async function backfillLegacyAuditIssues() {
  try {
    const legacyIssues = await IssuedStock.find({
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: 'pending' },
        { verification_deadline: { $exists: false } },
        { verification_deadline: null },
      ],
    }).select('_id status created_at verification_deadline')

    if (!legacyIssues.length) {
      console.log('Audit backfill: no legacy records found.')
      return
    }

    const operations = legacyIssues
      .map((issue) => {
        const updates = {}

        if (!issue.status || issue.status === 'pending') {
          updates.status = 'pending-audit'
        }

        if (!issue.verification_deadline) {
          updates.verification_deadline = buildDeadline(issue)
        }

        if (Object.keys(updates).length === 0) return null

        return {
          updateOne: {
            filter: { _id: issue._id },
            update: { $set: updates },
          },
        }
      })
      .filter(Boolean)

    if (!operations.length) {
      console.log('Audit backfill: no updates required.')
      return
    }

    const result = await IssuedStock.bulkWrite(operations)
    const updated = (result.modifiedCount || 0) + (result.upsertedCount || 0)
    console.log(`Audit backfill completed. Updated ${updated} legacy issue record(s).`)
  } catch (error) {
    console.error('Audit backfill failed:', error.message)
  }
}
