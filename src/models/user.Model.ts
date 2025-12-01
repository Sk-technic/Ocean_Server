import { Schema, model, } from 'mongoose';
import { IUser } from '../interfaces/user.Interface';
import bcrypt from "bcrypt"
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
// User Schema
const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    fullName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, lowercase: true },
    lastName: { type: String, required: true, lowercase: true },
    email: { type: String, unique: true, default: null },
    recoveryEmail: {
        type: String,
        unique: true,
        sparse: true,
    },
    isDeleted: { type: Boolean, default: false },
    phone: { type: String, default: null },
    passwordHash: { type: String, required: true },
    isPrivate:{ type:Boolean, default:false },
    profilePic: { type: String, default: null },
    bio: { type: String, default: '' },
    coverImage: { type: String, default: null },
    socialLinks: { type: Map, of: String, default: {} },
    status: {
        type: String,
        enum: ['active', 'banned', 'suspended'],
        default: 'active'
    },
    isActive:{
        type:String,
        enum:['online','offline','away'],
        default:'offline'
    },
    language: {
        type: String,
        required: true,
        default: 'en'
    },
    isVerified: { type: Boolean, default: false },
    isemailVerified: { type: Boolean, default: false },
    isphoneVerified: { type: Boolean, default: false },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    lastActive:{
        type:Date,
        default:null
    },
    otp: {
        type: String,
        default: ''
    },
    Token: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    TokenExpiry: {
        type: Date,
        default: null
    },
    refreshToken: {
        type: String,
        default: null
    },
    googleId: {
        type: String,
        default: null
    },
    //videos,reels and posts
    postCount: { type: Number, default: 0 },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    videosCount: { type: Number, default: 0 },
    reelsCount: { type: Number, default: 0 },
    //subscriptions
    subscriptionStartedAt: { type: Date },
    subscriptionExpiresAt: { type: Date },
    subscriptionStatus: { type: String },
    subscriptionPlanId: {
        type: Schema.Types.ObjectId,
        ref: "Subscriptions"
    },
    subscribedCount: { type: Number, default: 0 },
    subscriptionsCount: { type: Number, default: 0 },
    //settings and notifications
    notificationPrefs: { type: Schema.Types.Mixed, default: {} },
    privacySettings: { type: Schema.Types.Mixed, default: {} },
    reportedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    blockedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
}, {
    timestamps: true
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("passwordHash")) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10)
    next();
})
userSchema.methods.isPasswordCorrect = async function (password: string) {
    return bcrypt.compare(password, this.passwordHash)
}
userSchema.methods.isOTPCorrect = async function (otp: string) {
    return bcrypt.compare(otp, this.otp)
}

userSchema.methods.generateAccessToken = function (): string {
    const JWT_SECRET = process.env.JWT_ACCESS_SECRET as Secret;
    const EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRE || "1h") as SignOptions["expiresIn"];
    const options: SignOptions = { expiresIn: EXPIRES_IN };
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            username: this.username,
        },
        JWT_SECRET,
        options
    );
};

userSchema.methods.generateRefreshToken = function (): string {

    const JWT_SECRET = process.env.JWT_REFRESH_SECRET as Secret;
    const EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRE || "1h") as SignOptions["expiresIn"];
    const options: SignOptions = { expiresIn: EXPIRES_IN };

    return jwt.sign(
        {
            _id: this._id,
        },
        JWT_SECRET,
        options
    );
};


export const UserModel = model<IUser>('User', userSchema);

