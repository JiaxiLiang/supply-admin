<template>
  <n-menu
    ref="menu"
    class="side-menu"
    inverted
    accordion
    :indent="18"
    :collapsed-icon-size="22"
    :collapsed-width="64"
    :collapsed="appStore.collapsed"
    :options="permissionStore.menus"
    :value="activeKey"
    @update:value="handleMenuSelect"
  />
</template>

<script setup lang="ts">
// 侧边菜单：渲染权限菜单树（permissionStore.menus，节点 path 即路由地址），点击即路由跳转；跳转后的页面缓存由路由 meta.keepAlive 经页签机制进入 App.vue 的 KeepAlive 名单，菜单本身不参与缓存
import type { MenuOption } from 'naive-ui'
import { useAppStore, usePermissionStore } from '@/store'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

// 本应用路由 name 均为字符串（权限 code / 基础路由字面量，见 generateRoute 与 basic-routes），无 symbol
const activeKey = computed(() => (route.meta?.parentKey ?? route.name ?? null) as string | null)

const menu = ref<{ showOption: () => void } | null>(null)
// 子路由页面无对应菜单项，高亮落在父菜单（meta.parentKey）上；路由变化后滚动让选中项保持可见
watch(route, async () => {
  await nextTick()
  menu.value?.showOption()
})

/** 菜单点击：按 path 路由跳转；目录项（path 为空）不响应 */
function handleMenuSelect(key: string, item: MenuOption | null) {
  if (!item?.path)
    return
  router.push(item.path)
}
</script>

<style>
.side-menu:not(.n-menu--collapsed) {
  .n-menu-item-content {
    &::before {
      left: 8px;
      right: 8px;
    }
    &.n-menu-item-content--selected::before {
      background-color: rgb(var(--primary-color));
    }
  }
}
.side-menu .n-menu-item-content--selected :is(.n-menu-item-content-header, .n-menu-item-content-icon) {
  color: #fff !important;
}
</style>
