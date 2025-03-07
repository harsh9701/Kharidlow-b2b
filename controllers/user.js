const userModel = require("../models/user");
const cartModel = require("../models/cart");
const orderModel = require("../models/order");
const { v4: uuidv4 } = require("uuid");
const { sendWelcomeMail, sendForgotPasswordMail, sendPasswordResetSuccessMail } = require("../services/emailService");
const bcrypt = require("bcrypt");

module.exports.userRegister = async (req, res) => {
    try {
        const { fullName, email, password, contactNo } = req.body;

        const user = await userModel.findOne({ email });

        if (user) {
            return res
                .status(404)
                .json({ message: "User with this email is already registered" });
        }

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                const createdUser = await userModel.create({
                    fullName,
                    password: hash,
                    email,
                    contactNo
                });

                if (createdUser) {
                    req.session.user = {
                        userId: createdUser._id,
                        fullName: createdUser.fullName,
                        email: createdUser.email,
                        contactNo: createdUser.contactNo,
                        role: createdUser.role,
                        isAuthenticated: true
                    };
                };

                if (createdUser) {
                    sendWelcomeMail(createdUser.email, createdUser.fullName);
                    res.status(200).json({ loginStatus: true, message: "success" });
                } else {
                    res.status(404).json({ loginStatus: false, message: "failed" });
                }
            });
        });
    } catch (err) {
        res.status(500).json({ err: "Server error" });
    }
};

module.exports.userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userExists = await userModel.findOne({ email: email }, { password: 1 });

        if (!userExists) {
            return res.status(404).json({ message: "Invalid credentials" });
        }
        bcrypt.compare(password, userExists.password, function (err, result) {
            if (err) {
                return res.status(500).json({ message: "Some error occured" });
            } else {
                if (result) {
                    req.session.user = {
                        userId: userExists._id,
                        fullName: userExists.fullName,
                        email: userExists.email,
                        contactNo: userExists.contactNo,
                        role: userExists.role,
                        isAuthenticated: true
                    };

                    if (userExists) {
                        return res.status(200).json({ message: "Login Successful" });
                    } else {
                        return res.status(500).json({ message: "Failed to login" });
                    }
                } else {
                    return res.status(404).json({ message: "Invalid credentials" });
                }
            }
        });
    } catch (err) {
        return res.status(500).send(err.message);
    }
};

module.exports.userLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ logoutStatus: false, message: "failed" });
        }
        res.redirect("user/login");
    });
};

module.exports.updatePassword = async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const { currentPassword, newPassword } = req.body;
        const userPassword = await userModel.findById(userId, { password: 1 });
        bcrypt.compare(currentPassword, userPassword.password, function (err, result) {
            if (err) {
                return res.status(500).json({ message: "Some error occured" });
            } else {
                if (result) {
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newPassword, salt, async (err, hash) => {
                            const updatedPassword = await userModel.findByIdAndUpdate(userId, { password: hash });
                            if (updatedPassword) {
                                return res.status(200).json({ success: true, message: "Password Updated Successfully" });
                            } else {
                                return res.status(200).json({ success: false, message: "Password Not Updated" });
                            }
                        });
                    });
                } else {
                    return res.status(404).json({ success: false, message: "Current password is incorrect" });
                }
            }
        });
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports.forgetPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = uuidv4();
        const resetTokenExpiry = Date.now() + 3600000;  // Token valid for 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;

        await user.save();

        sendForgotPasswordMail(email, user.fullName, resetToken);

        res.status(200).json({ message: 'Password reset link sent' });

    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports.resetPassword = async (req, res) => {
    try {
        const user = await userModel.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }  // Ensure token is not expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(req.body.newPassword, salt, async (err, hash) => {
                user.password = hash;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                await user.save();
                sendPasswordResetSuccessMail(user.email, user.fullName);
                res.status(200).json({ message: 'Password has been reset successfully' });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password' });
    }
};

module.exports.renderRegisterPage = (req, res) => {
    res.render("user/register.ejs");
};

module.exports.renderUserAccountPage = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.session.user.userId }, { orderNumber: 1, createdAt: 1, status: 1, grandTotal: 1 }).sort({ createdAt: -1 }).limit(4);
        const userAddress = (await userModel.find({ _id: req.session.user.userId }, { addresses: 1, _id: 0 }))[0].addresses;
        res.render("user/user-account.ejs", { orders, userAddress });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports.renderCartPage = async (req, res) => {
    try {
        if (!(req.session.user && req.session.user.isAuthenticated)) {
            return res.status(401).redirect("/user/login");
        }
        const userId = req.session.user.userId;
        const cartItems = await cartModel.find({ userId }).populate("items.productId", "_id productName price mainImage moq").exec();
        let items;
        if (cartItems.length != 0) {
            items = cartItems[0].items;
        }
        res.cookie('orderCompletion', 'false', { maxAge: 9000000, httpOnly: true });
        return res.render("user/cart.ejs", { items });
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports.renderLoginPage = (req, res) => {
    res.render("user/login.ejs");
};

module.exports.renderForgetPasswordPage = (req, res) => {
    try {
        res.render("user/password-forget.ejs");
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.renderResetPasswordPage = (req, res) => {
    try {
        res.render("user/reset-password.ejs");
    } catch (error) {
        res.status(500).send(error.message);
    }

};