const { cloudinary } = require("../config/cloudinary");

const extractPublicId = (url) => {
    const parts = url.split('/');
    const fileWithExtension = parts[parts.length - 1];
    const publicId = fileWithExtension.split('.')[0];
    const folderPath = parts.slice(7, parts.length - 1).join('/');
    return folderPath ? `${folderPath}/${publicId}` : publicId;
};

// Helper function to delete Cloudinary image
const deleteCloudinaryImage = async (imagePath) => {
    try {
        const public_id = extractPublicId(imagePath);
        await cloudinary.uploader.destroy(public_id);
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        throw new Error('Failed to delete image');
    }
};

// Helper fucntion to format amounts
const formatAmount = (amount) => {
    if (amount >= 10000000) {
        // For crore (>= 1 crore)
        return (amount / 10000000).toFixed(2) + 'Cr';
    } else if (amount >= 100000) {
        // For lakh (>= 1 lakh but less than 1 crore)
        return (amount / 100000).toFixed(2) + 'L';
    } else if (amount >= 1000) {
        // For thousands (>= 1 thousand but less than 1 lakh)
        return (amount / 1000).toFixed(2) + 'K';
    } else {
        // For small amounts (less than 1 thousand)
        return amount.toString();
    }
}

module.exports = { deleteCloudinaryImage, formatAmount };