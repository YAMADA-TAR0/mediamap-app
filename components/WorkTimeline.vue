<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
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

const timelineContainer = ref(null)
const zoomTarget = ref(null)
let panzoomInstance = null

const getFilteredWorks = (year, rating) => {
  return props.works.filter(w => 
    Number(w.year) === Number(year) && 
    Number(w.rating) === Number(rating) && 
    props.selectedCategories.has(w.category) &&
    w.tags.some(tag => props.selectedTags.has(tag))
  )
}

const initPanzoom = () => {
  if (!panzoomInstance && timelineContainer.value) {
    panzoomInstance = panzoom(zoomTarget.value, {
      maxScale: 5,
      minScale: 0.1,
    })

    const zoomWithWheel = (e) => panzoomInstance.zoomWithWheel(e);
    
    timelineContainer.value.addEventListener("mouseenter", () => {
      timelineContainer.value.addEventListener("wheel", zoomWithWheel);
    });
    
    timelineContainer.value.addEventListener("mouseleave", () => {
      timelineContainer.value.removeEventListener("wheel", zoomWithWheel);
    });
  }
}

onMounted(() => {
  initPanzoom()
})

onUnmounted(() => {
  if (panzoomInstance) {
    panzoomInstance.destroy()
    panzoomInstance = null
  }
})
</script>

<template>
  <div ref="timelineContainer" class="timeline-container">
    <table ref="zoomTarget">
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
              :key="work.title"
              class="work-item"
              :data-category="work.category"
              @click="emit('openModal', work, works.findIndex(w => w === work))"
            >
              <img 
                v-if="work.thumbnail" 
                :src="work.thumbnail" 
                :alt="work.title"
                class="work-thumbnail"
              />
              <span class="work-title">{{ work.title }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.timeline-container {
  overflow: auto;
  width: 100%;
  position: relative;
  margin: 20px 0;

  table {
    border-collapse: collapse;
    width: max-content;
    min-width: 100%;
  }

  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
    min-width: 100px;
    height: 140px;
    vertical-align: top;
    white-space: nowrap;
  }

  th {
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    &:hover {
      background-color: #c8e6c9;
    }

    .work-thumbnail {
      width: 80px;
      height: 120px;
      object-fit: cover;
      border-radius: 2px;
    }

    .work-title {
      font-size: 11px;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      max-width: 100%;
    }

    &[data-category="小説"] { color: #1f77b4; }
    &[data-category="漫画"] { color: #d62728; }
    &[data-category="アニメ"] { color: #2ca02c; }
    &[data-category="映画"] { color: #ff7f0e; }
    &[data-category="ドラマ"] { color: #9467bd; }
  }
}
</style> 