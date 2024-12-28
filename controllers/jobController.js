import Job from "../models/jobModel.js"
import geoCoder from "../utils/geocoder.js"
import { createError } from "../utils/errorHandler.js"
import { APIFilters } from "../utils/apiFilters.js"
import path from 'path'
import fs from 'fs'

export const createJob =async(req, res, next)=>{
    try {
        const job = await Job.create({
            ...req.body,
            user:req.user.id
        })

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
        const job =await Job.find({$and:[{_id:req.params.id}, {slug:req.params.slug}]}).populate({
            path:'user',
            select:'name'
        })
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

        // We need to check if the user is the owner of the job
        if(job.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return next(createError(400, `You are not allowed to update this job`))
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
        let job = await Job.findById(req.params.id).select('+applicantsApplied')
        if(!job){
           return next(createError(404, 'Job not found'))
        }

         // We need to check if the user is the owner of the job
           if(job.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return next(createError(400, `You are not allowed to update this job`))
        }

        // Deleting files assoicaited with the job
        // const delJob =await Job.findOne({_id:req.params.id})

        for(let i =0; i < job.applicantsApplied.length; i++) {
            let filePath = `${__dirname}/public/uploads/${job.applicantsApplied[i].resume}`.replace('\\controllers', '')

            fs.unlink(filePath, err =>{
                if(err) return console.log(err)
            });
            
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

// Apply to job using Resume => /api/v1/job/:id/apply, this is to apply to a job and we want to use the Resume
export const jobApply =async(req, res, next)=>{
    try {
        let job = await Job.findById(req.params.id).select('+applicantsApplied')

        if(!job){
            return next(createError(404, 'Job not found'))
        }

        // Check if the job last date has been passed or not, meaning the last date has to be greater than the current date
        if(job.lastDate < new Date(Date.now)){
            return next(createError(400, 'You cannot apply to this job, Job expired'))
        }

        // to check if the user has already applied to this job before, 
        // because the applicantsApplied is an array we have to loop over it, and check for each id, if it's matched with the req.user.id
        for(let i =0; i < job.applicantsApplied.length; i++){
            if(job.applicantsApplied[1].id === req.user.id){
                next(createError(400, 'You have already applied to this job'))
            }
        }

        // Check files
        if(!req.files){
            return next(createError(400, 'Please upload file'))
        }
        const file = req.files.file

        // we need to check the file type, so a user wont upload other type of files
        const supportedFiles =/.docs|.pdf/;

        // this is to check if the file we are uploading (file.name) is the supported files we are after
        if(!supportedFiles.test(path.extname(file.name))){
            return next(createError(400, 'Please upload right document file'))
        }

        // now if we have the right file, we then need to check the file size
        if(file.size > process.env.MAX_FILE_SIZE){
            return next(createError(400, 'Please upload file less than 2mb'))
        }

        // Renaming the document
        file.name = `${req.user.name.replace(' ', '_')}_${job._id}${path.parse(file.name).ext}`

        file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async err =>{
            if(err){
                console.log(err)
                return next(createError(500, 'Resume upload failed'))
            }

        // if no error we then push the user object into the job applicants object as a user 
        // that has registerd for the job or sumitted application

            await Job.findByIdAndUpdate(req.params.id, {$push:{applicantsApplied:{
                id:req.user.id,
                resume:file.name,
            }}}, {new:true})

            res.status(200).json({
                success:true,
                message:'Applied to job successfully',
                data:file.name
            })
        })

    } catch (error) {
        next(error)
    }
}