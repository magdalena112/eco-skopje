import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// @ts-ignore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export async function seedEvents() {
  if (!auth.currentUser) return;
  try {
    const eventsRef = collection(db, 'events');
    const snap = await getDocs(eventsRef);
    
    if (snap.empty) {
      const defaultEvents = [
        {
          title: "Чистење на Водно",
          description: "Голема акција за чистење на патеките кон врвот Крстовар.",
          date: new Date(Date.now() + 86400000 * 3), // 3 days from now
          location: "Средно Водно",
          pointsReward: 50,
          participants: [auth.currentUser.uid],
          userId: auth.currentUser.uid
        },
        {
          title: "Садење дрвја во Градски Парк",
          description: "Озеленување на новиот дел од паркот со 50 нови садници.",
          date: new Date(Date.now() + 86400000 * 7), // 7 days from now
          location: "Градски Парк, Скопје",
          pointsReward: 100,
          participants: [auth.currentUser.uid],
          userId: auth.currentUser.uid
        }
      ];

      for (const event of defaultEvents) {
        await addDoc(eventsRef, {
          ...event,
          date: serverTimestamp() // Simplified for demo to use current server time or manual Date
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'events');
  }
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error.message && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
