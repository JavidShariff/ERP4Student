import mongoose from 'mongoose';

const ScheduleEntrySchema = new mongoose.Schema({
    classRef: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        required: true 
    },
    teacherRef: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Teacher', 
        required: true 
    },
    subject: { 
        type: String, 
        required: true 
    },
    dayOfWeek: { 
        type: String, 
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: { 
        type: String, // Use string for easier time comparison (e.g., "09:00")
        required: true 
    },
    endTime: { 
        type: String, 
        required: true 
    },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    roomNumber: { 
        type: String 
    }
}, { timestamps: true });

module.exports = mongoose.model('ScheduleEntry', ScheduleEntrySchema);