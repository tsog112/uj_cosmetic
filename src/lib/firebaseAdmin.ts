import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function cleanEnvValue(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getServiceAccountFromJson() {
  const raw = cleanEnvValue(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return {
      projectId: parsed.project_id || parsed.projectId,
      clientEmail: parsed.client_email || parsed.clientEmail,
      privateKey: parsed.private_key || parsed.privateKey,
    };
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.');
  }
}

function getPrivateKey() {
  const key = cleanEnvValue(process.env.FIREBASE_PRIVATE_KEY);
  return key ? key.replace(/\\n/g, '\n') : undefined;
}

export function getAdminDb() {
  const serviceAccount = getServiceAccountFromJson();
  const projectId = serviceAccount?.projectId || cleanEnvValue(process.env.FIREBASE_ADMIN_PROJECT_ID) || cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const clientEmail = serviceAccount?.clientEmail || cleanEnvValue(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = serviceAccount?.privateKey?.replace(/\\n/g, '\n') || getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && 'project id',
      !clientEmail && 'client email',
      !privateKey && 'private key',
    ].filter(Boolean).join(', ');
    throw new Error(`Firebase Admin credentials are missing: ${missing}. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_ADMIN_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.`);
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

  return getFirestore(app);
}
