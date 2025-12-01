import Jwt, { Secret, JwtPayload  } from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { Collections } from "../models";


interface MyJwtPayload extends JwtPayload {
  _id: string;
}

export const generateAccessAndRefreshToken = async (
  userId: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    if (!userId) {
      throw new ApiError(400, "userId Missing to generate Tokens");
    }

    const user = await Collections.UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    if (!accessToken || !refreshToken) {
      throw new ApiError(400, "Unable to generate jwt tokens.");
    }

    const decode = Jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as Secret
    ) as MyJwtPayload;

    const user_id: string = decode._id;

    await Collections.UserModel.findByIdAndUpdate(user_id, {
      $set: { refreshToken: refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error: any) {
    throw new ApiError(500, error.message || "server error");
  }
};

