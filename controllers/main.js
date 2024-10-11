module.exports.renderLandingPage = (req, res) => {
    try {
        res.render("index.ejs");
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};