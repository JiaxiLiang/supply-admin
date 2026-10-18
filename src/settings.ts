import type { GlobalThemeOverrides } from 'naive-ui'

/** 全站唯一定色处：arco 色板与 naive 主题覆盖均从这里单源取值 */
export const defaultPrimaryColor = '#23C891'

/** 静态首屏只声明主色与圆角，运行时由 appStore.setThemeColor 按色板覆写 */
export const naiveThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: `${defaultPrimaryColor}FF`,
    borderRadius: '8px',
  },
}
