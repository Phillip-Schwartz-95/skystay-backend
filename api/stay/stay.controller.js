import { logger } from '../../services/logger.service.js'
import { stayService } from './stay.service.js'
import { normalizeStayPayload } from './normalizeStayPayload.js'

export async function getStays(req, res) {
    try {
        const filterBy = {
            txt: req.query.txt || '',
            city: req.query.city || '',
            capacity: +req.query.capacity || 0,
            startDate: req.query.startDate || '',
            endDate: req.query.endDate || '',
            coords: req.query.coords ? JSON.parse(req.query.coords) : null,
            hostId: req.query.hostId ? String(req.query.hostId) : ''
        }
        
        const stays = await stayService.query(filterBy)
        res.json(stays)
    } catch (err) {
        logger.error('Failed to get stays', err)
        res.status(400).send({ err: 'Failed to get stays' })
    }
}

export async function getStayById(req, res) {
    try {
        const stayId = req.params.id
        const stay = await stayService.getById(stayId)
        res.json(stay)
    } catch (err) {
        logger.error('Failed to get stay', err)
        res.status(400).send({ err: 'Failed to get stay' })
    }
}

export async function addStay(req, res) {
    try {
        const { loggedinUser } = req
        if (!loggedinUser) return res.status(401).send('Not logged in')

        const canonical = normalizeStayPayload(req.body, loggedinUser)
        const stay = {
            ...canonical,
            hostId: String(loggedinUser._id),
            host: {
                _id: loggedinUser._id,
                fullname: loggedinUser.fullname,
                imgUrl: loggedinUser.imgUrl || ''
            }
        }

        const addedStay = await stayService.add(stay)
        res.json(addedStay)
    } catch (err) {
        logger.error('Failed to add stay', err)
        res.status(400).send({ err: 'Failed to add stay' })
    }
}

export async function updateStay(req, res) {
    const { loggedinUser, body: stay } = req
    const { _id: userId, isAdmin } = loggedinUser

    if (!isAdmin && String(stay.host?.(_id) || stay.hostId) !== String(userId)) {
        return res.status(403).send('Not your stay...')
    }

    try {
        const updatedStay = await stayService.update(stay)
        res.json(updatedStay)
    } catch (err) {
        logger.error('Failed to update stay', err)
        res.status(400).send({ err: 'Failed to update stay' })
    }
}

export async function removeStay(req, res) {
    try {
        const stayId = req.params.id
        const removedId = await stayService.remove(stayId)
        res.send(removedId)
    } catch (err) {
        logger.error('Failed to remove stay', err)
        res.status(400).send({ err: 'Failed to remove stay' })
    }
}

export async function addStayMsg(req, res) {
    const { loggedinUser } = req
    try {
        const stayId = req.params.id
        const msg = {
            txt: req.body.txt,
            by: loggedinUser
        }
        const savedMsg = await stayService.addStayMsg(stayId, msg)
        res.json(savedMsg)
    } catch (err) {
        logger.error('Failed to add stay msg', err)
        res.status(400).send({ err: 'Failed to add stay msg' })
    }
}

export async function removeStayMsg(req, res) {
    try {
        const { id: stayId, msgId } = req.params
        const removedId = await stayService.removeStayMsg(stayId, msgId)
        res.send(removedId)
    } catch (err) {
        logger.error('Failed to remove stay msg', err)
        res.status(400).send({ err: 'Failed to remove stay msg' })
    }
}
