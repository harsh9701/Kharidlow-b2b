const categoryModel = require("../models/generaldata");
const productModel = require("../models/product");
const fs = require("fs").promises;
const path = require("path");

module.exports.renderAddProductPage = (req, res) => {
    res.render("product/add-product.ejs");
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