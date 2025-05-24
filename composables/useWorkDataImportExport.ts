import { ref } from 'vue'

export const useWorkDataImportExport = (createWork: (work: any) => Promise<void>) => {
  const downloadData = (works: any[]) => {
    const data = JSON.stringify(works)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'works.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const uploadData = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          for (const work of data) {
            await createWork(work)
          }
        } catch (error) {
          console.error('データ読み込みエラー:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  return {
    downloadData,
    uploadData
  }
} 