import { FileDictionary } from "interfaces/files.interface";
import { Collections } from "../models";
import { ApiError } from "../utils/ApiError"
import { Request } from "express";
import { uploadToCloudinary } from "../utils/cloudinary";
import { generateAccessAndRefreshToken } from "../utils/generateJwt";
import Jwt, { Secret, JwtPayload } from "jsonwebtoken";
import { forgetPasswordMail, SentOtpToMail, SentRecoveryEmail, updatePasswordConfirmation } from "../emails/emails"
import { validatePassword } from "../utils/passwordValidator";
import { validateEmail } from "../utils/verifyEmail";
import { generateToken } from "../utils/createToken";
import { RedisHelpers } from "../utils/redisHelper";
import type { Server } from "socket.io";
import { generateOTP } from "../utils/generateOtp";
import passport from "passport";

export const signup = async (data: Request) => {

  const { firstName, lastName, username, email, phone, password } = data.body;

  if ([firstName, lastName, username, password].some(field => field === "")) {
    throw new ApiError(400, "All fields (firstName, lastName, username, password) are required and cannot be empty.");
  }

  if (!email && !phone) {
    throw new ApiError(400, "Either email or phone number must be provided.");
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (email && !emailRegex.test(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  const phoneRegex = /^\+?[1-9][0-9]{7,14}$/;
  if (phone && !phoneRegex.test(phone)) {
    throw new ApiError(400, "Please enter a valid phone number.");
  }

  const verifyPassword = validatePassword(password);
  if (!verifyPassword.valid) {
    throw new ApiError(400, verifyPassword.message!);
  }
  const existedUser = await Collections.UserModel.findOne({ $or: [{ username }, { email }] })
  if (existedUser) {
    throw new ApiError(400, "This email or username is already taken")
  }

  const files = data.files;

  const typedFiles = (data.files ?? {}) as FileDictionary;

  let profilePicPath = null;

  if (typedFiles.profilePic?.[0]?.path) {
    profilePicPath = typedFiles.profilePic[0]?.path;
  }

  let profile;

  if (profilePicPath != null) {
    profile = await uploadToCloudinary(profilePicPath)
  }
  const newUser = {
    fullName: firstName + " " + lastName,
    firstName,
    lastName,
    email: email ? email : null,
    phone: phone ? phone : null,
    username,
    profilePic: profile?.url,
    passwordHash: password
  }

  const User = await Collections.UserModel.create(newUser)

  const createUser = await Collections.UserModel.findById(User._id).select("-passwordHash -refreshToken")

  if (!createUser) {
    throw new ApiError(400, "something wents wrong while user signup")
  }
  let token
  if (createUser) {
    token = generateOTP()
    await RedisHelpers.setOtp(createUser.email, token)
  }

  const verificationPayload = {
    to: createUser.email!,
    Name: createUser.fullName,
    Token: Number(token)
  }

  if (createUser) {
    await SentOtpToMail(verificationPayload)
  }

  return createUser?._id.toString();
};

export const signIn = async (req: Request) => {
  const { email, password, username } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "Either email or username is required");
  }

  const user = await Collections.UserModel.findOne({
    $or: [{ username }, { email }],
    isDeleted: false
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid login details");
  }

  const objectIdString = user._id.toString();
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(objectIdString);

  user.lastActive = null;
  await user.save();

  const loggedIn = await Collections.UserModel.findById(user._id).select("-passwordHash -refreshToken");

  return { accessToken, refreshToken, loggedIn };
};

export const logout = async (req: Request, io?: Server) => {
  try {
    const userId = req.identity;
    if (!userId) throw new Error("User identity missing");

    await Collections.UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          refreshToken: null,
          lastActive: new Date(),
        },
      },
      { new: true }
    );

    await RedisHelpers.del(`user:socket:${userId}`);
    await RedisHelpers.del(`user:presence:${userId}`);

    if (io) {
      io.emit("user:status:update", {
        userId,
        status: "offline",
        lastActive: Date.now(),
      });
    }

    console.log(`🧹 Logout successful for ${userId}`);
    return { message: "Logout successful" };
  } catch (err) {
    console.error("❌ Logout error:", err);
    throw new Error("Failed to logout user");
  }
};

export const RefreshAccessToken = async (req: Request): Promise<{ accessToken: string; refreshToken: string }> => {
  const { token } = req.body;
  if (!token) throw new ApiError(401, "No refresh token provided");

  const secret = process.env.JWT_REFRESH_SECRET as Secret;
  if (!secret) throw new Error("JWT_REFRESH_SECRET not defined");

  let decoded;
  try {
    decoded = Jwt.verify(token, secret) as JwtPayload & { _id: string };
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await Collections.UserModel.findById(decoded._id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.refreshToken !== token) {
    throw new ApiError(403, "Refresh token invalid or reused");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

export const addRecoveryEmail = async (req: Request): Promise<boolean> => {
  const { recoveryEmail } = req.body;

  if (!req.identity) throw new ApiError(401, "Unauthorized");

  if (!recoveryEmail) throw new ApiError(400, "Recovery email is required");

  if (!validateEmail(recoveryEmail)) throw new ApiError(400, "Invalid email format");

  // Check if email is already used by another user
  const existingUser = await Collections.UserModel.findOne({ recoveryEmail, isDeleted: false });
  if (existingUser) throw new ApiError(400, "This recovery email is already in use");

  const user = await Collections.UserModel.findById(req.identity);
  if (!user) throw new ApiError(404, "User not found");

  user.recoveryEmail = recoveryEmail;
  const newUser = await user.save();

  const payload = {
    recoveryEmail: newUser!.recoveryEmail,
    email: newUser!.email,
    Name: newUser!.firstName
  }

  await SentRecoveryEmail(payload)
  return true;
};

export const autoLogin = async (req: Request) => {
  const { id } = req.body

  if (!id) throw new ApiError(401, "id not provided");

  const user = await Collections.UserModel.findOne({
    _id: id,
    isDeleted: false
  }).select("-passwordHash -refreshToken")

  if (!user) throw new ApiError(404, "User not found");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(id)

  return { loggedIn: user, accessToken: accessToken, refreshToken: refreshToken };
};

// export const sendEmailVerification = async (req: Request) => {

//   const user = await Collections.UserModel.findOne({ email: req?.User?.email, isDeleted: false })

//   if (!user) throw new ApiError(400, "Unauthorized");
//   if (user?.isemailVerified) throw new ApiError(400, "your email is verified.")

//   const { rawToken, hashedToken } = await generateToken(8)

//   const tokenuser = await Collections.UserModel.findOneAndUpdate({
//     email: req?.User?.email,
//     isDeleted: false
//   }, {
//     $set: {
//       Token: hashedToken,
//       TokenExpiry: Date.now() + 5 * 60 * 1000
//     }
//   }, {
//     new: true
//   })
//   const payload = {
//     to: tokenuser?.email,
//     Token: rawToken,
//     Name: tokenuser?.firstName
//   }

//   await SentOtpToMail(payload)

// }

export const verifyOtp = async (req: Request) => {
  const { token, userId } = req.body;

  const user = await Collections.UserModel.findById(userId);

  if (!user) throw new ApiError(404, "User not found");

  if (!token) throw new ApiError(400, "otp not found.");

  const emailExist = await RedisHelpers.getOtp(user?.email)
  if (!emailExist) throw new ApiError(400, "OTP expired or not found")

  const otpVerified = await RedisHelpers.verifyOtp({ email: user.email, submittedOtp: token })

  if (!otpVerified) {
    throw new ApiError(400, "Invalid OTP");
  }

  const verifiedUser = await Collections.UserModel.findByIdAndUpdate(
    userId,
    {
      isVerified: true,
      isOtpVerified: true
    },
    { new: true }
  ).select("-passwordHash -refreshToken -isDeleted");

  await RedisHelpers.deleteOtp(verifiedUser!.email)
  return verifiedUser?._id;
};

export const sendForgetPasswordMail = async (req: Request) => {
  const email = req?.User?.email
  const Name = req?.User?.fullName

  const { rawToken, hashedToken } = await generateToken(10)

  await Collections.UserModel.findOneAndUpdate({ email: email }, { $set: { Token: hashedToken, TokenExpiry: Date.now() + 10 * 60 * 1000 } })

  const info = await forgetPasswordMail({ email: email!.toString(), Token: rawToken, Name })

  return info;
}

// export const resetPassword = async (req: Request): Promise<boolean> => {
//   const { email, token, newPassword } = req.body;

//   // Validate fields separately
//   if (!email) throw new ApiError(400, "Email is required.");
//   if (!token) throw new ApiError(400, "Reset token is required.");
//   if (!newPassword) throw new ApiError(400, "New password is required.");

//   // Find user
//   const user = await Collections.UserModel.findOne({ email, isDeleted: false });
//   if (!user) throw new ApiError(404, "User not found.");

//   // Validate token
//   const isValid = await verifyToken(token, user.Token, user.TokenExpiry);
//   if (!isValid) {
//     throw new ApiError(
//       400,
//       "This reset link is invalid or has expired. Please request a new one."
//     );
//   }

//   const verifyPassword = validatePassword(newPassword);
//   if (!verifyPassword.valid) {
//     throw new ApiError(400, verifyPassword.message!);
//   }    // Update password (pre-hook will hash it)
//   user.passwordHash = newPassword;
//   user.Token = null;
//   user.TokenExpiry = null;

//   const payload = {
//     email: user?.email!,
//     Name: user?.fullName!
//   }
//   await updatePasswordConfirmation(payload)

//   await user.save();

//   return true;
// }

export const changePassword = async (req: Request): Promise<boolean> => {
  const { newPassword, password } = req.body;

  if (!password) throw new ApiError(400, "Old password is required.");
  if (!newPassword) throw new ApiError(400, "New password is required.");

  const user = await Collections.UserModel.findById(req.identity);
  if (!user) throw new ApiError(404, "User not found.");

  const passwordVerify = await user.isPasswordCorrect(password);
  if (!passwordVerify) throw new ApiError(400, "Old password is incorrect.");

  const verifyPassword = validatePassword(newPassword);
  if (!verifyPassword.valid) {
    throw new ApiError(400, verifyPassword.message || "Invalid new password format.");
  }

  user.passwordHash = newPassword;

  const payload = {
    email: user?.email!,
    Name: user?.fullName
  }
  await updatePasswordConfirmation(payload)
  await user.save();

  return true;
};

export const getUser = async (req: Request) => {
  const user = await Collections.UserModel.findById(req.identity).select(
    `-passwordHash
     -otp 
     -Token 
     -TokenExpiry 
     -isDeleted 
     -createdAt
     -otpExpiry
     -__v
     `);

  if (!user) throw new ApiError(400, "unauthorized");

  return user
}

export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const resendOtp = async (req: Request) => {
  const { id } = req.body;

  const user = await Collections.UserModel.findById(id)

  if (!user) throw new ApiError(400, "user not found");

  const token = generateOTP()

  if (token) {
    await RedisHelpers.setOtp(user.email, token)
  }

  const verificationPayload = {
    to: user.email!,
    Name: user.fullName,
    Token: Number(token)
  }

  await SentOtpToMail(verificationPayload)

}

export const googleCallback = async (req: Request) => {
  const googleUser = (req?.user as any)?._id;
  if (!googleUser) throw new ApiError(400, "google user not found");
  const userId = googleUser;
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userId);

  const redirectURL = `${process.env.CLIENT_URI}/auth/success?accessToken=${accessToken}&refreshToken=${refreshToken}&id=${userId}`;
  return redirectURL;
}