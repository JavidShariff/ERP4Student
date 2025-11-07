import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
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
    employeeID: { 
        type: String, 
        required: true, 
        unique: true 
    },
    subjectExpertise: [{ 
        type: String 
    }],
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    // Classes/Subjects the teacher is assigned to teach
    assignedClasses: [{
        classRef: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Class' 
        },
        subject: { 
            type: String 
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Teacher', TeacherSchema);