<template>
  <n-dropdown
    :show="show"
    :options="options"
    :x="x"
    :y="y"
    placement="bottom-start"
    @clickoutside="show = false"
    @select="handleSelect"
  />
</template>

<script setup lang="ts">
// 页签右键菜单：在鼠标坐标处弹出 n-dropdown，提供重新加载/关闭/关闭其他/关闭左侧/关闭右侧操作。
// 显隐、坐标与目标页签都是本菜单自身的交互状态，自持并只暴露 open(e, path) 入口，
// 页签栏无需代管这些状态；动作实现全部收敛在 tab store
import { useTabStore } from '@/store'

const tabStore = useTabStore()

// 菜单显隐与定位（坐标 + 右键目标页签路径）
const show = ref(false)
const x = ref(0)
const y = ref(0)
const currentPath = ref('')

/** 右键唤出菜单（页签栏经模板 ref 调用）：先隐藏再在下一帧携新坐标/目标重新显示，避免菜单复用旧定位不刷新 */
async function open(e: MouseEvent, path: string) {
  show.value = false
  x.value = e.clientX
  y.value = e.clientY
  currentPath.value = path
  await nextTick()
  show.value = true
}

// 按右键目标页签的位置决定可用性：重新加载仅对激活页签开放；关闭左侧/右侧在目标已处于列表边缘时禁用
const options = computed(() => [
  {
    label: '重新加载',
    key: 'reload',
    disabled: currentPath.value !== tabStore.activeTab,
    icon: () => h('i', { class: 'i-mdi:refresh text-14' }),
  },
  {
    label: '关闭',
    key: 'close',
    disabled: tabStore.tabs.length <= 1,
    icon: () => h('i', { class: 'i-mdi:close text-14' }),
  },
  {
    label: '关闭其他',
    key: 'close-other',
    disabled: tabStore.tabs.length <= 1,
    icon: () => h('i', { class: 'i-mdi:arrow-expand-horizontal text-14' }),
  },
  {
    label: '关闭左侧',
    key: 'close-left',
    disabled: tabStore.tabs.length <= 1 || currentPath.value === tabStore.tabs[0]?.path,
    icon: () => h('i', { class: 'i-mdi:arrow-expand-left text-14' }),
  },
  {
    label: '关闭右侧',
    key: 'close-right',
    disabled:
      tabStore.tabs.length <= 1
      || currentPath.value === tabStore.tabs.at(-1)?.path,
    icon: () => h('i', { class: 'i-mdi:arrow-expand-right text-14' }),
  },
])

const route = useRoute()

/** 动作表：key 与菜单项 key 一一对应（TabAction 由本表派生，两处天然一致），操作最终都落在 tab store 的对应方法上 */
const actionMap = {
  'reload': () => {
    tabStore.reloadTab(route.fullPath, route.meta?.keepAlive)
  },
  'close': () => {
    tabStore.removeTab(currentPath.value)
  },
  'close-other': () => {
    tabStore.removeOther(currentPath.value)
  },
  'close-left': () => {
    tabStore.removeLeft(currentPath.value)
  },
  'close-right': () => {
    tabStore.removeRight(currentPath.value)
  },
} satisfies Record<string, () => void>

type TabAction = keyof typeof actionMap

/** 执行右键选中的动作后收起菜单；key 均来自 actionMap（字符串），number 分支理论不可达 */
function handleSelect(key: string | number) {
  const actionFn = actionMap[key as TabAction]
  actionFn?.()
  show.value = false
}

defineExpose({ open })
</script>
