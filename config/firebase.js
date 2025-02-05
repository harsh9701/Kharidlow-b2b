const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "kharidlow-674ea.firebasestorage.app"
});

const bucket = admin.storage().bucket();

module.exports = bucket;