import express from 'express'
import { createdJobs, deleteUser, deleteUserByAdmin, getAllUsers, getAppliedJobs, myProfile, updatePassword } from '../controllers/userController.js'
import { authorizedRoles, verifyUser } from '../utils/verifyUser.js'


const router = express.Router()

// since all routes will use verify user, we are using it generally here
router.use(verifyUser)

router.get('/user/me', myProfile);
router.put('/user/me/password/update', updatePassword);
router.delete('/user/me/delete', deleteUser);
router.get('/user/me/jobs',authorizedRoles('user'), getAppliedJobs);
router.get('/user/me/jobs/published',authorizedRoles('employeer', 'admin'), createdJobs);

// admin routes
router.get('/users',authorizedRoles('admin'), getAllUsers);
router.get('/user/:id',authorizedRoles('admin'), deleteUserByAdmin);

export default router