const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/userAuth");

const { userRegister, renderRegisterPage, renderLoginPage, userLogin, renderCartPage, renderUserAccountPage, updatePassword } = require("../controllers/user");
const { addToCart, removeFromCart } = require("../controllers/product");
const { orderSummary, completeOrder, renderOrdersPage } = require("../controllers/order");

router.get("/account", isAuthenticated, renderUserAccountPage);
router.get("/orders", isAuthenticated, renderOrdersPage);
router.get("/register", renderRegisterPage);
router.get("/login", renderLoginPage);
router.get("/cart", isAuthenticated, renderCartPage);
router.put("/updatepassword", isAuthenticated, updatePassword);
router.post("/cart", addToCart);
router.post("/cart/remove/:id", removeFromCart);
router.post("/order/summary", orderSummary);
router.post("/order", completeOrder);
router.post("/register", userRegister);
router.post("/login", userLogin);

module.exports = router;