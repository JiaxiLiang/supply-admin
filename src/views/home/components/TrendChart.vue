<template>
  <div class="h-400">
    <VChart :option="option" autoresize />
  </div>
</template>

<script setup lang="ts">
// 月度业务趋势图：报价单数（左轴柱状）与报价金额（右轴折线，万美元）双轴联动。
// 演示数据由内置 mock 语境提供；图表类型与组件按需注册以控制打包体积（echarts.use 幂等，可多组件各自调用）
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
])

// 趋势图配置：报价单数走左轴柱状，报价金额（万美元）走右轴折线
const option = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: '#999',
      },
    },
  },
  legend: {
    top: '5%',
    data: ['报价单数', '报价金额(万美元)'],
  },
  xAxis: [
    {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisPointer: {
        type: 'shadow',
      },
    },
  ],
  yAxis: [
    {
      type: 'value',
      min: 0,
      max: 40,
      interval: 10,
      axisLabel: {
        formatter: '{value}',
      },
    },
    {
      type: 'value',
      min: 0,
      max: 140,
      interval: 35,
      axisLabel: {
        formatter: '{value}',
      },
    },
  ],
  series: [
    {
      name: '报价单数',
      type: 'bar',
      data: [6, 8, 5, 9, 12, 10, 14, 11, 16, 13, 18, 15],
    },
    {
      name: '报价金额(万美元)',
      yAxisIndex: 1,
      type: 'line',
      data: [28, 35, 26, 41, 52, 47, 58, 49, 66, 55, 72, 63],
    },
  ],
}
</script>
