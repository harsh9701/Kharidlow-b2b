const categoryModel = require("../models/generaldata");
const productModel = require("../models/product");
const cartModel = require("../models/cart");
const { uploadImagesUsingFirebase, deleteImagesUsingFirebase } = require("../utils/helper");
const mongoose = require("mongoose");

module.exports.renderAddProductPage = (req, res) => {
    try {
        res.render("product/add-product.ejs");
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports.renderListingPage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 48;
    const currentPage = page;

    const categoryFilter = req.query.category || req.body.category;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);

    const skip = (page - 1) * pageSize;

    let filter = {};

    if (categoryFilter) {
        filter.subCategory = categoryFilter;
    }

    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        filter.price = { $gte: minPrice, $lte: maxPrice };
    } else if (!isNaN(minPrice)) {
        filter.price = { $gte: minPrice };
    } else if (!isNaN(maxPrice)) {
        filter.price = { $lte: maxPrice };
    }

    try {
        const products = await productModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .select('productName price moq mainImage');

        const totalProducts = await productModel.countDocuments(filter);

        const unsortedCategories = await productModel.aggregate([
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

        const categories = unsortedCategories.sort((a, b) => a.subCategory.localeCompare(b.subCategory));

        const totalPages = Math.ceil(totalProducts / pageSize);

        res.render("product/listing.ejs", { products, totalProducts, currentPage, totalPages, categories, selectedCategory: categoryFilter || '', minPrice: req.query.minPrice || '', maxPrice: req.query.maxPrice || '' });

    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports.renderProductPage = async (req, res) => {
    const productId = req.params.id;
    try {
        const productDetails = await productModel.findById(productId, { productName: 1, subCategory: 1, price: 1, description: 1, moq: 1, mainImage: 1, discount: 1, reviews: 1, productImages: 1, taxType: 1, taxRate: 1 })
            .populate({
                path: "reviews.user",
                select: "fullName"
            });
        const suggestedProducts = await productModel.aggregate([
            { $match: { subCategory: productDetails.subCategory } },
            { $sample: { size: 32 } },
            { $project: { productName: 1, price: 1, moq: 1, mainImage: 1 } }
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
        const { productName, category, subCategory, price, taxRate, taxType, stock, description, sku, tags, moq } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Product image is mandatory" });
        }

        if (price < 1 || stock < 1 || moq < 1) {
            return res.status(400).json({ success: false, message: "Price, stock & MOQ should be greater than 0" });
        }

        if (!productName || !category || !price || !sku) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const isProductExist = await productModel.findOne({ sku });

        if (isProductExist) {
            return res.status(400).json({ success: false, message: "This SKU already exists" });
        }

        let tagsArray = [];
        if (tags) {
            tagsArray = tags.split(',').map(tag => tag.trim());
        }

        const imageUrl = await uploadImagesUsingFirebase(req.file);

        const newProduct = await productModel.create({
            category,
            subCategory,
            sku,
            moq: Number(moq),
            stock,
            productName,
            description,
            price,
            taxType,
            taxRate: Number(taxRate),
            mainImage: imageUrl,
            tags: tagsArray,
        });

        return res.status(200).json({ success: true, message: "Product Created Successfully" });
    } catch (err) {
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

        req.session.cartCount = cart.items.length;

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

        req.session.cartCount = cart.items.length;

        return res.status(200).redirect("/user/cart");
    } catch (error) {
        return res.status(500).json({ message: "Error removing product", error });
    }
};

module.exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const updatedProductData = req.body;
        const product = await productModel.findById(productId, { mainImage: 1, productImages: 1 });

        if (!product) {
            return res.status(404).json({ success: false, message: "Product Not Found" });
        }

        if (updatedProductData.price < 1 || updatedProductData.stock < 1 || updatedProductData.moq < 1) {
            return res.status(400).json({ success: false, message: "Price, stock & MOQ should be greater than 0" });
        }

        const tagsArray = updatedProductData.tags ? updatedProductData.tags.split(',').map(tag => tag.trim()) : [];

        let productImages = [...product.productImages];
        let mainImage = product.mainImage;

        // Handle Main Image Replacement
        if (req.files.mainImage) {
            // Delete old mainImage if a new one is uploaded
            if (product.mainImage) {
                await deleteImagesUsingFirebase(product.mainImage);
            }

            // Upload new main image
            mainImage = await uploadImagesUsingFirebase(req.files.mainImage[0]);
        }

        // Handle Additional Images (Max 5)
        if (req.files.productImages && req.files.productImages.length > 0) {
            const totalImagesCount = productImages.length + req.files.productImages.length;

            if (totalImagesCount <= 5) {
                // Delete all old images before replacing them
                // if (productImages.length > 0) {
                //     await deleteImagesUsingFirebase(productImages);
                // }

                // Upload new product images
                const newUploadedImages = await Promise.all(req.files.productImages.map(file => uploadImagesUsingFirebase(file)));

                // Append to existing productImages array
                productImages = [...productImages, ...newUploadedImages];
            } else {
                return res.status(400).json({
                    success: false,
                    message: `You can only upload ${5 - productImages.length} more images.`
                });
            }
        }

        // Update Product Data
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
            mainImage,
            productImages
        };

        const updatedProduct = await productModel.findByIdAndUpdate(productId, updateData, { new: true });

        res.status(200).json({ success: true, message: "Product updated successfully", product: updatedProduct });

    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
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
        } else {
            try {
                await deleteImagesUsingFirebase(imageName);
            } catch (error) {
                return res.status(500).json({ success: false, message: 'Failed to delete image' });
            }
        }

        return res.status(200).json({ success: true, message: 'Image deleted successfully.' });

    } catch (error) {
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

        const cartWithProduct = await cartModel.find({ 'items.productId': productId });

        if (cartWithProduct.length > 0) {
            // Product is in someone's cart, remove it from all carts
            await cartModel.updateMany(
                { 'items.productId': productId },
                { $pull: { items: { productId: productId } } }
            );
        }

        // Delete product images
        const imagesToDelete = [product.mainImage, ...product.productImages];
        for (const image of imagesToDelete) {
            try {
                await deleteImagesUsingFirebase(image);
            } catch (error) {
                return res.status(500).json({ success: false, message: 'Failed to delete image' });
            }
        }

        // Delete the product
        await productModel.findByIdAndDelete(productId);

        res.status(200).json({ success: true, message: 'Product deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports.deleteMultipleProducts = async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No products selected.' });
        }

        // Check and remove products from all carts
        await Promise.all(
            productIds.map(async (productId) => {
                const cartWithProduct = await cartModel.find({ 'items.productId': productId });

                if (cartWithProduct.length > 0) {
                    // Product is in someone's cart, remove it from all carts
                    await cartModel.updateMany(
                        { 'items.productId': productId },
                        { $pull: { items: { productId: productId } } }
                    );
                }
            })
        );

        // Delete product images and products
        await Promise.all(
            productIds.map(async (productId) => {
                const product = await productModel.findById(productId);

                if (!product) {
                    return; // Skip if product doesn't exist
                }

                // Delete product images
                const imagesToDelete = [product.mainImage, ...product.productImages];
                for (const image of imagesToDelete) {
                    try {
                        await deleteImagesUsingFirebase(image);
                    } catch (error) {
                        console.error(`Failed to delete image for product ${productId}:`, error);
                    }
                }

                // Delete the product
                await productModel.findByIdAndDelete(productId);
            })
        );

        res.status(200).json({ success: true, message: 'Products deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports.addReview = async (req, res) => {
    try {
        if (!(req.session.user && req.session.user.isAuthenticated)) {
            return res.status(200).json({ success: false, message: "User must be logged In", reason: "authentication" });
        }

        const { rating, comment, productId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid Product ID" });
        }

        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        product.reviews.push({
            rating: parseInt(rating, 10),
            comment: comment,
            user: req.session.user.userId,
        });

        await product.save();

        return res.status(200).json({ success: true, message: 'Review submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }

};