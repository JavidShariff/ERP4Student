import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN, 
    credentials: true 
}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({limit:"16kb",extended:true}));
app.use(express.static("public"));
app.use(cookieParser());

import authRouter from "./routes/auth.route.js"
// import adminRouter from "./routes/admin.route.js"
// import teacherRouter from "./routes/teacher.route.js"
// import studentRouter from "./routes/student.route.js"
// import classRouter from "./routes/class.route.js"   

app.use("/api/v1/auth",authRouter);
// app.use("/api/v1/admin",adminRouter);
// app.use("/api/v1/teacher",teacherRouter);
// app.use("/api/v1/student",studentRouter);
// app.use("/api/v1/class",classRouter);

export {app};