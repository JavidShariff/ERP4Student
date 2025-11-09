import { asyncHandler } from "../utils/asyncHandler.js";
import School from "../models/school.model.js";
import User from "../models/user.model.js";
import {ApiErrors} from "../utils/ApiErrors.js"
import ApiResponse from "../utils/ApiResponse.js";
import { json } from "express";
import jwt from "jsonwebtoken";
import { options } from "../constants.js";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userId)=>{
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_SECRET_EXPIRY || '15m' }
    );
    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_SECRET_EXPIRY || '7d' }
    );
    return {accessToken,refreshToken};
}


const createSchool = asyncHandler(async (req, res) => {
    // Destructure required fields for the School and the Admin User
    const { name, email, address, contact, planType, schoolCode, password } = req.body; 
    
    // 1. VALIDATE SCHOOL CODE UNIQUENESS
    const schoolExist = await School.findOne({ schoolCode });
    if (schoolExist) {
        // Correct error message for the field that failed the check
        throw new ApiErrors(400, "School Code is already taken. Please choose a different code.");
    }
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

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(adminUser._id);

    // 6. RESPOND WITH SUCCESS (and possibly automatic token generation/login)
    // In a real flow, you would generate a JWT token and log the admin in immediately here.
    // For this example, we just send a confirmation.

    res.status(201)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(201, "School and Admin account successfully created.", {
        schoolId: schoolId,
        adminId: adminUser._id
    }));

});


const loginUser = asyncHandler(async (req,res)=>{
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if(!user){
        throw new ApiErrors(404,"User not found with this email.");
    }
    const isPasswordValid = await user.isPasswordValid(password);
    if(!isPasswordValid){
        throw new ApiErrors(401,"Invalid password.");
    }
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);
    res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,"Login successful.",{
        userId: user._id,
        role: user.role,
        schoolId: user.schoolId,
        email: user.email,
        schoolCode: user.schoolCode
    }));   
})

const logoutUser = asyncHandler(async (req,res)=>{
    res.status(200)
    .cookie("accessToken","",{  
        httpOnly: true,
        expires: new Date(0)
    })
    .cookie("refreshToken","",{
        httpOnly: true,
        expires: new Date(0)
    })
    .json(new ApiResponse(200,"Logout successful."));
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password");
    if(!user){
        throw new ApiErrors(404,"User not found.");
    }   
    res.status(200).json(new ApiResponse(200,"User fetched successfully.",user));
})

export {
    createSchool,
    loginUser,
    logoutUser,
    getCurrentUser
};