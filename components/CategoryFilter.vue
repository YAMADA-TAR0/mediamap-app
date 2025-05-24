<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  selectedCategories: {
    type: Set,
    required: true
  }
})

const emit = defineEmits(['update:selectedCategories'])

// デフォルトですべてのカテゴリーを選択
onMounted(() => {
  if (props.selectedCategories.size === 0) {
    const newSelectedCategories = new Set(props.categories)
    emit('update:selectedCategories', newSelectedCategories)
  }
})

const selectAllCategories = () => {
  const newSelectedCategories = new Set(props.categories)
  emit('update:selectedCategories', newSelectedCategories)
}

const deselectAllCategories = () => {
  emit('update:selectedCategories', new Set())
}

const handleCategoryChange = (category, checked) => {
  const newSelectedCategories = new Set(props.selectedCategories)
  if (checked) {
    newSelectedCategories.add(category)
  } else {
    newSelectedCategories.delete(category)
  }
  emit('update:selectedCategories', newSelectedCategories)
}
</script>

<template>
  <div class="category-filter">
    <h2>メディア種別フィルター</h2>
    <div class="category-controls">
      <button @click="selectAllCategories" class="control-button">すべて選択</button>
      <button @click="deselectAllCategories" class="control-button">すべて解除</button>
    </div>
    <div class="category-list">
      <label v-for="category in categories" :key="category" class="category-item">
        <input
          type="checkbox"
          :value="category"
          :checked="selectedCategories.has(category)"
          @change="(e) => handleCategoryChange(category, e.target.checked)"
          class="category-checkbox"
        >
        <span class="category-label" :class="`category-${category}`">{{ category }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.category-filter {
  margin: 20px 0;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-controls {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.control-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.control-button:hover {
  background: #45a049;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 0;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f5f5f5;
  transition: background-color 0.2s;
}

.category-item:hover {
  background: #e8e8e8;
}

.category-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #4CAF50;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.category-checkbox:checked {
  background-color: #4CAF50;
}

.category-checkbox:checked::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 14px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.category-checkbox:hover {
  border-color: #45a049;
}

.category-label {
  font-size: 14px;
  font-weight: 500;
}

/* カテゴリー別の色分け */
.category-小説 { color: #1f77b4; }
.category-漫画 { color: #d62728; }
.category-アニメ { color: #2ca02c; }
.category-映画 { color: #ff7f0e; }
.category-ドラマ { color: #9467bd; }

/* レスポンシブ対応 */
@media (max-width: 600px) {
  .category-filter {
    padding: 15px;
  }

  .category-list {
    gap: 8px;
  }

  .category-item {
    padding: 3px 6px;
  }

  .category-label {
    font-size: 12px;
  }
}
</style> 