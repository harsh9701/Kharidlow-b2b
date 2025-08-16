const mongoose = require("mongoose");
const cartModel = require("../models/cart");
const generalDataModel = require("../models/generaldata");
const productModel = require("../models/product");

// module.exports.renderLandingPage = async (req, res) => {
//     try {
//         const category = await generalDataModel.find({}, { subcategories: 0 })
//             .sort({ createdAt: -1 });

//         const recentProducts = await productModel.find({}, { productName: 1, price: 1, moq: 1, mainImage: 1 })
//             .sort({ createdAt: -1 })
//             .limit(12);

//         const under99Products = await productModel.aggregate([
//             { $match: { price: { $lte: 99 } } },
//             { $sample: { size: 36 } },
//             {
//                 $project: {
//                     productName: 1,
//                     price: 1,
//                     moq: 1,
//                     mainImage: 1
//                 }
//             }
//         ]);

//         const bagsProducts = await productModel.find(
//             { category: new mongoose.Types.ObjectId("66fe8456c94255633c708a26") },
//             { productName: 1, price: 1, moq: 1, mainImage: 1 }
//         ).limit(12);

//         console.log(bagsProducts);

//         res.render("index.ejs", { category, recentProducts, under99Products });
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// };

module.exports.renderLandingPage = async (req, res) => {
    try {
        const [category, recentProducts, under99Products, bagsProducts, stationeryItems] = await Promise.all([
            generalDataModel.find({}, { subcategories: 0 }).sort({ createdAt: -1 }).lean(),

            productModel.find({}, { productName: 1, price: 1, moq: 1, mainImage: 1 })
                .sort({ createdAt: -1 })
                .limit(12)
                .lean(),

            productModel.aggregate([
                { $match: { price: { $lte: 99 } } },
                { $sample: { size: 36 } },
                {
                    $project: {
                        productName: 1,
                        price: 1,
                        moq: 1,
                        mainImage: 1
                    }
                }
            ]),

            productModel.aggregate([
                { $match: { category: new mongoose.Types.ObjectId("66fe8456c94255633c708a26") } },
                { $sample: { size: 36 } },
                {
                    $project: {
                        productName: 1,
                        price: 1,
                        moq: 1,
                        mainImage: 1
                    }
                }
            ]),

            productModel.aggregate([
                { $match: { category: new mongoose.Types.ObjectId("67d573aaefcccb671f2d11a5") } },
                { $sample: { size: 20 } },
                {
                    $project: {
                        productName: 1,
                        price: 1,
                        moq: 1,
                        mainImage: 1
                    }
                }
            ])
        ]);

        return res.render("index.ejs", { category, recentProducts, under99Products, bagsProducts, stationeryItems });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
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

module.exports.renderCategoryWiseListingPage = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 48;
        const currentPage = parseInt(req.query.page) || 1;

        const categoryFilter = req.query.category || req.body.category;
        const minPrice = parseFloat(req.query.minPrice);
        const maxPrice = parseFloat(req.query.maxPrice);

        const skip = (page - 1) * pageSize;

        let filter = { category: categoryId };

        if (categoryFilter) {
            filter.subCategory = categoryFilter;
        }

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).render("error.ejs", { message: "Invalid category ID" });
        }

        const isCategoryExist = await generalDataModel.findById(categoryId);

        if (!isCategoryExist) {
            return res.status(400).render("error.ejs", { message: "Invalid category ID" });
        }

        if (!isNaN(minPrice) && !isNaN(maxPrice)) {
            filter.price = { $gte: minPrice, $lte: maxPrice };
        } else if (!isNaN(minPrice)) {
            filter.price = { $gte: minPrice };
        } else if (!isNaN(maxPrice)) {
            filter.price = { $lte: maxPrice };
        }

        const products = await productModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .select('productName price moq mainImage');

        const totalProducts = await productModel.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / pageSize);
        const categories = isCategoryExist;

        res.render("product/category-wise-listing.ejs", { products, totalProducts, currentPage, totalPages, categories, selectedCategory: categoryFilter || '', minPrice: req.query.minPrice || '', maxPrice: req.query.maxPrice || '' });
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports.renderSearchResultPage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 48;
    const currentPage = parseInt(req.query.page) || 1;
    const searchTerm = req.query.searchTerm;

    const skip = (page - 1) * pageSize;

    try {
        const searchResult = await productModel.find({
            $or: [
                { productName: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } }
            ]
        }, { productName: 1, price: 1, moq: 1, mainImage: 1 })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);

        const totalProducts = await productModel.countDocuments({
            $or: [
                { productName: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } }
            ]
        });
        const totalPages = Math.ceil(totalProducts / pageSize);

        res.status(200).render("product/searchResult.ejs", { searchResult, searchTerm, totalProducts, currentPage, totalPages });
    } catch (error) {
        console.log(error);
        return res.status(500).send(error.message);
    }
};

module.exports.renderShippingInfoPage = (req, res) => {
    try {
        res.render("shipping-information.ejs");
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.renderReturnRefundPolicyPage = (req, res) => {
    try {
        res.render("return-refund-policy.ejs");
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.renderPrivacyPolicyPage = (req, res) => {
    try {
        res.render("privacy-policy.ejs");
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.renderAboutUsPage = (req, res) => {
    try {
        res.render("about-us.ejs");
    } catch (error) {
        res.status(500).send(error.message);
    }
}