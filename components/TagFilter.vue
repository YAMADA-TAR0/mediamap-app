<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  subcategories: {
    type: Array,
    required: true
  },
  selectedTags: {
    type: Set,
    required: true
  }
})

const emit = defineEmits(['update:selectedTags'])

// デフォルトですべてのタグを選択
onMounted(() => {
  if (props.selectedTags.size === 0) {
    const newSelectedTags = new Set(props.subcategories)
    emit('update:selectedTags', newSelectedTags)
  }
})

const selectAllTags = () => {
  const newSelectedTags = new Set(props.subcategories)
  emit('update:selectedTags', newSelectedTags)
}

const deselectAllTags = () => {
  emit('update:selectedTags', new Set())
}

const handleTagChange = (tag, checked) => {
  const newSelectedTags = new Set(props.selectedTags)
  if (checked) {
    newSelectedTags.add(tag)
  } else {
    newSelectedTags.delete(tag)
  }
  emit('update:selectedTags', newSelectedTags)
}
</script>

<template>
  <div class="tag-filter">
    <h2>ジャンル（タグ）フィルター</h2>
    <div class="tag-controls">
      <button @click="selectAllTags" class="control-button">すべて選択</button>
      <button @click="deselectAllTags" class="control-button">すべて解除</button>
    </div>
    <div class="tag-list">
      <label v-for="tag in subcategories" :key="tag" class="tag-item">
        <input
          type="checkbox"
          :value="tag"
          :checked="selectedTags.has(tag)"
          @change="(e) => handleTagChange(tag, e.target.checked)"
          class="tag-checkbox"
        >
        <span class="tag-label">{{ tag }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.tag-filter {
  margin: 20px 0;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tag-controls {
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

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 0;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f5f5f5;
  transition: background-color 0.2s;
}

.tag-item:hover {
  background: #e8e8e8;
}

.tag-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.tag-label {
  font-size: 14px;
  color: #333;
}

/* チェックボックスのカスタマイズ */
.tag-checkbox {
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

.tag-checkbox:checked {
  background-color: #4CAF50;
}

.tag-checkbox:checked::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 14px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.tag-checkbox:hover {
  border-color: #45a049;
}

/* レスポンシブ対応 */
@media (max-width: 600px) {
  .tag-filter {
    padding: 15px;
  }

  .tag-list {
    gap: 8px;
  }

  .tag-item {
    padding: 3px 6px;
  }

  .tag-label {
    font-size: 12px;
  }
}
</style> 