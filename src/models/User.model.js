import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is a required field"]
    },
    email: {
        type: String,
        required: [true, "Email is a required field"],
        unique: [true, "An accout with this email already exists"]
    },
    password: {
        type: String,
        required: [true, "Password is a required field"],
    },
    verified: {
        type: Boolean,
        default: false
    }
    
})

const User = mongoose.model("User", userSchema)
export default User 