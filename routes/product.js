const express = require("express");
const router = express.Router();
const { upload, multerErrorHandler } = require("../config/multer");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

const { renderAddProductPage, getCategory, getSubCategory, addNewProduct, renderListingPage, renderProductPage, addReview } = require("../controllers/product");

router.get("/new", isAdmin, renderAddProductPage);
router.get("/category", getCategory);
router.get("/category/:id/subCateorgy", getSubCategory);
router.post("/new", isAdmin, upload.fields([{ name: "productImage", maxCount: 1 }, { name: "additionalImages", maxCount: 5 }]), multerErrorHandler, addNewProduct);
router.post("/review", addReview);
router.get("/:id", renderProductPage);
router.get("/", renderListingPage);

module.exports = router;