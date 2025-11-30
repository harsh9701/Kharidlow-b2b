const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const productModel = require("../models/product");
const orderModel = require("../models/order");
const cartModel = require("../models/cart");
const userModel = require("../models/user");
const { sendOrderSummaryMail } = require("../services/emailService");
const { generateOrderNumber } = require("../utils/generateOrderNumber");

module.exports.renderOrdersPage = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.session.user.userId }, { orderNumber: 1, createdAt: 1, status: 1, grandTotal: 1, cancellationReason: 1 }).sort({ createdAt: -1 });
        res.render("order/orders.ejs", { orders });
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports.renderOrderViewPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        // Check if orderId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            // return res.status(400).json({ message: "Invalid order ID" });
            return res.status(400).render("error.ejs", { message: "Invalid order ID" });
        }
        const order = await orderModel.findById(orderId)
            .populate({
                path: 'orderItems.productId',
                select: 'mainImage'
            });
        if (order) {
            res.status(200).render("order/view-order.ejs", { order });
        } else {
            res.status(404).json({ success: false, message: "Order not found" });
        }
    } catch (error) {
        return res.status(500).send(`ERROR, ${error.message}`);
    }
};

module.exports.orderSummary = async (req, res) => {
    try {

        if (!(req.session.user && req.session.user.isAuthenticated)) {
            return res.status(401).redirect("/user/login");
        }

        const userId = req.session.user.userId;
        const cartData = JSON.parse(req.body.cartData);

        const orderItems = await Promise.all(
            cartData.map(async (item) => {
                const product = await productModel.findById(item.productId, { productName: 1, mainImage: 1, taxRate: 1, taxType: 1 });

                const taxAmount = product.taxType === "exclusive"
                    ? (Number(item.quantity) * Number(item.price) * Number(product.taxRate)) / 100
                    : (Number(item.quantity) * Number(item.price)) * (product.taxRate / (100 + product.taxRate));

                const total = product.taxType === "exclusive"
                    ? (Number(item.quantity) * Number(item.price)) + taxAmount
                    : (Number(item.quantity) * Number(item.price));

                return {
                    productId: product._id,
                    productName: product.productName,
                    mainImage: product.mainImage,
                    taxRate: product.taxRate,
                    taxType: product.taxType,
                    taxAmount: taxAmount.toFixed(2),
                    instruction: item.instruction,
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                    total: total
                };
            })
        );

        const userDetails = await userModel.findById(userId, { addresses: 1 });
        const userAddresses = userDetails.addresses;
        const cookieValue = req.cookies.orderCompletion || "";

        const grandTotal = orderItems.reduce((acc, item) => acc + item.total, 0).toFixed(2);

        res.render("order/order-summary.ejs", { orderItems, grandTotal, userAddresses, cookieValue });
    } catch (error) {
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
        const orderDetails = req.body;

        if (orderDetails.orderItems[0].productId == "") {
            return res.status(400).json({ success: false, message: "Please add products to complete purchase" });
        }

        let address;

        const grandTotal = orderDetails.orderItems.reduce((acc, item) => acc + item.total, 0).toFixed(2);

        if (orderDetails.address.selectedAddressId) {

            const userWithAddress = await userModel.findOne(
                {
                    _id: new ObjectId(userId),
                    addresses: {
                        $elemMatch: {
                            _id: new ObjectId(orderDetails.address.selectedAddressId)
                        }
                    }
                },
                {
                    "addresses.$": 1  // Project only the matched address from the array
                }
            );

            address = userWithAddress.addresses[0];

        } else {

            const userDetails = await userModel.findById(userId, { addresses: 1, _id: 0 });
            const userAddresses = userDetails.addresses;

            if (userAddresses.length > 0) {
                const updateAddress = await userModel.updateOne(
                    { _id: userId },
                    { $push: { addresses: orderDetails.address } }
                );
            } else {
                const updateAddress = await userModel.updateOne({ _id: userId }, { $set: { addresses: orderDetails.address } });
            }

            address = orderDetails.address;

        }

        const orderNumber = generateOrderNumber();

        if (orderDetails.orderItems.length <= 0) {
            return res.status(400).json({ success: false, message: "Your Cart is empty" });
        }

        const createOrder = await orderModel.create({
            userId,
            orderItems: orderDetails.orderItems,
            orderNumber,
            grandTotal,
            shippingAddress: address
        });

        if (createOrder) {
            // Increment the order count for the user
            await userModel.updateOne(
                { _id: userId },
                { $inc: { orderCount: 1 } }
            );

            const deleteCart = await cartModel.deleteOne({ userId: userId });
            if (deleteCart) {
                sendOrderSummaryMail(userEmail, req.session.user.fullName, orderNumber, orderDetails.orderItems, grandTotal);
                res.cookie("orderCompletion", "");
                return res.status(200).json({ success: true, message: "Order created" });
            } else {
                return res.status(400).json({ success: false, message: "Order not created" })
            }
        } else {
            return res.status(400).json({ success: false, message: "Order not created" })
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};