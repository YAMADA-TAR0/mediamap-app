import { ref } from 'vue'
import type { Ref } from 'vue'
import type { User } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import { useCloudData } from './useCloudData'

export interface Work {
  id?: string
  title: string
  year: string
  category: string
  rating: number
  tags: string[]
  memo?: string
  thumbnail?: string
}

export const useWork = (firestore: Firestore, currentUser: Ref<User | null>) => {
  const works = ref<Work[]>([])
  const { saveCloudData, loadCloudData } = useCloudData(firestore, currentUser)

  const createWork = async (work: Work): Promise<void> => {
    works.value.push(work)
    await saveCloudData(works.value)
  }

  const readWorks = async (): Promise<Work[]> => {
    const loadedWorks = await loadCloudData()
    works.value = loadedWorks
    return loadedWorks
  }

  const updateWork = async (workId: string, updatedWork: Partial<Work>): Promise<void> => {
    const index = works.value.findIndex(w => w.id === workId)
    if (index !== -1) {
      works.value[index] = { ...works.value[index], ...updatedWork }
      await saveCloudData(works.value)
    }
  }

  const deleteWork = async (workId: string): Promise<void> => {
    works.value = works.value.filter(w => w.id !== workId)
    await saveCloudData(works.value)
  }

  return {
    works,
    createWork,
    readWorks,
    updateWork,
    deleteWork
  }
} 