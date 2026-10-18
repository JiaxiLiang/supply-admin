import type { RouteBtn } from '@/types/models'

// 扩展 vue-router 的 RouteMeta，承载布局、缓存、菜单渲染等前端附加信息
declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题（用于 document.title 与菜单 label） */
    title?: string
    /** 是否启用 keep-alive 页面缓存 */
    keepAlive?: boolean
    /** 页面使用的布局（目前仅 empty 整屏布局一种显式取值，其余页面走通用布局） */
    layout?: 'empty'
    /** 菜单图标 class（unocss 图标，如 'i-fe:xxx?mask'） */
    icon?: string
    /** 菜单树中的父级 key（构建菜单树用） */
    parentKey?: string | null
    /** 页面下的按钮级权限（v-permission 指令的数据源） */
    btns?: RouteBtn[]
  }
}

export {}
