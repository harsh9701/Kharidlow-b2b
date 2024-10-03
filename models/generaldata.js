const mongoose = require("mongoose");

const generalDataSchema = new mongoose.Schema({
	productCategory: {
		type: Object,
		required: true,
	},
});

const generalData = mongoose.model("generalData", generalDataSchema);

module.exports = generalData;
