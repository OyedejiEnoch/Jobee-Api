import User from "../models/userModel.js";
import jwt from 'jsonwebtoken'
import {createError} from '../utils/errorHandler.js'


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