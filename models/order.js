const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    orderItems: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            productName: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            total: { type: Number, required: true },
        },
    ],
    grandTotal: {
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
    },
    paymentMethod: {
        type: String,
    },
    taxRate: {
        type: Number
    },
    shippingPrice: {
        type: Number,
        default: 0.0,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'dispatched', 'delivered'],
        default: 'pending',
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
