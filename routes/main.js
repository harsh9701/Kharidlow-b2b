const express = require("express");
const router = express.Router();

const { renderLandingPage } = require("../controllers/main");

router.get("/", renderLandingPage);

module.exports = router;