
export function generateOTP(): string {  

  const Length:number = 6

  let otp = '';
  for (let i = 0; i < Length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return String(otp);

}
