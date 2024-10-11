const express = require("express");
const app = express();
const path = require("path");
const connectToDb = require("./config/db");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("dotenv").config();

const userRoute = require("./routes/user.js");
const mainRoute = require("./routes/main.js");
const productRoute = require("./routes/product.js");
const adminRoute = require("./routes/admin.js");

// Set up session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));

// Middleware to make user available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

connectToDb();

app.use("/product", productRoute);
app.use("/user", userRoute);
app.use("/admin", adminRoute);
app.use("/", mainRoute);

app.all("*", (req, res, next) => {
    res.render("error.ejs");
});

app.listen(process.env.PORT || 8010, () => {
    console.log(`Server is running on port ${process.env.PORT || 8010}`);
});