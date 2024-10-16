const categoryModel = require("../models/generaldata");
const productModel = require("../models/product");
const cartModel = require("../models/cart");
const fs = require('fs').promises;
const path = require('path');

module.exports.renderAddProductPage = (req, res) => {
    try {
        res.render("product/add-product.ejs");
    } catch (error) {
        console.log(error.message);
        return res.status(500).send(error.message);
    }
};

module.exports.renderListingPage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 24;
    const currentPage = parseInt(req.query.page) || 1;
    const categoryFilter = req.query.category;

    const skip = (page - 1) * pageSize;

    let filter = {};
    if (categoryFilter) {
        filter.subCategory = categoryFilter;
    }

    try {
        const products = await productModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .select('productName price moq mainImage');

        const totalProducts = await productModel.countDocuments(filter);

        const categories = await productModel.aggregate([
            {
                $group: {
                    _id: "$subCategory"
                }
            },
            {
                $project: {
                    _id: 0,
                    subCategory: "$_id"
                }
            }
        ]);

        const totalPages = Math.ceil(totalProducts / pageSize);

        res.render("product/listing.ejs", { products, totalProducts, currentPage, totalPages, categories, selectedCategory: categoryFilter || '' });

    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports.renderProductPage = async (req, res) => {
    const productId = req.params.id;
    try {
        const productDetails = await productModel.findById(productId, { productName: 1, subCategory: 1, price: 1, description: 1, moq: 1, mainImage: 1, discount: 1 });
        const suggestedProducts = await productModel.aggregate([
            { $match: { subCategory: productDetails.subCategory } },
            { $sample: { size: 3 } },
            { $project: { productName: 1, subCategory: 1, price: 1, description: 1, moq: 1, mainImage: 1, discount: 1 } }
        ]);
        res.render("product/product.ejs", { productDetails, suggestedProducts });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.getCategory = async (req, res) => {
    try {
        const categories = await categoryModel.find({});
        return res.status(200).send(categories);
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports.getSubCategory = async (req, res) => {
    const categoryId = req.params.id;
    try {
        const subCategories = (await categoryModel.find({ _id: categoryId }))[0].subcategories;
        return res.status(200).send(subCategories);
    } catch (error) {
        return res.status(500).send(error.message);
    }
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

module.exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const updatedProductData = req.body;
        const mainImage = req.files.mainImage ? req.files.mainImage[0] : null;
        const additionalImages = req.files.productImages || [];

        const product = await productModel.findById(productId, { mainImage: 1, productImages: 1 });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product Not Found" });
        }

        const tagsArray = updatedProductData.tags ? updatedProductData.tags.split(',').map(tag => tag.trim()) : [];

        let productImages = [...product.productImages];

        // Only push new images if the total count will not exceed 5
        if (additionalImages.length > 0) {
            const totalImagesCount = Number(productImages.length) + Number(additionalImages.length);

            if (totalImagesCount <= 5) {
                productImages = productImages.concat(additionalImages.map(file => file.filename));
            } else {
                return res.status(400).json({
                    success: false,
                    message: `You can only upload ${5 - productImages.length} more images.`
                });
            }
        }

        const updateData = {
            productName: updatedProductData.productName,
            description: updatedProductData.description,
            price: updatedProductData.price,
            stock: updatedProductData.stock,
            moq: updatedProductData.moq,
            discount: updatedProductData.discount,
            taxType: updatedProductData.taxType,
            taxRate: updatedProductData.taxRate,
            tags: tagsArray,
            mainImage: mainImage ? mainImage.filename : product.mainImage,
            productImages
        };

        const updatedProduct = await productModel.findByIdAndUpdate(productId, updateData, { new: true });

        if (updatedProduct) {
            // Delete old main image if it's being replaced
            if (mainImage && product.mainImage) {
                const oldMainImagePath = path.join(__dirname, '..', 'public', 'uploads', product.mainImage);
                try {
                    await fs.unlink(oldMainImagePath);
                } catch (err) {
                    console.error('Error deleting old main image:', err);
                }
            }
        }

        res.status(200).send({ success: true, message: 'Product updated successfully', product: updatedProduct });

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send({ success: false, message: 'Internal server error', error: error.message });
    }
};

module.exports.deleteProductImage = async (req, res) => {
    const productId = req.params.productId;
    const imageName = req.body.imageName;

    if (!imageName) {
        return res.status(400).json({ success: false, message: 'Image name is required.' });
    }

    try {
        const updatedProduct = await productModel.findByIdAndUpdate(
            productId,
            { $pull: { productImages: imageName } },
            { new: true } // Return the updated product after the image is removed
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', imageName);
        try {
            await fs.unlink(oldImagePath);
        } catch (err) {
            console.error('Error deleting image from file system:', err);
        }

        return res.status(200).json({ success: true, message: 'Image deleted successfully.' });

    } catch (error) {
        console.error('Error during image deletion:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};

module.exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.productId;

        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        // Delete product images
        const imagesToDelete = [product.mainImage, ...product.productImages];
        for (const image of imagesToDelete) {
            const imagePath = path.join(__dirname, '..', 'public', 'uploads', image);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.error('Error deleting image:', err);
            }
        }

        // Delete the product
        await productModel.findByIdAndDelete(productId);

        res.status(200).json({ success: true, message: 'Product deleted successfully.' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};