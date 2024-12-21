import express from 'express'
import dotenv from 'dotenv'
import connection from './config/database.js'
import jobRoute from './routes/jobRoute.js'
import userRoute from './routes/userRoute.js'
import errors from './middlewares/errors.js'
import { createError } from './utils/errorHandler.js'
import cookieParser from 'cookie-parser'

// setting up config.env
dotenv.config({path:'config/.env'})

const app =express()


app.use(express.json())
app.use(cookieParser())

// Handling unCaught Exception
process.on('uncaughtException', err=>{
    console.log(`Error: ${err.message}`);
    console.log('Shutting down due to uncaught exception');
    process.exit(1);
})

// connecting to database
connection()


app.use('/api/v1', jobRoute)
app.use('/api/v1', userRoute)

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