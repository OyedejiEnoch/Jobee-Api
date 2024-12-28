import express from 'express'
import { createJob, deleteJob, getAllJobs, getJobsInRadius, jobApply, singleJob, updateJob } from '../controllers/jobController.js'
import { authorizedRoles, verifyUser } from '../utils/verifyUser.js'

const router=express.Router();

router.post('/job/new', verifyUser,authorizedRoles('employeer', 'admin', 'user')  ,createJob);
router.get('/jobs', getAllJobs);
router.get('jobs/:zipcode/:distance', getJobsInRadius);
router.get('/job/:id/:slug', singleJob);
router.put('/job/:id', verifyUser, updateJob);
router.delete('/job/:id', verifyUser, deleteJob);
router.put('/job/:id/apply', verifyUser, authorizedRoles('user') ,jobApply);

// router.route('/job/:id').put(updateJob).delete(deleteJob)


export default router