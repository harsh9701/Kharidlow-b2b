const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5, 
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const productSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
    },
    stock: {
      type: Number,
      default: 10,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 255,
    },
    subHead: {
      type: String,
      trim: true,
      maxlength: 550,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    keyHighlights: {
      type: Array,
    },
    mainImage: {
      type: String,
      required: true,
      unique: true,
    },
    productImages: [
      {
        type: String,
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
    },
    moq: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
      default: 6
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    taxType: {
      type: String,
      required: true,
      default: "exclusive"
    },
    taxRate: {
      type: Number,
      required: true,
      default: 0
    },
    tags: {
      type: Array,
      required: true
    },
    reviews: [reviewSchema],
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  { timestamps: true },
);

module.exports = productSchema;

module.exports = mongoose.model("Product", productSchema);
