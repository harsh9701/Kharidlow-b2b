const multer = require("multer");
const path = require("path");

// File filter to allow only specific image types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        return cb(new Error("Unsupported image format"), false);
    }
};

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "Image size should not exceed 5MB"
            });
        }

        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Custom fileFilter errors
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "File upload error"
        });
    }

    next();
};

module.exports = {upload, multerErrorHandler};