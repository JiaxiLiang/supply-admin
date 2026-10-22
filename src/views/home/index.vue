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
          href="https://github.com/JiaxiLiang/supply-admin"
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
        <TechPie />
      </n-card>
    </div>

    <n-card class="mt-12" title="⚡️ 趋势" segmented>
      <TrendChart />
    </n-card>
  </AppPage>
</template>

<script setup lang="ts">
// 首页：欢迎横幅 + 项目特性介绍 + 两块 ECharts 图表（图表配置与注册各自内聚在
// TrendChart / TechPie 子组件，本页只做版面装配）
import { useUserStore } from '@/store'
import TechPie from './components/TechPie.vue'
import TrendChart from './components/TrendChart.vue'

const userStore = useUserStore()
</script>
