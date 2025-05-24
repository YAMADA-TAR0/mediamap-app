<script setup>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  works: {
    type: Array,
    required: true
  }
})

const chartInstance = ref(null)
const chartCanvas = ref(null)

const renderChart = () => {
  if (!chartCanvas.value) return

  // 既存のグラフを破棄
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  const tagRatingMap = {}
  props.works.forEach(work => {
    if (!Array.isArray(work.tags) || isNaN(work.rating) || work.rating < 1 || work.rating > 5) {
      return
    }

    work.tags.forEach(tag => {
      if (!tagRatingMap[tag]) {
        tagRatingMap[tag] = [0, 0, 0, 0, 0] // ★1〜5カウント用
      }
      tagRatingMap[tag][work.rating - 1]++
    })
  })

  const labels = Object.keys(tagRatingMap)
  const datasets = []

  for (let r = 5; r >= 1; r--) {
    datasets.push({
      label: `★${r}`,
      data: labels.map(tag => tagRatingMap[tag][r - 1]),
      backgroundColor: `rgba(${50 + r * 30}, ${100 + r * 15}, ${200 - r * 20}, 0.8)`,
      stack: 'stack1'
    })
  }

  chartInstance.value = new Chart(chartCanvas.value, {
    type: 'bar',
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
  })
}

watch(() => props.works, () => {
  renderChart()
}, { deep: true })

onMounted(() => {
  renderChart()
})
</script>

<template>
  <div class="chart-container">
    <canvas ref="chartCanvas" width="600" height="300"></canvas>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 300px;
  margin: 20px 0;
}
</style> 