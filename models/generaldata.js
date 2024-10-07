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
	subcategories: [subCategorySchema]  // Array of sub-categories
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
