import { config } from './config/index.js'
console.log('Loaded config:', config)

const nodeEnv = process.env.NODE_ENV || 'development'
const envFile = nodeEnv === 'production' ? '.env.production' : '.env.development'

console.log(`Loaded env file: ${envFile}`)
console.log('NODE_ENV:', nodeEnv)
console.log('DB URL:', process.env.MONGO_URL)

import { dbService } from './services/db.service.js'
import { logger } from './services/logger.service.js'

import { users } from './data/seed/users.js'
import { stays } from './data/seed/stays.js'
import { reviews } from './data/seed/reviews.js'
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

        // USERS
        for (const user of users) {
            await userCol.updateOne({ _id: user._id }, { $setOnInsert: user }, { upsert: true })
        }
        logger.info(`Users inserted or already existed: ${users.length}`)

        // STAYS
        for (const stay of stays) {
            await stayCol.updateOne({ _id: stay._id }, { $setOnInsert: stay }, { upsert: true })
        }
        logger.info(`Stays inserted or already existed: ${stays.length}`)

        // REVIEWS
        for (const review of reviews) {
            await reviewCol.updateOne({ _id: review._id }, { $setOnInsert: review }, { upsert: true })
        }
        logger.info(`Reviews inserted or already existed: ${reviews.length}`)

        // RESERVATIONS
        for (const reservation of reservations) {
            await reservationCol.updateOne({ _id: reservation._id }, { $setOnInsert: reservation }, { upsert: true })
        }
        logger.info(`Reservations inserted or already existed: ${reservations.length}`)

        // STAY PHOTOS
        for (const [stayId, photos] of Object.entries(stayPhotos)) {
            await stayPhotosCol.updateOne({ stayId }, { $setOnInsert: { stayId, photos } }, { upsert: true })
        }
        logger.info(`Stay photos inserted or already existed: ${Object.keys(stayPhotos).length}`)

        logger.info('Seeding complete')
        process.exit(0)
    } catch (err) {
        logger.error('Failed seeding data', err)
        process.exit(1)
    }
}

seed()

