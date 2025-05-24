<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useCloudData } from '~/composables/useCloudData'
import WorkInput from '~/components/WorkInput.vue'
import TagCountChart from '~/components/TagCountChart.vue'
import TagRatingChart from '~/components/TagRatingChart.vue'
import WorkTimeline from '~/components/WorkTimeline.vue'
import TagFilter from '~/components/TagFilter.vue'
import CategoryFilter from '~/components/CategoryFilter.vue'

const { $firebase } = useNuxtApp()
const { auth } = $firebase
const { isLoggedIn, currentUser, login, logout, initAuth } = useAuth()
const { saveCloudData, loadCloudData } = useCloudData($firebase.firestore, currentUser)

// 状態管理
const works = ref([])
const showModal = ref(false)
const modalTitle = ref('')
const modalInfo = ref('')
const modalRatingSelect = ref('')
const memoEditArea = ref('')
const selectedWorkId = ref(null)
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
const handleSaveCloudData = async () => {
  await saveCloudData(works.value)
}

const handleLoadCloudData = async () => {
  works.value = await loadCloudData()
}

// 作品追加ハンドラー
const handleAddWork = (work) => {
  works.value.push(work)
  handleSaveCloudData()
}

// モーダル関連
const openModal = (work) => {
  modalTitle.value = work.title
  modalInfo.value = `${work.category} / ${work.year}年`
  modalRatingSelect.value = work.rating.toString()
  memoEditArea.value = work.memo
  selectedWorkId.value = work.id
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveMemo = async () => {
  if (!selectedWorkId.value) return

  const workIndex = works.value.findIndex(w => w.id === selectedWorkId.value)
  if (workIndex !== -1) {
    works.value[workIndex].memo = memoEditArea.value
    works.value[workIndex].rating = parseInt(modalRatingSelect.value)
    await handleSaveCloudData()
  }

  showModal.value = false
}

const deleteWork = async () => {
  if (!selectedWorkId.value) return

  works.value = works.value.filter(w => w.id !== selectedWorkId.value)
  await handleSaveCloudData()
  showModal.value = false
}

// データインポート/エクスポート
const downloadData = () => {
  const data = JSON.stringify(works.value)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'works.json'
  a.click()
  URL.revokeObjectURL(url)
}

const uploadData = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        works.value = data
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      }
    }
    reader.readAsText(file)
  }
}

// 初期化
onMounted(() => {
  // 認証状態の監視
  initAuth(auth, async (user) => {
    if (user) {
      await handleLoadCloudData()
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
      <section class="main-visual">
        <div class="main-visual-img">
          <img src="/img/KV.png" alt="メインビジュアル">
        </div>
      </section>

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

      <div id="modal" v-if="showModal">
        <div class="modal-content">
          <h2>{{ modalTitle }}</h2>
          <p>{{ modalInfo }}</p>
          <label for="modalRatingSelect">評価（★1〜5）</label>
          <select v-model="modalRatingSelect">
            <option value="1">★1</option>
            <option value="2">★2</option>
            <option value="3">★3</option>
            <option value="4">★4</option>
            <option value="5">★5</option>
          </select>
          <textarea v-model="memoEditArea"></textarea>
          <br>
          <button @click="saveMemo">保存</button>
          <button @click="deleteWork">この作品を削除</button>
          <button @click="closeModal">キャンセル</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.main-visual {
  margin: 20px 0;
}

.main-visual-img img {
  margin: auto;
  padding-top: 150px;
  padding-bottom: 150px;
  width: 25%;
  max-width: 25%;
  display: block;
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

@media (max-width: 600px) {
  .main-visual-img img {
    padding-top: 25px;
    padding-bottom: 25px;
    width: 80%;
    max-width: 80%;
  }
}
</style> 