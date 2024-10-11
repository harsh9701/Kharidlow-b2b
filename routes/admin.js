const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const { isAdmin } = require("../middleware/auth");

const { renderAdminPage, renderManageCustomerPage, renderManageOrderPage, renderManageProductPage, renderViewOrderPage, updateOrderStatus, renderViewCustomerPage, renderUpdateProductPage } = require("../controllers/admin");
const { updateProduct, deleteProductImage, deleteProduct } = require("../controllers/product");

router.get("/manage", isAdmin, renderAdminPage);
router.put("/manage/orders/update", isAdmin, updateOrderStatus);
router.get("/manage/orders/:orderId", isAdmin, renderViewOrderPage);
router.get("/manage/orders", isAdmin, renderManageOrderPage);
router.get("/manage/customers/:customerId", isAdmin, renderViewCustomerPage);
router.get("/manage/customers", isAdmin, renderManageCustomerPage);
router.get("/manage/products/:productId", isAdmin, renderUpdateProductPage);
router.get("/manage/products", isAdmin, renderManageProductPage);
router.delete("/delete/productimage/:productId", isAdmin, deleteProductImage);
router.delete("/delete/product/:productId", isAdmin, deleteProduct);
router.put("/update/product/:productId", isAdmin, upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'productImages', maxCount: 5 }]), updateProduct);

module.exports = router;