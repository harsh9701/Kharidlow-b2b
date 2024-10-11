const categoryModel = require("../models/generaldata");
const productModel = require("../models/product");
const cartModel = require("../models/cart");
const fs = require("fs").promises;
const path = require("path");

module.exports.renderAddProductPage = (req, res) => {
    try {
        res.render("product/add-product.ejs");
    } catch(error) {
        console.log(error.message);
        return res.status(500).send(error.message);
    }
};

module.exports.renderListingPage = async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 24;
    const currentPage = parseInt(req.query.page) || 1;

    const skip = (page - 1) * pageSize;

    const products = await productModel.find({})
        .skip(skip)
        .limit(pageSize)
        .select('productName price moq mainImage');

    const totalProducts = await productModel.countDocuments({});

    res.render("product/listing.ejs", { products, totalProducts, currentPage });
};

module.exports.renderProductPage = async (req, res) => {
    const productId = req.params.id;
    const productDetails = await productModel.findById(productId, { productName: 1, subCategory: 1, price: 1, description: 1, moq: 1, mainImage: 1, discount: 1 });
    const suggestedProducts = await productModel.aggregate([
        { $match: { subCategory: productDetails.subCategory } },
        { $sample: { size: 3 } },
        { $project: { productName: 1, subCategory: 1, price: 1, description: 1, moq: 1, mainImage: 1, discount: 1 } }
    ]);
    res.render("product/product.ejs", { productDetails, suggestedProducts });
};

module.exports.getCategory = async (req, res) => {
    const categories = await categoryModel.find({});
    return res.status(200).send(categories);
};

module.exports.getSubCategory = async (req, res) => {
    const categoryId = req.params.id;
    const subCategories = (await categoryModel.find({ _id: categoryId }))[0].subcategories;
    return res.status(200).send(subCategories);
};

module.exports.addNewProduct = async (req, res) => {
    try {
        const { productName, category, subCategory, price, stock, description, sku, brand, tags } = req.body;

        if (!productName || !category || !price || !sku) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let tagsArray = [];
        if (tags) {
            tagsArray = tags.split(',').map(tag => tag.trim());
        }

        const isProductExist = await productModel.findOne({ sku });
        if (isProductExist) {
            return res.status(400).json({ success: false, message: "This SKU already exists" });
        }

        const newProduct = await productModel.create({
            category,
            subCategory,
            sku,
            stock,
            productName,
            description,
            price,
            mainImage: req.file.filename,
            tags: tagsArray
        });

        return res.status(200).json({ success: true, message: "Product Created Successfully", product: newProduct });

    } catch (err) {
        console.error('Error occurred while adding product:', err);
        if (req.file && req.file.filename) {
            try {
                const imagePath = path.join(__dirname, '..', 'public', 'uploads', req.file.filename);
                await fs.unlink(imagePath);
                console.log('File deleted:', req.file.filename);
            } catch (unlinkErr) {
                console.error('Error deleting file:', unlinkErr);
            }
        }

        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports.addToCart = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(200).json({ success: false, message: "User must be loggedIn", reason: "authentication" });
        }
        const userId = req.session.user.userId;
        const productId = req.body.productId;
        const quantity = req.body.moq || 6;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        let cart = await cartModel.findOne({ userId: userId });

        if (!cart) {
            cart = new cartModel({
                userId: userId,
                items: [{ productId, quantity }],
            });
        } else {
            const existingItem = cart.items.find(item => item.productId.equals(productId));

            if (existingItem) {
                existingItem.quantity += Number(quantity);
            } else {
                cart.items.push({ productId, quantity });
            }
        }

        await cart.save();

        return res.status(200).json({ success: true, message: "Product added to cart", cart });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

module.exports.removeFromCart = async (req, res) => {
    if (!(req.session.user && req.session.user.isAuthenticated)) {
        return res.status(200).json({ success: false, message: "User must be loggedIn", reason: "authentication" });
    }

    const productId = req.params.id;
    const userId = req.session.user.userId;

    try {
        const cart = await cartModel.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Remove the product from the items array
        cart.items = cart.items.filter(item => item.productId.toString() !== productId.toString());

        await cart.save();

        return res.status(200).redirect("/user/cart");
    } catch (error) {
        return res.status(500).json({ message: "Error removing product", error });
    }
};