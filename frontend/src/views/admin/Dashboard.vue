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

    <nav class="chart-directory" aria-label="图表目录">
      <button
        type="button"
        class="chart-directory__item"
        :class="{ 'chart-directory__item--active': activePanel === 'trend' }"
        @click="switchPanel('trend')"
      >
        发布趋势
      </button>
      <button
        type="button"
        class="chart-directory__item"
        :class="{ 'chart-directory__item--active': activePanel === 'tags' }"
        @click="switchPanel('tags')"
      >
        标签占比
      </button>
      <button
        type="button"
        class="chart-directory__item"
        :class="{ 'chart-directory__item--active': activePanel === 'heat' }"
        @click="switchPanel('heat')"
      >
        分类热力图
      </button>
      <button
        type="button"
        class="chart-directory__item"
        :class="{ 'chart-directory__item--active': activePanel === 'sentiment' }"
        @click="switchPanel('sentiment')"
      >
        评论情感
      </button>
    </nav>

    <section v-show="activePanel === 'trend'" class="charts charts--single">
      <div class="trend">
        <h2>近 30 日新发布文章</h2>
        <p v-if="trendError" class="trend-err" role="alert">{{ trendError }}</p>
        <div ref="chartRef" class="trend__chart" />
      </div>
    </section>

    <section v-show="activePanel === 'tags'" class="charts charts--single">
      <div class="trend">
        <h2>标签占比（TOP 12）</h2>
        <p v-if="tagError" class="trend-err" role="alert">{{ tagError }}</p>
        <div ref="pieRef" class="trend__chart" />
      </div>
    </section>

    <section v-show="activePanel === 'heat'" class="charts charts--single">
      <div class="trend">
        <h2>分类活跃热力图（近 12 个月）</h2>
        <p v-if="heatError" class="trend-err" role="alert">{{ heatError }}</p>
        <div ref="heatRef" class="trend__chart trend__chart--heat" />
      </div>
    </section>

    <section v-show="activePanel === 'sentiment'" class="charts charts--single">
      <div class="trend">
        <h2>评论情感分析（近 90 天）</h2>
        <p class="trend-hint">基于评论关键词规则分类，仅作趋势参考。</p>
        <p v-if="sentimentError" class="trend-err" role="alert">{{ sentimentError }}</p>
        <div ref="sentimentRef" class="trend__chart" />
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useUserStore } from '../../store/user'
import {
  getDashboardStats,
  getVisitTrend,
  getTagRatio,
  getCategoryHeatmap,
  getCommentSentiment,
} from '../../api/stats'

const userStore = useUserStore()
const activePanel = ref('trend')
const stats = ref({})
const trendError = ref('')
const tagError = ref('')
const heatError = ref('')
const sentimentError = ref('')
const chartRef = ref(null)
const pieRef = ref(null)
const heatRef = ref(null)
const sentimentRef = ref(null)
const trendSeries = ref([])
const pieSeries = ref([])
const heatData = ref({ months: [], categories: [], points: [], max: 0 })
const sentimentData = ref({ total: 0, series: [] })
let chartInstance = null
let pieInstance = null
let heatInstance = null
let sentimentInstance = null
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

const buildHeat = () => {
  const data = heatData.value || {}
  if (!heatRef.value) return
  if (!heatInstance) {
    heatInstance = echarts.init(heatRef.value)
  }
  const p = chartPalette()
  const months = data.months || []
  const categories = data.categories || []
  const points = (data.points || []).map((row) => {
    const x = months.indexOf(row.month)
    const y = categories.indexOf(row.category)
    if (x < 0 || y < 0) return null
    return [x, y, row.value || 0]
  }).filter(Boolean)
  const max = Math.max(1, Number(data.max) || 0)

  heatInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      ...tooltipBase(p),
      formatter: (item) => {
        const [x, y, v] = item.value || [0, 0, 0]
        const month = months[x] || ''
        const category = categories[y] || ''
        return `${month}<br/>${category}: ${v}`
      },
    },
    grid: { left: 92, right: 24, top: 18, bottom: 64 },
    xAxis: {
      type: 'category',
      data: months,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: p.split } },
      axisTick: { show: false },
      axisLabel: { color: p.axis, rotate: 28 },
    },
    yAxis: {
      type: 'category',
      data: categories,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: p.split } },
      axisTick: { show: false },
      axisLabel: { color: p.axis, width: 80, overflow: 'truncate' },
    },
    visualMap: {
      min: 0,
      max,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 6,
      textStyle: { color: p.axis },
      inRange: {
        color: isDarkTheme()
          ? ['#21343c', '#2f5c66', '#4f8a93', '#6eb8b0', '#90d6ba']
          : ['#f3eee5', '#e4d4bb', '#cdb58c', '#a88758', '#6e5a3a'],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: points,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0, 0, 0, 0.35)' },
        },
      },
    ],
  })
}

const buildSentiment = () => {
  const data = sentimentData.value || {}
  if (!sentimentRef.value) return
  if (!sentimentInstance) {
    sentimentInstance = echarts.init(sentimentRef.value)
  }
  const p = chartPalette()
  const series = Array.isArray(data.series) ? data.series : []
  const names = series.map((s) => s.name)
  const values = series.map((s) => s.value || 0)
  sentimentInstance.setOption({
    backgroundColor: 'transparent',
    color: ['#4caf50', '#9e9e9e', '#e57373'],
    grid: { left: 44, right: 16, top: 24, bottom: 36 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase(p),
      formatter: (items) => {
        const it = Array.isArray(items) ? items[0] : items;
        const val = it?.value || 0;
        const total = data.total || 0;
        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
        return `${it?.name || ''}: ${val}（${pct}%）`;
      },
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: p.split } },
      axisTick: { show: false },
      axisLabel: { color: p.axis },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: p.split } },
      axisLabel: { color: p.axis },
    },
    series: [{ type: 'bar', barMaxWidth: 52, data: values }],
  })
}

const refreshAllCharts = () => {
  if (activePanel.value === 'trend') buildChart()
  if (activePanel.value === 'tags') buildPie()
  if (activePanel.value === 'heat') buildHeat()
  if (activePanel.value === 'sentiment') buildSentiment()
  nextTick(() => onResize())
}

const switchPanel = (panel) => {
  if (activePanel.value === panel) return
  activePanel.value = panel
  nextTick(() => {
    if (panel === 'trend') buildChart()
    if (panel === 'tags') buildPie()
    if (panel === 'heat') buildHeat()
    if (panel === 'sentiment') buildSentiment()
    onResize()
  })
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
  } catch (err) {
    trendError.value = err.response?.data?.message || '趋势数据加载失败'
  }
  try {
    const pieRes = await getTagRatio()
    pieSeries.value = pieRes.data.data?.series || []
  } catch (err) {
    tagError.value = err.response?.data?.message || '标签占比加载失败'
  }
  try {
    const heatRes = await getCategoryHeatmap()
    heatData.value = heatRes.data.data || { months: [], categories: [], points: [], max: 0 }
  } catch (err) {
    heatError.value = err.response?.data?.message || '分类热力图加载失败'
  }
  try {
    const sentimentRes = await getCommentSentiment()
    sentimentData.value = sentimentRes.data.data || { total: 0, series: [] }
  } catch (err) {
    sentimentError.value = err.response?.data?.message || '评论情感分析加载失败'
  }
  await nextTick()
  buildChart()
  window.addEventListener('resize', onResize)
})

const onResize = () => {
  chartInstance?.resize()
  pieInstance?.resize()
  heatInstance?.resize()
  sentimentInstance?.resize()
}

onUnmounted(() => {
  themeObserver?.disconnect()
  themeObserver = null
  window.removeEventListener('resize', onResize)
  chartInstance?.dispose()
  pieInstance?.dispose()
  heatInstance?.dispose()
  sentimentInstance?.dispose()
  chartInstance = null
  pieInstance = null
  heatInstance = null
  sentimentInstance = null
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
.chart-directory {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin: 0 0 1rem;
}
.chart-directory__item {
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-ink-muted);
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-size: 0.86rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.chart-directory__item:hover {
  color: var(--color-ink);
  border-color: var(--color-primary);
}
.chart-directory__item--active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.charts--single {
  grid-template-columns: 1fr;
  margin-top: 1rem;
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
.trend-hint {
  margin: 0 0 0.4rem;
  color: var(--color-ink-muted);
  font-size: 0.84rem;
}
.trend__chart {
  width: 100%;
  height: 360px;
  min-height: 240px;
}
.trend__chart--heat {
  height: 420px;
}
</style>
