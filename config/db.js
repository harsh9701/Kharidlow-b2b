const mongoose = require("mongoose");

const connectDb = () => {
  try {
    mongoose
      .connect(process.env.MONGO_URL)
      .then(() => {
        console.log("Connected to DB");
      })
      .catch((err) => {
        console.log("DB connection error", err);
      });
  } catch (err) {
    console.error("Mongodb connection error", err);
    process.exit(1);
  }
};

module.exports = connectDb;