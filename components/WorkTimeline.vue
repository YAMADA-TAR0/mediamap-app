<script setup>
import { ref, onMounted, watch } from 'vue'
import panzoom from '@panzoom/panzoom'

const props = defineProps({
  works: {
    type: Array,
    required: true
  },
  selectedTags: {
    type: Set,
    required: true
  },
  selectedCategories: {
    type: Set,
    required: true
  },
  years: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['openModal'])

const timeline = ref(null)
let panzoomInstance = null

const getFilteredWorks = (year, rating) => {
  return props.works.filter(w => 
    w.year === String(year) && 
    w.rating === rating && 
    props.selectedCategories.has(w.category) &&
    w.tags.some(tag => props.selectedTags.has(tag))
  )
}

const initPanzoom = () => {
  if (!panzoomInstance && timeline.value) {
    panzoomInstance = panzoom(timeline.value, {
      bounds: true,
      boundsPadding: 0.1
    })
  }
}

watch([() => props.works, () => props.selectedTags, () => props.selectedCategories], () => {
  // データの変更時にpanzoomを再初期化
  if (panzoomInstance) {
    panzoomInstance.destroy()
    panzoomInstance = null
  }
  initPanzoom()
}, { deep: true })

onMounted(() => {
  initPanzoom()
})
</script>

<template>
  <div ref="timeline" class="timeline-container">
    <table>
      <thead>
        <tr>
          <th></th>
          <th v-for="year in years" :key="year">{{ year }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rating in [5, 4, 3, 2, 1]" :key="rating">
          <th>★{{ rating }}</th>
          <td v-for="year in years" :key="year">
            <div
              v-for="work in getFilteredWorks(year, rating)"
              :key="work.id || work.title"
              class="work-item"
              :data-category="work.category"
              @click="emit('openModal', work)"
            >
              {{ work.title }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.timeline-container {
  overflow: auto;
  width: 100%;
  height: 1200px;
  border: 1px solid #aaa;
  background: #f9f9f9;
  position: relative;
  margin: 20px 0;
}

.timeline-container table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
}

.timeline-container th,
.timeline-container td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
  min-width: 100px;
  height: 140px;
  vertical-align: top;
  white-space: nowrap;
}

.timeline-container th {
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
.work-item[data-category="小説"] { color: #1f77b4; }
.work-item[data-category="漫画"] { color: #d62728; }
.work-item[data-category="アニメ"] { color: #2ca02c; }
.work-item[data-category="映画"] { color: #ff7f0e; }
.work-item[data-category="ドラマ"] { color: #9467bd; }
</style> 