import admin from 'firebase-admin';

let app: admin.app.App | null = null;

function initFirebaseAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');

  // FIREBASE_SERVICE_ACCOUNT_KEY should be base64-encoded JSON
  let serviceAccountJson: any;
  try {
    const decoded = Buffer.from(key, 'base64').toString('utf8');
    serviceAccountJson = JSON.parse(decoded);
  } catch (e) {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ' + e);
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccountJson.project_id,
  });

  return app;
}

export function getFirestore() {
  if (!admin.apps.length) initFirebaseAdmin();
  return admin.firestore();
}
