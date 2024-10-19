const categoryModel = require("../models/generaldata");
const productModel = require("../models/product");
const cartModel = require("../models/cart");
const { deleteCloudinaryImage } = require("../utils/helper");
const mongoose = require("mongoose");

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
    const categoryFilter = req.query.category || req.body.category;

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
        const productDetails = await productModel.findById(productId, { productName: 1, subCategory: 1, price: 1, description: 1, moq: 1, mainImage: 1, discount: 1, reviews: 1 })
            .populate({
                path: "reviews.user",
                select: "fullName"
            });
        const suggestedProducts = await productModel.aggregate([
            { $match: { subCategory: productDetails.subCategory } },
            { $sample: { size: 12 } },
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
        const { productName, category, subCategory, price, stock, description, sku, tags, moq } = req.body;

        if (!productName || !category || !price || !sku) {
            // Delete uploaded image if required fields are missing
            if (req.file && req.file.path) {
                await deleteCloudinaryImage(req.file.path);
            }
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const isProductExist = await productModel.findOne({ sku });
        if (isProductExist) {
            // Delete uploaded image if SKU already exists
            if (req.file && req.file.path) {
                await deleteCloudinaryImage(req.file.path);
            }
            return res.status(400).json({ success: false, message: "This SKU already exists" });
        }

        let tagsArray = [];
        if (tags) {
            tagsArray = tags.split(',').map(tag => tag.trim());
        }

        const newProduct = await productModel.create({
            category,
            subCategory,
            sku,
            moq: Number(moq),
            stock,
            productName,
            description,
            price,
            mainImage: req.file ? req.file.path : null,
            tags: tagsArray,
        });

        return res.status(200).json({ success: true, message: "Product Created Successfully" });
    } catch (err) {
        console.error('Error occurred while adding product:', err);

        // Delete the uploaded image in case of an error
        if (req.file && req.file.path) {
            try {
                await deleteCloudinaryImage(req.file.path);
            } catch (error) {
                return res.status(500).json({ success: false, message: 'Failed to delete image' });
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
        const mainImage = req.files.mainImage ? req.files.mainImage[0].path : null;
        const additionalImages = req.files.productImages || [];

        const product = await productModel.findById(productId, { mainImage: 1, productImages: 1 });
        if (!product) {
            if (mainImage) {
                try {
                    await deleteCloudinaryImage(mainImage);
                } catch (error) {
                    return res.status(500).json({ success: false, message: 'Failed to delete image' });
                }
            }
            return res.status(404).json({ success: false, message: "Product Not Found" });
        }

        const tagsArray = updatedProductData.tags ? updatedProductData.tags.split(',').map(tag => tag.trim()) : [];

        let productImages = [...product.productImages];

        // Only push new images if the total count will not exceed 5
        if (additionalImages.length > 0) {
            const totalImagesCount = Number(productImages.length) + Number(additionalImages.length);

            if (totalImagesCount <= 5) {
                productImages = productImages.concat(additionalImages.map(file => file.path));
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
            mainImage: mainImage ? mainImage : product.mainImage,
            productImages
        };

        const updatedProduct = await productModel.findByIdAndUpdate(productId, updateData, { new: true });

        if (updatedProduct) {
            // Delete old main image if it's being replaced
            if (mainImage && product.mainImage) {
                try {
                    await deleteCloudinaryImage(product.mainImage);
                } catch (error) {
                    return res.status(500).json({ success: false, message: 'Failed to delete image' });
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
        } else {
            try {
                await deleteCloudinaryImage(imageName);
            } catch (error) {
                return res.status(500).json({ success: false, message: 'Failed to delete image' });
            }
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
                await deleteCloudinaryImage(image);
            } catch (error) {
                return res.status(500).json({ success: false, message: 'Failed to delete image' });
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
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }

};