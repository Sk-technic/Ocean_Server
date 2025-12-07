import Doucument from "mongoose"

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      fullName: string;
      username: string;
      email?: string | null;
    }
      interface PassportUser extends Document {
      _id: string;
      googleId: string;
      email: string;
      name: string;
      profilePic?: string;
    }
    interface Request {
      User: AuthUser;
      user?: PassportUser;
      identity: string;
    }
  }
}

export {};
