import express from 'express'
import { getReservations, getReservationById, addReservation, removeReservation, getByStayId, getByUserId } from './reservation.controller.js'

const router = express.Router()

router.get('/', getReservations)
router.get('/:id', getReservationById)
router.get('/byStay/:stayId', getByStayId)
router.get('/byUser/:userId', getByUserId)
router.post('/', addReservation)
router.delete('/:id', removeReservation)

export const reservationRoutes = router
