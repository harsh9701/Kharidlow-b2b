module.exports.isAuthenticated = (req, res, next) => {
    if (req.session.user && req.session.user.isAuthenticated) {
        return next();
    } else {
        return res.status(401).redirect(`/user/login?redirect=${encodeURIComponent(req.originalUrl)}`);
    }
};