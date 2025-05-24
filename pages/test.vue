<script setup>
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>

<template>
  <div class="container">
    <h1>インド人を右に商店</h1>
    <jankengame   />
    <Molegame />
    <p>あなたのメディア体験をマッピングしましょう</p>
    <div class="counter">
      <p>カウント: {{ count }}</p>
      <button @click="increment">＋ 1</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  text-align: center;
  padding: 20px;
}

.counter {
  margin-top: 20px;
}

button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #2980b9;
}
</style>
