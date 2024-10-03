const userModel = require("../models/user");
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
            if (err) {
                console.error(err);
            }
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) {
                    console.error(err);
                }
                const createdUser = await userModel.create({
                    fullName,
                    password: hash,
                    email,
                    contactNo
                });

                if (createdUser) {
                    req.session.user = {
                        fullName: createdUser.fullName,
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
                    res.status(200).json({ loginStatus: true, message: "success" });
                } else {
                    res.status(404).json({ loginStatus: false, message: "failed" });
                }
            });
        });
    } catch (err) {
        console.log(err);
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
                        fullName: userExists.fullName,
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
}

module.exports.renderLoginPage = (req, res) => {
    res.render("user/login.ejs");
}