import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  contact: String,
    schoolCode: { 
        type: String, 
        required: true, 
        unique: true, // Crucial for security and uniqueness validation
        uppercase: true, // Recommended: Standardize input
        trim: true,
        minlength: 3 
    },
  planType: { type: String, default: "Free" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("School", schoolSchema);
