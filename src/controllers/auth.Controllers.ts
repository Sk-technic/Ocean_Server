import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response, CookieOptions } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { authService } from "../services";

export const signup = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.signup(req)
    return res.status(201).json(
        new ApiResponse(200, result, "Signup Successfull.")
    )
})

export const signIn = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.signIn(req)
     return res.status(200).json(new ApiResponse(200, result, "Login successful."));

})

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.logout(req)
    return res.status(200).json(new ApiResponse(200, result, "logout successfull."))
})

export const RefreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.RefreshAccessToken(req)
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", result?.accessToken, options)
        .cookie("refreshToken", result?.refreshToken, options)
        .json(new ApiResponse(200, result, "AccessToken Refreshed."))
})

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    // const result = await authService.resetPassword(req);
    return res.status(200).json(new ApiResponse(200, [], "Reset Password Successfully"))
})

export const sendForgetPasswordMail = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.sendForgetPasswordMail(req);
    return res.status(200).json(
        new ApiResponse(200, [], "Password reset email has been sent successfully.")
    );
})

export const addRecoveryEmail = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.addRecoveryEmail(req);
    return res.status(200).json(new ApiResponse(200, result, "Recovery Email Added"))

})

export const autoLogin = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.autoLogin(req)
    return res.status(200)
        .cookie("accessToken", result?.accessToken)
        .json(
            new ApiResponse(200, result, "Auto-login successful. You are now logged in.")
        );
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.verifyOtp(req);
    return res.status(200).json(
        new ApiResponse(200, result, "Your Email is now verified")
    );
})

export const resendOTP = asyncHandler(async (req:Request,res:Response) => {
    await authService.resendOtp(req)
    return res.status(200).json(
        new ApiResponse(200, [], "OTP resend successfully")
    );
})

export const sendEmailVerification = asyncHandler(async (req: Request, res: Response) => {
    // const result = await authService.sendEmailVerification(req);
    return res.status(200).json(
        new ApiResponse(200, [], "Verification token sent to your email.")
    );
})

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.changePassword(req)
    return res.status(200).json(
        new ApiResponse(200, [], "Your password has been updated successfully.")
    );
})

export const getUser = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.getUser(req)
    return res.status(200).json(
        new ApiResponse(200, result, "fetched.")
    );
})

export const googleAuth = asyncHandler( async(req:Request,res:Response) => {
    const result = await authService.googleAuth(req)
    return res.status(200).json(
        new ApiResponse(200, result, "Google Authenticated.")
    );
})

export const googleCallback = asyncHandler( async(req:Request,res:Response) => {
    const result = await authService.googleCallback(req)
    res.redirect(result)
    return res.status(200).json(
        new ApiResponse(200, result, "Google success.")
    );
})