const express = require("express");
const router = express.Router();
const upload = require("../config/multer");

const { renderAddProductPage, getCategory, getSubCategory, addNewProduct } = require("../controllers/product");

router.get("/new", renderAddProductPage);
router.get("/category", getCategory);
router.get("/category/:id/subCateorgy", getSubCategory);
router.post("/new", upload.single('productImage'), addNewProduct);

module.exports = router;