import { ObjectId } from 'mongodb'

import { asyncLocalStorage } from '../../services/als.service.js'
import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'

export const reviewService = { query, remove, add }

async function query(filterBy = {}) {
    try {
        const collection = await dbService.getCollection('review')
        const criteria = _buildCriteria(filterBy)

        // Check if this is stay-based or user-based
        const pipeline = [{ $match: criteria }]

        if (filterBy.aboutStayId) {
            // Stay-based review (from stays collection)
            pipeline.push({
                $lookup: {
                    from: 'stays',
                    localField: 'aboutStayId',
                    foreignField: '_id',
                    as: 'aboutStay'
                }
            })
            pipeline.push({ $unwind: { path: '$aboutStay', preserveNullAndEmptyArrays: true } })
        } else {
            // User-based review (legacy)
            pipeline.push({
                $lookup: {
                    from: 'user',
                    localField: 'byUserId',
                    foreignField: '_id',
                    as: 'byUser'
                }
            })
            pipeline.push({ $unwind: { path: '$byUser', preserveNullAndEmptyArrays: true } })
            pipeline.push({
                $lookup: {
                    from: 'user',
                    localField: 'aboutUserId',
                    foreignField: '_id',
                    as: 'aboutUser'
                }
            })
            pipeline.push({ $unwind: { path: '$aboutUser', preserveNullAndEmptyArrays: true } })
        }

        const reviews = await collection.aggregate(pipeline).toArray()
        return reviews
    } catch (err) {
        logger.error('cannot get reviews', err)
        throw err
    }
}

async function remove(reviewId) {
    try {
        const { loggedinUser } = asyncLocalStorage.getStore()
        const collection = await dbService.getCollection('review')

        const criteria = { _id: ObjectId.createFromHexString(reviewId) }

        // remove only if user is owner/admin
        if (!loggedinUser.isAdmin) {
            criteria.byUserId = ObjectId.createFromHexString(loggedinUser._id)
        }

        const { deletedCount } = await collection.deleteOne(criteria)
        return deletedCount
    } catch (err) {
        logger.error(`cannot remove review ${reviewId}`, err)
        throw err
    }
}

async function add(review) {
    try {
        const reviewToAdd = {
            byUserId: ObjectId.createFromHexString(review.byUserId),
            aboutUserId: ObjectId.createFromHexString(review.aboutUserId),
            txt: review.txt,
        }
        const collection = await dbService.getCollection('review')
        await collection.insertOne(reviewToAdd)

        return reviewToAdd
    } catch (err) {
        logger.error('cannot add review', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
  const criteria = {}

  if (filterBy.byUserId) {
    try {
      criteria.byUserId = new ObjectId(filterBy.byUserId)
    } catch {
      criteria.byUserId = filterBy.byUserId
    }
  }

  if (filterBy.aboutStayId) {
    try {
      criteria.aboutStayId = new ObjectId(filterBy.aboutStayId)
    } catch {
      criteria.aboutStayId = filterBy.aboutStayId
    }
  }

  if (filterBy.aboutUserId) {
    try {
      criteria.aboutUserId = new ObjectId(filterBy.aboutUserId)
    } catch {
      criteria.aboutUserId = filterBy.aboutUserId
    }
  }

  return criteria
}
