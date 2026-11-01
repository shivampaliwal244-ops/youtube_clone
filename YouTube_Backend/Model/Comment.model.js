import mongoose from "mongoose";

const {Schema} =mongoose;

const commentSchema=new Schema({
    content:{
        type:String,
        required:true,
        trim:true,
        minlength:1,
        maxlength:2000
    },
    username:{
        type:String,
        required:true,
        trim:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:'users',
        required:false
    },
    Video_id_Num:{
        type:String,
        required:true,
        trim:true,
        maxlength:100
    }
},{timestamps:true})
const commentModel=mongoose.model('comments',commentSchema);
export default commentModel;
