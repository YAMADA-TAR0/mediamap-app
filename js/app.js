const firebaseConfig = {
  apiKey: "AIzaSyBn30p1y46ru6m2SQHMb9U9eQCCxzla7xo",
  authDomain: "mediamap-app-2ee92.firebaseapp.com",
  projectId: "mediamap-app-2ee92",
  storageBucket: "mediamap-app-2ee92.firebasestorage.app",
  messagingSenderId: "35065730175",
  appId: "1:35065730175:web:04d4e2814237851451db4a"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;
const works = [];
const subcategories = [
  "ミステリー", "サスペンス", "SF", "ファンタジー", "バトル・アクション",
  "恋愛・ラブコメ", "青春", "ホラー", "ヒューマンドラマ", "歴史・時代劇",
  "コメディ", "ビジネス・社会派", "ドキュメンタリー・ノンフィクション",
  "エッセイ・随筆", "異世界転生"
];
const categories = ["小説", "漫画", "アニメ", "映画", "ドラマ"];
const years = [];
for (let y = 1900; y <= 2025; y += 1) years.push(y);

const selectedTags = new Set(subcategories);
const selectedCategories = new Set(categories);
let currentEditingIndex = null;
let panzoomInstance = null;

// TMDb APIキー（ご自身のキーに差し替えてください）
const TMDB_API_KEY = "29180f77723266df5d1d65fee230daf9";

function login() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    currentUser = result.user;
    document.getElementById("userInfo").textContent = `${currentUser.displayName} でログイン中`;
    loadCloudData();
  });
}

function logout() {
  auth.signOut().then(() => {
    currentUser = null;
    document.getElementById("userInfo").textContent = "";
    works.length = 0;
    renderTimeline();
  });
}

function saveCloudData() {
  if (!currentUser) return;
  const uid = currentUser.uid;
  db.collection("mediaMaps").doc(uid).set({ works });
}

function loadCloudData() {
  if (!currentUser) return;
  const uid = currentUser.uid;
  db.collection("mediaMaps").doc(uid).get().then(doc => {
    if (doc.exists) {
      works.length = 0;
      doc.data().works.forEach(w => works.push(w));
      renderTimeline();
    }
  });
}

function populateYearSelect() {
  const yearSelect = document.getElementById("yearSelect");
  years.forEach(y => {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = `${y}年`;
    yearSelect.appendChild(option);
  });
}

function createTagCheckboxes() {
  const container = document.getElementById("tagCheckboxes");
  container.innerHTML = "";
  subcategories.forEach(tag => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = tag;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(tag));
    container.appendChild(label);
  });
}

function createTagFilterArea() {
  const area = document.getElementById("tagFilterArea");
  area.innerHTML = "";
  subcategories.forEach(tag => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = tag;
    cb.checked = true;
    cb.onchange = () => {
      if (cb.checked) {
        selectedTags.add(tag);
      } else {
        selectedTags.delete(tag);
      }
      renderTimeline();
    };
    label.appendChild(cb);
    label.appendChild(document.createTextNode(tag));
    area.appendChild(label);
  });
}

function createCategoryFilterArea() {
  const area = document.getElementById("categoryFilterArea");
  area.innerHTML = "";
  categories.forEach(cat => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = cat;
    cb.checked = true;
    cb.onchange = () => {
      if (cb.checked) {
        selectedCategories.add(cat);
      } else {
        selectedCategories.delete(cat);
      }
      renderTimeline();
    };
    label.appendChild(cb);
    label.appendChild(document.createTextNode(cat));
    area.appendChild(label);
  });
}
function selectAllTags() {
  subcategories.forEach(tag => selectedTags.add(tag));
  updateTagCheckboxes(true);
  renderTimeline();
}

function deselectAllTags() {
  selectedTags.clear();
  updateTagCheckboxes(false);
  renderTimeline();
}

function updateTagCheckboxes(checked) {
  const checkboxes = document.querySelectorAll('#tagFilterArea input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = checked);
}

function addWork() {
  const title = document.getElementById("titleInput").value.trim();
  const year = document.getElementById("yearSelect").value;
  const category = document.getElementById("categorySelect").value;
  const rating = parseInt(document.getElementById("ratingSelect").value);
  const thumbnail = document.getElementById("thumbnailInput").value.trim();
  const memo = document.getElementById("memoInput").value.trim();

  const tagElements = document.querySelectorAll('#tagCheckboxes input[type="checkbox"]:checked');
  const tags = Array.from(tagElements).map(cb => cb.value);

  if (!title || !year || !category || tags.length === 0 || isNaN(rating)) {
    alert("すべての項目を入力してください（タグは1つ以上）");
    return;
  }

  works.push({ title, year, category, tags, rating, thumbnail, memo });
  saveWorks();
  renderTimeline();
  if (currentUser) saveCloudData();  // ←追加！
}

function clearWorks() {
  if (confirm("すべてのデータを削除しますか？")) {
    localStorage.removeItem("works");
    works.length = 0;
    renderTimeline();
  }
}

function renderTimeline() {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  const table = document.createElement("table");

  // ヘッダー行（年代）
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.appendChild(document.createElement("th")); // 左上空セル
  years.forEach(year => {
    const th = document.createElement("th");
    th.textContent = year;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  for (let r = 5; r >= 1; r--) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = `★${r}`;
    tr.appendChild(th);

    years.forEach(y => {
      const td = document.createElement("td");

      const group = works.filter(w =>
        parseInt(w.year) === y &&
        parseInt(w.rating) === r &&
        selectedCategories.has(w.category) &&
        Array.isArray(w.tags) &&
        w.tags.some(tag => selectedTags.has(tag))
      );

      group.forEach((work, index) => {
        const div = document.createElement("div");
        div.className = "work-item";
        div.onclick = () => openModal(index);

        if (work.thumbnail) {
          const img = document.createElement("img");
          img.src = work.thumbnail;
          img.alt = work.title;
          img.className = "thumbnail";
          div.appendChild(img);
        }

        const span = document.createElement("span");
        span.textContent = `[${work.category}] ${work.title}`;
        div.appendChild(span);

        td.appendChild(div);
      });

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  timeline.appendChild(table);
  
  // === パン＆ズームここから追加 ===
  const zoomTarget = document.querySelector("#timeline table");
  const timelineContainer = document.getElementById("timeline");
  
  if (panzoomInstance) {
    panzoomInstance.destroy();
  }
  
  panzoomInstance = Panzoom(zoomTarget, {
    maxScale: 5,
    minScale: 0.01,
    contain: 'outside'
  });
  
  const zoomWithWheel = (e) => panzoomInstance.zoomWithWheel(e);
  
  timelineContainer.addEventListener("mouseenter", () => {
    timelineContainer.addEventListener("wheel", zoomWithWheel);
  });
  
  timelineContainer.addEventListener("mouseleave", () => {
    timelineContainer.removeEventListener("wheel", zoomWithWheel);
  });
  // === パン＆ズームここまで追加 ===
}

function renderTagCountChart() {
  const tagCounts = {};
  subcategories.forEach(tag => tagCounts[tag] = 0);

  works.forEach(w => {
    if (Array.isArray(w.tags)) {
      w.tags.forEach(tag => {
        if (tagCounts.hasOwnProperty(tag)) {
          tagCounts[tag]++;
        }
      });
    }
  });

  const ctx = document.getElementById("tagCountChart").getContext("2d");

  // 既存のグラフを破棄（再描画対策）
  if (window.tagChart) {
    window.tagChart.destroy();
  }

  window.tagChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(tagCounts),
      datasets: [{
        label: "登録件数",
        data: Object.values(tagCounts),
        backgroundColor: "rgba(54, 162, 235, 0.7)"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderTagRatingChart() {
  const tagRatingMap = {};
  subcategories.forEach(tag => {
    tagRatingMap[tag] = [0, 0, 0, 0, 0]; // ★1〜5カウント用
  });

  console.log("📊 [タグ×評価グラフ] 登録作品一覧");
  works.forEach(w => {
    console.log(`- ${w.title} / rating: ${w.rating} / tags:`, w.tags);

    if (!Array.isArray(w.tags) || isNaN(w.rating) || w.rating < 1 || w.rating > 5) {
      console.warn(`⚠ データ無効スキップ: ${w.title}`);
      return;
    }

    w.tags.forEach(tag => {
      if (tagRatingMap[tag]) {
        tagRatingMap[tag][w.rating - 1]++;
      } else {
        console.warn(`⚠ 未定義タグ: "${tag}" in ${w.title}`);
      }
    });
  });

  const labels = subcategories;
  const datasets = [];

  for (let r = 5; r >= 1; r--) {
    datasets.push({
      label: `★${r}`,
      data: labels.map(tag => tagRatingMap[tag][r - 1]),
      backgroundColor: `rgba(${50 + r * 30}, ${100 + r * 15}, ${200 - r * 20}, 0.8)`,
      stack: 'stack1'
    });
  }

  const ctx = document.getElementById("tagRatingChart").getContext("2d");

  // 修正済：Chartインスタンスかどうか確認
  if (window.tagRatingChart instanceof Chart) {
    window.tagRatingChart.destroy();
  }
  
  window.tagRatingChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      },
      plugins: {
        tooltip: { mode: 'index', intersect: false }
      }
    }
  });
}  

function openModal(index) {
  currentEditingIndex = index;
  const work = works[index];
  document.getElementById("modalTitle").textContent = `[${work.category}] ${work.title}`;
  document.getElementById("modalInfo").textContent =
  `タグ: ${(work.tags || []).join(", ")} / ${work.year}年`;
  document.getElementById("memoEditArea").value = work.memo || '';
  document.getElementById("modalRatingSelect").value = work.rating;
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  currentEditingIndex = null;
}

function saveMemo() {
  if (currentEditingIndex !== null) {
    works[currentEditingIndex].memo = document.getElementById("memoEditArea").value;
    works[currentEditingIndex].rating = parseInt(document.getElementById("modalRatingSelect").value);
    saveWorks();
    renderTimeline();
    closeModal();
    if (currentUser) saveCloudData();  // ←追加！
  }
}

function deleteWork() {
  if (currentEditingIndex !== null) {
    const title = works[currentEditingIndex].title;
    if (confirm(`「${title}」を削除しますか？`)) {
      works.splice(currentEditingIndex, 1);
      saveWorks();
      renderTimeline();
      closeModal();
      if (currentUser) saveCloudData();  // ←追加！
    }
  }
}

function saveWorks() {
  localStorage.setItem("works", JSON.stringify(works));
}

function loadWorks() {
  const data = localStorage.getItem("works");
  if (data) {
    const parsed = JSON.parse(data);
    parsed.forEach(w => works.push(w));
  }
}

function downloadData() {
  const blob = new Blob([JSON.stringify(works, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "works_data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function uploadData() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const loaded = JSON.parse(e.target.result);
      if (Array.isArray(loaded)) {
        works.length = 0;
        loaded.forEach(w => works.push(w));
        saveWorks();
        renderTimeline();
        alert("データを読み込みました！");
      } else {
        alert("形式が不正です。");
      }
    } catch (e) {
      alert("読み込みエラー：" + e.message);
    }
  };
  reader.readAsText(file);
}
function searchWorks() {
  const category = document.getElementById("categorySelect").value;
  const title = document.getElementById("titleSearchInput").value.trim();
  if (!title) return;

  if (category === "漫画") {
    searchAniList(title);
  } else {
    searchTMDb(title);
  }
}

// -------------------------
// AniList API（漫画用）
// -------------------------
function searchAniList(title) {
  const query = `
    query ($search: String) {
      Page(perPage: 10) {
        media(search: $search, type: MANGA) {
          id
          title {
            romaji
            native
          }
          coverImage {
            medium
          }
          startDate {
            year
          }
          description(asHtml: false)
        }
      }
    }`;

  const variables = { search: title };

  fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ query, variables })
  })
    .then(res => res.json())
    .then(data => {
      const resultsArea = document.getElementById("searchResults");
      resultsArea.innerHTML = "";

      data.data.Page.media.forEach(item => {
        const div = document.createElement("div");
        div.className = "search-result-item";
        div.onclick = () => selectAniListResult(item);

        const img = document.createElement("img");
        img.src = item.coverImage.medium;
        div.appendChild(img);

        const text = document.createElement("span");
        text.textContent = `${item.title.native || item.title.romaji} (${item.startDate.year || "年不明"})`;
        div.appendChild(text);

        resultsArea.appendChild(div);
      });
    })
    .catch(err => console.error("AniList検索失敗:", err));
}

function selectAniListResult(item) {
  const title = item.title.native || item.title.romaji;
  const year = item.startDate.year;
  const thumbnail = item.coverImage.medium;
  const description = item.description || "";

  document.getElementById("titleInput").value = title;
  if (year) {
    const roundedYear = Math.floor(year / 1) * 1;
    document.getElementById("yearSelect").value = roundedYear;
  }
  document.getElementById("thumbnailInput").value = thumbnail;
  document.getElementById("memoInput").value = description;
}

// -------------------------
// TMDb API（映画・アニメ用）
// -------------------------
function searchTMDb() {
  const query = document.getElementById("titleSearchInput").value.trim();
  const resultsArea = document.getElementById("searchResults");
  resultsArea.innerHTML = "";

  if (!query) return;

  fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ja`)
    .then(res => res.json())
    .then(data => {
      data.results.slice(0, 10).forEach(item => {
        const div = document.createElement("div");
        div.className = "search-result-item";
        div.onclick = () => selectResult(item);

        const img = document.createElement("img");
        img.src = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '';
        div.appendChild(img);

        const text = document.createElement("span");
        text.textContent = `${item.title || item.name || 'タイトル不明'} (${(item.release_date || item.first_air_date || '').split('-')[0] || '年不明'})`;
        div.appendChild(text);

        resultsArea.appendChild(div);
      });
    })
    .catch(err => console.error("TMDb検索失敗:", err));
}

function selectResult(item) {
  const title = item.title || item.name || '';
  const year = (item.release_date || item.first_air_date || '').split('-')[0] || '';
  const thumbnail = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '';
  const overview = item.overview || '';

  document.getElementById("titleInput").value = title;
  document.getElementById("thumbnailInput").value = thumbnail;
  document.getElementById("memoInput").value = overview;

  if (year) {
    const roundedYear = Math.floor(parseInt(year) / 1) * 1;
    document.getElementById("yearSelect").value = roundedYear;
  }
}

window.onload = () => {
  populateYearSelect();
  createTagCheckboxes();
  createTagFilterArea();
  createCategoryFilterArea();
  loadWorks();
  renderTimeline();
  renderTagCountChart(); // ← タグ別グラフ描画
  renderTagRatingChart(); // ← 追加  
};
