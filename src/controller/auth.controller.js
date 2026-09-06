import User from "../models/User.model.js";
import Session from "../models/Session.model.js";
import OTP from "../models/OTP.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import RandomOTP from "../utils/otp.utils.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 24 * 60 * 60 * 1000
};

export async function Register(req, res) {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        const otp = RandomOTP();
        const hashedOTP = await bcrypt.hash(String(otp), 10);

        await OTP.create({
            email,
            otp: hashedOTP,
            user: newUser._id,
            purpose: "verify-email",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        await sendVerificationEmail({
            to: email,
            otp
        });

        const accessToken = jwt.sign(
            { userId: newUser._id },
            config.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { userId: newUser._id },
            config.REFRESH_TOKEN_SECRET,
            { expiresIn: "15d" }
        );

        await Session.create({
            user: newUser._id,
            refreshToken,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                email: newUser.email,
                username: newUser.username
            },
            accessToken,
            verified: newUser.verified
        });
    } catch (error) {
        console.error("Error during registration:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function verifyEmail(req, res) {
    const { email, otp } = req.body;

    try {
        const otpDocument = await OTP.findOne({
            email,
            purpose: "verify-email"
        }).sort({ createdAt: -1 });

        if (!otpDocument) {
            return res.status(400).json({
                success: false,
                message: "No OTP found for this email"
            });
        }

        if (otpDocument.expiresAt < new Date()) {
            await OTP.deleteOne({ _id: otpDocument._id });

            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }

        if (otpDocument.attempts >= 5) {
            return res.status(400).json({
                success: false,
                message: "Maximum OTP attempts exceeded"
            });
        }

        const isOTPValid = await bcrypt.compare(
            String(otp),
            otpDocument.otp
        );

        if (!isOTPValid) {
            otpDocument.attempts += 1;
            await otpDocument.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        const user = await User.findById(otpDocument.user);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.verified = true;
        await user.save();

        await OTP.deleteOne({
            _id: otpDocument._id
        });

        const oldSession = await Session.findOne({
            user: user._id
        }).sort({ createdAt: -1 });

        const accessToken = jwt.sign(
            { userId: user._id },
            config.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            config.REFRESH_TOKEN_SECRET,
            { expiresIn: "15d" }
        );

        if (oldSession) {
            await Session.deleteOne({
                _id: oldSession._id
            });
        }

        await Session.create({
            user: user._id,
            refreshToken,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                username: user.username,
                email: user.email
            },
            accessToken,
            verified: user.verified
        });
    } catch (error) {
        console.error("Error during email verification:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function Login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "An account with this email doesn't exist"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password"
            });
        }

        const accessToken = jwt.sign(
            { userId: user._id },
            config.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            config.REFRESH_TOKEN_SECRET,
            { expiresIn: "15d" }
        );

        await Session.create({
            user: user._id,
            refreshToken,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        return res
            .status(200)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json({
                success: true,
                message: "Login successful",
                user: {
                    username: user.username,
                    email: user.email
                },
                accessToken,
                verified: true
            });
    } catch (error) {
        console.error("Error during login:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function refreshToken(req, res) {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token required"
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            config.REFRESH_TOKEN_SECRET
        );

        const validRefreshToken = await Session.findOne({
            refreshToken,
            user: decoded.userId
        });

        if (!validRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const accessToken = jwt.sign(
            { userId: user._id },
            config.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        const newRefreshToken = jwt.sign(
            { userId: user._id },
            config.REFRESH_TOKEN_SECRET,
            { expiresIn: "15d" }
        );

        await Session.deleteOne({
            _id: validRefreshToken._id
        });

        await Session.create({
            user: user._id,
            refreshToken: newRefreshToken,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        res.cookie(
            "refreshToken",
            newRefreshToken,
            cookieOptions
        );

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            accessToken
        });
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token"
            });
        }

        console.error("Error during token refresh:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function getMe(req, res) {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "Access token required"
            });
        }

        const decoded = jwt.verify(
            accessToken,
            config.ACCESS_TOKEN_SECRET
        );

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User doesn't exist"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Fetched successfully",
            user: {
                username: user.username,
                email: user.email
            },
            verified: user.verified
        });
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired access token"
            });
        }

        console.error("Error during getMe:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function logout(req, res) {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "User already logged out"
            });
        }

        const validRefreshToken = await Session.findOne({
            refreshToken
        });

        if (!validRefreshToken) {
            res.clearCookie("refreshToken", cookieOptions);

            return res.status(400).json({
                success: false,
                message: "User already logged out"
            });
        }

        await Session.deleteOne({
            _id: validRefreshToken._id
        });

        res.clearCookie("refreshToken", cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Error during logout:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function logoutAllDevices(req, res) {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "Access token required"
            });
        }

        const decoded = jwt.verify(
            accessToken,
            config.ACCESS_TOKEN_SECRET
        );

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await Session.deleteMany({
            user: user._id
        });

        res.clearCookie("refreshToken", cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Logged out from all devices successfully"
        });
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired access token"
            });
        }

        console.error("Error during logout all devices:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function resendOTP(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.verified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }

        await OTP.deleteMany({
            user: user._id,
            purpose: "verify-email"
        });

        const otp = RandomOTP();
        const hashedOTP = await bcrypt.hash(String(otp), 10);

        await OTP.create({
            email,
            otp: hashedOTP,
            user: user._id,
            purpose: "verify-email",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        await sendVerificationEmail({
            to: email,
            otp
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (error) {
        console.error("Error during OTP resend:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await OTP.deleteMany({
            user: user._id,
            purpose: "forgot-password"
        });

        const otp = RandomOTP();
        const hashedOTP = await bcrypt.hash(String(otp), 10);

        await OTP.create({
            email,
            otp: hashedOTP,
            user: user._id,
            purpose: "forgot-password",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        await sendPasswordResetEmail({
            to: email,
            otp
        });

        return res.status(200).json({
            success: true,
            message: "Password reset OTP sent successfully"
        });
    } catch (error) {
        console.error("Error during forgot password:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function resetPassword(req, res) {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP and new password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const otpDocument = await OTP.findOne({
            user: user._id,
            email,
            purpose: "forgot-password"
        }).sort({ createdAt: -1 });

        if (!otpDocument) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        if (otpDocument.expiresAt < new Date()) {
            await OTP.deleteOne({
                _id: otpDocument._id
            });

            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }

        if (otpDocument.attempts >= 5) {
            return res.status(400).json({
                success: false,
                message: "Maximum OTP attempts exceeded"
            });
        }

        const isOTPValid = await bcrypt.compare(
            String(otp),
            otpDocument.otp
        );

        if (!isOTPValid) {
            otpDocument.attempts += 1;
            await otpDocument.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        user.password = hashedPassword;

        await user.save();

        await OTP.deleteOne({
            _id: otpDocument._id
        });

        await Session.deleteMany({
            user: user._id
        });

        res.clearCookie("refreshToken", cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error("Error during password reset:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}