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

  const tagCounts = {}
  props.works.forEach(work => {
    work.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })

  chartInstance.value = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: Object.keys(tagCounts),
      datasets: [{
        label: 'タグ別登録数',
        data: Object.values(tagCounts),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
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