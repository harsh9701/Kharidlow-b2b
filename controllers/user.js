const userModel = require("../models/user");
const cartModel = require("../models/cart");
const orderModel = require("../models/order");
const { sendWelcomeMail } = require("../services/emailService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
                        role: createdUser.role,
                        isAuthenticated: true
                    };
                };

                const token = jwt.sign(
                    { email: email, userid: createdUser._id },
                    process.env.JWT_SECRET,
                );

                if (token && createdUser) {
                    res.cookie("token", token, {
                        secure: true,
                        httpOnly: false,
                    });
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

        const userExists = await userModel.findOne({ email: email });

        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
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
                        role: userExists.role,
                        isAuthenticated: true
                    };

                    const token = jwt.sign(
                        { email: userExists.email, userid: userExists._id },
                        process.env.JWT_SECRET,
                    );
                    if (token && userExists) {
                        res.cookie("token", token, {
                            httpOnly: false,
                            secure: true,
                        });
                        return res.status(200).json({ message: "Login Successful" });
                    } else {
                        return res.status(500).json({ message: "Failed to login" });
                    }
                } else {
                    return res.status(404).json({ message: "Wrong Password" });
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
        res.cookie("token", "");
        res.redirect("user/login");
    });
}

module.exports.renderRegisterPage = (req, res) => {
    res.render("user/register.ejs");
};

module.exports.renderUserAccountPage = (req, res) => {
    res.render("user/user-account.ejs");
};

module.exports.renderOrdersPage = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.session.user.userId }, { orderNumber: 1, createdAt: 1, status: 1, grandTotal: 1 });
        res.render("order/orders.ejs", { orders });
    } catch (error) {
        return res.status(500).send(error.message);
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
}