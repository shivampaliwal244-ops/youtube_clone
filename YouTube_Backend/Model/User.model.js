import mongoose from 'mongoose';
const {Schema} =mongoose;

let userSchema=new Schema({
    userName:{
        type:String,
        required:true,
        trim:true,
        minlength:2,
        maxlength:60
    },
    userEmail:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
        maxlength:254
    },
    userPassword:{
        type:String,
        required:true,
        minlength:1,
        maxlength:100
    }

})
let userModel=mongoose.model('users',userSchema);
export default userModel;
