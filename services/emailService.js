const nodemailer = require('nodemailer');
const mailData = {
    email: process.env.NODE_MAILER_EMAIL,
    pass: process.env.NODE_MAILER_PASS
}

const sendWelcomeMail = async (clientMail, fullName) => {
    const transport = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        auth: {
            user: mailData.email,
            pass: mailData.pass
        }
    });
    const mailOptions = {
        from: mailData.email,
        to: clientMail,
        subject: 'Welcome to Kharidlow!',
        html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; }
                        .email-container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                        h1 { color: #1e90ff; }
                        p { font-size: 16px; line-height: 1.6; }
                        .button { background-color: #1e90ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                        .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <h1>Welcome to Kharidlow!</h1>
                        <p>Hi ${fullName},</p>
                        <p>Thank you for registering with <strong>Kharidlow</strong>. We're thrilled to have you onboard!</p>
                        <p>Kharidlow is your one-stop platform for all your B2B needs. We’re committed to making your shopping and business experience smooth and hassle-free.</p>
                        <p>Feel free to browse our latest products and deals. If you need any assistance, don't hesitate to contact our support team.</p>
                        <a href="https://kharidlow.com" class="button" style="color: #fff; font-size: 16px;">Explore Now</a>
                        <p>We’re here to help you succeed. Welcome to the Kharidlow family!</p>
                        <div class="footer">
                            <p>Best Regards,<br>The Kharidlow Team</p>
                            <p>If you have any questions, contact us at support@kharidlow.com</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
    }
    await transport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.error(error);
        } else {
        }
    })
};

const sendForgotPasswordMail = async (clientMail, fullName, resetToken) => {
    const transport = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        auth: {
            user: mailData.email,
            pass: mailData.pass
        }
    });

    const resetURL = `https://kharidlow.com/resetpassword/${resetToken}`; // The link to reset the password

    const mailOptions = {
        from: mailData.email,
        to: clientMail,
        subject: 'Password Reset Request for Kharidlow',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; }
                    .email-container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    h1 { color: #1e90ff; }
                    p { font-size: 16px; line-height: 1.6; }
                    .button { background-color: #1e90ff; color: #fffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                    .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <h1>Password Reset Request</h1>
                    <p>Hi ${fullName},</p>
                    <p>We received a request to reset your password for your Kharidlow account. If you did not request this, please ignore this email.</p>
                    <p>If you did request a password reset, click the button below to reset your password:</p>
                    <a href="${resetURL}" class="button" style="color: #fff; font-size: 16px;">Reset Password</a>
                    <p>This link will expire in 1 hour. If you don’t reset your password within this time, you will need to submit another password reset request.</p>
                    <p>If you have any questions or need further assistance, feel free to contact our support team.</p>
                    <div class="footer">
                        <p>Best Regards,<br>The Kharidlow Team</p>
                        <p>If you have any questions, contact us at support@kharidlow.com</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    await transport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            // console.log('Password reset email sent:');
        }
    });
};

const sendPasswordResetSuccessMail = async (clientMail, fullName) => {
    const transport = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        auth: {
            user: mailData.email,
            pass: mailData.pass
        }
    });

    const mailOptions = {
        from: mailData.email,
        to: clientMail,
        subject: 'Your Password Has Been Reset Successfully',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; }
                    .email-container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    h1 { color: #1e90ff; }
                    p { font-size: 16px; line-height: 1.6; }
                    .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <h1>Password Reset Successful</h1>
                    <p>Hi ${fullName},</p>
                    <p>Your password has been reset successfully! You can now log in to your Kharidlow account using your new password.</p>
                    <p>If you did not request this change or believe this was a mistake, please contact our support team immediately.</p>
                    <p>We recommend that you do not share your password with anyone and ensure that your password is strong and secure.</p>
                    <p>Thank you for being a part of the Kharidlow community!</p>
                    <div class="footer">
                        <p>Best Regards,<br>The Kharidlow Team</p>
                        <p>If you have any questions, contact us at support@kharidlow.com</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    await transport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            // console.log('Password reset success email sent:', response);
        }
    });
};

const sendOrderSummaryMail = async (clientMail, fullName, orderNumber, orderItems, grandTotal) => {
    try {
        let transporter = nodemailer.createTransport({
            host: 'smtpout.secureserver.net',
            port: 465,
            auth: {
                user: mailData.email,
                pass: mailData.pass
            }
        });

        // Dynamically create order items rows
        let orderItemsHtml = '';
        orderItems.forEach(item => {
            const taxAmount = item.taxType === "Exclusive"
                ? (Number(item.quantity) * Number(item.price) * Number(item.taxRate)) / 100
                : (Number(item.quantity) * Number(item.price)) * (item.taxRate / (100 + item.taxRate));
            const total = item.taxType === "Exclusive"
                ? (Number(item.quantity) * Number(item.price)) + taxAmount
                : (Number(item.quantity) * Number(item.price));
            orderItemsHtml += `
                <tr>
                    <td>${item.productName}</td>
                    <td>${item.price}</td>
                    <td>${item.quantity}</td>
                    <td>${item.taxRate}</td>
                    <td>${item.taxType}</td>
                    <td>${item.taxAmount.toFixed(2)}</td>
                    <td>${total.toFixed(2)}</td>
                </tr>
            `;
        });

        let mailOptions = {
            from: mailData.email,
            to: clientMail,
            subject: 'Order Summary from Kharidlow',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; }
                        .email-container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                        h1 { color: #1e90ff; }
                        h3 { color: #01b944; }
                        p { font-size: 16px; line-height: 1.6; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                        th { background-color: #1e90ff; color: white; }
                        .grand-total { font-weight: bold; font-size: 18px; }
                        .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <h1>Order Summary</h1>
                        <h2>Order No. ${orderNumber}</h2>
                        <p>Hi ${fullName},</p>
                        <p>Thank you for your order! Below is a summary of the items you have ordered from <strong>Kharidlow</strong>.</p>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Tax Rate</th>
                                    <th>Tax Type</th>
                                    <th>Tax Amount</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orderItemsHtml}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="6" style="text-align:right;">Grand Total:</td>
                                    <td class="grand-total">${grandTotal}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <p>If you have any questions or need further assistance, feel free to contact our support team at <strong>support@kharidlow.com</strong>.</p>
                        
                        <div class="footer">
                            <p>Best Regards,<br>The Kharidlow Team</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendAbandonedCartEmail = async (clientMail, customerName, cartItems, cartLink) => {
    try {

        let transporter = nodemailer.createTransport({
            host: 'smtpout.secureserver.net',
            port: 465,
            auth: {
                user: mailData.email,
                pass: mailData.pass
            }
        });

        const itemList = cartItems.map(item => `<li style="margin-bottom: 5px;">${item}</li>`).join('');

        const mailOptions = {
            from: mailData.email,
            to: clientMail,
            subject: 'Don’t Miss Out! Your Cart is Waiting for You 🛒',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
          <div style="padding: 14px; background-color: #f4f4f4; text-align: center;">
            <h1 style="color: #4A90E2;">Kharidlow</h1>
            <p style="color: #555;">Powered by Nitvi Fashion Pvt Ltd</p>
          </div>
  
          <div style="padding: 20px; background-color: #ffffff;">
            <p>Hello ${customerName},</p>
            <p>We noticed that you left some items in your cart, and we wanted to make sure you don’t miss out on them! Here’s a quick reminder of what’s waiting for you:</p>
            <ul style="padding-left: 20px; color: #4A90E2;">
              ${itemList}
            </ul>
            <p style="font-size: 16px;">
              Complete your purchase today before these items go out of stock! Just click the link below to pick up where you left off:
            </p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="${cartLink}" style="background-color: #4A90E2; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to your cart</a>
            </p>
            <p>If you have any questions or need assistance, feel free to reply to this email—we’re here to help.</p>
            <p>Happy Shopping!<br><strong>The Kharidlow Team</strong></p>
          </div>
  
          <div style="padding: 15px; background-color: #f4f4f4; text-align: center; color: #888; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kharidlow | Nitvi Fashion Pvt Ltd</p>
            <p>Contact us: <a href="mailto:support@kharidlow.com" style="color: #4A90E2;">support@kharidlow.com</a></p>
          </div>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendWelcomeMail, sendOrderSummaryMail, sendForgotPasswordMail, sendPasswordResetSuccessMail, sendAbandonedCartEmail }