const orderModel = require("../models/order");
const userModel = require("../models/user");
const productModel = require("../models/product");
const { formatAmount } = require("../utils/helper");

module.exports.renderAdminPage = async (req, res) => {
    try {
        const orderCount = await orderModel.countDocuments({}, { hint: "_id_" });
        const userCount = await userModel.countDocuments({}, { hint: "_id_" });
        const productCount = await productModel.countDocuments({}, { hint: "_id_" });
        const deliveredOrder = await orderModel.countDocuments({ status: "delivered" });
        const totalSales = await orderModel.aggregate([
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
        const products = await productModel.find({}, { productName: 1, price: 1, stock: 1, moq: 1, subCategory: 1 }).sort({ createdAt: -1 });
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