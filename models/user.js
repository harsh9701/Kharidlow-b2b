const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		fullName: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			default: "customer",
		},
		contactNo: {
			type: Number,
			required: true,
		},
		address: {
			type: String,
			// required: true,
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model("user", userSchema);
