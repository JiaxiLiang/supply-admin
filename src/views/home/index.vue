<template>
  <AppPage show-footer>
    <div class="flex flex-col rounded-8 brand-gradient px-32 py-24 text-white card-shadow md:flex-row md:items-center">
      <div class="flex items-center">
        <n-avatar round :size="60" :src="userStore.avatar" class="flex-shrink-0" />
        <div class="ml-20 flex-col">
          <span class="text-22 font-bold">Hello, {{ userStore.nickName ?? userStore.username }}</span>
          <span class="mt-4 opacity-80">当前角色：{{ userStore.currentRole?.name }}</span>
        </div>
        <p class="ml-40 hidden text-14 opacity-85 lg:block">
          一个人几乎可以在任何他怀有无限热忱的事情上成功。—— 查尔斯·史考伯
        </p>
      </div>

      <footer class="mt-16 flex items-center gap-12 md:ml-auto md:mt-0">
        <n-button
          class="!bg-white !text-#23C891 hover:!opacity-90"
          tag="a"
          href="https://github.com/Jiaxiliang/vue-naive-admin"
          target="_blank"
        >
          代码仓库
        </n-button>
      </footer>
    </div>

    <div class="mt-12 flex">
      <n-card class="w-50%" title="💯 特性" segmented>
        <p class="opacity-60">
          这是跨境供应链管理系统的前端：基于权限动态路由，覆盖商品、报价单、PI 打印的采购报价业务流；
          使用 Vite + Vue3 + TypeScript + Pinia + Unocss 构建，配套 Nestjs + TypeOrm + MySql 后端；
          开发期以内置 mock 脱后端运行，对接真实后端只需切换环境开关。
        </p>
        <ul class="mt-12 opacity-90">
          <li class="py-4">
            🆒 使用 <b>Vue3</b> 主流技术栈: <span class="text-highlight">Vite + Vue3 + TypeScript + Pinia</span>
          </li>
          <li class="py-4">
            🍇 使用 <b>原子CSS</b> 框架: <span class="text-highlight">Unocss</span>，优雅、轻量、易用
          </li>
          <li class="py-4">
            🤹 使用主流的 <span class="text-highlight">iconify + unocss</span> 图标方案，支持自定义图标，支持动态渲染
          </li>
          <li class="py-4">
            🎨 使用 Naive UI，<span class="text-highlight">极致简洁的代码风格和清爽的页面设计</span>，审美在线，主题轻松定制
          </li>
          <li class="py-4">
            👏 先进且易于理解的文件结构设计，多个模块之间 <b>零耦合</b>，单个业务模块删除不影响其他模块
          </li>
          <li class="py-4">
            🚀 <span class="text-highlight">扁平化路由</span> 设计，每一个组件都可以是一个页面，告别多级路由 KeepAlive 难实现问题
          </li>
          <li class="py-4">
            🍒 <span class="text-highlight">基于权限动态生成路由</span>，无需额外定义路由，<span class="text-highlight">403和404可区分</span>，而不是无权限也跳404
          </li>
          <li class="py-4">
            🔐 基于Redis集成 <span class="text-highlight">无感刷新</span>，用户登录态可控，安全与体验缺一不可
          </li>
          <li class="py-4">
            ✨ 基于 Naive UI 封装 <span class="text-highlight">message</span> 全局工具方法，支持批量提醒，支持跨页面共享实例
          </li>
          <li class="py-4">
            ⚡️ 基于 Naive UI 封装常用的业务组件，包含 <span class="text-highlight">Page</span> 组件、<span class="text-highlight">CRUD</span> 表格组件及 <span class="text-highlight">Modal</span> 组件，减少大量重复性工作
          </li>
        </ul>

        <n-divider class="mb-0! mt-12!">
          <p class="text-14 opacity-60">
            演示环境由内置 mock 驱动，刷新即复位；完整架构说明见仓库 README 与 docs/
          </p>
        </n-divider>
      </n-card>

      <n-card class="ml-12 w-50%" title="🛠️ 技术栈" segmented>
        <VChart :option="skillOption" autoresize />
      </n-card>
    </div>

    <n-card class="mt-12" title="⚡️ 趋势" segmented>
      <div class="h-400">
        <VChart :option="trendOption" autoresize />
      </div>
    </n-card>
  </AppPage>
</template>

<script setup lang="ts">
// 首页：欢迎横幅 + 项目特性介绍 + 两块 ECharts 图表（技术栈语言占比饼图、报价业务月度趋势图）
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useUserStore } from '@/store'

const userStore = useUserStore()

// 按需注册用到的图表类型与组件，减小 echarts 打包体积
echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
  PieChart,
])

// 趋势图配置：业务演示数据——报价单数走左轴柱状，报价金额（万美元）走右轴折线
const trendOption = {
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

// 技术栈占比环形图配置：按 src 下 ts/vue/css 真实行数占比统计；默认隐藏标签，悬停时在中心放大显示
const skillOption = {
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
