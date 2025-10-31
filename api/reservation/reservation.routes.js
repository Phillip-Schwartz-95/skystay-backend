import express from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import {
    getReservations,
    getReservationById,
    addReservation,
    removeReservation,
    getByStayId,
    getByUserId,
    updateReservationStatus
} from './reservation.controller.js'

const router = express.Router()

router.get('/', getReservations)
router.get('/byStay/:stayId', getByStayId)
router.get('/byUser/:userId', getByUserId)
router.get('/:id', getReservationById)

router.post('/', requireAuth, addReservation)
router.put('/:id/status', requireAuth, updateReservationStatus)
router.delete('/:id', requireAuth, removeReservation)

export const reservationRoutes = router
