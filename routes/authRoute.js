import express from 'express'
import { forgotPassword, loginUser, logOut, registerUser, resetPassword } from '../controllers/authController.js'
import { verifyUser } from '../utils/verifyUser.js'

const router = express.Router()

router.post('/user', registerUser)
router.post('/user/login', loginUser)
router.put('/user/forgot-password', forgotPassword)
router.put('/user/reset-password/:token', resetPassword)
router.get('/user/logout',verifyUser ,logOut)

export default router