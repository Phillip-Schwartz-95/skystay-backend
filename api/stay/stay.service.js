import { ObjectId } from 'mongodb'
import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const PAGE_SIZE = 3

export const stayService = {
    remove,
    query,
    getById,
    add,
    update,
    addStayMsg,
    removeStayMsg,
}

function asCriteriaId(id) {
    try {
        if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) return ObjectId.createFromHexString(id)
    } catch (_) { }
    return id
}

async function query(filterBy = { txt: '' }) {
    try {
        const criteria = _buildCriteria(filterBy)
        const sort = _buildSort(filterBy)
        const collection = await dbService.getCollection('stays')
        let stayCursor = collection.find(criteria, { sort })
        if (filterBy.pageIdx !== undefined) {
            stayCursor = stayCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
        }
        const stays = await stayCursor.toArray()
        return stays
    } catch (err) {
        logger.error('cannot find stays', err)
        throw err
    }
}

async function getById(stayId) {
    try {
        const criteria = { _id: asCriteriaId(stayId) }
        const collection = await dbService.getCollection('stays')
        const stay = await collection.findOne(criteria)
        if (!stay) return null
        if (ObjectId.isValid(stay._id)) {
            try { stay.createdAt = stay._id.getTimestamp() } catch (_) { }
        }
        return stay
    } catch (err) {
        logger.error(`while finding stay ${stayId}`, err)
        throw err
    }
}

async function remove(stayId) {
    const store = asyncLocalStorage.getStore() || {}
    const { loggedinUser } = store
    const ownerId = loggedinUser?._id
    const isAdmin = !!loggedinUser?.isAdmin
    try {
        const base = { _id: asCriteriaId(stayId) }
        let criteria = base
        if (!isAdmin && ownerId) {
            const ownerStr = String(ownerId)
            const or = [{ hostId: ownerStr }, { 'host._id': ownerStr }]
            try {
                if (/^[0-9a-fA-F]{24}$/.test(ownerStr)) {
                    const oid = ObjectId.createFromHexString(ownerStr)
                    or.push({ 'host._id': oid })
                }
            } catch (_) { }
            criteria = { $and: [base, { $or: or }] }
        }
        const collection = await dbService.getCollection('stays')
        const res = await collection.deleteOne(criteria)
        if (res.deletedCount === 0) throw ('Not your stay')
        return stayId
    } catch (err) {
        logger.error(`cannot remove stay ${stayId}`, err)
        throw err
    }
}

async function add(stay) {
    try {
        const collection = await dbService.getCollection('stays')
        await collection.insertOne(stay)
        return stay
    } catch (err) {
        logger.error('cannot insert stay', err)
        throw err
    }
}

async function update(stay) {
    try {
        const { _id, ...rest } = stay
        const criteria = { _id: asCriteriaId(_id) }
        const collection = await dbService.getCollection('stays')
        await collection.updateOne(criteria, { $set: rest })
        return stay
    } catch (err) {
        logger.error(`cannot update stay ${stay._id}`, err)
        throw err
    }
}

async function addStayMsg(stayId, msg) {
    try {
        const criteria = { _id: asCriteriaId(stayId) }
        msg.id = makeId()
        const collection = await dbService.getCollection('stays')
        await collection.updateOne(criteria, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        logger.error(`cannot add stay msg ${stayId}`, err)
        throw err
    }
}

async function removeStayMsg(stayId, msgId) {
    try {
        const criteria = { _id: asCriteriaId(stayId) }
        const collection = await dbService.getCollection('stays')
        await collection.updateOne(criteria, { $pull: { msgs: { id: msgId } } })
        return msgId
    } catch (err) {
        logger.error(`cannot remove stay msg ${stayId}`, err)
        throw err
    }
}

function _buildCriteria(filterBy = {}) {
    const and = []

    if (filterBy.hostId) {
        const idStr = String(filterBy.hostId)
        const hostOr = [{ hostId: idStr }, { 'host._id': idStr }]
        try {
            if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
                const oid = ObjectId.createFromHexString(idStr)
                hostOr.push({ 'host._id': oid })
            }
        } catch (_) { }
        and.push({ $or: hostOr })
    }

    if (filterBy.txt) {
        and.push({ title: { $regex: filterBy.txt, $options: 'i' } })
    }

    if (filterBy.city) {
        and.push({ 'loc.city': { $regex: filterBy.city, $options: 'i' } })
    }

    if (filterBy.capacity && +filterBy.capacity > 0) {
        and.push({ maxGuests: { $gte: +filterBy.capacity } })
    }

    if (filterBy.minPrice) {
        and.push({ price: { $gte: +filterBy.minPrice } })
    }

    if (filterBy.startDate && filterBy.endDate) {
        const start = new Date(filterBy.startDate)
        const end = new Date(filterBy.endDate)
        and.push({
            $or: [
                { reservations: { $exists: false } },
                { 'reservations.endDate': { $lte: start } },
                { 'reservations.startDate': { $gte: end } },
            ],
        })
    }

    return and.length ? { $and: and } : {}
}

function _buildSort(filterBy) {
    if (!filterBy.sortField) return {}
    return { [filterBy.sortField]: filterBy.sortDir }
}
