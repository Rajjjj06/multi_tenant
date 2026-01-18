import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firebaseUid:{
        type: String,
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    name:{
        type:String
    },
    avatar:{
        type:String
    },
    organisations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    }],
    createdAt:{
        type: Date, default: Date.now
    },
    updatedAt:{
        type: Date, default: Date.now
    }
})

export default mongoose.model("User", userSchema)