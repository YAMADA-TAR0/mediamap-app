<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useWork } from '~/composables/useWork'
import { useWorkDataImportExport } from '~/composables/useWorkDataImportExport'
import WorkInput from '~/components/WorkInput.vue'
import TagCountChart from '~/components/TagCountChart.vue'
import TagRatingChart from '~/components/TagRatingChart.vue'
import WorkTimeline from '~/components/WorkTimeline.vue'
import TagFilter from '~/components/TagFilter.vue'
import CategoryFilter from '~/components/CategoryFilter.vue'
import MainVisual from '~/components/MainVisual.vue'
import WorkModal from '~/components/WorkModal.vue'

const { $firebase } = useNuxtApp()
const { auth } = $firebase
const { isLoggedIn, currentUser, login, logout, initAuth } = useAuth()
const { works, createWork, readWorks, updateWork, deleteWork } = useWork($firebase.firestore, currentUser)
const { downloadData, uploadData } = useWorkDataImportExport(createWork)

// 状態管理
const showModal = ref(false)
const selectedWork = ref(null)
const selectedWorkIndex = ref(-1)
const selectedTags = ref(new Set())
const selectedCategories = ref(new Set())

// 定数
const subcategories = [
  "ミステリー", "サスペンス", "SF", "ファンタジー", "バトル・アクション",
  "恋愛・ラブコメ", "青春", "ホラー", "ヒューマンドラマ", "歴史・時代劇",
  "コメディ", "ビジネス・社会派", "ドキュメンタリー・ノンフィクション",
  "エッセイ・随筆", "異世界転生"
]

const categories = ["小説", "漫画", "アニメ", "映画", "ドラマ"]
const years = Array.from({ length: 126 }, (_, i) => 1900 + i)

// TMDb APIキー
const TMDB_API_KEY = "228d640ff08a8b0c878af7963277edd3"

// データ管理
const handleLoadCloudData = async () => {
  works.value = await loadCloudData()
}

// 作品追加ハンドラー
const handleAddWork = async (work) => {
  await createWork(work)
}

// モーダル関連
const openModal = (work, index) => {
  selectedWork.value = work
  selectedWorkIndex.value = index
  showModal.value = true
}

const handleModalSave = async (data) => {
  if (selectedWorkIndex.value === -1) return

  await updateWork(selectedWorkIndex.value, {
    memo: data.memo,
    rating: data.rating
  })

  showModal.value = false
}

const handleModalDelete = async (index) => {
  if (index === -1) return

  await deleteWork(index)
  showModal.value = false
}

// 初期化
onMounted(() => {
  // 認証状態の監視
  initAuth(auth, async (user) => {
    if (user) {
      await readWorks()
    } else {
      works.value = []
    }
  })
})
</script>

<template>
  <div class="container">
    <header>
      <h1>作品マップ年表アプリ</h1>
    </header>

    <main>
      <MainVisual />

      <div id="loginPrompt" v-if="!isLoggedIn" class="login-prompt">
        <h2>ログインしてください</h2>
        <p>このアプリを利用するにはGoogleアカウントでのログインが必要です。</p>
        <button @click="() => login(auth, handleLoadCloudData)">Googleでログイン</button>
      </div>

      <div id="userArea" v-if="isLoggedIn">
        <button @click="() => logout(auth, () => {
          works.value = []
        })">ログアウト</button>
        <p id="userInfo">{{ currentUser?.displayName }} でログイン中</p>
      </div>

      <WorkInput
        :subcategories="subcategories"
        :categories="categories"
        :years="years"
        @add-work="handleAddWork"
      />

      <CategoryFilter
        :categories="categories"
        v-model:selected-categories="selectedCategories"
      />

      <TagFilter
        :subcategories="subcategories"
        v-model:selected-tags="selectedTags"
      />

      <h2>作品マップ（縦軸：評価 / 横軸：年代）</h2>
      <WorkTimeline
        :works="works"
        :selected-tags="selectedTags"
        :selected-categories="selectedCategories"
        :years="years"
        @open-modal="openModal"
      />

      <h2>タグ別登録数グラフ</h2>
      <TagCountChart :works="works" />

      <h2>タグ × 評価の傾向グラフ</h2>
      <TagRatingChart :works="works" />

      <h2>データ管理</h2>
      <button @click="downloadData">データをダウンロード</button>
      <input type="file" accept=".json" @change="uploadData">

      <WorkModal
        v-model="showModal"
        :work="selectedWork"
        :work-index="selectedWorkIndex"
        @save="handleModalSave"
        @delete="handleModalDelete"
      />
    </main>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.login-prompt {
  text-align: center;
  margin-top: 50px;
}

#modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  max-width: 500px;
  width: 90%;
}

button {
  padding: 8px 16px;
  margin: 5px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #45a049;
}

input[type="file"] {
  margin: 10px 0;
}
</style> 