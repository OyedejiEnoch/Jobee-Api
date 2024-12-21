import mongoose from "mongoose";
import validator from "validator";
import bcrypt from 'bcryptjs'

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
    resetPassword :String,
    resetPasswordExpire : Date
})


userSchema.pre('save', async function(next){
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

export default mongoose.model('User', userSchema)