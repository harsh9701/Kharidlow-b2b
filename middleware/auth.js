module.exports.isAuthenticated = (req, res, next) => {
    try {
        if (req.session.user && req.session.user.isAuthenticated) {
            return next();
        } else {
            return res.status(401).redirect(`/user/login?redirect=${encodeURIComponent(req.originalUrl)}`);
        }
    } catch (error) {
        console.error('Error in isAuthenticated middleware:', error);
        return res.status(500).send('Internal Server Error');
    }
};

module.exports.isAdmin = (req, res, next) => {
    try {
        if (req.session.user && req.session.user.isAuthenticated) {
            if(req.session.user.role === "admin") {
                return next();
            } else {
                return res.status(403).render('error.ejs', { message: "You are not authorized to access this page." });
            }
        } else {
            return res.status(401).redirect(`/user/login?redirect=${encodeURIComponent(req.originalUrl)}`);
        }
    } catch (error) {
        console.error('Error in isAuthenticated middleware:', error);
        return res.status(500).send('Internal Server Error');
    }
};