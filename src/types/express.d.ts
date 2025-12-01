
declare global {
  namespace Express {
    interface Request {
      User: {
        id: string;
        fullName: string;
        username:string;
        email?: string | null;
      };

      identity:string
    }
  }
}
export{};