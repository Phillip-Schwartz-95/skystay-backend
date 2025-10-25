import dotenv from 'dotenv'
dotenv.config({ path: '.env.production' })

export default {
    dbUrl: 'mongodb://127.0.0.1:27017',
    dbName: 'skystay_local'
}
