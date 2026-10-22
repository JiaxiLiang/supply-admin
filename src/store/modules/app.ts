// 应用 UI 状态仓库：侧边栏折叠、主题色与明暗。只管界面状态，不碰业务数据。
// 选用 setup store 风格：isDark 本质是 useDark() 的可写计算属性，setup 风格下它就是普通的
// computed 状态，无需像 options 风格那样把 WritableComputedRef 塞进 state 工厂再靠解包表现成 boolean
import type { PersistenceOptions } from 'pinia-plugin-persistedstate'
import { generate, getRgbStr } from '@arco-design/color'
import { useDark } from '@vueuse/core'
import { defineStore } from 'pinia'
import { defaultPrimaryColor, naiveThemeOverrides as defaultThemeOverrides } from '@/settings'

// 持久化字段名单：只持久化界面偏好；sessionStorage 会话级隔离，关闭标签页即还原默认
const persistedKeys = ['collapsed', 'primaryColor', 'naiveThemeOverrides'] as const

export const useAppStore = defineStore('app', () => {
  // ── state ──
  /** 侧边栏折叠 */
  const collapsed = ref(false)
  /** 明暗模式：首次访问默认亮色；用户显式切换到暗色后由 localStorage 记忆，此后跟随其选择 */
  const isDark = useDark({ initialValue: 'light' })
  /** 主题色 */
  const primaryColor = ref(defaultPrimaryColor)
  /** naive 主题覆盖：common 色板随主题色/明暗由 setThemeColor 重算 */
  const naiveThemeOverrides = ref(defaultThemeOverrides)

  // ── actions ──
  /** 切换侧边栏折叠状态 */
  function switchCollapsed() {
    collapsed.value = !collapsed.value
  }
  /** 直接设置侧边栏折叠状态 */
  function setCollapsed(b: boolean) {
    collapsed.value = b
  }
  /** 切换明暗模式（首次进入默认亮色，显式切换后记忆到 localStorage） */
  function toggleDark() {
    isDark.value = !isDark.value
  }
  /** 只记录主题色，色板重算统一由 setThemeColor 触发 */
  function setPrimaryColor(color: string) {
    primaryColor.value = color
  }
  /**
   * 依据主色与明暗生成 arco 色板，同步写入 CSS 变量与 naive 主题覆盖
   * @param color 缺省取当前主题色
   * @param dark 缺省取当前明暗状态
   */
  function setThemeColor(color?: string, dark?: boolean) {
    const themeColor = color ?? primaryColor.value
    const isDarkNow = dark ?? isDark.value
    const colors = generate(themeColor, {
      list: true,
      dark: isDarkNow,
    })
    // 色板第 5 档为标准色，写入 CSS 变量供自写样式取用
    document.body.style.setProperty('--primary-color', getRgbStr(colors[5]!))
    // 原地合并 common 区块：hover 用略亮档、pressed 用略暗档，保持主题层次；
    // info 同步主色档，让"确定"类弹窗按钮与图标跟随主题绿，避免出现突兀的默认蓝
    const common = naiveThemeOverrides.value.common || {}
    Object.assign(common, {
      primaryColor: colors[5],
      primaryColorHover: colors[4],
      primaryColorSuppl: colors[4],
      primaryColorPressed: colors[6],
      infoColor: colors[5],
    })
    naiveThemeOverrides.value.common = common
  }

  // setup store 须返回全部状态（DevTools、持久化插件、$state 都依赖完整状态清单）
  return {
    collapsed,
    isDark,
    primaryColor,
    naiveThemeOverrides,
    switchCollapsed,
    setCollapsed,
    toggleDark,
    setPrimaryColor,
    setThemeColor,
  }
}, {
  persist: {
    pick: [...persistedKeys],
    storage: sessionStorage,
  } as PersistenceOptions,
})
