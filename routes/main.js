const express = require("express");
const router = express.Router();

const { renderLandingPage } = require("../controllers/main");
const { userLogout, renderForgetPasswordPage, renderResetPasswordPage, forgetPassword, resetPassword } = require("../controllers/user");

router.get("/", renderLandingPage);
router.get("/logout", userLogout);
router.get("/forgetpassword", renderForgetPasswordPage);
router.get("/resetpassword/:token", renderResetPasswordPage);
router.put("/resetpassword/:token", resetPassword);
router.post("/forgetpassword", forgetPassword);

module.exports = router;