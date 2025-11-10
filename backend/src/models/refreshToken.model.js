import mongoose from 'mongoose';

const { Schema } = mongoose;

const refreshTokenSchema = new Schema({
    // 1. Token Value (Hashed)
    token: {
        type: String,
        required: true,
        unique: true,
        // Store the token hashed (if you choose to hash it before storage)
        // or just the unique token string (if you use a long, random JWT)
    },
    
    // 2. Core Links (Who and Where)
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    
    // 3. Security and Device Tracking
    userAgent: {
        type: String, // The raw string (e.g., "Chrome on Windows 10")
        required: true
    },
    ipAddress: {
        type: String, // IP used to generate the token
        required: true
    },
    deviceId: {
        type: String, // Client-generated persistent ID (optional, but recommended)
        default: null
    },
    
    // 4. Expiration
    expiresAt: {
        type: Date,
        required: true,
        // This index will allow MongoDB to automatically delete expired tokens
        index: { expires: 0 } 
    }
}, { timestamps: true });

// Optional: Index on userId and schoolId for fast lookups (e.g., "Log out of all devices")
refreshTokenSchema.index({ userId: 1, schoolId: 1 });

export default mongoose.model('RefreshToken', refreshTokenSchema);