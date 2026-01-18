import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    description:{
        type:String,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    organization:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Organization'
    },
    project:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Project'
    },
    member:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Member'
        
    }],
    status:{
        type:String,
        enum:['todo', 'in-progress', 'done'],
    }
})

taskSchema.pre('save',async function () {
    if(this.isModified() && !this.isNew){
        this.updatedAt = Date.now();
    }
} )


export default mongoose.model("Task",taskSchema)