import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    invitations: [{
        email: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true,
            unique: true
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        invitedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true
        },
        acceptedAt: {
            type: Date
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
organizationSchema.pre('save', function() {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
});

export default mongoose.model('Organization', organizationSchema);