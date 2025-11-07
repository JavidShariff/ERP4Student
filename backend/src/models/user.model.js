import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";
const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true, 
        enum: ['admin', 'teacher', 'student'] 
    },
    profileRef: {
        // This will be populated based on the 'role' field
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // We use virtuals or logic in the controller to determine the 'ref' dynamically
    },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    isSuspended: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) next();
    const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password,salt);
  next();
})

userSchema.methods.isPasswordCorrect = async function (password){
  return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = async function (){
  return jwt.sign(
  {
    _id : this._id,
    fullname: this.fullname,
    username:this.username,
    email:this.email
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn : process.env.ACCESS_TOKEN_EXPIRY
  }
)}

userSchema.methods.generateRefreshToken = async function (){
  return jwt.sign(
  {
    _id : this._id
  },
  process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn : process.env.REFRESH_TOKEN_EXPIRY
  }
)
};

module.exports = mongoose.model('User', UserSchema);