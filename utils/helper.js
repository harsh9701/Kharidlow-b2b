const bucket = require("../config/firebase");

const extractPublicId = (url) => {
    const parts = url.split('/');
    const fileWithExtension = parts[parts.length - 1];
    const publicId = fileWithExtension.split('.')[0];
    const folderPath = parts.slice(7, parts.length - 1).join('/');
    return folderPath ? `${folderPath}/${publicId}` : publicId;
};

// Helper function to upload images using firebase
const uploadImagesUsingFirebase = async (files) => {
    // Ensure 'files' is always an array
    files = Array.isArray(files) ? files : [files];

    try {
        const uploadPromises = files.map((file) => {
            return new Promise((resolve, reject) => {
                const fileName = `images/${Date.now()}_${file.originalname}`;
                const fileUpload = bucket.file(fileName);

                const stream = fileUpload.createWriteStream({
                    metadata: {
                        contentType: file.mimetype,
                    },
                });

                stream.on("error", (error) => reject(error));

                stream.on("finish", async () => {
                    await fileUpload.makePublic(); // Makes the file publicly accessible
                    resolve(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
                });

                stream.end(file.buffer);
            });
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        return uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls; // Return single URL if 1 file, else array
    } catch (error) {
        throw new Error(error.message);
    }
}

// Helper funcion to Delete images using firebase
const deleteImagesUsingFirebase = async (imageUrls) => {
    try {
        // Ensure 'imageUrls' is always an array
        imageUrls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];

        const deletePromises = imageUrls.map(async (imageUrl) => {
            const decodedUrl = decodeURIComponent(imageUrl);
            const baseUrl = `https://storage.googleapis.com/${bucket.name}/`;

            if (!decodedUrl.startsWith(baseUrl)) {
                throw new Error("Invalid image URL");
            }

            const filePath = decodedUrl.replace(baseUrl, ""); // Extract relative path
            const file = bucket.file(filePath);

            // Check if the file exists before deleting
            const [exists] = await file.exists();
            if (!exists) {
                throw new Error("File not found");
            }

            await file.delete();
            return `Deleted: ${imageUrl}`;
        });

        return await Promise.all(deletePromises);
    } catch (error) {
        throw new Error(error.message);
    }
}

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

module.exports = { uploadImagesUsingFirebase, deleteImagesUsingFirebase, formatAmount };