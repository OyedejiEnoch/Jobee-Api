import User from "../models/userModel.js";
import jwt from 'jsonwebtoken'
import {createError} from '../utils/errorHandler.js'
import sendEmail from "../utils/sendEmail.js";
import crypto from 'crypto'

export const registerUser =async(req, res, next)=>{
    const {name, email, password, role} =req.body
    try {
        const user =await User.create({
            name, email, password, role
        })

        const token=jwt.sign({id:user._id}, process.env.JWT_SECRET, {expiresIn:process.env.JWT_EXPIRES_TIME})

        res.cookie('accessToken', token,{
            httpOnly:true,
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 24*60*60*1000)
        }).status(201).json({
            success:true,
            message:'Registered successfully',
            user
        })
    } catch (error) {
        next(error)
    }
}

export const loginUser = async(req, res, next)=>{
    const {email, password}=req.body
    try {
        if(!req.body.password || !req.body.email){
            return next(createError(400, 'No email or password entered'))
        }

        // finding the user 
        const user = await User.findOne({email}).select('+password')
        if(!user){
            return next(createError(401, 'Wrong Email or Password'))
        }

        // if the user exist, we need to compare or check the password
           // to check for password
        const isCorrectPassword = await user.comparePassword(password);
        if (!isCorrectPassword) {
        return next(createError(401, "Invalid email or password"));
        }
        // if password is correct, we then login the user

        const token=jwt.sign({id:user._id}, process.env.JWT_SECRET, {expiresIn:process.env.JWT_EXPIRES_TIME})

        res.cookie('accessToken', token,{
            httpOnly:true,
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 24*60*60*1000)
        }).status(200).json({
            success:true,
            message:'Logged in successfully',
            user,
            token
        })
    } catch (error) {
        next(error)
    }
}


// forgot password => /api/v1/user/forgot-password
export const forgotPassword =async(req, res, next)=>{
    try {
        const user = await User.find({email:req.body.email})
        if(!user){
            return next(404, 'No user found with this email')
        }

        // we then get the resetToken we already created in the model
        const resetToken =await user.getResetPasswordToken();
        await user.save({validateBeforeSave : false})

        // after setting the token, we create the reset url to reset the token
        // const resetUrl =``
        const resetUrl =`${req.protocol}://${req.get('host')}/api/v1/user/forgot-password/${resetToken}`

        const message= `Your password reset link is as follow: \n\n${resetUrl} \n\n If you have not requested this, please ignore.`

// Then we send the email to the user
        try {
            await sendEmail({
                email:user.email,
                subject: 'Jobee-API Password Recovery',
                message
            })
    
            res.status(200).json({
                success:true,
                message:`Email sent successfully to ${user.email}`
            })
        } catch (error) {
            // if the email doesn't send, we reset all to undefined
            user.resetPasswordToken  =undefined;
            user.resetPasswordExpire =undefined

            await user.save({validateBeforeSave:false})

            return next(createError(500, 'Email not sent'))
        }
    } catch (error) {
        next(error)
    }
}

// to reset password  => api/v1/user/reset-passowrd/:token
export const resetPassword = async(req, res, next)=>{
    try {
        // we harsh the token we get from the url we sent
        const resetPasswordToken =crypto.createHash('sha256').update(req.params.token).digest('hex')

        // we then find the user with the resetPasswordToken, and also get if the expire time is greater than now
        const user = await User.findOne({resetPasswordToken, resetPasswordExpire:{$gt: Date.now()}})

        if(!user){
            return next(createError(400, 'Password token is invalid'))
        }
        // if the token is valid, we then update the password

        user.password =req.body.password;
        user.resetPasswordToken =undefined;
        user.resetPasswordExpire=undefined;

        await user.save()

        res.status(200).json({
            success:true,
            message:'Password reset successfully'
        })
    } catch (error) {
        next(error)
    }
}

// to logout a user => /api/v1/user/logout
export const logOut =async(req, res, next)=>{
    try {
        res.cookie('accessToken', 'none', {
            expires: new Date(Date.now()),
            httpOnly:true
        })

        res.status(200).json({
            success:true,
            message:'Logged Out Successfully'
        })
        
    } catch (error) {
        next(error)
    }
}