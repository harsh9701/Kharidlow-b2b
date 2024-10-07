const productModel = require("../models/product");
const orderModel = require("../models/order");
const cartModel = require("../models/cart");
const { sendOrderSummaryMail } = require("../services/emailService");
const { generateOrderNumber } = require("../utils/generateOrderNumber");

module.exports.orderSummary = async (req, res) => {
    try {

        if (!(req.session.user && req.session.user.isAuthenticated)) {
            return res.status(401).redirect("/user/login");
        }

        const cartData = JSON.parse(req.body.cartData);

        const orderItems = await Promise.all(
            cartData.map(async (item) => {
                const product = await productModel.findById(item.productId, { productName: 1, mainImage: 1 });

                return {
                    productId: product._id,
                    productName: product.productName,
                    mainImage: product.mainImage,
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                    total: Number(item.quantity) * Number(item.price)
                };
            })
        );

        const grandTotal = orderItems.reduce((acc, item) => acc + item.total, 0);

        res.render("order/order-summary.ejs", { orderItems, grandTotal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports.completeOrder = async (req, res) => {
    try {
        if (!(req.session.user && req.session.user.isAuthenticated)) {
            return res.status(401).redirect("/user/login");
        }
        const userId = req.session.user.userId;
        const userEmail = req.session.user.email;
        const orderItems = req.body;

        const grandTotal = orderItems.reduce((acc, item) => acc + item.total, 0);
        const orderNumber = generateOrderNumber();

        if (orderItems.length <= 0) {
            return res.status(400).json({ success: false, message: "Your Cart is empty" });
        }

        const createOrder = await orderModel.create({
            userId,
            orderItems,
            orderNumber,
            grandTotal
        });

        if (createOrder) {
            const deleteCart = await cartModel.deleteOne({ userId: userId });
            if (deleteCart) {
                sendOrderSummaryMail(userEmail, req.session.user.fullName, orderNumber, orderItems, grandTotal);
                return res.status(200).json({ success: true, message: "Order created" });
            } else {
                return res.status(400).json({ success: false, message: "Order not created" })
            }
        } else {
            return res.status(400).json({ success: false, message: "Order not created" })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};