import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
    className: { 
        type: String, 
        required: true, 
        unique: true 
    },
    gradeLevel: { 
        type: Number, 
        required: true 
    },
    // Reference to the main (homeroom) teacher for this class
    classTeacher: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Teacher', 
        default: null 
    },
    // List of students enrolled in this class
    students: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student' 
    }],
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);