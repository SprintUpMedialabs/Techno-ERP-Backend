import otpGenerator from 'otp-generator';

export const generateOTP = (delay : number, length : number) => {
    const otp = otpGenerator.generate(length, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
      });
  
      const otpExpireAt = new Date();
      otpExpireAt.setMinutes(otpExpireAt.getMinutes() + delay);

      return {
        otpValue : otp,
        otpExpiryTime : otpExpireAt
      }
}