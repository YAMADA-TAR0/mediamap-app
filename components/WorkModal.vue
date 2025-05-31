<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  work: {
    type: Object,
    default: null
  },
  workIndex: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'delete'])

const localRating = ref('')
const localMemo = ref('')

// workが変更されたときにローカルステートを更新
watch(() => props.work, (newWork) => {
  if (newWork) {
    localRating.value = newWork.rating.toString()
    localMemo.value = newWork.memo
  }
}, { immediate: true })

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSave = () => {
  emit('save', {
    index: props.workIndex,
    rating: parseInt(localRating.value),
    memo: localMemo.value
  })
}

const handleDelete = () => {
  emit('delete', props.workIndex)
}
</script>

<template>
  <div v-if="modelValue && work" class="modal-overlay">
    <div class="modal-content">
      <h2>{{ work.title }}</h2>
      <p>{{ work.category }} / {{ work.year }}年</p>
      <p v-if="work.subcategory">ジャンル: {{ work.subcategory }}</p>
      <p v-if="work.tags && work.tags.length">タグ: {{ work.tags.join(', ') }}</p>

      
      <div class="form-group">
        <label for="modalRatingSelect">評価（★1〜5）</label>
        <select v-model="localRating">
          <option value="1">★1</option>
          <option value="2">★2</option>
          <option value="3">★3</option>
          <option value="4">★4</option>
          <option value="5">★5</option>
        </select>
      </div>

      <div class="form-group">
        <textarea v-model="localMemo" placeholder="メモを入力..."></textarea>
      </div>

      <div class="button-group">
        <button @click="handleSave" class="save-button">保存</button>
        <button @click="handleDelete" class="delete-button">この作品を削除</button>
        <button @click="closeModal" class="cancel-button">キャンセル</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin: 16px 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

select, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 16px;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.button-group {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.save-button {
  background: #4CAF50;
  color: white;
}

.delete-button {
  background: #f44336;
  color: white;
}

.cancel-button {
  background: #9e9e9e;
  color: white;
}

button:hover {
  opacity: 0.9;
}
</style> 