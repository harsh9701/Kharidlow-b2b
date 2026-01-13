const express = require("express");
const router = express.Router();
const { upload, multerErrorHandler } = require("../config/multer");
const { isAdmin } = require("../middleware/auth");

const { renderAdminPage, renderManageCustomerPage, renderManageOrderPage, renderManageProductPage, renderViewOrderPage, updateOrderStatus, renderViewCustomerPage, renderUpdateProductPage, renderCartAnalysisPage, sendAbandonedCartEmailService, renderFinalizeBillPage, finalizeBill, renderInvoice, renderAddUserPage } = require("../controllers/admin");
const { updateProduct, deleteProductImage, deleteProduct, deleteMultipleProducts } = require("../controllers/product");

router.get("/add-user", isAdmin, renderAddUserPage);
router.get("/cartanalysis", isAdmin, renderCartAnalysisPage);
router.get("/manage", isAdmin, renderAdminPage);
router.put("/manage/orders/update", isAdmin, updateOrderStatus);
router.post("/manage/orders/finalize-bill", isAdmin, finalizeBill);
router.get("/manage/orders/invoice/:orderId", isAdmin, renderInvoice);
router.get("/manage/orders/:orderId", isAdmin, renderViewOrderPage);
router.get("/manage/orders/:orderId/finalize", isAdmin, renderFinalizeBillPage);
router.get("/manage/orders", isAdmin, renderManageOrderPage);
router.get("/manage/customers/:customerId", isAdmin, renderViewCustomerPage);
router.get("/manage/customers", isAdmin, renderManageCustomerPage);
router.get("/manage/products/:productId", isAdmin, renderUpdateProductPage);
router.get("/manage/products", isAdmin, renderManageProductPage);
router.post("/abandoned-cart-reminder/:userId", isAdmin, sendAbandonedCartEmailService);
router.delete("/delete/productimage/:productId", isAdmin, deleteProductImage);
router.delete("/delete/products", isAdmin, deleteMultipleProducts);
router.delete("/delete/product/:productId", isAdmin, deleteProduct);
router.put("/update/product/:productId", isAdmin, upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'productImages', maxCount: 5 }]), multerErrorHandler, updateProduct);

module.exports = router;