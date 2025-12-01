import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { Collections } from '../models';
import { unprotechtedRouts } from '../utils/unprotechtedRoutes';
import { ApiError } from '../utils/ApiError';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (unprotechtedRouts.includes(req.path)) {
      return next();
    }
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = tokenFromHeader;

    if (!token) {
      throw new ApiError(401, 'Unauthorized: No token provided');
    }
    // Verify token with secret from environment variables
    const secret = process.env.JWT_ACCESS_SECRET as Secret;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
    }

    const payload = jwt.verify(token, secret) as JwtPayload & { _id: string };

    // Fetch user from DB using payload _id
    const user = await Collections.UserModel.findById(payload._id).exec();

    if (!user) {
      throw new ApiError(401, 'Unauthorized: User not found');
    }

    // Attach user info to request object with typing
    req.identity = user?._id
    const userId = user?._id.toString()
    const userdata = {
      email: user?.email,
      username: user?.username,
      fullName: user?.fullName,
      id:userId
    }
    req.User = userdata
    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: error.message });
  }
};
