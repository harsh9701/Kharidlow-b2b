const express = require("express");
const app = express();
const path = require("path");
const connectToDb = require("./config/db");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const userRoute = require("./routes/user.js");
const mainRoute = require("./routes/main.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));

connectToDb();

app.use("/user", userRoute);
app.use("/", mainRoute);

app.listen(process.env.PORT || 8010, () => {
    console.log(`Server is running on port ${process.env.PORT || 8010}`);
});