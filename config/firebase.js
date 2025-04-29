const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "kharidlow-674ea.firebasestorage.app"  //For production
  // storageBucket: "testing-7dfcb.firebasestorage.app"  //For development
});

const bucket = admin.storage().bucket();

module.exports = bucket;