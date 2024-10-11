const orderModel = require("../models/order");
const userModel = require("../models/user");
const productModel = require("../models/product");

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
            totalSales: totalSales
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
        // const orderDetail = await orderModel.findById(orderId);
        const orderDetail = await orderModel.findById(orderId)
            .populate({
                path: 'userId',
                select: 'fullName'
            })
            .populate({
                path: 'orderItems.productId',
                select: 'mainImage'
            });
        res.render("admin/view-order.ejs", { order: orderDetail });
    } catch (error) {
        res.status(500).send(error.message);
    }
};