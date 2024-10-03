const express = require("express");
const router = express.Router();

const { userRegister, renderRegisterPage, renderLoginPage } = require("../controllers/user");

router.get("/register", renderRegisterPage);
router.get("/login", renderLoginPage);
router.post("/register", userRegister);

module.exports = router;