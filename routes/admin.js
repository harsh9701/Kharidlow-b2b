const express = require("express");
const router = express.Router();

const { renderAdminPage, renderManageCustomerPage, renderManageOrderPage, renderManageProductPage, renderViewOrderPage } = require("../controllers/admin");

router.get("/manage", renderAdminPage);
router.get("/manage/orders/:orderId", renderViewOrderPage);
router.get("/manage/orders", renderManageOrderPage);
router.get("/manage/customers", renderManageCustomerPage);
router.get("/manage/products", renderManageProductPage);

module.exports = router;