import { ApiError } from "../utils/ApiError";

export function generateOTP(length: number): number {
    if(length > 6){
        throw new ApiError(400,"Maximum 6 digit otp is valid")
    }

  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return Number(otp);

}
