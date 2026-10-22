/**
 * 跨层共享的后端契约与前端实体模型（全项目实体唯一定义处）
 */
import type { VNode } from 'vue'

import type { RouteMeta } from 'vue-router'

/** 用户角色 */
export interface Role {
  id: number
  name: string
  /** 角色编码（如 SUPER_ADMIN，内置角色禁止编辑时依赖它判断） */
  code?: string
  enable?: boolean
}

/**
 * 前端实际使用的用户信息（由 store/helper.ts getUserInfo() 从后端原始数据重组而来）。
 * 注意 enable 在行数据上是 boolean，列表查询契约则是 0/1 数字，二者由 EnabledQuery 区分、不混用
 */
export interface UserInfo {
  id: number
  username: string
  avatar?: string
  nickName?: string
  /** 1 男 / 2 女 / 0 保密 */
  gender?: number
  address?: string
  email?: string
  /** 账号启用状态（用户页状态开关） */
  enable?: boolean
  /** 仅列表接口返回（详情接口不含），故可选 */
  createTime?: string
  roles: Role[]
  currentRole: Role
}

/** 权限树节点（后端权限/菜单数据，permission store 共用） */
export interface PermissionItem {
  /** 后端节点可能携带任意扩展字段，索引签名如实声明；已知字段仍单独声明以保留精确类型 */
  [key: string]: unknown
  /** 后端主键（资源管理页行数据有） */
  id?: number
  code: string
  name: string
  /** 节点类型：目录 / 菜单 / 按钮权限 */
  type: 'DIR' | 'MENU' | 'BUTTON'
  /** 父级节点 id（资源页新增下级菜单时使用） */
  parentId?: number | string | null
  icon?: string
  /** DIR/MENU 的路由路径；目录项（如系统管理组）为空串 */
  path?: string
  order?: number
  enable?: boolean
  /** 是否在菜单中显示 */
  show?: boolean
  /** 页面是否启用 keep-alive 缓存 */
  keepAlive?: boolean
  redirect?: string
  /** 路由显式布局：目前仅 'empty'（整屏页，如登录/打印），未设置走通用布局 */
  layout?: 'empty'
  /** 后端返回的组件路径字符串（如 '/src/views/prod/product/index.vue'），生成路由时才解析为组件 */
  component?: string
  children?: PermissionItem[]
}

/** 挂在 MENU 下的按钮权限节点（写入 RouteMeta.btns，供 v-permission 指令消费） */
export interface RouteBtn {
  code: string
  name: string
}

/** MeCrud 分页契约：后端分页返回 { pageData, total }，非分页接口直接返回数组 */
export interface PageResult<T = unknown> {
  pageData: T[]
  total: number
}

// 列表查询参数契约：查询侧类型与实体类型分离，二者不混用

/** 分页参数（pageNo/pageSize 由 MeCrud 组装进请求） */
export interface PageParams { pageNo?: number, pageSize?: number }

/** 状态字段的查询侧契约：列表过滤用 0/1 数字，与行数据的 boolean 开关区分 */
export interface EnabledQuery { enable?: 0 | 1 }

/** 通用启停筛选项（EnabledQuery 的选项词汇表）：用户/角色等列表的状态筛选共用 */
export const ENABLE_OPTIONS = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
] satisfies { label: string, value: 0 | 1 }[]

/**
 * 用户列表查询参数：实体过滤字段 + 分页组合；enable 从实体 Omit 后改用数字契约覆盖，
 * 索引签名声明查询参数本质是字符串键的宽松键袋（满足 MeCrud 泛型 Q 的约束）
 */
export type UserInfoQuery = Omit<Partial<UserInfo>, 'enable'> & EnabledQuery & PageParams & Record<string, unknown>

/** 角色列表查询参数（与用户查询同构） */
export type RoleQuery = Omit<Partial<Role>, 'enable'> & EnabledQuery & PageParams & Record<string, unknown>

/** 登录成功返回的 token 载荷（auth store 只消费 accessToken） */
export interface LoginToken {
  accessToken: string
}

/** 后端原始用户信息（个人资料嵌套在 profile 里），getUserInfo() 据此拍平重组为 UserInfo */
export interface RawUserInfo extends UserInfo {
  profile?: {
    avatar?: string
    nickName?: string
    gender?: number
    address?: string
    email?: string
  }
}

/**
 * 侧边栏菜单树节点（permission store getMenuItem 产出，直接绑定 naive-ui 的 n-menu）。
 * key 用 string 是因为路由 name 均为权限 code 等字符串，结构上与 MenuOption 兼容，模板绑定无需断言
 */
export interface MenuItem {
  label?: string
  key: string
  path?: string
  icon?: () => VNode
  order: number
  children?: MenuItem[]
}

/**
 * 权限 store 生成的动态路由记录：component 在 store 阶段仍是后端给的字符串路径，
 * 到路由守卫里才经 import.meta.glob 替换为真实懒加载组件。
 * 不从 RouteRecordRaw 派生，因为 Omit 作用在联合类型上会塌缩出错误的 redirect 类型
 */
export interface AccessRoute {
  /** 路由 name（权限 code，generateRoute 恒赋值） */
  name: string
  path?: string
  redirect?: string
  /** 路由显式布局：目前仅 'empty'（整屏页，如登录/打印），未设置走通用布局 */
  layout?: 'empty'
  /** store 阶段为字符串路径，守卫阶段替换为懒加载组件 */
  component?: unknown
  meta: RouteMeta
}

// ───────────────────────── 业务模块：商品（SPU/SKU）与报价单 ─────────────────────────
// 金额契约：全项目金额一律以最小货币单位整数（分）存储，展示经 utils/money 换算

/** 系统涉及的币种全集（成本恒为人民币；报价币种为其中的外币子集，见 QuotationCurrency） */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CNY'

/** 报价单可开的币种：外币子集，从币种全集排除人民币派生，新增币种只改 Currency 一处 */
export type QuotationCurrency = Exclude<Currency, 'CNY'>

/** 商品品类：字面量联合为唯一事实源，下拉选项由它 satisfies 校验（label=value 一致性编译期把关） */
export type ProductCategory = '上衣' | '裤装' | '连衣裙' | '配饰'

/** 品类下拉选项：商品页筛选、编辑弹窗与报价选品弹窗共用同一份（枚举词汇表全项目单一来源） */
export const CATEGORY_OPTIONS = [
  { label: '上衣', value: '上衣' },
  { label: '裤装', value: '裤装' },
  { label: '连衣裙', value: '连衣裙' },
  { label: '配饰', value: '配饰' },
] satisfies { label: string, value: ProductCategory }[]

/** SKU（规格）：颜色 × 尺码笛卡尔积的一行；cost 为成本价（人民币分），新增态 id 由服务端分配 */
export interface Sku {
  id?: number
  color: string
  size: string
  cost: number
}

/** 商品（SPU：款）：SKU 数与成本区间不入库，由列表接口按 SKU 集合聚合（见 ProductRow） */
export interface Product {
  id: number
  /** 商品主图 URL（列表主图列展示；可选，缺省显示占位图标） */
  image?: string
  styleNo: string
  title: string
  category: ProductCategory
  /** 上架状态 */
  enable: boolean
  skus: Sku[]
  createTime?: string
}

/** 商品列表行：SKU 数与成本区间为服务端聚合字段；无 SKU 的款两个区间字段为 null */
export type ProductRow = Product & { skuCount: number, costMin: number | null, costMax: number | null }

/** 商品列表查询契约：keyword 同时模糊匹配款号与标题 */
export type ProductQuery = {
  keyword?: string
  category?: ProductCategory
  enable?: 0 | 1
} & PageParams & Record<string, unknown>

/** 选品弹窗数据源：SKU 维度的跨商品可选项，由服务端拼装（报价选品按 SKU 带入快照） */
export interface SkuOption {
  productId: number
  skuId: number
  styleNo: string
  title: string
  category: ProductCategory
  color: string
  size: string
  /** 成本（人民币分），带入明细行快照并参与毛利联动 */
  cost: number
}

/** 贸易条款 */
export type TradeTerm = 'FOB' | 'CIF' | 'DDP'

/**
 * 报价单状态机：draft --send--> sent --confirm/void--> confirmed/void（终态）。
 * sent 及以后整单只读；迁移合法性由状态机表驱动（报价单模块 model.ts），
 * 服务端与前端各自独立校验（跨端不共享实现是有意解耦，与真实前后端关系一致）
 */
export type QuotationStatus = 'draft' | 'sent' | 'confirmed' | 'void'

/** 报价明细行：商品信息为下单时快照（只读固化），行内仅开放单价与数量编辑 */
export interface QuotationItem {
  id: number
  productId: number
  skuId: number
  /** ── 商品快照（只读） ── */
  styleNo: string
  title: string
  color: string
  size: string
  /** 成本快照（人民币分），低于成本报价的行由前端整行告警 */
  cost: number
  /** ── 可编辑字段 ── */
  /** 报价单价（报价币种最小单位，如美分） */
  unitPrice: number
  quantity: number
}

/** 报价单聚合根：金额不入库，总额与毛利率按明细 + 汇率实时计算（报价单模块 model.ts） */
export interface Quotation {
  id: number
  quotationNo: string
  customerName: string
  currency: QuotationCurrency
  /** 对人民币汇率：1 单位报价币种 = exchangeRate 元人民币 */
  exchangeRate: number
  tradeTerm: TradeTerm
  /** 有效期（YYYY-MM-DD） */
  validUntil: string
  remark?: string
  status: QuotationStatus
  items: QuotationItem[]
  /** 创建人 id（数据权限主体：业务员仅可见本人创建的报价单） */
  createdBy: number
  creatorName: string
  createTime: string
}

/** 报价单列表行：金额为服务端按明细聚合的快照，不携带明细数组 */
export type QuotationRow = Omit<Quotation, 'items'> & { totalAmount: number, grossMargin: number | null }

/** 报价单列表查询契约：keyword 同时模糊匹配单号与客户名 */
export type QuotationQuery = {
  keyword?: string
  status?: QuotationStatus
  currency?: QuotationCurrency
} & PageParams & Record<string, unknown>
