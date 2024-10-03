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

module.exports.renderRegisterPage = (req, res) => {
    res.render("user/register.ejs");
}

module.exports.renderLoginPage = (req, res) => {
    res.render("user/login.ejs");
}