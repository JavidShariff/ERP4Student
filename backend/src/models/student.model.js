import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    firstName: { 
        type: String, 
        required: true 
    },
    lastName: { 
        type: String, 
        required: true 
    },
    studentID: { 
        type: String, 
        required: true, 
        unique: true 
    },
    rollNumber: { 
        type: Number, 
        required: true 
    },
    // The class the student belongs to
    classRef: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        required: true 
    },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    parentContact: { 
        type: String 
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);