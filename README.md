# 跨境供应链管理系统

📐 **[项目架构图全集（14 张 · 基于源码重绘）](docs/arch-overview.md)** · [整体分层架构图（可视化 HTML）](docs/architecture.html) · [Mermaid 源码](docs/architecture.md) · [CRUD 模块架构图](docs/module-architecture.md)

## 业务模块（跨境电商供应链演示）

在权限系统底座上新增两个业务模块，定位为「跨境电商供应链管理系统（Web 管理端）」：

| 模块       | 路由              | 能力                                                                                                                                                                                                  |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 商品管理   | `/prod/product`   | SPU 列表（筛选同步 URL / 上架开关 / 导出）、编辑弹窗内以 **规格矩阵**（颜色 × 尺码笛卡尔积）维护 SKU，成本以「分」存储                                                                                |
| 报价单管理 | `/sale/quotation` | 报价台账（状态标签/多币种/导出）、详情页（选品带入快照、行内改价、**毛利实时联动**、低于成本整行红字）、**状态机**（草稿→已发送→已确认/已作废，发送后整单只读）、**PI 打印**（A4 形式发票，可存 PDF） |

**演示账号**（mock 模式下双账号演示行级数据权限）：

| 账号    | 密码     | 角色                           | 数据范围           |
| ------- | -------- | ------------------------------ | ------------------ |
| `admin` | `123456` | 超级管理员（可切换业务员身份） | 全部报价单         |
| `sale`  | `123456` | 业务员                         | 仅本人创建的报价单 |

**mock 层**：`VITE_USE_MOCK='true'`（默认开）时请求由内存 mock 适配器应答（`src/mock/`，覆盖登录/权限树/两个业务模块/系统管理接口），拦截器链路不变；改为 `'false'` 即恢复真实后端（NestJS）。业务扩展方式：**新增页面零路由代码**——路由与菜单由权限数据驱动（`src/mock/index.ts` 内按角色下发的权限树，路由 name 即权限 code），页面级状态不进 Pinia（与既有 CRUD 页一致，页面自持 + useRequest）。

```
跨境供应链管理系统
├─ .editorconfig
├─ .env
├─ .env.development
├─ .env.production
├─ .npmrc
├─ build
│  ├─ index.ts
│  └─ plugin-isme
│     ├─ icons.ts
│     ├─ index.ts
│     └─ page-pathes.ts
├─ eslint.config.ts
├─ index.html
├─ LICENSE
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ public
│  └─ favicon.svg
├─ src
│  ├─ api
│  │  └─ index.ts（含 createCrudApi<T, Q> CRUD 接口工厂）
│  ├─ App.vue
│  ├─ assets
│  │  ├─ icons
│  │  │  ├─ dynamic-icons.ts
│  │  │  ├─ feather（svg 图标集）
│  │  │  └─ isme（svg 图标集）
│  │  └─ images
│  ├─ components
│  │  ├─ common
│  │  │  ├─ AppCard.vue
│  │  │  ├─ AppPage.vue
│  │  │  ├─ CommonPage.vue
│  │  │  ├─ index.ts
│  │  │  ├─ TheFooter.vue
│  │  │  ├─ TheLogo.vue
│  │  │  ├─ ThemeSetting.vue
│  │  │  └─ ToggleTheme.vue
│  │  ├─ index.ts
│  │  └─ me
│  │     ├─ crud
│  │     │  ├─ index.vue（MeCrud 泛型组件 generic="T, Q"）
│  │     │  └─ QueryItem.vue
│  │     ├─ index.ts
│  │     └─ modal
│  │        ├─ index.vue
│  │        └─ utils.ts
│  ├─ composables
│  │  ├─ index.ts
│  │  ├─ useCrud.ts（泛型 useCrud<T> + 类型守卫收窄）
│  │  ├─ useEnableRow.ts（表格行状态开关）
│  │  ├─ useForm.ts
│  │  ├─ useModal.ts
│  │  └─ useUserInfoColumns.ts（用户两页共享列）
│  ├─ directives
│  │  └─ index.ts
│  ├─ layouts
│  │  ├─ components
│  │  │  ├─ BreadCrumb.vue
│  │  │  ├─ Fullscreen.vue
│  │  │  ├─ index.ts
│  │  │  ├─ MenuCollapse.vue
│  │  │  ├─ RoleSelect.vue
│  │  │  ├─ SideLogo.vue
│  │  │  ├─ SideMenu.vue
│  │  │  ├─ tab
│  │  │  │  ├─ ContextMenu.vue
│  │  │  │  └─ index.vue
│  │  │  └─ UserAvatar.vue
│  │  ├─ empty
│  │  │  └─ index.vue
│  │  ├─ normal
│  │  │  ├─ header
│  │  │  │  └─ index.vue
│  │  │  ├─ index.vue
│  │  │  └─ sidebar
│  │  │     └─ index.vue
│  ├─ main.ts
│  ├─ mock（mock 层单文件总装：axios 适配器 + 内存路由表 + 按角色权限树，VITE_USE_MOCK 开关）
│  │  └─ index.ts（路径匹配 → MockCtx 应答：认证 / 权限树 / 商品选品 / 报价单状态机守卫 / 系统管理）
│  ├─ router
│  │  ├─ basic-routes.ts（satisfies RouteRecordRaw[]）
│  │  ├─ guards
│  │  │  ├─ index.ts
│  │  │  ├─ page-loading-guard.ts
│  │  │  ├─ page-title-guard.ts
│  │  │  ├─ permission-guard.ts
│  │  │  └─ tab-guard.ts
│  │  └─ index.ts
│  ├─ settings.ts（LAYOUT_MODES as const → LayoutMode 派生 + toLayoutMode 归一）
│  ├─ store
│  │  ├─ helper.ts
│  │  ├─ index.ts
│  │  └─ modules
│  │     ├─ app.ts
│  │     ├─ auth.ts
│  │     ├─ index.ts
│  │     ├─ permission.ts
│  │     ├─ router.ts
│  │     ├─ tab.ts
│  │     └─ user.ts
│  ├─ styles
│  │  ├─ global.css
│  │  └─ reset.css
│  ├─ types
│  │  ├─ arco-design-color.d.ts
│  │  ├─ env.d.ts
│  │  ├─ global.d.ts
│  │  ├─ icons.ts（模板字面量类型 i-${string}）
│  │  ├─ me-components.ts
│  │  ├─ models.ts（实体 + 查询契约唯一来源）
│  │  ├─ router.d.ts
│  │  └─ virtual-modules.d.ts
│  ├─ utils
│  │  ├─ common.ts
│  │  ├─ http
│  │  │  ├─ helpers.ts
│  │  │  ├─ index.ts（HttpClient/ApiResult + setupHttpAuth 注入点）
│  │  │  └─ interceptors.ts（全链路 unknown 收窄）
│  │  ├─ index.ts
│  │  ├─ is.ts
│  │  ├─ money.ts（金额纯工具：分↔元、汇率乘法、多币种格式化、毛利率）
│  │  ├─ naiveTools.ts
│  │  └─ storage
│  │     ├─ index.ts
│  │     └─ storage.ts（get 函数重载 + StoredEnvelope）
│  └─ views
│     ├─ demo
│     │  └─ upload
│     │     └─ index.vue
│     ├─ error-page
│     │  ├─ 403.vue
│     │  └─ 404.vue
│     ├─ home
│     │  └─ index.vue
│     ├─ login
│     │  ├─ api.ts
│     │  └─ index.vue
│     ├─ prod
│     │  └─ product
│     │     ├─ api.ts
│     │     ├─ components
│     │     │  └─ SpecMatrix.vue（规格矩阵：颜色 × 尺码笛卡尔积，已录成本保留）
│     │     ├─ index.vue
│     │     └─ model.ts（表格行/列扩展类型 + buildSkuMatrix 纯函数）
│     ├─ pms
│     │  ├─ resource
│     │  │  ├─ api.ts
│     │  │  ├─ components
│     │  │  │  ├─ MenuTree.vue
│     │  │  │  ├─ QuestionLabel.vue
│     │  │  │  └─ ResAddOrEdit.vue
│     │  │  └─ index.vue
│     │  ├─ role
│     │  │  ├─ api.ts
│     │  │  ├─ index.vue
│     │  │  └─ role-user.vue
│     │  └─ user
│     │     ├─ api.ts
│     │     └─ index.vue
│     └─ sale
│        └─ quotation
│           ├─ api.ts
│           ├─ components
│           │  ├─ PiPrintTemplate.vue（A4 形式发票模板）
│           │  ├─ QuotationItemTable.vue（明细行编辑表格：行内改价/数量、低于成本红字）
│           │  └─ SkuPickerModal.vue（选品弹窗：SKU 维度勾选带入快照）
│           ├─ detail.vue（新建/详情共用：状态机门控 + 毛利实时联动）
│           ├─ index.vue（报价台账列表）
│           ├─ model.ts（状态机迁移表 + 金额聚合纯函数）
│           └─ print.vue（PI 打印页，empty 整屏布局）
├─ tsconfig.json（应用源码工程，strict 全开 + noUncheckedIndexedAccess）
├─ tsconfig.node.json（构建工具链工程：vite/uno/eslint/build）
└─ uno.config.ts
```

## TypeScript 说明

本项目为纯 TypeScript 项目（2026-10 完成 JS → TS 迁移并通过验收整改）。编译器强度：`strict` + `noUncheckedIndexedAccess` + `noImplicitOverride`；构建工具链（vite/uno/eslint/build）由 `tsconfig.node.json` 纳入同一 typecheck。

### 类型组织方式

| 位置                             | 内容                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/models.ts`            | 全项目唯一实体与契约定义处：`UserInfo`/`Role`/`PermissionItem` 等实体 + `PageParams`/`UserInfoQuery` 等查询契约（enable 数字契约在查询侧归一） |
| `src/types/global.d.ts`          | `window.$message/$dialog/$notification/$loadingBar` 全局声明（`WrappedMessage`/`WrappedDialog` 包装类型）                                      |
| `src/types/me-components.ts`     | `MeModal` 暴露契约（`ModalOptions`/`MeModalExposed`），useModal 与组件两端引用                                                                 |
| `src/types/router.d.ts`          | `vue-router` 的 `RouteMeta` 声明合并（title/layout/keepAlive/originPath/icon/parentKey/btns）                                                  |
| `src/types/icons.ts`             | 模板字面量类型 `` IconName = `i-${string}` ``，约束图标名以 `i-` 开头                                                                          |
| `src/types/virtual-modules.d.ts` | 自定义虚拟模块 `isme:icons`、`isme:page-pathes`                                                                                                |
| `src/types/env.d.ts`             | `.env` 环境变量类型                                                                                                                            |
| `src/utils/http/index.ts`        | `HttpClient`/`ApiResult`/`RequestConfig` + `setupHttpAuth` 注入点——响应拦截器改写了 axios 返回值形状，业务统一面向该接口                       |
| `src/api/index.ts`               | `createCrudApi<T, Q>` CRUD 工厂：四份 api 样板收敛为一处，Q 契约经 MeCrud 反向推断到页面查询框                                                 |
| `src/composables/useCrud.ts`     | 泛型 `useCrud<T>` + `MeCrud` 泛型组件（`generic="T, Q"`），页面列配置即获全链路类型推导                                                        |

### 常用命令

```bash
pnpm dev          # 启动开发服务器（默认 :3200）
pnpm typecheck    # 双工程类型检查（src + 构建工具链，strict 全开，0 错误为绿）
pnpm lint:fix     # eslint --fix（@antfu 配置 + 分层依赖方向机器化）
pnpm build        # 产物构建
```

### 分层依赖方向（eslint no-restricted-imports 机器化）

`utils ← api ← composables ← components ← views`，下层禁止反向引用上层；store 不引 UI；api 层不引 UI；views 之间禁止横向 import。规则固化在 `eslint.config.ts`，违规 import 在 lint 阶段直接报错。

### 质量验收口径

- 基线门禁：`pnpm typecheck`、`pnpm lint:fix`、`pnpm build` 三绿
- 功能验证：浏览器实走演示链路（登录 → 商品 → 报价 → 发送锁单 → 打印 PI，双账号数据隔离）
- 验收报告与过程记录为本地工作存档，不入库（`docs/` 仅保留架构文档）
- 纯逻辑（金额换算/规格矩阵/状态机）设计为无副作用纯函数，可随时以任意测试框架补测

### 已登记的类型豁免（第三方类型局限）

- `src/utils/http/index.ts`：`request = createAxios() as unknown as HttpClient`——axios 方法级泛型无法表达"响应拦截器改写响应体"这一运行时事实，以自封装 HttpClient 收口
- `src/main.ts`：`setupNaiveDiscreteApi` 的 configProviderProps——naive-ui `GlobalThemeOverrides` 与 `ConfigProviderProps['themeOverrides']` 深层型变不兼容（官方已知类型缺陷）
- `src/router/guards/permission-guard.ts`：`{ ...to, replace: true } as RouteLocationRaw`——vue-router 的 RouteLocationRaw 不接受 RouteLocationNormalized 展开（官方类型缺口）
