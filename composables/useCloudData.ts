import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import type { Ref } from 'vue'

interface Work {
  id?: string
  title: string
  year: string
  category: string
  rating: number
  tags: string[]
  memo?: string
  thumbnail?: string
}

interface CloudData {
  works: Work[]
}

export const useCloudData = (firestore: Firestore, currentUser: Ref<User | null>) => {
  const saveCloudData = async (works: Work[]): Promise<void> => {
    if (!currentUser.value?.uid) return
    try {
      await setDoc(doc(firestore, 'mediaMaps', currentUser.value.uid), { works })
    } catch (error) {
      console.error('クラウド保存エラー:', error)
    }
  }

  const loadCloudData = async (): Promise<Work[]> => {
    if (!currentUser.value?.uid) return []
    try {
      const docRef = doc(firestore, 'mediaMaps', currentUser.value.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data() as CloudData
        return data.works
      }
      return []
    } catch (error) {
      console.error('クラウド読み込みエラー:', error)
      return []
    }
  }

  return {
    saveCloudData,
    loadCloudData
  }
} 