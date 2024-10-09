const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const productModel = require("../models/product");
const orderModel = require("../models/order");
const cartModel = require("../models/cart");
const userModel = require("../models/user");
const { sendOrderSummaryMail } = require("../services/emailService");
const { generateOrderNumber } = require("../utils/generateOrderNumber");

module.exports.orderSummary = async (req, res) => {
    try {

        if (!(req.session.user && req.session.user.isAuthenticated)) {
            return res.status(401).redirect("/user/login");
        }

        const userId = req.session.user.userId;
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

        const userDetails = await userModel.findById(userId, { addresses: 1 });
        const userAddresses = userDetails.addresses;
        const cookieValue = req.cookies.orderCompletion || "";

        const grandTotal = orderItems.reduce((acc, item) => acc + item.total, 0);

        res.render("order/order-summary.ejs", { orderItems, grandTotal, userAddresses, cookieValue });
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
        const orderDetails = req.body;

        let address;

        const grandTotal = orderDetails.orderItems.reduce((acc, item) => acc + item.total, 0);

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
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};