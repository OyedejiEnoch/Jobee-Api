import mongoose from "mongoose";
import validator from "validator";
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, 'Name is required']
    },
    email:{
        type:String,
        required:[true, 'Email address is required'],
        unique:true,
        validate:[validator.isEmail, 'Please enter valid email address']
    },
    role:{
        type:String,
        enum:{
            values:['user', 'employer'],
            message:'Select the right role'
        },
        default:'user'
    },
    password:{
        type:String,
        required:[true, 'Password is required'],
        minlength:[8, 'Password must be at least be 8 characters long'],
        select:false
    },
    createdAt:{
        type:Date,
        default: Date.now
    },
    resetPasswordToken:String,
    resetPasswordExpire : Date
}, {
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})


userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next()
    }
    this.password =await bcrypt.hash(this.password, 10)
})

// to compare user password
userSchema.methods.comparePassword =async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}


// We could also use this
// userSchema.methods.getJwtToken = function(){
//     return jwt.sign({id:this._id}, process.env.JWT_SECRET, {
//         expiresIn:process.env.JWT_EXPIRES_TIME
//     })
// }


// to generate password reset token
userSchema.methods.getResetPasswordToken =async function() {
    // firstly we generate the token Generate token
    const resetToken =crypto.randomBytes(20).toString('hex');

    // After generate we hash the token and set to the resetPassword token
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // We then set the token expiry time
    this.resetPasswordExpire =Date.now() + 30*60*1000;

    return resetToken
}

// Show all jobs created by a user(employeer) using virtuals
// We set up a virtual field called jobPublished on the userSchema,
// This field will not exist in the database but can be used to retrieve related data
// Indicates the field in the userSchema (in this case, the _id field of the User document) that will match the foreignField in the Job model.
userSchema.virtual('jobPublished',{
    ref:'Job',
    localField:'_id',
    foreignField:'user',
    justOne:false
})

export default mongoose.model('User', userSchema)