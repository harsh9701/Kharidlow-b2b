const express = require("express");
const router = express.Router();

const { userRegister, renderRegisterPage, renderLoginPage, userLogin} = require("../controllers/user");

router.get("/register", renderRegisterPage);
router.get("/login", renderLoginPage);
router.post("/register", userRegister);
router.post("/login", userLogin);

module.exports = router;