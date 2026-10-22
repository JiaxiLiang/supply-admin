<template>
  <div id="top-tab">
    <n-tabs
      :value="tabStore.activeTab"
      :closable="tabStore.tabs.length > 1"
      type="card"
      @close="(path) => tabStore.removeTab(path)"
    >
      <n-tab
        v-for="item in tabStore.tabs"
        :key="item.path"
        :name="item.path"
        @click="handleItemClick(item.path)"
        @contextmenu.prevent="contextMenuRef?.open($event, item.path)"
      >
        {{ item.title }}
      </n-tab>
    </n-tabs>

    <ContextMenu ref="contextMenuRef" />
  </div>
</template>

<script setup lang="ts">
// 多页签栏：展示已访问路由的页签（数据来自 tab store，由路由守卫 addTab 维护），点击切换路由；
// 右键唤出 ContextMenu 做刷新与批量关闭，菜单的显隐/定位/目标都是它自身的状态，这里只透传事件
import { useTabStore } from '@/store'
import ContextMenu from './ContextMenu.vue'

const router = useRouter()
const tabStore = useTabStore()

const contextMenuRef = useTemplateRef('contextMenuRef')

/** 点击页签：同步激活态并跳到对应路由 */
function handleItemClick(path: string) {
  tabStore.setActiveTab(path)
  router.push(path)
}
</script>

<style scoped>
:deep(.n-tabs) {
  .n-tabs-tab {
    padding: 0 14px;
    height: 30px;
    margin-right: 6px;
    border: none !important;
    border-radius: 6px !important;
    &:hover {
      background-color: rgba(var(--primary-color), 0.12) !important;
    }
  }
  .n-tabs-tab--active {
    background-color: rgb(var(--primary-color)) !important;
    color: #fff !important;
    .n-base-close {
      color: #fff;
    }
  }
  .n-tabs-pad,
  .n-tabs-tab-pad,
  .n-tabs-scroll-padding {
    border: none !important;
  }
}
</style>
