import Job from "../models/jobModel.js"
import geoCoder from "../utils/geocoder.js"
import { createError } from "../utils/errorHandler.js"
import { APIFilters } from "../utils/apiFilters.js"

export const createJob =async(req, res, next)=>{
    try {
        const job = await Job.create(req.body)

        // const job =
        res.status(201).json({
            success:true,
            message:'Job created successfully',
            job
        })
    } catch (error) {
        next(error)
    }
}

export const getAllJobs =async(req, res, next)=>{
    try {
        const apiFilters =new APIFilters(Job.find(), req.query).filter().sort().limitFields().searchByQuery().pagination()

        
        const allJobs =await apiFilters.query

        res.status(200).json({
            success:true,
            results:allJobs.length,
            allJobs
        })
    } catch (error) {
        next(error)
    }
}

// to search Jobs with radius => /api/v1/jobs/:zipcode/:distance
export const getJobsInRadius =async(req, res, next)=>{
    try {
        const {zipcode, distance}= req.params;

        // Getting latitude & longitude from geocoder with zipcode
        const loc =await geoCoder.geocode(zipcode)

        const latitude =loc[0].latitude;
        const longitude=loc[0].longitude

        const radius =distance/3963
        const jobs =await Job.find({
            location:{$geoWithin:{$centerSpghere:[[longitude, latitude], radius ]}}
        })

        res.status(200).json({
            success:true,
            results:jobs.length,
            jobs
        })

    } catch (error) {
        next(error)
    }
}

// to get a single job => /api/v1/job/:id
export const singleJob =async(req, res, next)=>{
    try {
        const job =await Job.find({$and:[{_id:req.params.id}, {slug:req.params.slug}]})
        if(!job){
            return next(createError(404, 'Job not found'))
        }

        res.status(200).json({
            success:true,
            job
        })
    } catch (error) {
        next(error)
    }
}

// to update a job => /api/v1/job/:id
export const updateJob =async(req, res, next)=>{
    try {
        // firstly to find the job
        let job =await Job.findById(req.params.id)
        if(!job){
           return next(createError(404, 'Job not found'))
        }

        // to update job
        job =await Job.findByIdAndUpdate(req.params.id, {$set:req.body}, {new:true})

        res.status(200).json({
            success: true,
            message:'Job updated successfully',
            job,
          });
    } catch (error) {
        next(error)
    }
}

export const deleteJob =async (req, res, next)=>{
    try {
        // find the job by id
        let job = await Job.findById(req.params.id)
        if(!job){
           return next(createError(404, 'Job not found'))
        }

        job =await Job.deleteOne(req.params.id)
        // job =await Job.removeOne(req.params.id)

        res.status(200).json({
            success: true,
            message:'Job deleted successfully',
          });
    } catch (error) {
        next(error)
    }
}


// to Get stats about a topic(job) => api/v1/stats/:topic
export const jobStats =async(req, res, next)=>{
    try {
        const stats= await Job.aggregate([
            {
                $match:{$text:{$search: "\""+req.params.topic + "\""}}
            },
            {
                $group:{
                    avgSalary:{$avg: '$salary'}
                }
            }
        ])
    } catch (error) {
        next(error)
    }
}