import {
    createSchool,
    loginUser,
    logoutUser,
    getCurrentUser  
} from "../controllers/auth.controller.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {Router} from "express";

const router = Router();

router.post("/create-school",asyncHandler(createSchool));
router.post("/login",asyncHandler(loginUser));
router.post("/logout",asyncHandler(logoutUser));
router.get("/current-user",asyncHandler(getCurrentUser));

export default router;