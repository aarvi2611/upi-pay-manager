import admin from 'firebase-admin';

function parseServiceAccountKey(key: string) {
  const trimmed = key.trim().replace(/^['"]|['"]$/g, "");
  const candidates = [
    trimmed,
    trimmed.startsWith("wog") ? `e${trimmed}` : "",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const serviceAccount = candidate.startsWith('{')
        ? candidate
        : Buffer.from(candidate, 'base64').toString('utf8');

      return JSON.parse(serviceAccount);
    } catch {
      // Try the next normalized candidate.
    }
  }

  throw new Error(
    "Invalid FIREBASE_SERVICE_ACCOUNT_KEY. Paste the full JSON service account or the complete base64 value. Base64 usually starts with 'ewog'."
  );
}

function initFirebaseAdmin() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');

  let serviceAccountJson: any;
  try {
    serviceAccountJson = parseServiceAccountKey(key);
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
