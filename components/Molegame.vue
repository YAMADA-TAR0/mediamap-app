<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const score = ref(0)
const moleIndex = ref(null)
const intervalId = ref(null)
const gameActive = ref(false)
const misses = ref(0)
const gameOver = ref(false)

function startGame() {
  score.value = 0
  misses.value = 0
  gameOver.value = false
  gameActive.value = true
  moveMole()
  intervalId.value = setInterval(moveMole, 1000)
}

function stopGame() {
  gameActive.value = false
  clearInterval(intervalId.value)
  moleIndex.value = null
}

function moveMole() {
  moleIndex.value = Math.floor(Math.random() * 9)
}

function hit(index) {
  if (!gameActive.value || gameOver.value) return
  if (index === moleIndex.value) {
    score.value++
    moleIndex.value = null
  } else {
    misses.value++
    if (misses.value >= 3) {
      gameOver.value = true
      stopGame()
    }
  }
}
</script>

<template>
  <div class="mole-game">
    <h2>もぐらたたきゲーム</h2>
    <p>スコア: {{ score }}　ミス: {{ misses }}/3</p>
    <p v-if="gameOver" style="color: red; font-weight: bold;">ゲームオーバー！😵</p>
    <div class="grid">
      <div
        v-for="(cell, i) in 9"
        :key="i"
        :class="['cell', { mole: i === moleIndex }]"
        @click="hit(i)"
      ></div>
    </div>
    <div class="buttons">
      <button @click="startGame" :disabled="gameActive">スタート</button>
      <button @click="stopGame" :disabled="!gameActive">ストップ</button>
    </div>
  </div>
</template>

<style scoped>
.mole-game {
  text-align: center;
  padding: 20px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-gap: 10px;
  justify-content: center;
  margin: 20px 0;
}
.cell {
  width: 100px;
  height: 100px;
  background-color: #eee;
  border-radius: 10px;
  transition: background-color 0.2s ease;
}
.cell.mole {
  background-color: #8e44ad;
  cursor: pointer;
}
.cell:hover {
  opacity: 0.8;
}
.buttons button {
  margin: 0 10px;
  padding: 10px 20px;
  font-size: 16px;
}
</style>
