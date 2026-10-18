<template>
  <n-config-provider
    class="wh-full"
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="appStore.isDark ? darkTheme : undefined"
    :theme-overrides="appStore.naiveThemeOverrides"
  >
    <component :is="Layout">
      <router-view v-slot="{ Component, route: curRoute }">
        <transition name="fade-slide" mode="out-in" appear>
          <!-- 只缓存页签里标记了 keepAlive 的页面，页签关闭即不再缓存 -->
          <KeepAlive :include="keepAliveNames">
            <component :is="Component" v-if="!tabStore.reloading" :key="curRoute.fullPath" />
          </KeepAlive>
        </transition>
      </router-view>
    </component>
  </n-config-provider>
</template>

<script setup lang="ts">
// 应用根组件：全局主题装配 + 布局二选一 + 页签缓存
import { darkTheme, dateZhCN, zhCN } from 'naive-ui'
import { useAppStore, useTabStore } from '@/store'
import EmptyLayout from './layouts/empty/index.vue'
import NormalLayout from './layouts/normal/index.vue'

const route = useRoute()
const appStore = useAppStore()
const tabStore = useTabStore()

/** 布局二选一：整屏页（登录/404/403/PI 打印，meta.layout='empty'）用空白布局，其余业务页统一通用布局 */
const Layout = computed(() => (route.meta?.layout === 'empty' ? EmptyLayout : NormalLayout))

/** KeepAlive 的缓存名单：已开启且标记 keepAlive 的页签对应组件名 */
const keepAliveNames = computed(() => {
  return tabStore.tabs.filter(item => item.keepAlive).map(item => item.name as string)
})

// watchEffect 追踪了主题色与明暗两个依赖，任一变化都会重算色板并同步 CSS 变量
watchEffect(() => {
  appStore.setThemeColor(appStore.primaryColor, appStore.isDark)
})
</script>
