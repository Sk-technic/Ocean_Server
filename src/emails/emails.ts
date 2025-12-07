import { IFORGETPASSWORD, IPASSWORDCONF, IRECOVERYEMAIL, ISENDOTP } from "../interfaces/auth.interface";
import { sendEmail } from "../utils/smtp";

export const SentOtpToMail = async (params: ISENDOTP) => {
  const { to, Token,Name } = params;
  const subject = 'Your One-Time Password (OTP) Token';
  
  const body = `
<!DOCTYPE html>
<html>
  <head>
    <title>Verify Your Email</title>
    <!-- Google Font -->
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
      rel="stylesheet">
  </head>
  <body style="font-family: 'Poppins', sans-serif; margin: 0; padding: 40px; background: #f5f5f5;">

    <!-- Shadow Wrapper -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="background:#e0e0e0; padding:20px;">
      <tr>
        <td align="center">

          <!-- Main Card -->
          <table width="700" border="0" cellspacing="0" cellpadding="0" 
            style="background:#ffffff; border:1px solid #f1f0f0; border-radius:12px;">

            <!-- Logo -->
            <tr>
              <td align="center" style="padding: 20px 0 10px 0;">
                <img src="https://i.postimg.cc/B68SdSWr/name2.png" alt="App Logo" width="38%" 
                  style="border-radius: 50%; display: block;">
              </td>
            </tr>

            <!-- Title -->
            <tr align="center">
              <td style="text-align: center; vertical-align: middle;">
                <div style="display: inline-flex; align-items: flex-end; justify-content: center; gap: 10px;">
                  <img src="https://i.postimg.cc/kGSn5qcS/verify.png" alt="badge" width="40">
                  <h1 style="font-size: 32px; font-weight: 700; color: #2e2e2e; margin: 0; line-height: 1;">
                    Verify Your Email Address
                  </h1>
                </div>
              </td>
            </tr>

            <!-- Message -->
            <tr>
              <td align="center" style="padding: 0 40px 20px 40px;">
                <p style="font-size: 16px; color: #6b6b6b; line-height: 1.7; margin:5px 0px;">
                  Hi ${Name || "there"} 👋<br>
                  Thanks for joining <strong>Younite</strong>!<br><br>
                  To finish setting up your account, please verify your email address.  
                  Once confirmed, you’ll be ready to explore everything we have to offer.
                </p>
              </td>
            </tr>

            <!-- Secondary Link (Token Box) -->
            <tr>
              <td align="center" style="padding: 20px 40px; border-top: 1px solid rgba(30, 18, 202, 0.3);">
                <div style="background-color: #f7f7f7; border-radius: 10px; padding: 14px; font-size: 14px; color: #6b6b6b; border: 1px dashed #ccc;">
                  Or enter this verification code:<br>
                  <strong style="
                    font-size: 20px; 
                    letter-spacing: 2px; 
                    background: linear-gradient(135deg, #008ff3ed, #9484ffed); 
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent; 
                    background-clip: text; 
                    color: transparent;">
                    ${Token}
                  </strong>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 10px 30px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <!-- Left side -->
                    <td align="left" style="font-size: 13px; color: #000;">
                      Need assistance?  
                      <a href="#"
                        style="color: #008ff3ed; text-decoration: none; font-size: 15px; font-weight: 600;">
                        Contact Support
                      </a>
                    </td>

                    <!-- Right side -->
                    <td align="right">
                      <img src="https://i.postimg.cc/QdnvvpX0/logo-YN.png" alt="Logo" width="100" style="display:block;">
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
          <!-- End Main Card -->

        </td>
      </tr>
    </table>
    <!-- End Shadow Wrapper -->

  </body>
</html>

  `;

  await sendEmail(to, subject, body);
};



export const SentRecoveryEmail = async (params: IRECOVERYEMAIL) => {
  const { recoveryEmail, email,Name } = params;
 
  const subject = 'New Recovery Email Linked to Your Account';
  const TO = email!.toString();
  const body = `
<!DOCTYPE html>
<html>
  <head>
    <title>Recovery Email Added</title>
    <!-- Google Font -->
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
      rel="stylesheet">
  </head>
  <body style="font-family: 'Poppins', sans-serif; margin: 0; padding: 40px; background: #f5f5f5;">

    <!-- Shadow Wrapper -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="background:#e0e0e0; padding:20px;">
      <tr>
        <td align="center">

          <!-- Main Card -->
          <table width="700" border="0" cellspacing="0" cellpadding="0" 
            style="background:#ffffff; border:1px solid #f1f0f0; border-radius:12px;">

            <!-- Logo -->
            <tr>
              <td align="center" style="padding: 20px 0 10px 0;">
                <img src="https://i.postimg.cc/B68SdSWr/name2.png" alt="App Logo" width="38%" 
                  style="border-radius: 50%; display: block;">
              </td>
            </tr>

            <!-- Title -->
            <tr align="center">
              <td style="text-align: center; vertical-align: middle;">
                <div style="display: inline-flex; align-items: flex-end; justify-content: center; gap: 10px;">
                  <img src="https://i.postimg.cc/9MHvqY0J/padlock.png" alt="badge" width="40">
                  <h1 style="font-size: 30px; font-weight: 700; color: #2e2e2e; margin: 0; line-height: 1;">
                    Recovery Email Added
                  </h1>
                </div>
              </td>
            </tr>

            <!-- Message -->
            <tr>
              <td align="center" style="padding: 0 40px 20px 40px;">
                <p style="font-size: 16px; color: #6b6b6b; line-height: 1.7; margin:5px 0px;">
                  Hi ${Name} 👋<br><br>
                  You’ve successfully added a <strong>recovery email</strong> to your <strong>Younite</strong> account.<br><br>
                  This recovery email will help secure your account and allow you to regain access if you forget your login details.
                </p>
              </td>
            </tr>

            <!-- Emails Table -->
            <tr>
              <td align="center" style="padding: 20px 40px;">
                <table border="0" cellpadding="10" cellspacing="0" width="100%" style="max-width: 550px; background:#f7f7f7; border-radius:10px; border:1px dashed #ccc;">
                  <tr>
                    <td style="font-size:15px; color:#555; text-align:left; font-weight:600;">Primary Email (Account):</td>
                    <td style="font-size:15px; color:#2e2e2e; text-align:right;">
                   ${email}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:15px; color:#555; text-align:left; font-weight:600;">Recovery Email:</td>
                    <td style="font-size:15px; color:#2e2e2e; text-align:right;">
                     ${recoveryEmail}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 10px 30px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <!-- Left side -->
                    <td align="left" style="font-size: 13px; color: #000;">
                      Didn’t make this change?  
                      <a href="#"
                        style="color: #008ff3ed; text-decoration: none; font-size: 15px; font-weight: 600;">
                        Secure Your Account
                      </a>
                    </td>

                    <!-- Right side -->
                    <td align="right">
                      <img src="https://i.postimg.cc/QdnvvpX0/logo-YN.png" alt="Logo" width="100" style="display:block;">
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
          <!-- End Main Card -->

        </td>
      </tr>
    </table>
    <!-- End Shadow Wrapper -->

  </body>
</html>

  `;

  await sendEmail(TO, subject, body);
};

export const forgetPasswordMail = async (params: IFORGETPASSWORD) => {
  const TO = params?.email
  const subject = 'Forgot Your Password? Let’s Fix That';
  const resetLink = `${process.env.CLIENT_URI}/reset-password?token=${params?.Token}&email=${params?.email}`
  const Name = params?.Name?.split(" ")[0]
  const body = `
                <!DOCTYPE html>
<html>
<head>
  <title>Password Reset Request</title>
  <!-- Google Font -->
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Poppins', sans-serif; margin: 0; padding: 40px; background: #f5f5f5;">

  <!-- Shadow Wrapper -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="background:#e0e0e0; padding:20px;">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table width="700" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff; border:1px solid #f1f0f0; border-radius:12px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 20px 0 10px 0;">
              <img src="https://i.postimg.cc/B68SdSWr/name2.png" alt="App Logo" width="38%" style="border-radius: 50%; display: block;">
            </td>
          </tr>

         <!-- Title -->
              <tr align="center">
                <td style="text-align: center; vertical-align: middle; padding: 20px 0;">
                  <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
                    <tr>
                      <td style="padding-right: 10px; vertical-align: middle;">
                        <img src="https://i.postimg.cc/9MHvqY0J/padlock.png" alt="badge" width="40" style="display:block;">
                      </td>
                      <td style="vertical-align: middle;">
                        <h1 style="font-size: 30px; font-weight: 700; color: #2e2e2e; margin: 0; line-height: 1;">
                          Forgot Your Password?
                        </h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>


          <!-- Greeting -->
          <tr>
            <td align="center" style="padding: 0 40px 20px 40px;">
              <p style="font-size: 16px; color: #6b6b6b; line-height: 1.7; margin:5px 0px;">
                Hi ${Name || "there!"} 👋,<br> Don’t worry, we’ve got you covered!
              </p>
            </td>
          </tr>

          <!-- Reset Button -->
          <tr>
            <td align="center" style="padding: 0px 40px; font-size: 16px; color: #6b6b6b; line-height: 1.7;">
              <p style="margin-bottom:15px;">
                To reset your password, simply click the button below:
              </p>
              <a href="${resetLink}" style="background:#008ff3ed; color:#fff; padding:14px 28px; font-size:16px; font-weight:600; text-decoration:none; border-radius:8px; display:inline-block;">
                Reset My Password
              </a>
              <p style="margin-top:20px;">
                ⚠️ <strong>Note:</strong> For your security, this link is valid for <strong>5 minutes</strong> only.
              </p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td align="center" style="padding: 0 40px 20px 40px; ">
              <p style="font-size: 16px; color: #6b6b6b; line-height: 1.7; text-align: left;">
                We received a request to reset the password for your <strong>Younite</strong> account.  
                Please follow these steps:
              </p>
              <ul style="text-align:left; font-size: 15px; color: #6b6b6b; line-height:1.8; padding-left:20px; margin: 10px 0;">
                <li>Click the <em>Reset My Password</em> button above.</li>
                <li>Create a strong, unique password you haven’t used before.</li>
                <li>Login securely with your new credentials.</li>
              </ul>
              <p style="font-size: 15px; color:#6b6b6b; line-height:1.7; margin-top:10px;">
                Didn’t make this request? No worries — you can safely ignore this email and your account will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Extra Note -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px;">
              <p style="font-size: 14px; color: #8a8a8a; line-height: 1.6; margin: 0;">
                🔒 Security Tip: Always use a <strong>unique, complex password</strong> and never reuse old ones to keep your account safe.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 10px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Left side -->
                  <td align="left" style="font-size: 13px; color: #000;">
                    Didn’t request this reset?  
                    <a href="#" style="color: #008ff3ed; text-decoration: none; font-size: 15px; font-weight: 600;">
                      Secure Your Account
                    </a>
                  </td>

                  <!-- Right side -->
                  <td align="right">
                    <img src="https://i.postimg.cc/QdnvvpX0/logo-YN.png" alt="Logo" width="100" style="display:block;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->

      </td>
    </tr>
  </table>
  <!-- End Shadow Wrapper -->

</body>
</html>

  `
  const info =  await sendEmail(TO, subject, body);
  return info
}

export const updatePasswordConfirmation = async (params: IPASSWORDCONF) =>{
  const TO = params?.email!.toString()
  const name = params?.Name.split(" ")[0]
  const subject = "Security Notice: Your Younite password was changed"
  const body = `
                  <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Password Changed Successfully</title>
                        <!-- Google Font -->
                        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
                      </head>
                      <body style="font-family: 'Poppins', sans-serif; margin: 0; padding: 40px; background: #f5f5f5;">

                        <!-- Shadow Wrapper -->
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="background:#e0e0e0; padding:20px;">
                          <tr>
                            <td align="center">

                              <!-- Main Card -->
                              <table width="700" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff; border:1px solid #f1f0f0; border-radius:12px;">

                                <!-- Logo -->
                                <tr>
                                  <td align="center" style="padding: 20px 0 10px 0;">
                                    <img src="https://i.postimg.cc/B68SdSWr/name2.png" alt="App Logo" width="38%" style="border-radius: 50%; display: block;">
                                  </td>
                                </tr>

                                <!-- Title -->
                                <tr align="center">
                                  <td style="text-align: center; vertical-align: middle;">
                                    <div style="display: inline-flex; align-items: flex-end; justify-content: center; gap: 10px;">
                                      <img src="https://i.postimg.cc/9MHvqY0J/padlock.png" alt="badge" width="40">
                                      <h1 style="font-size: 28px; font-weight: 700; color: #2e2e2e; margin: 0; line-height: 1;">
                                        Your Password Has Been Changed
                                      </h1>
                                    </div>
                                  </td>
                                </tr>

                                <!-- Greeting & Confirmation -->
                                <tr>
                                  <td align="center" style="padding: 0 40px 20px 40px;">
                                    <p style="font-size: 16px; color: #6b6b6b; line-height: 1.7; margin:5px 0px; text-align: left;">
                                      Hi ${name} 👋,<br><br>
                                      This is a confirmation that your <strong>Younite</strong> account password was successfully updated.
                                    </p>
                                    <p style="font-size: 15px; color: #6b6b6b; line-height: 1.7; text-align: left;">
                                      If you made this change, you don’t need to do anything else.<br>
                                      If you did <strong>not</strong> change your password, please contact our support team immediately.
                                    </p>
                                  </td>
                                </tr>

                                <!-- Security Tip -->
                                <tr>
                                  <td align="center" style="padding: 0 40px 30px 40px;">
                                    <p style="font-size: 14px; color: #8a8a8a; line-height: 1.6; margin: 0;">
                                      🔒 Security Tip: Always use a <strong>unique, complex password</strong> and never share your login details with anyone.
                                    </p>
                                  </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                  <td style="padding: 10px 30px;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                      <tr>
                                        <!-- Left side -->
                                        <td align="left" style="font-size: 13px; color: #000;">
                                          Need help?  
                                          <a href="#" style="color: #008ff3ed; text-decoration: none; font-size: 15px; font-weight: 600;">
                                            Contact Support
                                          </a>
                                        </td>

                                        <!-- Right side -->
                                        <td align="right">
                                          <img src="https://i.postimg.cc/QdnvvpX0/logo-YN.png" alt="Logo" width="100" style="display:block;">
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>

                              </table>
                              <!-- End Main Card -->

                            </td>
                          </tr>
                        </table>
                        <!-- End Shadow Wrapper -->

                      </body>
                      </html>

  `

  await sendEmail(TO, subject, body);

}