import { reservationService } from './reservation.service.js'
import { logger } from '../../services/logger.service.js'

export async function getReservations(req, res) {
    try {
        const filterBy = req.query
        const reservations = await reservationService.query(filterBy)
        res.json(reservations)
    } catch (err) {
        logger.error('Cannot get reservations', err)
        res.status(500).send('Failed to get reservations')
    }
}

export async function getReservationById(req, res) {
    try {
        const reservation = await reservationService.getById(req.params.id)
        res.json(reservation)
    } catch (err) {
        logger.error('Cannot get reservation', err)
        res.status(500).send('Failed to get reservation')
    }
}

export async function addReservation(req, res) {
    try {
        const reservation = req.body
        const addedReservation = await reservationService.add(reservation)
        res.json(addedReservation)
    } catch (err) {
        logger.error('Cannot add reservation', err)
        res.status(500).send('Failed to add reservation')
    }
}

export async function removeReservation(req, res) {
    try {
        await reservationService.remove(req.params.id)
        res.send('Removed')
    } catch (err) {
        logger.error('Cannot remove reservation', err)
        res.status(500).send('Failed to remove reservation')
    }
}

export async function getByStayId(req, res) {
    try {
        const { stayId } = req.params
        const reservations = await reservationService.getByStayId(stayId)
        res.json(reservations)
    } catch (err) {
        logger.error('Cannot get reservations by stay', err)
        res.status(500).send('Failed to get reservations by stay')
    }
}

export async function getByUserId(req, res) {
    try {
        const { userId } = req.params
        const reservations = await reservationService.getByUserId(userId)
        res.json(reservations)
    } catch (err) {
        logger.error('Cannot get reservations by user', err)
        res.status(500).send('Failed to get reservations by user')
    }
}
