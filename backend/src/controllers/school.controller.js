import { asyncHandler } from "../utils/asyncHandler.js";
import School from "../models/school.model.js";
import {ApiErrors} from "../utils/ApiErrors.js"
import {UploadOnCloudinary} from "../utils/Cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js";
import { json } from "express";
import jwt from "jsonwebtoken";
import { options } from "../constants.js";
import mongoose from "mongoose";


const createSchool = asyncHandler(async (req, res) => {
    // Destructure required fields for the School and the Admin User
    const { name, email, address, contact, planType, schoolCode, password } = req.body; 
    
    // 1. VALIDATE SCHOOL CODE UNIQUENESS
    const schoolExist = await School.findOne({ schoolCode });
    if (schoolExist) {
        // Correct error message for the field that failed the check
        throw new ApiErrors(400, "School Code is already taken. Please choose a different code.");
    }
    
    // 2. HASH PASSWORD (Do this early for security and error checking)


    // 3. CREATE THE SCHOOL RECORD (DO NOT pass password or email here)
    const school = await School.create({ 
        name, 
        address, 
        contact, 
        planType, 
        schoolCode 
    });

    const schoolId = school._id;

    // 4. CHECK FOR EXISTING ADMIN EMAIL (Optional, but good integrity check)
    // Checking for an existing admin for *this specific school* is redundant since it was just created,
    // but a check for email uniqueness *globally* is recommended if you allow cross-school accounts.
    // For now, we rely on the successful creation of the User below.

    // 5. CREATE THE LINKED ADMIN USER
    const adminUser = await User.create({
        email,
        password: hashedPassword, // *** CORRECTED: USE THE HASHED PASSWORD ***
        role: 'admin',
        schoolId, // Link to the new School record
        profileRef: new mongoose.Types.ObjectId() // Placeholder 
    });

    console.log(`\n🎉 Admin user created successfully for school: ${schoolCode}`);

    // 6. RESPOND WITH SUCCESS (and possibly automatic token generation/login)
    // In a real flow, you would generate a JWT token and log the admin in immediately here.
    // For this example, we just send a confirmation.

    res.status(201).json(new ApiResponse(201, "School and Admin account successfully created.", {
        schoolId: schoolId,
        adminId: adminUser._id
    }));

});

export default createSchool;