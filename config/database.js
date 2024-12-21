import mongoose from 'mongoose'
import dotenv from 'dotenv'


dotenv.config()

const connection =()=>{   
    mongoose.connect(process.env.MONGO_DB_URL).then((con)=>{
        console.log('Mongodb Connected Successfully')
    })
}


export default connection