const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Address sub-schema
const addressSchema = new Schema(
	{
		flatNo: {
			type: String,
			required: true,
		},
		streetNo: {
			type: String,
			required: true,
		},
		area: {
			type: String,
			required: true,
		},
		state: {
			type: String,
			required: true,
		},
		pincode: {
			type: String,
			required: true,
		},
		company: {
			type: String,
		},
		gstNo: {
			type: String,
		},
		altContact: {
			type: String,
		},
	}
);

const userSchema = new Schema(
	{
		fullName: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true
		},
		password: {
			type: String,
			required: true
		},
		role: {
			type: String,
			default: "customer",
		},
		contactNo: {
			type: Number,
			required: true,
		},
		orderCount: {
			type: Number,
			default: 0
		},
		addresses: [addressSchema],
		resetPasswordToken: {
			type: String
		},
		resetPasswordExpires: {
			type: Date
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model("User", userSchema);