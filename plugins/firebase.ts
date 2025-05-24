import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import type { FirebaseOptions } from 'firebase/app'

export default defineNuxtPlugin(() => {
  // const config = useRuntimeConfig()

  const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyBn30p1y46ru6m2SQHMb9U9eQCCxzla7xo",
    authDomain: "mediamap-app-2ee92.firebaseapp.com",
    projectId: "mediamap-app-2ee92",
    storageBucket: "mediamap-app-2ee92.firebasestorage.app",
    messagingSenderId: "35065730175",
    appId: "1:35065730175:web:04d4e2814237851451db4a"
  }

  // 既に初期化されているかチェック
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  const auth = getAuth(app)
  const firestore = getFirestore(app)

  return {
    provide: {
      firebase: {
        app,
        auth,
        firestore
      }
    }
  }
})
