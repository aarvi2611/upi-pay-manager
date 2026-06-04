import admin from 'firebase-admin';

function initFirebaseAdmin() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');

  let serviceAccountJson: any;
  try {
    const serviceAccount = key.trim().startsWith('{')
      ? key
      : Buffer.from(key, 'base64').toString('utf8');

    serviceAccountJson = JSON.parse(serviceAccount);
  } catch (e) {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON or base64 JSON: ' + e);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccountJson.project_id;
  const appName = `upi-pay-manager-${projectId}`;
  const existingApp = admin.apps.find((firebaseApp) => firebaseApp?.name === appName);
  if (existingApp) return existingApp;

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
    projectId,
  }, appName);
}

export function getFirestore() {
  return admin.firestore(initFirebaseAdmin());
}
