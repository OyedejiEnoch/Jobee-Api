import User from "../models/userModel.js";
import { createError } from "../utils/errorHandler.js";
import jwt from 'jsonwebtoken'
import Job from "../models/jobModel.js";
import fs from 'fs'
import { APIFilters } from "../utils/apiFilters.js";

// to get a logged in user profile => /api/v1/user/me
export const myProfile =async (req, res, next)=>{
    try {
        const user = await User.findById(req.user.id).populate({
            path:'jobsPublished',
            select:'title postingDate'
        })
        // we added the populate, which is mostly for employeers to find or show the jobs created by the user(employeer)
        // so therefore display the jobs created by a user. using the virtuals property we added in the user model

        res.status(200).json({
            success:true,
            data:user
        })
    } catch (error) {
        next(error)
    }
}

// to change/update password => /api/v1/user/me/password/update
export const updatePassword =async(req, res, next)=>{
    try {
        const user =await User.findById(req.user.id).select('+password')
        
        // Check for the previous password
        const isMatched =await user.comparePassword(req.body.currentPassword)
        if(!isMatched){
            return next(createError(400, 'Previous password does not match'))
        }

        // if the password match then we can allow them to change the password
        user.password =req.body.newPassword
        await user.save()

        const token=jwt.sign({id:user._id}, process.env.JWT_SECRET, {expiresIn:process.env.JWT_EXPIRES_TIME})

        res.cookie('accessToken', token,{
            httpOnly:true,
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 24*60*60*1000)
        }).status(201).json({
            success:true,
            message:'Password updated successfully',
            data: user
        })
    } catch (error) {
        next(error)
    }
}

// to update my profile => /api/v1/user/me/update
export const updateUser =async(req, res, next)=>{
    try {
        const newUserData ={
            name:req.body.name,
            email:req.body.email
        }

        const newUser = await User.findByIdAndUpdate(req.user.id, newUserData, {new:true})

        res.status(200).json({
            success:true,
            data:newUser
        })
        
    } catch (error) {
        next(error)
    }
}

// to delete a user => /api/v1/user/delete
export const deleteUser =async(req, res, next)=>{
    try {
        deleteUserData(req.user.id, req.user.role)


        const user =await User.findById(req.user.id);

        res.cookie('accessToken', 'none', {
            expiresIn:new Date(Date.now()),
            httpOnly:true
        })

        res.status(200).json({
            success:true,
            message:'Account deleted successfully'
        });
    } catch (error) {
        next(error)
    }
}

// to show all appllied jobs => /api/v1/jobs/applied
export const getAppliedJobs =async(req, res, next)=>{
    try {
        const jobs = await Job.find({'applicantsApplied.id':req.user.id}).select('+applicantsApplied')

        res.status(200).json({
            success:true,
            results:jobs.length,
            data:jobs
        })
    } catch (error) {
        next(error)
    }
}

// to show all jobs created by an employeer 
export const createdJobs =async(req, res, next)=>{
    try {
        const jobs =await Job.find({user:req.user.id})
        if(!jobs){
            return next(createError(404, 'No job found'))
        }

        res.status(200).json({
            success:true,
            results:jobs.length,
            data:jobs
        })
    } catch (error) {
        next(error)
    }
}


// to delete a user file(resume) and all jobs created by an employeer(user)
async function deleteUserData (userId, role){
    if(role === 'employer'){
        // then we have to delete the jobs associated to the user
        await Job.deleteMany({user:userId})
    }
    if(role === 'user'){
        // then we only have to delete the resume file associated with the user
        const appliedJobs =await Job.find({'applicantsApplied.id':userId}).select('+applicantsApplied');

        // if it's more than one job, it would be an array, so there is a possibility that the user has applied to more than one job
        // and also the appliedjob is an array, so we are trying to loop through that array
        for(let i =0; i < appliedJobs.length; i++){
            let obj =appliedJobs[i].applicantsApplied.find(o => o.id === userId);

            // console.log(__dirname)
            let filePath = `${__dirname}/public/uploads/${obj.resume}`.replace('\\controllers', '')

            fs.unlink(filePath, err =>{
                if(err) return console.log(err)
            });
            
            appliedJobs[i].applicantsApplied.splice(appliedJobs[i].applicantsApplied.indexOf(obj.id));

            appliedJobs[i].save();
        }
    }
}


// Adding controller methods that only accessible by the admin

// to show all users => /api/v1/users
export const getAllUsers =async(req, res, next)=>{
    try {
        const apiFilters = new APIFilters(User.find(), req.query).filter().sort().limitFields().pagination();

        const users =await apiFilters.query;

        res.status(200).json({
            success:true,
            results:users.length,
            data:users
        })
    } catch (error) {
        next(error)
    }
}


// delete a user(Admin) => /api/v1/user/:id
export const deleteUserByAdmin =async(req, res, next)=>{
    try {
        const user =await User.findById(req.params.id);
        if(!user) return next(createError(404, 'No user found'));

        // we use the delete function we've created before, to delete a user resume and also if an employer to delete all jobs created by them
        deleteUserData(user.id, user.role);
        await user.remove();


        res.status(200).json({
            success:true,
            message:'User deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}