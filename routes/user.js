const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");

const { userRegister, renderRegisterPage, renderLoginPage, userLogin, renderCartPage, renderUserAccountPage, updatePassword } = require("../controllers/user");
const { addToCart, removeFromCart } = require("../controllers/product");
const { orderSummary, completeOrder, renderOrdersPage, renderOrderViewPage } = require("../controllers/order");

router.get("/account", isAuthenticated, renderUserAccountPage);
router.get("/orders", isAuthenticated, renderOrdersPage);
router.get("/orders/:orderId", isAuthenticated, renderOrderViewPage);
router.get("/register", renderRegisterPage);
router.get("/login", renderLoginPage);
router.get("/cart", isAuthenticated, renderCartPage);
router.put("/updatepassword", isAuthenticated, updatePassword);
router.post("/cart", addToCart);
router.post("/cart/remove/:id", isAuthenticated, removeFromCart);
router.post("/order/summary", isAuthenticated, orderSummary);
router.post("/order", isAuthenticated, completeOrder);
router.post("/register", userRegister);
router.post("/login", userLogin);

module.exports = router;