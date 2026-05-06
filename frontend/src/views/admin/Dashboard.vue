<template>
  <div class="admin-page">
    <header class="admin-page__head">
      <h1>数据概览</h1>
      <p>欢迎，{{ userStore.userInfo?.username }}。以下为站点统计与近期发布趋势。</p>
    </header>

    <div class="stat-grid">
      <div class="stat-card">
        <span class="stat-card__k">总文章</span>
        <span class="stat-card__v">{{ stats.totalPosts ?? 0 }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__k">注册用户</span>
        <span class="stat-card__v">{{ stats.totalUsers ?? 0 }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__k">近 7 日登录用户</span>
        <span class="stat-card__v">{{ stats.activeUsers7d ?? 0 }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__k">待审核评论</span>
        <span class="stat-card__v">{{ stats.pendingComments ?? 0 }}</span>
      </div>
    </div>

    <section class="charts">
      <div class="trend">
        <h2>近 30 日新发布文章</h2>
        <p v-if="trendError" class="trend-err" role="alert">{{ trendError }}</p>
        <div ref="chartRef" class="trend__chart" />
      </div>
      <div class="trend">
        <h2>标签占比（TOP 12）</h2>
        <p v-if="tagError" class="trend-err" role="alert">{{ tagError }}</p>
        <div ref="pieRef" class="trend__chart" />
      </div>
    </section>

    <section class="charts charts--sources">
      <div class="trend trend--wide">
        <h2>访问来源 Top（近 30 日）</h2>
        <p class="trend-hint">基于文章页记录的 Referer 聚合；站内直达显示为 (direct / empty)。</p>
        <p v-if="srcError" class="trend-err" role="alert">{{ srcError }}</p>
        <div ref="srcRef" class="trend__chart trend__chart--bar" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useUserStore } from '../../store/user'
import { getDashboardStats, getVisitTrend, getTagRatio, getVisitSources } from '../../api/stats'

const userStore = useUserStore()
const stats = ref({})
const trendError = ref('')
const tagError = ref('')
const chartRef = ref(null)
const pieRef = ref(null)
const srcRef = ref(null)
const srcError = ref('')
const trendSeries = ref([])
const pieSeries = ref([])
const barSeries = ref([])
let chartInstance = null
let pieInstance = null
let srcInstance = null
let themeObserver = null

const isDarkTheme = () => document.documentElement.getAttribute('data-theme') === 'dark'

const chartPalette = () => {
  if (isDarkTheme()) {
    return {
      line: '#8fbfaa',
      area: 'rgba(143, 191, 170, 0.22)',
      bar: '#8aa8d4',
      axis: '#98a3b3',
      split: '#2a313c',
      pieBorder: '#171c24',
      tooltipBg: '#171c24',
      tooltipBorder: '#2a313c',
      tooltipText: '#e8ecf1',
    }
  }
  return {
    line: '#2d4a3e',
    area: 'rgba(45, 74, 62, 0.1)',
    bar: '#4a6fa5',
    axis: '#5c5c66',
    split: '#e4ddd4',
    pieBorder: '#fff',
    tooltipBg: '#fff',
    tooltipBorder: '#e4ddd4',
    tooltipText: '#1a1a1e',
  }
}

const tooltipBase = (p) => ({
  backgroundColor: p.tooltipBg,
  borderColor: p.tooltipBorder,
  borderWidth: 1,
  textStyle: { color: p.tooltipText },
})

const buildChart = () => {
  const series = trendSeries.value
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  const p = chartPalette()
  const dates = series.map((item) => item.date)
  const values = series.map((item) => item.value)
  chartInstance.setOption({
    backgroundColor: 'transparent',
    color: [p.line],
    grid: { left: 44, right: 16, top: 28, bottom: 40 },
    tooltip: { trigger: 'axis', ...tooltipBase(p) },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: p.split } },
      axisTick: { lineStyle: { color: p.split } },
      axisLabel: { rotate: 28, color: p.axis },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: p.split } },
      axisLabel: { color: p.axis },
    },
    series: [
      {
        name: '新发布',
        type: 'line',
        data: values,
        smooth: true,
        lineStyle: { width: 2.2, color: p.line },
        itemStyle: { color: p.line },
        areaStyle: { color: p.area },
      },
    ],
  })
}

const buildPie = () => {
  const series = pieSeries.value
  if (!pieRef.value) return
  if (!pieInstance) {
    pieInstance = echarts.init(pieRef.value)
  }
  const p = chartPalette()
  pieInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      ...tooltipBase(p),
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      textStyle: { color: p.axis },
      pageTextStyle: { color: p.axis },
    },
    series: [
      {
        name: '标签占比',
        type: 'pie',
        radius: ['35%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: p.pieBorder, borderWidth: 2 },
        label: { formatter: '{b}', color: p.axis },
        data: series,
      },
    ],
  })
}

const buildBar = () => {
  const series = barSeries.value
  if (!srcRef.value) return
  if (!srcInstance) {
    srcInstance = echarts.init(srcRef.value)
  }
  const p = chartPalette()
  const names = series.map((s) => s.name)
  const vals = series.map((s) => s.value)
  srcInstance.setOption({
    backgroundColor: 'transparent',
    color: [p.bar],
    grid: { left: 120, right: 24, top: 16, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase(p),
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: p.split } },
      axisLabel: { color: p.axis },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: p.split } },
      axisTick: { show: false },
      axisLabel: { color: p.axis, width: 110, overflow: 'truncate' },
    },
    series: [{ type: 'bar', data: vals, barMaxWidth: 22, itemStyle: { color: p.bar } }],
  })
}

const refreshAllCharts = () => {
  buildChart()
  buildPie()
  buildBar()
  nextTick(() => onResize())
}

onMounted(async () => {
  themeObserver = new MutationObserver((mutations) => {
    const hit = mutations.some(
      (m) => m.type === 'attributes' && m.attributeName === 'data-theme'
    )
    if (hit) refreshAllCharts()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  try {
    const res = await getDashboardStats()
    stats.value = res.data.data || {}
  } catch (err) {
    console.error('加载统计失败', err)
  }
  try {
    const trendRes = await getVisitTrend()
    trendSeries.value = trendRes.data.data?.series || []
    await nextTick()
    buildChart()
  } catch (err) {
    trendError.value = err.response?.data?.message || '趋势数据加载失败'
  }
  try {
    const pieRes = await getTagRatio()
    pieSeries.value = pieRes.data.data?.series || []
    await nextTick()
    buildPie()
  } catch (err) {
    tagError.value = err.response?.data?.message || '标签占比加载失败'
  }
  try {
    const srcRes = await getVisitSources()
    barSeries.value = srcRes.data.data?.series || []
    await nextTick()
    buildBar()
  } catch (err) {
    srcError.value = err.response?.data?.message || '访问来源加载失败'
  }
  window.addEventListener('resize', onResize)
})

const onResize = () => {
  chartInstance?.resize()
  pieInstance?.resize()
  srcInstance?.resize()
}

onUnmounted(() => {
  themeObserver?.disconnect()
  themeObserver = null
  window.removeEventListener('resize', onResize)
  chartInstance?.dispose()
  pieInstance?.dispose()
  srcInstance?.dispose()
  chartInstance = null
  pieInstance = null
  srcInstance = null
})
</script>

<style scoped>
.admin-page {
  max-width: 1000px;
  margin: 0 auto;
}
.admin-page__head h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 0.4rem;
  letter-spacing: 0.04em;
}
.admin-page__head p {
  margin: 0 0 1.5rem;
  color: var(--color-ink-muted);
  font-size: 0.95rem;
  line-height: 1.55;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.75rem;
}
.stat-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.1rem 1.1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  box-shadow: var(--shadow-sm);
}
.stat-card__k {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-ink-muted);
  font-weight: 600;
}
.stat-card__v {
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1.1;
}
.trend {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.1rem 1.15rem 1.25rem;
  box-shadow: var(--shadow-sm);
}
.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 960px) {
  .charts {
    grid-template-columns: 1fr;
  }
}
.trend h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 0.5rem;
}
.trend-err {
  color: #b83232;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}
.trend__chart {
  width: 100%;
  height: 360px;
  min-height: 240px;
}
.charts--sources {
  display: grid;
  grid-template-columns: 1fr;
  margin-top: 1rem;
}
.trend--wide {
  width: 100%;
}
.trend-hint {
  font-size: 0.82rem;
  color: var(--color-ink-muted);
  margin: 0 0 0.5rem;
  line-height: 1.45;
}
.trend__chart--bar {
  height: 420px;
}
</style>
