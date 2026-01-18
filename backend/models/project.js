import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    organization:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Organization',
        required:true
    },
    status:{
       type:String,
       enum:['active', 'completed', 'on-hold', 'cancelled'],
       default:'active'
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    },

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
})

projectSchema.pre('save', async function() {
    if(this.isModified() && !this.isNew){
        this.updatedAt = Date.now();
    }
})



export default mongoose.model("Project", projectSchema)