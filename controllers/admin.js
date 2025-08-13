const mongoose = require('mongoose');
const orderModel = require("../models/order");
const invoiceModel = require("../models/invoice");
const userModel = require("../models/user");
const productModel = require("../models/product");
const cartModel = require("../models/cart");
const { formatAmount } = require("../utils/helper");
const { sendAbandonedCartEmail } = require("../services/emailService");

module.exports.renderAdminPage = async (req, res) => {
    try {
        const orderCount = await orderModel.countDocuments({}, { hint: "_id_" });
        const userCount = await userModel.countDocuments({}, { hint: "_id_" });
        const productCount = await productModel.countDocuments({}, { hint: "_id_" });
        const deliveredOrder = await orderModel.countDocuments({ status: "delivered" });
        const totalSales = await orderModel.aggregate([
            {
                $match: {
                    status: { $nin: ["canceled", "pending"] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$grandTotal" }
                }
            }
        ]);

        const lastFiveOrders = await orderModel.find({}, { orderNumber: 1, userId: 1, status: 1, grandTotal: 1, _id: 1 }).sort({ createdAt: -1 }).limit(5).populate("userId", "fullName");
        const lastFiveUser = await userModel.find({}, { fullName: 1, email: 1, orderCount: 1, contactNo: 1 }).sort({ createdAt: -1 }).limit(5);
        const lastFiveProduct = await productModel.find({}, { productName: 1, price: 1, stock: 1, moq: 1, subCategory: 1 }).sort({ createdAt: -1 }).limit(5);

        const data = {
            orderCount: orderCount,
            userCount: userCount,
            productCount: productCount,
            orders: lastFiveOrders,
            customers: lastFiveUser,
            listing: lastFiveProduct,
            deliveredOrder: deliveredOrder,
            totalSales: (totalSales.length > 0) ? formatAmount(Number(totalSales[0].totalSales)) : 0
        }

        res.render("admin/admin-page.ejs", { data });
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports.renderManageOrderPage = async (req, res) => {
    try {
        const allOrders = await orderModel.find({}, { orderNumber: 1, userId: 1, status: 1, grandTotal: 1, createdAt: 1, _id: 1 }).sort({ createdAt: -1 }).populate("userId", "fullName");
        res.render("admin/manage-orders.ejs", { allOrders });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.renderManageCustomerPage = async (req, res) => {
    try {
        const customers = await userModel.find({}, { fullName: 1, email: 1, orderCount: 1, contactNo: 1 }).sort({ createdAt: -1 });
        res.render("admin/manage-customers.ejs", { customers });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.renderManageProductPage = async (req, res) => {
    try {
        const products = await productModel.find({}, { productName: 1, price: 1, sku: 1, createdAt: 1, moq: 1, subCategory: 1 }).sort({ createdAt: -1 });
        res.render("admin/manage-products.ejs", { products });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.renderViewOrderPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const orderDetail = await orderModel.findById(orderId)
            .populate({
                path: 'userId',
                select: 'fullName contactNo'
            })
            .populate({
                path: 'orderItems.productId',
                select: 'mainImage'
            });
        if (orderDetail) {
            return res.render("admin/view-order.ejs", { order: orderDetail });
        } else {
            return res.status(404).render("error.ejs");
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.updateOrderStatus = async (req, res) => {
    const { status, trackingId, trackingUrl, reason, orderId } = req.body;
    try {
        const updateData = { status: status };
        if (status === 'dispatched') {
            updateData.trackingId = trackingId;
            updateData.trackingUrl = trackingUrl;
        } else if (status === 'canceled') {
            updateData.cancellationReason = reason;
        }

        await orderModel.findByIdAndUpdate(orderId, updateData);
        res.status(200).json({ success: true, message: 'Order updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating order' });
    }
};

module.exports.renderViewCustomerPage = async (req, res) => {
    const customerId = req.params.customerId;
    try {
        const customer = await userModel.findById(customerId);
        const orders = await orderModel.find({ userId: customerId }, { orderNumber: 1, status: 1, createdAt: 1 });
        if (customer) {
            res.render("admin/view-customer.ejs", { customer, recentOrders: orders });
        } else {
            res.status(404).render("error.ejs");
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.renderUpdateProductPage = async (req, res) => {
    const productId = req.params.productId;
    try {
        const product = await productModel.findById(productId);
        if (product) {
            res.render("product/update-product.ejs", { product });
        } else {
            res.status(404).render("error.ejs");
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.renderCartAnalysisPage = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;

        const totalCarts = await cartModel.countDocuments({
            items: { $elemMatch: { productId: { $exists: true } } }
        });

        const cartDetails = await cartModel.find({ items: { $elemMatch: { productId: { $exists: true } } } })
            .populate({
                path: "userId",
                select: "fullName contactNo email"
            })
            .populate({
                path: "items.productId",
                select: "_id productName price mainImage moq"
            })
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean() // Optional: returns plain JavaScript objects
            .exec();

        res.render("admin/cart-analysis.ejs", { cartDetails, totalCarts, currentPage: page, limit });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.sendAbandonedCartEmailService = async (req, res) => {
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
    try {
        const userId = req.params.userId;
        const cartItems = await cartModel.findOne({ userId })
            .populate({
                path: "userId",
                select: "fullName contactNo email"
            })
            .populate({
                path: "items.productId",
                select: "_id productName price mainImage moq"
            });

        if (!cartItems.length && (cartItems.items).length < 0) {
            return res.status(404).json({ success: false, message: "No abandoned cart found for the user" });
        }

        if (cartItems.lastNotified && (new Date() - new Date(cartItems.lastNotified)) < TWO_DAYS) {
            return res.status(400).json({ success: false, message: "Notification already sent within the last 2 days." });
        }

        const items = (cartItems.items).map(item => item.productId.productName);

        sendAbandonedCartEmail(cartItems.userId.email, cartItems.userId.fullName, items, "https://www.kharidlow.com/user/cart");

        cartItems.lastNotified = new Date();
        await cartItems.save();

        res.status(200).json({ success: true, message: "Email alert for abandoned cart sent successfully!" });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.renderFinalizeBillPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const orderDetail = await orderModel.findById(orderId)
            .populate({
                path: 'userId',
                select: 'fullName contactNo'
            })
            .populate({
                path: 'orderItems.productId',
                select: 'mainImage'
            });
        if (orderDetail) {
            return res.render("admin/finalize-bill.ejs", { order: orderDetail });
        } else {
            return res.status(404).render("error.ejs");
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.finalizeBill = async (req, res) => {
    try {
        const { items, grandTotal, orderId } = req.body;

        const isOrderExist = await orderModel.findById(orderId);

        if (!isOrderExist) {
            return res.status(400).render("error.ejs", { message: "Order doesn't exist" });
        }

        if (isOrderExist.isInvoiceCreated) {
            return res.status(400).json({ message: "Invoice Already Generated" });
        }

        const customerId = isOrderExist.userId;
        const orderNumber = isOrderExist.orderNumber;
        const shippingAddress = isOrderExist.shippingAddress;

        const orderItems = items.map((item) => {
            return {
                productName: item.productName,
                price: item.price,
                taxRate: item.gstRate,
                taxType: item.gstType,
                taxAmount: item.gstType.toLowerCase() == "inclusive"
                    ? Math.abs(((item.price * item.qty) * item.gstRate) / (100 + item.gstRate)).toFixed(2)
                    : Math.abs(((item.price * item.qty) * item.gstRate) / 100).toFixed(2),
                quantity: item.qty,
                total: item.itemTotal,
            }
        });

        const invoice = new invoiceModel({
            userId: customerId,
            orderId,
            orderNumber,
            orderItems,
            grandTotal,
            shippingAddress
        });

        const invoiceCreated = await invoice.save();

        if (!invoiceCreated) {
            return res.status(400).json({ message: "Error while create invoice" });
        }

        isOrderExist.isInvoiceCreated = true;

        await isOrderExist.save();

        return res.status(200).json({ message: "Invoice created" });

    } catch (err) {
        res.status(500).send(err.message);
    }
};

module.exports.renderInvoice = async (req, res) => {
    try {
        const orderNumber = req.params.orderNumber;
        const invoice = await invoiceModel.find({ orderNumber });
        res.render("admin/invoice.ejs", { order: invoice[0] });
    } catch (err) {
        res.status(500).send(err);
    }
};