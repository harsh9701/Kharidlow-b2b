const cartModel = require("../models/cart");
const generalDataModel = require("../models/generaldata");

module.exports.renderLandingPage = (req, res) => {
    try {
        res.render("index.ejs");
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports.cartCount = async (req, res) => {
    if (!req.session.user || !req.session.user.userId) {
        return res.status(200).json({ count: 0 }); // User not logged in
    }

    try {
        const cart = await cartModel.findOne({ userId: req.session.user.userId });
        const cartCount = cart ? cart.items.length : 0; // Assuming items is an array in your cart model
        res.json({ count: cartCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports.renderCategoriesPage = async (req, res) => {
    const categories = await generalDataModel.find({});
    res.render("product/categories.ejs", { categories });
};