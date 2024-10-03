const express = require("express");
const router = express.Router();

const { renderLandingPage } = require("../controllers/main");
const { userLogout } = require("../controllers/user");

router.get("/", renderLandingPage);
router.get("/logout", userLogout);

module.exports = router;