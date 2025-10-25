import { MongoClient, ServerApiVersion } from 'mongodb'

import { config } from '../config/index.js'
import { logger } from './logger.service.js'

export const dbService = { getCollection }

var dbConn = null

async function getCollection(collectionName) {
    try {
        const db = await _connect()
        const collection = await db.collection(collectionName)
        return collection
    } catch (err) {
        logger.error('Failed to get Mongo collection', err)
        throw err
    }
}

async function _connect() {
    if (dbConn) return dbConn

    try {
        console.log('Connecting to MongoDB using:', config.dbURL)

        const client = new MongoClient(config.dbURL, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        })

        await client.connect()

        dbConn = client.db(config.dbName)
        console.log('Connected to MongoDB at:', config.dbURL, '| Database:', config.dbName)
        return dbConn
    } catch (err) {
        logger.error('Cannot Connect to DB', err)
        throw err
    }
}