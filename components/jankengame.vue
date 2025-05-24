<script setup>
import { ref } from 'vue'

const hands = ['✊', '✌️', '🖐️']
const handNames = ['ぐー', 'ちょき', 'ぱー']
const userHand = ref(null)
const cpuHand = ref(null)
const result = ref('')
const resultColor = ref('')
const animating = ref(false)

let sounds = { win: null, lose: null, draw: null }

onMounted(() => {
  // Audioオブジェクトはブラウザでしか存在しないので onMounted 内で初期化！
  sounds.win = new Audio('/sounds/A.mp3')
  sounds.lose = new Audio('/sounds/B.mp3')
  sounds.draw = new Audio('/sounds/C.mp3')
})

function play(userChoice) {
  if (animating.value) return
  userHand.value = userChoice
  animating.value = true
  result.value = ''
  resultColor.value = ''
  cpuHand.value = '❔'

  let i = 0
  const interval = setInterval(() => {
    cpuHand.value = hands[i % 3]
    i++
  }, 100)

  setTimeout(() => {
    clearInterval(interval)
    const finalIndex = Math.floor(Math.random() * 3)
    const finalHand = hands[finalIndex]
    cpuHand.value = finalHand

    const winMap = {
      '✊': '✌️',
      '✌️': '🖐️',
      '🖐️': '✊'
    }

    if (userChoice === finalHand) {
      result.value = 'あいこ！'
      resultColor.value = 'draw'
      sounds.draw.play()
    } else if (winMap[userChoice] === finalHand) {
      result.value = 'あなたの勝ち！🎉'
      resultColor.value = 'win'
      sounds.win.play()
    } else {
      result.value = 'あなたの負け…😭'
      resultColor.value = 'lose'
      sounds.lose.play()
    }

    animating.value = false
  }, 1500)
}
</script>

<template>
  <div class="janken" :class="resultColor">
    <h2>じゃんけんしよう！</h2>
    <div class="buttons">
      <button v-for="(hand, i) in hands" :key="hand" :disabled="animating" @click="play(hand)">
        {{ handNames[i] }} {{ hand }}
      </button>
    </div>

    <div class="result" v-if="userHand">
      <p>あなた：{{ userHand }}　/　CPU：{{ cpuHand }}</p>
      <p><strong>{{ result }}</strong></p>
    </div>
  </div>
</template>

<style scoped>
.janken {
  text-align: center;
  padding: 20px;
  transition: background-color 0.3s ease;
}
.janken.win {
  background-color: #d4f4dd;
}
.janken.lose {
  background-color: #f9d6d5;
}
.janken.draw {
  background-color: #fff7d6;
}

.buttons button {
  margin: 10px;
  padding: 12px 20px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #ccc;
  background-color: #fff;
  transition: transform 0.2s ease;
}
.buttons button:hover {
  transform: scale(1.05);
}
.result {
  font-size: 20px;
  margin-top: 20px;
}
</style>
