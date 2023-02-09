const mongoose=require('mongoose')
const passportLocalMongoose=require('passport-local-mongoose')

const UserSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    }
});

UserSchema.plugin(passportLocalMongoose); //this function uses passport to add username, password, salting etc to UserSchema.

module.exports=mongoose.model('User', UserSchema);