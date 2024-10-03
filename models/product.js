const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    item: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
    },
    productCode: {
      type: String,
      unique: true,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
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
      required: true,
      trim: true,
      maxlength: 550,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    keyHighlights: {
      type: Array,
      required: true,
    },
    mainImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productImage.files",
      required: true,
      unique: true,
    },
    productImages: [
      {
        type: String,
      },
    ],
    basePrice: {
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
    },
    isDiscounted: {
      type: Boolean,
      required: true,
    },
    baseDiscount: {
      type: Number,
      min: 0,
      max: 100,
      validate: {
        validator: function (value) {
          // If isDiscounted is true, baseDiscount is required
          if (this.isDiscounted) {
            return value !== null && value !== undefined;
          }
          return true; // No validation if isDiscounted is false
        },
        message: "Base discount is required when product is discounted",
      },
    },
    qtyPriceSlabs: [
      {
        moq: {
          type: Number,
          // required: true
        },
        discount: {
          type: Number,
          // required: true
        },
      },
    ],
    // qtyPriceSlabs: {
    //     type: [{
    //         moq: {
    //             type: Number,
    //             required: true
    //         },
    //         discount: {
    //             type: Number,
    //             required: true
    //         }
    //     }],
    //     validate: {
    //         validator: function (value) {
    //             // Validate qtyPriceSlabs only if isQtyBasedPricing is true
    //             if (this.isQtyBasedPricing) {
    //                 return value.length > 0;
    //             }
    //             return true; // No validation if isQtyBasedPricing is false
    //         },
    //         message: 'Quantity price slabs are required when quantity-based pricing is enabled'
    //     }
    // },
    taxType: {
      type: String,
      required: true,
    },
    taxRate: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = productSchema;

module.exports = mongoose.model("product", productSchema);
