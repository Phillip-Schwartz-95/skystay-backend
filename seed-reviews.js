import dotenv from 'dotenv'
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` })

import { ObjectId } from 'mongodb'
import { dbService } from './services/db.service.js'
import { logger } from './services/logger.service.js'
import { users } from './data/seed/users.js'

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
    return arr[rand(0, arr.length - 1)]
}

const REVIEW_TEXTS = [
    "Perfect location, loved the view!",
    "Very comfortable and clean, would book again.",
    "Loved the beach vibes and the host was super friendly.",
    "Cozy and quiet — slept like a baby.",
    "Spotless and stylish. 10/10.",
    "Photos don’t do it justice. Amazing.",
    "Great Wi-Fi for work, would return.",
    "Walkable to everything. Host was helpful.",
    "A little noisy at night, but overall great.",
    "Fantastic value. Super comfortable bed.",
    "Host went above and beyond, thank you!",
    "Great for families — plenty of space.",
    "Exactly as described. Would stay again.",
    "Modern, clean, and beautifully decorated.",
    "Sunsets from the balcony were unreal!",
    "The kitchen was fully stocked — super convenient.",
    "Quick responses from the host. A+ service.",
    "Really felt like home — super cozy!",
    "The pool and view were absolutely stunning.",
    "Quiet neighborhood, easy parking."
]

async function seedReviews() {
    try {
        logger.info('Starting review-only seeding...')

        const reviewCol = await dbService.getCollection('review')
        const stayCol = await dbService.getCollection('stays')

        // Fetch real stays from DB
        const stays = await stayCol.find({}).toArray()
        logger.info(`Found ${stays.length} stays in DB.`)

        // Clear old reviews
        await reviewCol.deleteMany({})
        logger.info('Old reviews deleted.')

        const reviews = []

        stays.forEach(stay => {
            const count = rand(1, 3)
            for (let i = 0; i < count; i++) {
                const reviewer = pick(users)

                // Ensure every ID is a real ObjectId
                const reviewerId = new ObjectId()
                const stayId =
                    typeof stay._id === 'string' ? new ObjectId(stay._id) : stay._id

                reviews.push({
                    _id: new ObjectId(),
                    rating: rand(4, 5),
                    txt: pick(REVIEW_TEXTS),
                    byUser: {
                        _id: reviewerId,
                        fullname: reviewer.fullname,
                        imgUrl: reviewer.imgUrl
                    },
                    aboutStayId: stayId,
                    createdAt: new Date()
                })
            }
        })

        await reviewCol.insertMany(reviews)
        logger.info(`Inserted ${reviews.length} reviews for ${stays.length} stays.`)
        process.exit(0)
    } catch (err) {
        logger.error('Failed seeding reviews:', err)
        process.exit(1)
    }
}

seedReviews()
