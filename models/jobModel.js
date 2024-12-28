import mongoose from 'mongoose'
import validator from 'validator'
import slugify from 'slugify'
import geoCoder from '../utils/geocoder.js'

const jobSchema =new mongoose.Schema({
    title:{
        type:String,
        required:[true, 'Title of the job is required'],
        trim:true,
        maxlength:[100, 'Job title cannot exceed 100 characters']
    },
    slug:String,
    description:{
        type:String,
        required:[true, 'Job description is required'],
        maxlength:[1000, 'Job title cannot exceed 1000 characters']
    },
    email:{
        type:String,
        validate:[validator.isEmail, 'Please use a vaild email address']
    },
    address:{
        type:String,
        required:[true, 'Address is required']
    },
    location:{
        type:{
            type:String,
            enum:['Point']
        },
        coordinates:{
            type:[Number],
            index:'2dsphere'
        },
        formattedAddress:String,
        city:String,
        state:String,
        zipcode:String,
        country:String
    },
    company:{
        type:String,
        required:[true, "Company name is required"]
    },
    industry:{
        type:[String],
        required:true,
        enum:{
            values:['Business', 'Information Technology', 'Banking', 'Education/Traning', 'Telecommunication', 'Others'],
            message:['Please select the right option for the industry']
        }
    },
    jobType:{
        type:String,
        required:[true, 'Job type is required'],
        enum:{
            values:['Permanent', 'Temporary', 'Internship'],
            message:'Please select the right option for the Job type'
        }  
    },
    minEducation:{
        type:String,
        required:[true, 'Minimum Education is required'],
        enum:{
            values:['Bachelors', 'Masters', 'Phd'],
            message:'Please select the right option for Education'
        }
    },
    positions:{
        type:Number,
        default:1
    },
    experience:{
        type:String,
        required:[true, 'Experience is required'],
        enum:{
            values:['No Experience', '1 Year - 2 Years', '2 Years - 5 Years', '5 Years+',],
            message:'Please select the right option for Experience'
        }
    },
    salary:{
        type:Number,
        required:[true, 'Enter the Expected Salary for this job']
    },
    postingDate:{
        type:Date,
        default:Date.now,
    },
    lastDate:{
        type:Date,
        default:new Date().setDate(new Date().getDate() + 7)
    },
    applicantsApplied:{
        type:[Object],
        select: false,

    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    }
})


// creating job slug
jobSchema.pre('save', function(next){
    // Creating slug for saving to DB
    this.slug=slugify(this.title, {lower : true});
    next()
})

// jobSchema.pre('save', async function(next){
//     const loc = await geoCoder.geocode(this.address)
//     this.location ={
//         type: 'Point',
//         coordinates: [loc[0].longitude, loc[0].latitude],
//         formattedAddress:loc[0].formattedAddress,
//         city:loc[0].city,
//         state:loc[0].stateCode,
//         zipcode:loc[0].zipcode,
//         country:loc[0].countryCode
//     }
// })

export default mongoose.model('Job', jobSchema)