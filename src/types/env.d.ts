/// <reference types="vite/client" />

// 项目自定义 .env 变量的类型补充：env 值全是字符串，布尔语义的变量需调用方自行判 'true'/'false'
interface ImportMetaEnv {
  /** 页面标题 */
  readonly VITE_TITLE: string
  /** 是否使用 hash 路由（'true' | 'false'） */
  readonly VITE_USE_HASH: string
  /** 部署的资源公共路径 */
  readonly VITE_PUBLIC_PATH: string
  /** axios 请求基础路径（开发走 proxy，生产指向后端或 mock） */
  readonly VITE_AXIOS_BASE_URL: string
  /** 开发环境接口代理目标 */
  readonly VITE_PROXY_TARGET: string
  /** 是否启用 mock 适配器（'true' | 'false'）：true 时请求由内存 mock 路由表应答 */
  readonly VITE_USE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
