const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
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
        address: { type: String },
        city: { type: String },
        postalCode: { type: String },
        country: { type: String },
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
