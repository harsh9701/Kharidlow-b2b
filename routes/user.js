const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/userAuth");

const { userRegister, renderRegisterPage, renderLoginPage, userLogin, renderCartPage } = require("../controllers/user");
const { addToCart, removeFromCart } = require("../controllers/product");
const { orderSummary, completeOrder } = require("../controllers/order");

router.get("/register", renderRegisterPage);
router.get("/login", renderLoginPage);
router.get("/cart", isAuthenticated, renderCartPage);
router.post("/cart", addToCart);
router.post("/cart/remove/:id", removeFromCart);
router.post("/order/summary", orderSummary);
router.post("/order", completeOrder);
router.post("/register", userRegister);
router.post("/login", userLogin);

module.exports = router;