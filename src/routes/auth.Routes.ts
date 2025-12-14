import { authController } from "../controllers";
import { Router } from "express";
import { uploadImage } from "../middlewares/multer.middleware";
import { resendOtpRateLimiter, resetPasswordRateLimiter } from "../utils/rateLimiter";
import { authService } from "../services";
import passport from "passport";

const AuthRoute = Router();

/**
 * @route   POST /signup
 * @desc    Register a new user with optional profile picture and cover image
 * @access  Public
 */
AuthRoute.route("/signup").post(
    uploadImage.fields([
        { name: "profilePic", maxCount: 1 },
    ]),
    authController.signup
);

/**
 * @route   POST /login
 * @desc    Authenticate user and issue tokens
 * @access  Public
 */
AuthRoute.route("/login").post(authController.signIn);

/**
 * @route   POST /logout
 * @desc    Invalidate user session and tokens
 * @access  Private
 */
AuthRoute.route("/logout").post(authController.logout);

/**
 * @route   POST /refreshAccessToken
 * @desc    Refresh expired access token using a valid refresh token
 * @access  Public
 */
AuthRoute.route("/refreshAccessToken").post(authController.RefreshAccessToken);

/**
 * @route   POST /google
 * @desc    Authenticate user via Google OAuth
 * @access  Public
 */
AuthRoute.route("/google").get(passport.authenticate("google", {scope: ["profile", "email"], session: false }));


/**
 * @route   POST /google/Callback
 * @desc    Authenticate or register user
 * @access  Public
 */
AuthRoute.route("/google/callback").get(passport.authenticate("google", { session: false }),authController.googleCallback);

/**
 * @route   POST /add-RecoveryEmail
 * @desc    Add or update a recovery email for account recovery
 * @access  Private
 */
AuthRoute.route("/add-RecoveryEmail").post(authController.addRecoveryEmail);

/**
 * @route   POST /auto-Login
 * @desc    Automatically log in user (token-based or session check)
 * @access  Public
 */
AuthRoute.route("/auto-login").post(authController.autoLogin);

/**
 * @route   POST /resend-otp
 * @desc    Automatically log in user (token-based or session check)
 * @access  Public
 */
AuthRoute.route("/resendOTP").post(resendOtpRateLimiter,authController.resendOTP);


/**
 * @route   POST /send-emailVarification
 * @desc    Send verification email to confirm user’s email address
 * @access  Private
 */
AuthRoute.route("/send-emailVerification").post(authController.sendEmailVerification);

/**
 * @route   POST /verifyEmail
 * @desc    Verify user’s email address using the verification code/link
 * @access  Public
 */
AuthRoute.route("/verify-otp").post(authController.verifyOtp);

/**
 * @route   PATCH /resetPassword
 * @desc    Reset user’s password using a valid token (rate-limited)
 * @access  Public
 */
AuthRoute.route("/reset-password").patch(
    resetPasswordRateLimiter,
    authController.resetPassword
);

/**
 * @route   PATCH /changePassword
 * @desc    change user’s password by verifing old password
 * @access  Private
 */
AuthRoute.route("/change-password").patch(
    authController.changePassword
);


/**
 * @route   get /me
 * @desc    get user Detail's
 * @access  Private
 */
AuthRoute.route("/me").get(
    authController.getUser
);

export { AuthRoute };
