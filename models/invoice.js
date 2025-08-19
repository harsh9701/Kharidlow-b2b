const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    orderItems: [
        {
            productName: { type: String, required: true },
            price: { type: Number, required: true },
            taxRate: { type: Number, required: true },
            taxType: { type: String, required: true },
            taxAmount: { type: Number, required: true },
            quantity: { type: Number, required: true },
            total: { type: Number, required: true },
        },
    ],
    grandTotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Object
    },
    finalTotal: {
        type: Number,
        required: true
    },
    shippingAddress: {
        flatNo: { type: String },
        streetNo: { type: String },
        area: { type: String },
        state: { type: String },
        pincode: { type: String },
        company: { type: String },
        gstNo: { type: String },
        altContact: { type: String }
    }
}, { timestamps: true });

const invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = invoice;