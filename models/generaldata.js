const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	}
});

const categorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	img: {
		type: String,
	},
	subcategories: [subCategorySchema]  // Array of sub-categories
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;