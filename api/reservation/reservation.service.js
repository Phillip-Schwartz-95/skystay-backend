import { dbService } from '../../services/db.service.js'
import { ObjectId } from 'mongodb'

export const reservationService = {
    query,
    getById,
    add,
    remove,
    getByStayId,
    getByUserId,
    updateStatus
}

function asObjId(id) {
    try {
        if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
            return ObjectId.createFromHexString(id)
        }
    } catch (_) { }
    return null
}

function toStr(id) {
    if (id == null) return ''
    return typeof id === 'string' ? id : String(id)
}

async function query(filterBy = {}) {
    const collection = await dbService.getCollection('reservations')
    const criteria = {}

    if (filterBy.userId) criteria.userId = toStr(filterBy.userId)

    if (filterBy.stayId) {
        const sidStr = toStr(filterBy.stayId)
        const sidObj = asObjId(sidStr)
        criteria.$or = criteria.$or || []
        criteria.$or.push({ stayId: sidStr })
        if (sidObj) criteria.$or.push({ stayId: sidObj })
    }

    if (filterBy.status) criteria.status = String(filterBy.status).toLowerCase()

    if (filterBy.hostId) {
        const hostId = toStr(filterBy.hostId)
        const staysCol = await dbService.getCollection('stays')
        const ownedStays = await staysCol
            .find({
                $or: [
                    { hostId: hostId },
                    { 'host._id': hostId },
                    { 'host.id': hostId }
                ]
            })
            .project({ _id: 1 })
            .toArray()

        const stayIdStrs = ownedStays.map(s => toStr(s._id))
        const stayObjIds = ownedStays.map(s => asObjId(s._id)).filter(Boolean)

        if (!stayIdStrs.length && !stayObjIds.length) {
            criteria.$or = [{ hostId: hostId }]
        } else {
            criteria.$or = [
                { hostId: hostId },
                ...(stayIdStrs.length ? [{ stayId: { $in: stayIdStrs } }] : []),
                ...(stayObjIds.length ? [{ stayId: { $in: stayObjIds } }] : []),
            ]
        }
    }

    const reservations = await collection.find(criteria, { sort: { createdAt: -1 } }).toArray()
    return reservations
}

async function getById(resId) {
    const collection = await dbService.getCollection('reservations')
    const _id = asObjId(resId)
    return collection.findOne(_id ? { _id } : { _id: resId })
}

async function add(reservation) {
    const collection = await dbService.getCollection('reservations')
    const now = Date.now()

    let hostId = reservation.hostId ? toStr(reservation.hostId) : ''
    const stayIdStr = toStr(reservation.stayId || '')

    if (!hostId && stayIdStr) {
        try {
            const staysCol = await dbService.getCollection('stays')
            const stayObjId = asObjId(stayIdStr)
            const stay = stayObjId
                ? await staysCol.findOne({ _id: stayObjId })
                : await staysCol.findOne({ _id: stayIdStr })
            if (stay) {
                hostId = toStr(stay.hostId || (stay.host && (stay.host._id || stay.host.id)) || '')
            }
        } catch (_) { }
    }

    const doc = {
        userId: toStr(reservation.userId || ''),
        hostId,
        stayId: stayIdStr || (reservation.stayId ? reservation.stayId : ''),
        stayName: reservation.stayName || '',
        imgUrl: reservation.imgUrl || '',
        checkIn: reservation.checkIn || '',
        checkOut: reservation.checkOut || '',
        guests: Number(reservation.guests || 1),
        nights: Number(reservation.nights || 1),
        nightlyPrice: Number(reservation.nightlyPrice || 0),
        serviceFee: Number(reservation.serviceFee || 0),
        totalPrice: Number(reservation.totalPrice || 0),
        status: (reservation.status ? String(reservation.status) : 'pending').toLowerCase(),
        createdAt: now,
        updatedAt: now
    }

    const res = await collection.insertOne(doc)
    doc._id = res.insertedId
    return doc
}

async function remove(resId) {
    const collection = await dbService.getCollection('reservations')
    const _id = asObjId(resId)
    await collection.deleteOne(_id ? { _id } : { _id: resId })
}

async function getByStayId(stayId) {
    const collection = await dbService.getCollection('reservations')
    const sidStr = toStr(stayId)
    const sidObj = asObjId(sidStr)
    return collection.find(
        sidObj ? { $or: [{ stayId: sidStr }, { stayId: sidObj }] } : { stayId: sidStr }
    ).toArray()
}

async function getByUserId(userId) {
    const collection = await dbService.getCollection('reservations')
    return collection.find({ userId: toStr(userId) }).toArray()
}

async function updateStatus(id, status) {
    const collection = await dbService.getCollection('reservations')
    const _id = asObjId(id)
    const norm = String(status).toLowerCase()

    const result = await collection.findOneAndUpdate(
        _id ? { _id } : { _id: id },
        { $set: { status: norm, updatedAt: Date.now() } },
        { returnDocument: 'after' }
    )

    if (!result.value) throw new Error(`Reservation not found for id=${id}`)
    return result.value
}
