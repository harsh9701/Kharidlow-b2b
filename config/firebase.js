const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);  //For production
// const serviceAccount = JSON.parse(process.env.LEARNING_FIREBASE);  //For development

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "kharidlow-674ea.firebasestorage.app"  //For production
  // storageBucket: "learning-1d8dd.firebasestorage.app"  //For development
});

const bucket = admin.storage().bucket();

module.exports = bucket;