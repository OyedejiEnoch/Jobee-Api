import express from 'express';
import dotenv from 'dotenv';
import connection from './config/database.js';
import jobRoute from './routes/jobRoute.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js'
import errors from './middlewares/errors.js';
import { createError } from './utils/errorHandler.js';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import xssClean from 'xss-clean'
import hpp from 'hpp'
import cors from 'cors'

// setting up config.env
dotenv.config({path:'config/.env'})

const app =express()

// set up sequrity headers
app.use(helmet())
app.use(cors())
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload())


//To Sanitize our data, i.e preventing using mongo operators to access our database
app.use(mongoSanitize());

// to prevent xss attacks
app.use(xssClean())

// to prevent parameter polution
app.use(hpp())

// Using rate limit
const limiter =rateLimit({
    windowsMs:10*60*1000 ,//10mins
    max:100
})

app.use(limiter)


// Handling unCaught Exception
process.on('uncaughtException', err=>{
    console.log(`Error: ${err.message}`);
    console.log('Shutting down due to uncaught exception');
    process.exit(1);
})

// connecting to database
connection()


app.use('/api/v1', authRoute)
app.use('/api/v1', userRoute)
app.use('/api/v1', jobRoute)

app.all('*', (req, res, next)=>{
    next(createError(404, `${req.originalUrl} route not found`))
})
// Middleware to handle errors
app.use(errors)



const PORT= process.env.PORT
const server =app.listen(PORT, ()=>{
    console.log(`Server started at port ${process.env.PORT} in ${process.env.NODE_ENV} mode`)
});


// handling unhandled promise rejection
process.on('unhandledRejection', err =>{
    console.log(`Error: ${err.message}`)
    console.log('Shutting down the server due to unhandled promise rejection')
    server.close(()=>{
        process.exit(1)
    })
})



// npm i nodemon --save-dev as dev dependency we don't have to use this in production