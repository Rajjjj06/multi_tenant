import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema ({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    organization:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Organization",
        required:true
    },
    project:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project"
    },
    role:{
        type:String,
        enum:["owner", "member", "viewer"],
        required:true
    },
    status:{
        type:Boolean,
        default:true

    },
    addedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    addedAt:{
        type:Date,
        default:Date.now
    }
})

memberSchema.index({organization:1, user:1})
memberSchema.index({project:1, user:1})
memberSchema.index({user:1, project:1, organization:1})

memberSchema.pre('save', async function(){
    if(this.project){
        const project = await mongoose.model('Project').findById(this.project);

        if(!project || project.organization.toString() !== this.organization.toString()){
            throw new Error("Project does not belong to the organization");
        }
    }
})

export default mongoose.model("Member", memberSchema)