<script setup>
import { ref } from 'vue'

const props = defineProps({
  subcategories: {
    type: Array,
    required: true
  },
  categories: {
    type: Array,
    required: true
  },
  years: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['add-work'])

// 状態管理
const showInputArea = ref(true)
const titleInput = ref('')
const yearSelect = ref('')
const categorySelect = ref('')
const ratingSelect = ref('')
const thumbnailInput = ref('')
const memoInput = ref('')
const titleSearchInput = ref('')
const selectedTags = ref(new Set())
const searchResults = ref([])  // 検索結果を保持するリアクティブな配列

// TMDb APIキー
const TMDB_API_KEY = "228d640ff08a8b0c878af7963277edd3"

// 作品追加
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

  emit('add-work', work)

  // 入力フォームをクリア
  titleInput.value = ''
  yearSelect.value = ''
  categorySelect.value = ''
  ratingSelect.value = ''
  thumbnailInput.value = ''
  memoInput.value = ''
  selectedTags.value.clear()
}

// タグ管理
const selectAllTags = () => {
  props.subcategories.forEach(tag => selectedTags.value.add(tag))
}

const deselectAllTags = () => {
  selectedTags.value.clear()
}

// 検索機能
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
            28: 'バトル・アクション',
            12: 'ファンタジー',
            16: 'アニメ',
            35: 'コメディ',
            80: 'サスペンス',
            99: 'ドキュメンタリー・ノンフィクション',
            18: 'ヒューマンドラマ',
            10751: 'ファンタジー',
            14: 'ファンタジー',
            36: '歴史・時代劇',
            27: 'ホラー',
            10402: 'ヒューマンドラマ',
            9648: 'ミステリー',
            10749: '恋愛・ラブコメ',
            878: 'SF',
            10770: 'ヒューマンドラマ',
            53: 'サスペンス',
            10752: 'ヒューマンドラマ',
            37: '歴史・時代劇'
          }
          return genres[id] || 'その他'
        }).filter(tag => props.subcategories.includes(tag))
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
            10759: 'バトル・アクション',
            16: 'アニメ',
            35: 'コメディ',
            80: 'サスペンス',
            99: 'ドキュメンタリー・ノンフィクション',
            18: 'ヒューマンドラマ',
            10751: 'ファンタジー',
            10762: '青春',
            9648: 'ミステリー',
            10763: 'ドキュメンタリー・ノンフィクション',
            10764: 'ドキュメンタリー・ノンフィクション',
            10765: 'SF',
            10766: 'ヒューマンドラマ',
            10767: 'ドキュメンタリー・ノンフィクション',
            10768: 'ヒューマンドラマ'
          }
          return genres[id] || 'その他'
        }).filter(tag => props.subcategories.includes(tag))
      })
    })

    // アニメの結果を追加
    aniListData.data.Page.media.slice(0, 5).forEach(anime => {
      results.push({
        title: anime.title.romaji,
        year: anime.startDate.year || '不明',
        category: 'アニメ',
        thumbnail: anime.coverImage.large,
        tags: anime.genres.map(genre => {
          const genreMap = {
            'Action': 'バトル・アクション',
            'Adventure': 'ファンタジー',
            'Comedy': 'コメディ',
            'Drama': 'ヒューマンドラマ',
            'Fantasy': 'ファンタジー',
            'Horror': 'ホラー',
            'Mystery': 'ミステリー',
            'Romance': '恋愛・ラブコメ',
            'Sci-Fi': 'SF',
            'Slice of Life': '青春',
            'Supernatural': 'ファンタジー',
            'Thriller': 'サスペンス',
            'Psychological': 'サスペンス',
            'Historical': '歴史・時代劇',
            'Sports': '青春',
            'Music': 'ヒューマンドラマ',
            'School': '青春',
            'Ecchi': 'コメディ',
            'Harem': '恋愛・ラブコメ',
            'Mecha': 'SF',
            'Parody': 'コメディ',
            'Samurai': '歴史・時代劇',
            'Shoujo': '恋愛・ラブコメ',
            'Shounen': 'バトル・アクション',
            'Super Power': 'ファンタジー',
            'Vampire': 'ホラー',
            'Yaoi': '恋愛・ラブコメ',
            'Yuri': '恋愛・ラブコメ',
            'Martial Arts': 'バトル・アクション',
            'Military': 'ヒューマンドラマ',
            'Police': 'サスペンス',
            'Psychological': 'サスペンス',
            'Seinen': 'ヒューマンドラマ',
            'Shoujo Ai': '恋愛・ラブコメ',
            'Shounen Ai': '恋愛・ラブコメ',
            'Space': 'SF',
            'Sports': '青春',
            'Super Power': 'ファンタジー',
            'Vampire': 'ホラー',
            'Yaoi': '恋愛・ラブコメ',
            'Yuri': '恋愛・ラブコメ'
          }
          return genreMap[genre] || 'その他'
        }).filter(tag => props.subcategories.includes(tag))
      })
    })

    // 検索結果をリアクティブな配列に設定
    searchResults.value = results
  } catch (error) {
    console.error('検索エラー:', error)
    alert('検索中にエラーが発生しました')
  }
}

// 検索結果を選択したときの処理
const selectSearchResult = (result) => {
  titleInput.value = result.title
  yearSelect.value = result.year
  categorySelect.value = result.category
  thumbnailInput.value = result.thumbnail
  selectedTags.value.clear()
  result.tags.forEach(tag => {
    if (props.subcategories.includes(tag)) {
      selectedTags.value.add(tag)
    }
  })
  searchResults.value = []  // 検索結果をクリア
  showInputArea.value = true
}
</script>

<template>
  <div class="work-input-container">
    <h2>作品情報を入力</h2>
    <div id="inputArea" v-if="showInputArea">
      <input v-model="titleInput" type="text" placeholder="作品タイトル">
      <select v-model="yearSelect">
        <option v-for="year in years" :key="year" :value="year">{{ year }}年</option>
      </select>
      <select v-model="categorySelect">
        <option value="">大区分（メディア種別）</option>
        <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
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
        <div id="tagCheckboxes">
          <label v-for="tag in subcategories" :key="tag">
            <input
              type="checkbox"
              :value="tag"
              :checked="selectedTags.has(tag)"
              @change="e => e.target.checked ? selectedTags.add(tag) : selectedTags.delete(tag)"
            >
            {{ tag }}
          </label>
        </div>
      </div>

      <button @click="addWork">追加する</button>
    </div>

    <h2>作品検索（TMDb / AniList）</h2>
    <div class="search-container">
      <div class="search-input-group">
        <input v-model="titleSearchInput" type="text" placeholder="作品タイトルを検索">
        <button @click="searchWorks">候補を検索</button>
      </div>
      <div class="search-results-grid">
        <div
          v-for="result in searchResults"
          :key="result.title"
          class="search-result-item"
        >
          <img :src="result.thumbnail" :alt="result.title" @error="$event.target.src='/img/no-image.png'">
          <span>{{ result.title }}</span>
          <span>{{ result.category }} / {{ result.year }}年</span>
          <span>{{ result.tags.join(', ') }}</span>
          <button @click="selectSearchResult(result)">選択</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.work-input-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

#inputArea {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}

#inputArea input,
#inputArea select {
  margin: 10px 0;
  padding: 8px;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  margin: 5px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background: #45a049;
}

#tagCheckboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
}

#tagCheckboxes label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  margin-right: 12px;
  display: inline-block;
  margin-bottom: 5px;
  padding: 4px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.search-container {
  margin-top: 20px;
}

.search-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input-group input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-results-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.search-result-item {
  width: 120px;
  background: #fff;
  border: 1px solid #ccc;
  padding: 5px;
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

.search-result-item span {
  display: block;
  margin-top: 5px;
  font-size: 12px;
}

.search-result-item button {
  margin-top: 5px;
  width: 100%;
  font-size: 12px;
  padding: 4px 8px;
}

@media (max-width: 600px) {
  .work-input-container {
    padding: 10px;
  }

  #inputArea,
  #tagCheckboxes {
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

  .search-results-grid {
    grid-template-columns: 1fr;
  }

  .search-result-image {
    height: 200px;
  }
}
</style> 