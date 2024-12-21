import express from 'express'
import { loginUser, registerUser } from '../controllers/userController.js'

const router = express.Router()

router.post('/user', registerUser)
router.post('/user/login', loginUser)

export default router