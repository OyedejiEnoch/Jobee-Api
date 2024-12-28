import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { createError } from './errorHandler.js';

export const verifyUser =async (req, res, next)=>{
    // This is to check if a user is authenticated
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]
    }
    if(!token){
        return next(createError(401, 'You are not authenticated, login to access this resource'))
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
          return next(createError(403, "Json web token is invalid. Try again"));
        }
    
        // req.user = user;
        req.user = await User.findById(user.id);
        next();
      });

    // // const decoded =jwt.verify(token, process.env.JWT_SECRET)
    // // req.user =await User.findById(decoded.id)

    // next()
}


// handling users roles
export const authorizedRoles = (...roles)=>{
    return (req, res, next)=>{
        if(!roles.includes(req.user.role)){
            return next(createError(403, `Role(${req.user.role}) is not allowed to access this resource`))
        }
        next()
    }
}