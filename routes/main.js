const express = require("express");
const router = express.Router();

const { renderLandingPage, cartCount, renderCategoryWiseListingPage, renderSearchResultPage, renderShippingInfoPage, renderReturnRefundPolicyPage, renderPrivacyPolicyPage, renderAboutUsPage } = require("../controllers/main");
const { userLogout, renderForgetPasswordPage, renderResetPasswordPage, forgetPassword, resetPassword } = require("../controllers/user");

router.get("/", renderLandingPage);
router.get("/shipping-info", renderShippingInfoPage);
router.get("/return-refunds", renderReturnRefundPolicyPage);
router.get("/privacy-policy", renderPrivacyPolicyPage);
router.get("/about-us", renderAboutUsPage);
router.get("/search", renderSearchResultPage);
router.get("/logout", userLogout);
router.get("/category/:id", renderCategoryWiseListingPage);
router.get("/cart/count", cartCount);
router.get("/forgetpassword", renderForgetPasswordPage);
router.get("/resetpassword/:token", renderResetPasswordPage);
router.put("/resetpassword/:token", resetPassword);
router.post("/forgetpassword", forgetPassword);

module.exports = router;