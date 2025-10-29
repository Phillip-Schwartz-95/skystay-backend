import dotenv from 'dotenv'
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` })

import { ObjectId } from 'mongodb'
import { dbService } from './services/db.service.js'
import { logger } from './services/logger.service.js'

import { users } from './data/seed/users.js'
import { stays } from './data/seed/stays.js'
import { reviews } from './data/seed/generate-reviews.js'
import { reservations } from './data/seed/reservations.js'
import { stayPhotos } from './data/seed/stayphotos.js'

async function seed() {
    try {
        logger.info('Starting SkyStay data seeding...')

        const userCol = await dbService.getCollection('users')
        const stayCol = await dbService.getCollection('stays')
        const reviewCol = await dbService.getCollection('review')
        const reservationCol = await dbService.getCollection('reservations')
        const stayPhotosCol = await dbService.getCollection('stayphotos')

        // 1. Drop old data
        await Promise.all([
            userCol.deleteMany({}),
            stayCol.deleteMany({}),
            reviewCol.deleteMany({}),
            reservationCol.deleteMany({}),
            stayPhotosCol.deleteMany({})
        ])

        // 2. Create new ObjectIds for everything
        const idMap = {}

        users.forEach(u => {
            const newId = new ObjectId()
            idMap[u._id] = newId
            u._id = newId
        })

        stays.forEach(s => {
            const newId = new ObjectId()
            idMap[s._id] = newId
            s._id = newId

            // Fix host reference
            if (s.host?._id && idMap[s.host._id]) s.host._id = idMap[s.host._id]
        })

        reviews.forEach(r => {
            const newId = new ObjectId()
            idMap[r._id] = newId
            r._id = newId

            // Fix references
            if (r.byUser?._id && idMap[r.byUser._id]) r.byUser._id = idMap[r.byUser._id]
            if (idMap[r.aboutStayId]) r.aboutStayId = idMap[r.aboutStayId]
        })

        reservations.forEach(r => {
            const newId = new ObjectId()
            idMap[r._id] = newId
            r._id = newId

            if (idMap[r.userId]) r.userId = idMap[r.userId]
            if (idMap[r.stayId]) r.stayId = idMap[r.stayId]
        })

        // 3. Insert all data
        await userCol.insertMany(users)
        await stayCol.insertMany(stays)
        await reviewCol.insertMany(reviews)
        await reservationCol.insertMany(reservations)

        // 4. Insert stay photos
        for (const [stayKey, photos] of Object.entries(stayPhotos)) {
            const mappedStayId = idMap[stayKey]
            if (mappedStayId)
                await stayPhotosCol.insertOne({ stayId: mappedStayId, photos })
        }

        logger.info('Seeding complete — all new ObjectIds assigned!')
        process.exit(0)
    } catch (err) {
        logger.error('Failed seeding data:', err)
        process.exit(1)
    }
}

seed()
