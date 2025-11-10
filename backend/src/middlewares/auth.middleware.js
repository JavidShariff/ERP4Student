import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Adjust path as needed
import ApiErrors from '../utils/ApiErrors.js'; // Adjust path as needed

// Configuration
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

export const authenticate = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        throw new ApiErrors(401, "Unauthorized access: Access Token missing.");
    }

    try {
        const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);

        const { userId, role, schoolId } = decodedToken;


        req.user = { 
            userId: userId, 
            role: role, 
            schoolId: schoolId 
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
             throw new ApiErrors(401, "Access Token expired. Please refresh.");
        }
        throw new ApiErrors(401, "Invalid Access Token.");
    }
});



export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        throw new ApiErrors(403, "Forbidden: Requires Admin privileges.");
    }
};

export const isTeacher = (req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
        next();
    } else {
        throw new ApiErrors(403, "Forbidden: Requires Teacher privileges.");
    }
};

export const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        throw new ApiErrors(403, "Forbidden: Requires Student privileges.");
    }
};

export const isTeacherOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        next();
    } else {
        throw new ApiErrors(403, "Forbidden: Requires Teacher or Admin privileges.");
    }
};