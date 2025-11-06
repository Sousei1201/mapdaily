import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebaseプロジェクトの設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebaseアプリの初期化（既に初期化済みの場合は既存のインスタンスを取得）
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Authentication のインスタンス
export const auth = getAuth(app);

// Firestore のインスタンス
export const db = getFirestore(app);

// Firebase Storage のインスタンス
export const storage = getStorage(app);

// 開発環境でエミュレータを使用する場合（オプション）
if (process.env.NODE_ENV === 'development') {
  // 必要に応じてエミュレータに接続（既に接続済みの場合はスキップ）
  try {
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectStorageEmulator(storage, 'localhost', 9199);
  } catch {
    console.log('Emulator connection skipped');
  }
}