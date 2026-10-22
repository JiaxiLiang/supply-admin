<template>
  <VChart :option="option" autoresize />
</template>

<script setup lang="ts">
// 技术栈占比环形图：按 src 下 ts/vue/css 真实行数占比统计；默认隐藏标签，悬停时在中心放大显示
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

echarts.use([TooltipComponent, LegendComponent, PieChart, CanvasRenderer])

const option = {
  tooltip: {
    trigger: 'item',
    formatter({ name, value }: { name: string, value: number }) {
      return `${name} ${value}%`
    },
  },
  legend: {
    left: 'center',
  },
  series: [
    {
      bottom: '12%',
      type: 'pie',
      radius: ['35%', '90%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
        position: 'center',
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 36,
          fontWeight: 'bold',
        },
      },
      labelLine: {
        show: false,
      },
      data: [
        { value: 54.3, name: 'Vue SFC' },
        { value: 40.5, name: 'TypeScript' },
        { value: 5.2, name: 'CSS' },
      ],
    },
  ],
}
</script>
