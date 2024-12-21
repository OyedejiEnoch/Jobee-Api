import express from 'express'
import { createJob, deleteJob, getAllJobs, getJobsInRadius, singleJob, updateJob } from '../controllers/jobController.js'


const router=express.Router()

router.post('/job/new', createJob)
router.get('/jobs', getAllJobs)
router.get('jobs/:zipcode/:distance', getJobsInRadius)
router.get('/job/:id/:slug', singleJob)
router.put('/job/:id', updateJob)
router.delete('/job/:id', deleteJob)

// router.route('/job/:id').put(updateJob).delete(deleteJob)


export default router