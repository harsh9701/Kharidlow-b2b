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

module.exports = { deleteCloudinaryImage };