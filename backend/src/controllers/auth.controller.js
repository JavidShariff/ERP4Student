import { asyncHandler } from "../utils/asyncHandler.js";
import School from "../models/school.model.js";
import User from "../models/user.model.js";
import refreshToken from "../models/refreshToken.model.js";
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
    console.log(`\n🔍 Checking if school code exists: ${schoolCode} -> ${schoolExist ? 'FOUND' : 'NOT FOUND'}`) ;
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
        schoolCode,
    });
    console.log(`\n🏫 School created successfully: ${school}`) ;
    const schoolId = school._id;
    console.log(`\n🏷️  New School ID: ${schoolId}`);

    // 4. CREATE THE ADMIN USER FOR THIS SCHOOL
    const adminUser = await User.create({
        email,
        password, // *** CORRECTED: USE THE HASHED PASSWORD ***
        role: 'admin',
        schoolId, // Link to the new School record
        profileRef: new mongoose.Types.ObjectId() // Placeholder 
    });

    console.log(`\n🎉 Admin user created successfully for school: ${schoolCode}`);

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(adminUser._id);

 // --- REFRESH TOKEN TRACKING DATA ---
    const rawUserAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.headers['x-forwarded-for'] || req.ip;
    const clientDeviceId = deviceId || null; 

    // --- REFRESH TOKEN EXPIRATION CALCULATION ---
    const REFRESH_TOKEN_LIFESPAN_DAYS = parseInt(process.env.JWT_REFRESH_SECRET_EXPIRY) || 60;
    
    // Use getTime() for cleaner calculation (milliseconds)
    const nowTimestamp = Date.now();
    // 1 day = 24 * 60 * 60 * 1000 milliseconds
    const expirationMs = nowTimestamp + (REFRESH_TOKEN_LIFESPAN_DAYS * 24 * 60 * 60 * 1000); 
    const expiresAt = new Date(expirationMs); 
    
    // 6. SAVE REFRESH TOKEN TO DB
    await refreshToken.create({
        token: refreshToken, // The unique token string
        userId: adminUser._id,
        schoolId: schoolId,
        userAgent: rawUserAgent,
        deviceId: clientDeviceId, 
        ipAddress,
        expiresAt: expiresAt, 
    });

    // 7. RESPOND AND SEND COOKIES
    // Ensure you have defined 'options' for cookie security (httpOnly, secure)
    const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production' };

    return res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(201, "School and Admin account successfully created.", {
            schoolId: schoolId,
            adminId: adminUser._id,
            accessToken // Send access token in JSON body too, common practice
        }));
});


const loginUser = asyncHandler(async (req, res) => {
    // 1. Get ALL required input fields
    const { schoolCode, email, password, deviceId } = req.body; 

    // --- TENANT ISOLATION STEP ---
    // 2. Find the School ID using the School Code (The master tenant key)
    const school = await School.findOne({ schoolCode });
    if (!school) {
        throw new ApiErrors(404, "Invalid School Code or School not found.");
    }
    const schoolId = school._id;

    // 3. Find the User using BOTH email AND schoolId (Crucial Security Step)
    const user = await User.findOne({ email, schoolId });
    if (!user) {
        // Return a generic error to prevent email harvesting
        throw new ApiErrors(401, "Invalid credentials (email or password)."); 
    }

    // 4. Validate Password
    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) {
        throw new ApiErrors(401, "Invalid credentials (email or password).");
    }

    // 5. Generate Tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // --- REFRESH TOKEN SAVING AND SESSION TRACKING ---
    
    // 6. Calculate Refresh Token Expiration Date
    const REFRESH_TOKEN_LIFESPAN_DAYS = parseInt(process.env.JWT_REFRESH_SECRET_EXPIRY) || 60;
    const nowTimestamp = Date.now();
    const expirationMs = nowTimestamp + (REFRESH_TOKEN_LIFESPAN_DAYS * 24 * 60 * 60 * 1000); 
    const expiresAt = new Date(expirationMs); 

    // 7. Extract Session Tracking Data
    const rawUserAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.headers['x-forwarded-for'] || req.ip;
    const clientDeviceId = deviceId || null; 
    
    // 8. Save Refresh Token to DB
    await refreshToken.create({
        token: refreshToken, 
        userId: user._id,
        schoolId: schoolId,
        userAgent: rawUserAgent,
        ipAddress: ipAddress,
        deviceId: clientDeviceId, 
        expiresAt: expiresAt, 
    });


    // 9. Final Response
    const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production' };

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, "Login successful.", {
            // Note: Use school.schoolCode, not user.schoolCode
            userId: user._id,
            role: user.role,
            schoolId: user.schoolId, 
            email: user.email,
            schoolCode: school.schoolCode // Get code from the School record
        })); 
});

const logoutUser = asyncHandler(async (req, res) => {
    // 1. Identify the Refresh Token from the request cookies
    const clientRefreshToken = req.cookies.refreshToken;

    // Check if the token was present before attempting database operations
    if (clientRefreshToken) {
        // 2. REVOKE TOKEN: Delete the refresh token document from the database
        // This is the CRITICAL security step to instantly invalidate the session.
        await refreshToken.deleteOne({ token: clientRefreshToken });

        console.log(`\n🔑 Successfully revoked refresh token from DB.`);
    }
    // 3. CLEAR COOKIES: Instruct the client to delete both tokens
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0) // Expires the cookie immediately
    };
    
    return res.status(200)
        .clearCookie("accessToken", cookieOptions) // Use clearCookie or set with expires: new Date(0)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, "Logout successful and session revoked."));
});

const getCurrentUser = asyncHandler(async (req,res)=>{
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password");
    if(!user){
        throw new ApiErrors(404,"User not found.");
    }   
    res.status(200).json(new ApiResponse(200,"User fetched successfully.",user));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // 1. Retrieve the old refresh token from the cookie
    const clientRefreshToken = req.cookies.refreshToken;
    
    if (!clientRefreshToken) {
        throw new ApiErrors(401, "Refresh Token missing or unauthorized.");
    }

    // 2. Database Lookup and Validation (Stateful Check)
    const foundToken = await refreshToken.findOne({ token: clientRefreshToken });

    if (!foundToken) {
        // Token was not found (likely expired or manually revoked)
        throw new ApiErrors(401, "Invalid or revoked Refresh Token.");
    }

    // 2b. Check database-level expiration (TTL index handles auto-cleanup, but check for safety)
    if (foundToken.expiresAt < Date.now()) {
        // Optionally delete the expired token here if TTL hasn't run yet
        await refreshToken.deleteOne({ _id: foundToken._id });
        throw new ApiErrors(401, "Refresh Token expired.");
    }
    
    // 3. Generate New Tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
        await generateAccessAndRefreshToken(foundToken.userId);

    // --- 4. Revoke Old Token (CRITICAL SECURITY STEP) ---
    // Delete the old token record to prevent replay attacks
    await refreshToken.deleteOne({ _id: foundToken._id });

    // --- 5. Save New Token with Updated Session Info ---
    
    // Recalculate new expiration date
    const LIFESPAN_DAYS = parseInt(process.env.JWT_REFRESH_SECRET_EXPIRY) || 60;
    const expirationMs = Date.now() + (LIFESPAN_DAYS * 24 * 60 * 60 * 1000); 
    const newExpiresAt = new Date(expirationMs); 

    // Create new token record with inherited or updated session data
    await refreshToken.create({
        token: newRefreshToken,
        userId: foundToken.userId,
        schoolId: foundToken.schoolId,
        userAgent: foundToken.userAgent, // Keep the original session details
        ipAddress: req.headers['x-forwarded-for'] || req.ip, // Update IP just in case
        deviceId: foundToken.deviceId,
        expiresAt: newExpiresAt,
    });

    // 6. Send New Tokens to Client via secure cookies
    const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production' };
    
    return res.status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json({ success: true, message: "Tokens refreshed successfully." });
});
export {
    createSchool,
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken
};