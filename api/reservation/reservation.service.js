import { dbService } from '../../services/db.service.js'
import { ObjectId } from 'mongodb'

export const reservationService = {
    query,
    getById,
    add,
    remove,
    getByStayId,
    getByUserId,
}

async function query(filterBy = {}) {
    const collection = await dbService.getCollection('reservations')

    const criteria = {}
    if (filterBy.stayId) criteria.stayId = filterBy.stayId
    if (filterBy.userId) criteria.userId = filterBy.userId

    const reservations = await collection.find(criteria).toArray()
    return reservations
}

async function getById(resId) {
    const collection = await dbService.getCollection('reservations')
    return collection.findOne({ _id: new ObjectId(resId) })
}

async function add(reservation) {
    const collection = await dbService.getCollection('reservations')
    await collection.insertOne(reservation)
    return reservation
}

async function remove(resId) {
    const collection = await dbService.getCollection('reservations')
    await collection.deleteOne({ _id: new ObjectId(resId) })
}

async function getByStayId(stayId) {
    const collection = await dbService.getCollection('reservations')
    return collection.find({ stayId }).toArray()
}

async function getByUserId(userId) {
    const collection = await dbService.getCollection('reservations')
    return collection.find({ userId }).toArray()
}
