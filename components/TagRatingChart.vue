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

  const tagRatings = {}
  props.works.forEach(work => {
    work.tags.forEach(tag => {
      if (!tagRatings[tag]) {
        tagRatings[tag] = { sum: 0, count: 0 }
      }
      tagRatings[tag].sum += work.rating
      tagRatings[tag].count++
    })
  })

  const averages = {}
  Object.keys(tagRatings).forEach(tag => {
    averages[tag] = tagRatings[tag].sum / tagRatings[tag].count
  })

  chartInstance.value = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: Object.keys(averages),
      datasets: [{
        label: 'タグ別平均評価',
        data: Object.values(averages),
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
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