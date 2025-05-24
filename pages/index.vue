<script setup>
import { ref, onMounted } from 'vue'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,
  where,
  setDoc,
  getDoc
} from 'firebase/firestore'
import Chart from 'chart.js/auto'
import panzoom from '@panzoom/panzoom'

const { $firebase } = useNuxtApp()
const { auth, firestore } = $firebase

// 状態管理
const isLoggedIn = ref(false)
const currentUser = ref(null)
const showInputArea = ref(false)
const works = ref([])
const titleInput = ref('')
const yearSelect = ref('')
const categorySelect = ref('')
const ratingSelect = ref('')
const thumbnailInput = ref('')
const memoInput = ref('')
const titleSearchInput = ref('')
const searchResults = ref([])
const showModal = ref(false)
const modalTitle = ref('')
const modalInfo = ref('')
const modalRatingSelect = ref('')
const memoEditArea = ref('')
const selectedWorkId = ref(null)
const selectedTags = ref(new Set())
const selectedCategories = ref(new Set())
const tagCountChart = ref(null)
const tagRatingChart = ref(null)

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

// 認証関連
const login = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    currentUser.value = result.user
    isLoggedIn.value = true
    await loadCloudData()
  } catch (error) {
    console.error('ログインエラー:', error)
  }
}

const logout = async () => {
  try {
    await signOut(auth)
    currentUser.value = null
    isLoggedIn.value = false
    works.value = []
    renderTimeline()
    renderTagCountChart()
    renderTagRatingChart()
  } catch (error) {
    console.error('ログアウトエラー:', error)
  }
}

// データ管理
const saveCloudData = async () => {
  if (!currentUser.value) return
  try {
    await setDoc(doc(firestore, 'mediaMaps', currentUser.value.uid), { works: works.value })
  } catch (error) {
    console.error('クラウド保存エラー:', error)
  }
}

const loadCloudData = async () => {
  if (!currentUser.value) return
  try {
    const docRef = doc(firestore, 'mediaMaps', currentUser.value.uid)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      works.value = docSnap.data().works
      renderTimeline()
      renderTagCountChart()
      renderTagRatingChart()
    }
  } catch (error) {
    console.error('クラウド読み込みエラー:', error)
  }
}

// 作品管理
const addWork = () => {
  if (!titleInput.value || !yearSelect.value || !categorySelect.value || selectedTags.value.size === 0 || !ratingSelect.value) {
    alert("すべての項目を入力してください（タグは1つ以上）")
    return
  }

  const work = {
    title: titleInput.value,
    year: yearSelect.value,
    category: categorySelect.value,
    tags: Array.from(selectedTags.value),
    rating: parseInt(ratingSelect.value),
    thumbnail: thumbnailInput.value,
    memo: memoInput.value
  }

  works.value.push(work)
  saveCloudData()
  renderTimeline()
  renderTagCountChart()
  renderTagRatingChart()

  // 入力フォームをクリア
  titleInput.value = ''
  yearSelect.value = ''
  categorySelect.value = ''
  ratingSelect.value = ''
  thumbnailInput.value = ''
  memoInput.value = ''
  selectedTags.value.clear()
}

const clearWorks = async () => {
  if (!confirm("すべてのデータを削除しますか？")) return

  if (currentUser.value) {
    try {
      await deleteDoc(doc(firestore, 'mediaMaps', currentUser.value.uid))
      works.value = []
      renderTimeline()
      renderTagCountChart()
      renderTagRatingChart()
      alert("クラウド上のデータを削除しました！")
    } catch (error) {
      console.error('データ削除エラー:', error)
    }
  } else {
    localStorage.removeItem("works")
    works.value = []
    renderTimeline()
    renderTagCountChart()
    renderTagRatingChart()
    alert("ローカル保存データを削除しました！")
  }
}

// タイムライン表示
const renderTimeline = () => {
  const timeline = document.getElementById("timeline")
  if (!timeline) return

  timeline.innerHTML = ""
  const table = document.createElement("table")

  // ヘッダー行（年代）
  const thead = document.createElement("thead")
  const headerRow = document.createElement("tr")
  headerRow.appendChild(document.createElement("th")) // 左上空セル
  years.forEach(year => {
    const th = document.createElement("th")
    th.textContent = year
    headerRow.appendChild(th)
  })
  thead.appendChild(headerRow)
  table.appendChild(thead)

  const tbody = document.createElement("tbody")

  for (let r = 5; r >= 1; r--) {
    const tr = document.createElement("tr")
    const th = document.createElement("th")
    th.textContent = `★${r}`
    tr.appendChild(th)

    years.forEach(year => {
      const td = document.createElement("td")
      const filteredWorks = works.value.filter(w => 
        w.year === year && 
        w.rating === r && 
        selectedCategories.value.has(w.category) &&
        w.tags.some(tag => selectedTags.value.has(tag))
      )

      filteredWorks.forEach(work => {
        const div = document.createElement("div")
        div.className = "work-item"
        div.setAttribute("data-category", work.category)
        div.textContent = work.title
        div.onclick = () => openModal(work)
        td.appendChild(div)
      })

      tr.appendChild(td)
    })

    tbody.appendChild(tr)
  }

  table.appendChild(tbody)
  timeline.appendChild(table)

  // タイムラインの初期化（panzoom）
  if (!window.panzoomInstance) {
    window.panzoomInstance = panzoom(timeline, {
      bounds: true,
      boundsPadding: 0.1
    })
  }
}

// グラフ表示
const renderTagCountChart = () => {
  const ctx = document.getElementById('tagCountChart')
  if (!ctx) return

  // 既存のグラフを破棄
  if (tagCountChart.value) {
    tagCountChart.value.destroy()
  }

  const tagCounts = {}
  works.value.forEach(work => {
    work.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })

  tagCountChart.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(tagCounts),
      datasets: [{
        label: 'タグ別登録数',
        data: Object.values(tagCounts),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
}

const renderTagRatingChart = () => {
  const ctx = document.getElementById('tagRatingChart')
  if (!ctx) return

  // 既存のグラフを破棄
  if (tagRatingChart.value) {
    tagRatingChart.value.destroy()
  }

  const tagRatings = {}
  works.value.forEach(work => {
    work.tags.forEach(tag => {
      if (!tagRatings[tag]) {
        tagRatings[tag] = { sum: 0, count: 0 }
      }
      tagRatings[tag].sum += work.rating
      tagRatings[tag].count++
    })
  })

  const averages = {}
  Object.keys(tagRatings).forEach(tag => {
    averages[tag] = tagRatings[tag].sum / tagRatings[tag].count
  })

  tagRatingChart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(averages),
      datasets: [{
        label: 'タグ別平均評価',
        data: Object.values(averages),
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
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
    await saveCloudData()
    renderTimeline()
    renderTagCountChart()
    renderTagRatingChart()
  }

  showModal.value = false
}

const deleteWork = async () => {
  if (!selectedWorkId.value) return

  works.value = works.value.filter(w => w.id !== selectedWorkId.value)
  await saveCloudData()
  renderTimeline()
  renderTagCountChart()
  renderTagRatingChart()
  showModal.value = false
}

// タグ管理
const selectAllTags = () => {
  subcategories.forEach(tag => selectedTags.value.add(tag))
  renderTimeline()
}

const deselectAllTags = () => {
  selectedTags.value.clear()
  renderTimeline()
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
        renderTimeline()
        renderTagCountChart()
        renderTagRatingChart()
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      }
    }
    reader.readAsText(file)
  }
}

const searchWorks = async () => {
  if (!titleSearchInput.value) {
    alert("検索キーワードを入力してください")
    return
  }

  try {
    // TMDb APIで映画を検索
    const movieResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(titleSearchInput.value)}&language=ja-JP`
    )
    const movieData = await movieResponse.json()

    // TMDb APIでドラマを検索
    const tvResponse = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(titleSearchInput.value)}&language=ja-JP`
    )
    const tvData = await tvResponse.json()

    // AniList APIでアニメを検索
    const aniListQuery = `
      query ($search: String) {
        Page {
          media(search: $search, type: ANIME) {
            id
            title {
              romaji
              native
            }
            startDate {
              year
            }
            coverImage {
              large
            }
            genres
          }
        }
      }
    `

    const aniListResponse = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: aniListQuery,
        variables: { search: titleSearchInput.value }
      })
    })
    const aniListData = await aniListResponse.json()

    // 検索結果を整形
    const results = []

    // 映画の結果を追加
    movieData.results.slice(0, 5).forEach(movie => {
      results.push({
        title: movie.title,
        year: movie.release_date?.split('-')[0] || '不明',
        category: '映画',
        thumbnail: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
        tags: movie.genre_ids.map(id => {
          const genres = {
            28: 'アクション',
            12: 'アドベンチャー',
            16: 'アニメ',
            35: 'コメディ',
            80: '犯罪',
            99: 'ドキュメンタリー',
            18: 'ドラマ',
            10751: 'ファミリー',
            14: 'ファンタジー',
            36: '歴史',
            27: 'ホラー',
            10402: '音楽',
            9648: 'ミステリー',
            10749: 'ロマンス',
            878: 'SF',
            10770: 'TV映画',
            53: 'スリラー',
            10752: '戦争',
            37: '西部劇'
          }
          return genres[id] || 'その他'
        })
      })
    })

    // ドラマの結果を追加
    tvData.results.slice(0, 5).forEach(tv => {
      results.push({
        title: tv.name,
        year: tv.first_air_date?.split('-')[0] || '不明',
        category: 'ドラマ',
        thumbnail: tv.poster_path ? `https://image.tmdb.org/t/p/w500${tv.poster_path}` : '',
        tags: tv.genre_ids.map(id => {
          const genres = {
            10759: 'アクション＆アドベンチャー',
            16: 'アニメ',
            35: 'コメディ',
            80: '犯罪',
            99: 'ドキュメンタリー',
            18: 'ドラマ',
            10751: 'ファミリー',
            10762: 'キッズ',
            9648: 'ミステリー',
            10763: 'ニュース',
            10764: 'リアリティ',
            10765: 'SF＆ファンタジー',
            10766: 'ソープ',
            10767: 'トーク',
            10768: '戦争＆政治'
          }
          return genres[id] || 'その他'
        })
      })
    })

    // アニメの結果を追加
    aniListData.data.Page.media.slice(0, 5).forEach(anime => {
      results.push({
        title: anime.title.romaji,
        year: anime.startDate.year || '不明',
        category: 'アニメ',
        thumbnail: anime.coverImage.large,
        tags: anime.genres
      })
    })

    // 検索結果を表示
    const searchResultsDiv = document.getElementById('searchResults')
    if (searchResultsDiv) {
      searchResultsDiv.innerHTML = ''
      results.forEach(result => {
        const div = document.createElement('div')
        div.className = 'search-result-item'
        div.innerHTML = `
          <img src="${result.thumbnail}" alt="${result.title}" style="width: 100px; height: auto;">
          <div>
            <h3>${result.title}</h3>
            <p>${result.category} / ${result.year}年</p>
            <p>タグ: ${result.tags.join(', ')}</p>
            <button onclick="selectSearchResult('${result.title}', '${result.year}', '${result.category}', '${result.thumbnail}', ${JSON.stringify(result.tags)})">選択</button>
          </div>
        `
        searchResultsDiv.appendChild(div)
      })
    }
  } catch (error) {
    console.error('検索エラー:', error)
    alert('検索中にエラーが発生しました')
  }
}

// 検索結果を選択したときの処理
const selectSearchResult = (title, year, category, thumbnail, tags) => {
  titleInput.value = title
  yearSelect.value = year
  categorySelect.value = category
  thumbnailInput.value = thumbnail
  selectedTags.value.clear()
  tags.forEach(tag => {
    if (subcategories.includes(tag)) {
      selectedTags.value.add(tag)
    }
  })
  document.getElementById('searchResults').innerHTML = ''
  showInputArea.value = true
}

// 初期化
onMounted(() => {
  // 認証状態の監視
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    isLoggedIn.value = !!user
    if (user) {
      loadCloudData()
    }
  })

  // 年選択肢の生成
  const yearSelect = document.getElementById('yearSelect')
  if (yearSelect) {
    years.forEach(year => {
      const option = document.createElement('option')
      option.value = year
      option.textContent = `${year}年`
      yearSelect.appendChild(option)
    })
  }

  // タグチェックボックスの生成
  const tagCheckboxes = document.getElementById('tagCheckboxes')
  if (tagCheckboxes) {
    subcategories.forEach(tag => {
      const label = document.createElement('label')
      const cb = document.createElement('input')
      cb.type = 'checkbox'
      cb.value = tag
      cb.checked = true
      cb.onchange = () => {
        if (cb.checked) {
          selectedTags.value.add(tag)
        } else {
          selectedTags.value.delete(tag)
        }
        renderTimeline()
      }
      label.appendChild(cb)
      label.appendChild(document.createTextNode(tag))
      tagCheckboxes.appendChild(label)
    })
  }

  // カテゴリーフィルターの生成
  const categoryFilterArea = document.getElementById('categoryFilterArea')
  if (categoryFilterArea) {
    categories.forEach(cat => {
      const label = document.createElement('label')
      const cb = document.createElement('input')
      cb.type = 'checkbox'
      cb.value = cat
      cb.checked = true
      cb.onchange = () => {
        if (cb.checked) {
          selectedCategories.value.add(cat)
        } else {
          selectedCategories.value.delete(cat)
        }
        renderTimeline()
      }
      label.appendChild(cb)
      label.appendChild(document.createTextNode(cat))
      categoryFilterArea.appendChild(label)
    })
  }

  // 初期表示
  renderTimeline()
  renderTagCountChart()
  renderTagRatingChart()
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
        <button @click="login">Googleでログイン</button>
      </div>

      <div id="userArea" v-if="isLoggedIn">
        <button @click="login">Googleでログイン</button>
        <button @click="logout">ログアウト</button>
        <p id="userInfo">{{ currentUser?.email }}</p>
      </div>

      <h2>作品情報を入力</h2>
      <button id="toggleInputBtn" @click="toggleInputArea">
        {{ showInputArea ? '−' : '＋' }} 作品を追加する
      </button>
      <div id="inputArea" v-if="showInputArea">
        <input v-model="titleInput" type="text" placeholder="作品タイトル">
        <select v-model="yearSelect"></select>
        <select v-model="categorySelect">
          <option value="">大区分（メディア種別）</option>
          <option value="小説">小説</option>
          <option value="漫画">漫画</option>
          <option value="アニメ">アニメ</option>
          <option value="映画">映画</option>
          <option value="ドラマ">ドラマ</option>
        </select>
        <select v-model="ratingSelect">
          <option value="">評価（★1〜5）</option>
          <option value="1">★1</option>
          <option value="2">★2</option>
          <option value="3">★3</option>
          <option value="4">★4</option>
          <option value="5">★5</option>
        </select>
        <input v-model="thumbnailInput" type="text" placeholder="サムネイル画像URL">
        <input v-model="memoInput" type="text" placeholder="メモ（詳細情報）">

        <div id="tagInputArea">
          <p>ジャンル（複数選択可）</p>
          <div id="tagCheckboxes"></div>
        </div>

        <button @click="addWork">追加する</button>
        <button @click="clearWorks">すべてクリア</button>
      </div>

      <h2>作品検索（TMDb / AniList）</h2>
      <div>
        <input v-model="titleSearchInput" type="text" placeholder="作品タイトルを検索">
        <button @click="searchWorks">候補を検索</button>
        <div id="searchResults"></div>
      </div>

      <h2>メディア種別フィルター</h2>
      <div id="categoryFilterArea"></div>

      <h2>ジャンル（タグ）フィルター</h2>
      <div>
        <button @click="selectAllTags">すべて選択</button>
        <button @click="deselectAllTags">すべて解除</button>
      </div>
      <div id="tagFilterArea"></div>

      <h2>作品マップ（縦軸：評価 / 横軸：年代）</h2>
      <div id="timeline"></div>

      <h2>タグ別登録数グラフ</h2>
      <canvas id="tagCountChart" width="600" height="300"></canvas>

      <h2>タグ × 評価の傾向グラフ</h2>
      <canvas id="tagRatingChart" width="600" height="300"></canvas>

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
body {
  font-family: sans-serif;
  background: #f7f7f7;
  margin: 20px;
  padding-left: 100px;
  padding-right: 100px;
}

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

#inputArea {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

#inputArea input,
#inputArea select {
  margin: 10px 0;
  padding: 8px;
  width: 100%;
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

/* タイムラインのスタイル */
#timeline {
  overflow: auto;
  width: 100%;
  height: 1200px;
  border: 1px solid #aaa;
  background: #f9f9f9;
  position: relative;
  margin: 20px 0;
}

#timeline table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
}

#timeline th,
#timeline td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
  min-width: 100px;
  height: 140px;
  vertical-align: top;
  white-space: nowrap;
}

#timeline th {
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
  z-index: 1;
}

.work-item {
  cursor: pointer;
  padding: 4px;
  margin: 2px;
  background-color: #e8f5e9;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
}

.work-item:hover {
  background-color: #c8e6c9;
}

/* カテゴリー別の色分け */
[data-category="小説"] { color: #1f77b4; }
[data-category="漫画"] { color: #d62728; }
[data-category="アニメ"] { color: #2ca02c; }
[data-category="映画"] { color: #ff7f0e; }
[data-category="ドラマ"] { color: #9467bd; }

/* タグチェックボックスのスタイル */
#tagCheckboxes,
#tagFilterArea {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
}

#tagCheckboxes label,
#tagFilterArea label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  margin-right: 12px;
  display: inline-block;
  margin-bottom: 5px;
}

.search-result-item {
  display: flex;
  gap: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  margin: 10px 0;
  border-radius: 4px;
  width: 120px;
  background: #fff;
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}

.search-result-item:hover {
  transform: scale(1.05);
  border-color: #007bff;
}

.search-result-item img {
  width: 100px;
  height: 150px;
  object-fit: cover;
}

.search-result-item h3 {
  margin: 0 0 10px 0;
}

.search-result-item p {
  margin: 5px 0;
  font-size: 12px;
}

/* レスポンシブ対応 */
@media (max-width: 600px) {
  body {
    font-size: 14px;
    padding: 10px;
  }

  .main-visual-img img {
    padding-top: 25px;
    padding-bottom: 25px;
    width: 80%;
    max-width: 80%;
  }

  #inputArea,
  #tagFilterArea,
  #categoryFilterArea {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  #inputArea input,
  #inputArea select,
  #inputArea button {
    width: 100%;
    font-size: 16px;
  }

  .work-item {
    max-width: 100%;
    text-align: center;
  }

  #timeline {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  #timeline table {
    min-width: 800px;
  }

  canvas {
    width: 100% !important;
    height: auto !important;
  }
}
</style> 