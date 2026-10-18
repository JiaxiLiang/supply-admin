// mock 总装（单文件极致版）：axios 自定义适配器，替换「网络」这一层——请求不落网，
// 由路由表在内存中应答，拦截器/token 注入/错误提示全链路与真实后端一致。
// 黑盒说明：前端只依赖 src/api + src/types 的接口契约，本文件按契约返回最简演示数据；
// 接真实后端时把 .env 的 VITE_USE_MOCK 改为 false 即整体旁路，无需阅读本文件。
// 开关：VITE_USE_MOCK === 'true' 时启用（getMockAdapterConfig 返回 undefined 即零侵入）
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { PermissionItem, Product, Quotation } from '@/types/models'
import dayjs from 'dayjs'
import avatarSale from '@/assets/images/avatar-sale.svg'
import avatarAdmin from '@/assets/images/avatar.svg'
import productCoat from '@/assets/images/product-coat.svg'
import productDress from '@/assets/images/product-dress.svg'
import productPants from '@/assets/images/product-pants.svg'

// ── 基座：业务错误 / 请求上下文 / 路径匹配 / mock token（无签名的演示身份） ──

class MockError extends Error {
  constructor(public code: number, message: string) {
    super(message)
  }
}

interface MockCtx {
  auth: { uid: number, username: string, roleCode: string } | null
  query: Record<string, string>
  body: Record<string, unknown>
  pathParams: string[]
}

interface MockRoute {
  method: 'get' | 'post' | 'patch' | 'delete'
  path: string
  handler: (ctx: MockCtx) => unknown
}

function matchPath(pattern: string, pathname: string): string[] | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length)
    return null
  const captured: string[] = []
  for (let i = 0; i < patternParts.length; i++) {
    const expected = patternParts[i]!
    const actual = pathParts[i]!
    if (expected.startsWith(':'))
      captured.push(actual)
    else if (expected !== actual)
      return null
  }
  return captured
}

function mint(auth: MockCtx['auth']) {
  return `mock.${btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(auth)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`
}

function parseAuth(header: unknown): MockCtx['auth'] {
  const raw = Array.isArray(header) ? header[0] : header
  const token = typeof raw === 'string' ? raw.replace(/^bearer\s/i, '').trim() : ''
  if (!token.startsWith('mock.'))
    return null
  try {
    const auth = JSON.parse(atob(token.slice(5).replace(/-/g, '+').replace(/_/g, '/')))
    return auth && typeof auth === 'object' && 'uid' in auth ? auth as MockCtx['auth'] : null
  }
  catch {
    return null
  }
}

// ── 种子数据：演示用内存库，刷新页面即重置 ──

const ROLES = [
  { id: 1, name: '超级管理员', code: 'SUPER_ADMIN', enable: true },
  { id: 2, name: '业务员', code: 'SALESMAN', enable: true },
]

interface MockUser {
  id: number
  username: string
  password: string
  nickName: string
  avatar?: string
  roles: { id: number, code: string }[]
}

const USERS: MockUser[] = [
  { id: 1, username: 'admin', password: '123456', nickName: '梁管理', avatar: avatarAdmin, roles: [{ id: 1, code: 'SUPER_ADMIN' }, { id: 2, code: 'SALESMAN' }] },
  { id: 2, username: 'sale', password: '123456', nickName: '张晓雨', avatar: avatarSale, roles: [{ id: 2, code: 'SALESMAN' }] },
]

// 权限树：登录后动态路由/菜单/按钮权限的唯一数据源，节点结构不可精简
const TREE: PermissionItem[] = [
  {
    code: 'BizCenter',
    name: '业务中心',
    type: 'MENU',
    icon: 'i-fe:briefcase',
    order: 0,
    enable: true,
    show: true,
    children: [
      {
        code: 'ProductMgt',
        name: '商品管理',
        type: 'MENU',
        path: '/prod/product',
        component: '/src/views/prod/product/index.vue',
        icon: 'i-fe:box',
        order: 1,
        enable: true,
        show: true,
        keepAlive: true,
        children: [{ code: 'AddProduct', name: '新增商品', type: 'BUTTON', order: 1, enable: true }],
      },
      {
        code: 'QuotationMgt',
        name: '报价单管理',
        type: 'MENU',
        path: '/sale/quotation',
        component: '/src/views/sale/quotation/index.vue',
        icon: 'i-fe:file-text',
        order: 2,
        enable: true,
        show: true,
        keepAlive: true,
        children: [
          { code: 'AddQuotation', name: '新增报价单', type: 'BUTTON', order: 1, enable: true },
          { code: 'SendQuotation', name: '发送报价单', type: 'BUTTON', order: 2, enable: true },
          { code: 'ConfirmQuotation', name: '确认报价单', type: 'BUTTON', order: 3, enable: true },
          { code: 'VoidQuotation', name: '作废报价单', type: 'BUTTON', order: 4, enable: true },
          { code: 'QuotationDetail', name: '报价单详情', type: 'MENU', path: '/sale/quotation/detail', component: '/src/views/sale/quotation/detail.vue', order: 3, enable: true, show: false },
          { code: 'QuotationPrint', name: 'PI打印', type: 'MENU', path: '/sale/quotation/print', component: '/src/views/sale/quotation/print.vue', layout: 'empty', order: 4, enable: true, show: false },
        ],
      },
    ],
  },
  {
    code: 'SysMgt',
    name: '系统管理',
    type: 'MENU',
    path: '',
    icon: 'i-fe:grid',
    order: 97,
    enable: true,
    show: true,
    children: [
      {
        code: 'RoleMgt',
        name: '角色管理',
        type: 'MENU',
        path: '/pms/role',
        component: '/src/views/pms/role/index.vue',
        icon: 'i-fe:user-check',
        order: 2,
        enable: true,
        show: true,
        children: [{ code: 'RoleUser', name: '分配用户', type: 'MENU', path: '/pms/role/user/:roleId', component: '/src/views/pms/role/role-user.vue', order: 1, enable: true, show: false }],
      },
      {
        code: 'UserMgt',
        name: '用户管理',
        type: 'MENU',
        path: '/pms/user',
        component: '/src/views/pms/user/index.vue',
        icon: 'i-fe:user',
        order: 3,
        enable: true,
        show: true,
        keepAlive: true,
        children: [
          { code: 'AddUser', name: '创建新用户', type: 'BUTTON', order: 1, enable: true },
          { code: 'SuperAdmin', name: '超管专属', type: 'BUTTON', order: 2, enable: true },
        ],
      },
    ],
  },
  { code: 'Resource_Mgt', name: '资源管理', type: 'MENU', path: '/pms/resource', component: '/src/views/pms/resource/index.vue', icon: 'i-fe:list', order: 96, enable: true, show: true },
]

function assignIds(items: PermissionItem[], startId: number): PermissionItem[] {
  let seq = startId
  const walk = (nodes: PermissionItem[], parentId: number | null): PermissionItem[] =>
    nodes.map(item => ({ ...item, id: ++seq, parentId, children: item.children ? walk(item.children, seq) : undefined }))
  return walk(items, null)
}

const ADMIN_TREE = assignIds(TREE, 200)
const SALE_TREE = assignIds(TREE, 100)
const ALL_NODES = [ADMIN_TREE, SALE_TREE].flat(9)

const PRODUCTS: Product[] = [
  { id: 1, styleNo: 'CT-8001', title: '法式泡泡袖连衣裙', category: '连衣裙', enable: true, image: productDress, createTime: '2026-09-02 10:24:00', skus: [{ id: 1, color: '黑色', size: 'M', cost: 5900 }, { id: 2, color: '米白', size: 'L', cost: 6300 }] },
  { id: 2, styleNo: 'CT-8040', title: '羊毛混纺大衣', category: '上衣', enable: false, image: productCoat, createTime: '2026-10-08 11:30:00', skus: [{ id: 3, color: '驼色', size: 'M', cost: 16300 }] },
  { id: 3, styleNo: 'CT-8056', title: '束脚休闲卫裤', category: '裤装', enable: true, image: productPants, createTime: '2026-10-12 15:48:00', skus: [{ id: 4, color: '灰色', size: 'M', cost: 4600 }, { id: 5, color: '黑色', size: 'XL', cost: 4800 }] },
]

const QUOTATIONS: Quotation[] = [
  {
    id: 1,
    quotationNo: 'QT-20261012-001',
    customerName: 'Aurora Trading LLC',
    currency: 'USD',
    exchangeRate: 7.24,
    tradeTerm: 'FOB',
    validUntil: '2026-11-30',
    remark: '',
    status: 'sent',
    createdBy: 2,
    creatorName: '张晓雨',
    createTime: '2026-10-12 10:05:00',
    items: [{ id: 1, productId: 3, skuId: 4, styleNo: 'CT-8056', title: '束脚休闲卫裤', color: '灰色', size: 'M', cost: 4600, unitPrice: 680, quantity: 1200 }],
  },
  {
    id: 2,
    quotationNo: 'QT-20261015-003',
    customerName: 'Madison Ave Boutique',
    currency: 'GBP',
    exchangeRate: 9.42,
    tradeTerm: 'DDP',
    validUntil: '2026-10-31',
    remark: '客户已回签 PI',
    status: 'confirmed',
    createdBy: 1,
    creatorName: '梁管理',
    createTime: '2026-10-15 09:12:00',
    items: [{ id: 2, productId: 1, skuId: 2, styleNo: 'CT-8001', title: '法式泡泡袖连衣裙', color: '米白', size: 'L', cost: 6300, unitPrice: 1380, quantity: 800 }],
  },
]

// ── 通用小件 ──

let seq = 100
const nid = () => ++seq
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const paginate = <T>(list: T[], pageNo = 1, pageSize = 10) => ({ pageData: list.slice((pageNo - 1) * pageSize, pageNo * pageSize), total: list.length })
const toRoles = (ids: number[]) => ROLES.filter(role => ids.includes(role.id))
function requireUser(ctx: MockCtx) {
  const user = USERS.find(candidate => candidate.id === ctx.auth?.uid)
  if (!user)
    throw new MockError(401, '登录已过期')
  return user
}
function must<T extends { id?: number }>(list: T[], id: number): T {
  const item = list.find(candidate => candidate.id === id)
  if (!item)
    throw new MockError(40404, '数据不存在或已删除')
  return item
}

let captcha = ''
function CAPTCHA_SVG(code: string) {
  return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" viewBox="0 0 80 40"><rect width="80" height="40" fill="#f7f7f7"/><text x="40" y="27" font-size="22" font-family="monospace" fill="#23C891" text-anchor="middle" letter-spacing="4">${code}</text></svg>`)}`
}

// ── 路由表：契约与视图/api 层一致，全部为最简内存实现 ──

const routes: MockRoute[] = [
  // 认证与身份
  {
    method: 'post',
    path: '/auth/login',
    handler({ body }) {
      const user = USERS.find(candidate => candidate.username === body.username && candidate.password === body.password)
      if (!user)
        throw new MockError(10001, '用户名或密码错误')
      if (body.isQuick !== true && body.captcha !== captcha)
        throw new MockError(10003, '验证码错误')
      return { accessToken: mint({ uid: user.id, username: user.username, roleCode: user.roles[0]!.code! }) }
    },
  },
  {
    method: 'get',
    path: '/auth/captcha',
    handler() {
      captcha = String(Math.floor(1000 + Math.random() * 9000))
      return CAPTCHA_SVG(captcha)
    },
  },
  {
    method: 'get',
    path: '/auth/refresh/token',
    handler(ctx) {
      const user = requireUser(ctx)
      return { accessToken: mint({ uid: user.id, username: user.username, roleCode: ctx.auth?.roleCode ?? '' }) }
    },
  },
  { method: 'post', path: '/auth/logout', handler: () => true },
  {
    method: 'post',
    path: '/auth/current-role/switch/:code',
    handler(ctx) {
      const user = requireUser(ctx)
      const target = user.roles.find(role => role.code === ctx.pathParams[0])
      if (!target)
        throw new MockError(10004, '该账号不包含此角色')
      return { accessToken: mint({ uid: user.id, username: user.username, roleCode: target.code! }) }
    },
  },
  {
    method: 'get',
    path: '/user/detail',
    handler(ctx) {
      const user = requireUser(ctx)
      const currentRole = toRoles([user.roles.find(role => role.code === ctx.auth?.roleCode)?.id ?? 0])[0]
      if (!currentRole)
        throw new MockError(401, '登录已过期')
      return {
        id: user.id,
        username: user.username,
        roles: toRoles(user.roles.map(role => role.id)),
        currentRole,
        profile: { avatar: user.avatar, nickName: user.nickName, gender: 1, address: '上海市浦东新区', email: `${user.username}@demo.com` },
      }
    },
  },
  {
    method: 'get',
    path: '/role/permissions/tree',
    handler(ctx) {
      return clone(ctx.auth?.roleCode === 'SUPER_ADMIN' ? ADMIN_TREE : SALE_TREE)
    },
  },
  {
    method: 'get',
    path: '/permission/menu/validate',
    handler(ctx) {
      return ALL_NODES.some(node => node.path === ctx.query.path)
    },
  },

  // 商品
  {
    method: 'get',
    path: '/product',
    handler(ctx) {
      const { keyword, category, enable, pageNo, pageSize } = ctx.query
      const rows = PRODUCTS
        .filter(product => !keyword || product.styleNo.includes(keyword) || product.title.includes(keyword))
        .filter(product => !category || product.category === category)
        .filter(product => enable === undefined || product.enable === (enable === '1'))
        .map(product => ({ ...product, skuCount: product.skus.length, costMin: Math.min(...product.skus.map(sku => sku.cost)), costMax: Math.max(...product.skus.map(sku => sku.cost)) }))
      return paginate(rows, Number(pageNo), Number(pageSize))
    },
  },
  {
    method: 'get',
    path: '/product/sku/options',
    handler(ctx) {
      const { keyword, category } = ctx.query
      return PRODUCTS
        .filter(product => product.enable)
        .filter(product => !keyword || product.styleNo.includes(keyword) || product.title.includes(keyword))
        .filter(product => !category || product.category === category)
        .flatMap(product => product.skus.map(sku => ({ productId: product.id, skuId: sku.id ?? 0, styleNo: product.styleNo, title: product.title, category: product.category, color: sku.color, size: sku.size, cost: sku.cost })))
    },
  },
  {
    method: 'post',
    path: '/product',
    handler(ctx) {
      PRODUCTS.unshift({ ...ctx.body, id: nid(), createTime: now() } as Product)
      return true
    },
  },
  {
    method: 'patch',
    path: '/product/:id',
    handler(ctx) {
      Object.assign(must(PRODUCTS, Number(ctx.pathParams[0])), ctx.body)
      return true
    },
  },
  {
    method: 'delete',
    path: '/product/:id',
    handler(ctx) {
      PRODUCTS.splice(PRODUCTS.indexOf(must(PRODUCTS, Number(ctx.pathParams[0]))), 1)
      return true
    },
  },

  // 报价单：SUPER_ADMIN 见全量，其余角色仅本人创建（行级数据权限演示）
  {
    method: 'get',
    path: '/quotation',
    handler(ctx) {
      const { keyword, status, currency, pageNo, pageSize } = ctx.query
      const scoped = QUOTATIONS.filter(quotation => ctx.auth?.roleCode === 'SUPER_ADMIN' || quotation.createdBy === ctx.auth?.uid)
        .filter(quotation => !keyword || quotation.quotationNo.includes(keyword) || quotation.customerName.includes(keyword))
        .filter(quotation => !status || quotation.status === status)
        .filter(quotation => !currency || quotation.currency === currency)
      const rows = scoped.map((quotation) => {
        const { items, ...rest } = quotation
        const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        const totalAmountCny = Math.round(totalAmount * quotation.exchangeRate)
        const totalCostCny = items.reduce((sum, item) => sum + item.cost * item.quantity, 0)
        return { ...rest, totalAmount, grossMargin: totalAmountCny === 0 ? null : (totalAmountCny - totalCostCny) / totalAmountCny }
      })
      return paginate(rows, Number(pageNo), Number(pageSize))
    },
  },
  {
    method: 'get',
    path: '/quotation/:id',
    handler: ctx => QUOTATIONS.find(quotation => quotation.id === Number(ctx.pathParams[0])),
  },
  {
    method: 'post',
    path: '/quotation',
    handler(ctx) {
      const user = requireUser(ctx)
      const quotation = {
        id: nid(),
        quotationNo: `QT-${dayjs().format('YYYYMMDD')}-${String(seq % 1000).padStart(3, '0')}`,
        customerName: String(ctx.body.customerName ?? ''),
        currency: ctx.body.currency,
        exchangeRate: Number(ctx.body.exchangeRate ?? 1),
        tradeTerm: ctx.body.tradeTerm,
        validUntil: String(ctx.body.validUntil ?? ''),
        remark: String(ctx.body.remark ?? ''),
        status: 'draft',
        createdBy: user.id,
        creatorName: user.nickName,
        createTime: now(),
        items: (Array.isArray(ctx.body.items) ? ctx.body.items : []).map((item: any) => ({ ...item, id: nid() })),
      } as Quotation
      QUOTATIONS.unshift(quotation)
      return quotation
    },
  },
  {
    method: 'patch',
    path: '/quotation/:id',
    handler(ctx) {
      Object.assign(must(QUOTATIONS, Number(ctx.pathParams[0])), ctx.body)
      return true
    },
  },
  {
    method: 'post',
    path: '/quotation/:id/:action',
    handler(ctx) {
      const status = { send: 'sent', confirm: 'confirmed', void: 'void' }[ctx.pathParams[1]!]
      must(QUOTATIONS, Number(ctx.pathParams[0])).status = status as Quotation['status']
      return true
    },
  },
  {
    method: 'delete',
    path: '/quotation/:id',
    handler(ctx) {
      QUOTATIONS.splice(QUOTATIONS.indexOf(must(QUOTATIONS, Number(ctx.pathParams[0]))), 1)
      return true
    },
  },

  // 系统管理：用户 / 角色 / 权限资源
  {
    method: 'get',
    path: '/user',
    handler(ctx) {
      const { username, pageNo, pageSize } = ctx.query
      const rows = USERS
        .filter(user => !username || user.username.includes(username))
        .map(user => ({ id: user.id, username: user.username, nickName: user.nickName, avatar: user.avatar, gender: 1, email: `${user.username}@demo.com`, address: '上海市浦东新区', enable: true, createTime: '2026-09-01 09:00:00', roles: toRoles(user.roles.map(role => role.id)), currentRole: toRoles(user.roles.map(role => role.id))[0] }))
      return paginate(rows, Number(pageNo), Number(pageSize))
    },
  },
  {
    method: 'post',
    path: '/user',
    handler(ctx) {
      const roleIds = Array.isArray(ctx.body.roleIds) ? ctx.body.roleIds : [2]
      USERS.push({
        id: nid(),
        username: String(ctx.body.username ?? ''),
        password: String(ctx.body.password ?? '123456'),
        nickName: String(ctx.body.username ?? ''),
        roles: toRoles(roleIds as number[]).map(role => ({ id: role.id, code: role.code! })),
      })
      return true
    },
  },
  {
    method: 'patch',
    path: '/user/password/reset/:id',
    handler(ctx) {
      must(USERS, Number(ctx.pathParams[0])).password = String(ctx.body.password ?? '123456')
      return true
    },
  },
  {
    method: 'patch',
    path: '/user/:id',
    handler(ctx) {
      const user = must(USERS, Number(ctx.pathParams[0]))
      if (Array.isArray(ctx.body.roleIds))
        user.roles = toRoles(ctx.body.roleIds as number[]).map(role => ({ id: role.id, code: role.code! }))
      return true
    },
  },
  {
    method: 'delete',
    path: '/user/:id',
    handler(ctx) {
      USERS.splice(USERS.indexOf(must(USERS, Number(ctx.pathParams[0]))), 1)
      return true
    },
  },
  {
    method: 'get',
    path: '/role/page',
    handler(ctx) {
      const { enable, pageNo, pageSize } = ctx.query
      // 状态筛选仅在显式传入时生效（启用 1 / 停用 0），未传则返回全量
      const rows = ROLES.filter(role => enable === undefined || role.enable === (enable === '1'))
      return paginate(rows, Number(pageNo), Number(pageSize))
    },
  },
  { method: 'get', path: '/role', handler: () => ROLES.filter(role => role.enable) },
  {
    method: 'post',
    path: '/role',
    handler(ctx) {
      ROLES.push({ id: nid(), name: String(ctx.body.name ?? ''), code: String(ctx.body.code ?? ''), enable: ctx.body.enable !== false })
      return true
    },
  },
  {
    method: 'patch',
    path: '/role/:id',
    handler(ctx) {
      Object.assign(must(ROLES, Number(ctx.pathParams[0])), ctx.body)
      return true
    },
  },
  {
    method: 'delete',
    path: '/role/:id',
    handler(ctx) {
      ROLES.splice(ROLES.indexOf(must(ROLES, Number(ctx.pathParams[0]))), 1)
      return true
    },
  },
  {
    method: 'patch',
    path: '/role/users/add/:roleId',
    handler(ctx) {
      const roleId = Number(ctx.pathParams[0])
      for (const userId of ctx.body.userIds as number[]) {
        const user = must(USERS, userId)
        if (!user.roles.some(role => role.id === roleId))
          user.roles.push({ id: roleId, code: ROLES.find(role => role.id === roleId)?.code ?? '' })
      }
      return true
    },
  },
  {
    method: 'patch',
    path: '/role/users/remove/:roleId',
    handler(ctx) {
      const roleId = Number(ctx.pathParams[0])
      for (const userId of ctx.body.userIds as number[]) {
        const user = must(USERS, userId)
        user.roles = user.roles.filter(role => role.id !== roleId)
      }
      return true
    },
  },
  { method: 'get', path: '/permission/tree', handler: () => clone(ADMIN_TREE) },
  { method: 'get', path: '/permission/menu/tree', handler: () => clone(ADMIN_TREE) },
  {
    method: 'get',
    path: '/permission/button/:parentId',
    handler: ctx => clone(ALL_NODES.filter(node => node.type === 'BUTTON' && node.parentId === Number(ctx.pathParams[0]))),
  },
  {
    method: 'post',
    path: '/permission',
    handler(ctx) {
      const parentId = ctx.body.parentId as number | null
      const node = { ...ctx.body, id: nid() } as PermissionItem
      const parent = parentId ? ALL_NODES.find(item => item.id === parentId) : null
      if (parent)
        parent.children = [...(parent.children ?? []), node]
      else
        ADMIN_TREE.push(node)
      return true
    },
  },
  {
    method: 'patch',
    path: '/permission/:id',
    handler(ctx) {
      Object.assign(must(ALL_NODES, Number(ctx.pathParams[0])), ctx.body)
      return true
    },
  },
  {
    method: 'delete',
    path: '/permission/:id',
    handler(ctx) {
      const id = Number(ctx.pathParams[0])
      const node = must(ALL_NODES, id)
      const container = ADMIN_TREE.includes(node)
        ? ADMIN_TREE
        : ALL_NODES.find(item => item.children?.some(child => child.id === id))!.children!
      container.splice(container.indexOf(node), 1)
      return true
    },
  },
]

// ── 适配器：延迟 → 解析请求 → 查表应答（统一 ApiResult 形状，code 0 为成功） ──

const mockAdapter: AxiosAdapter = async (config) => {
  await new Promise(resolve => setTimeout(resolve, 150))

  const method = (config.method ?? 'get').toLowerCase() as MockRoute['method']
  const [pathname = '', search = ''] = (config.url ?? '').split('?')
  const query = {
    ...Object.fromEntries(new URLSearchParams(search)),
    // params 里未选中的筛选项是 undefined/null，必须跳过而非字符串化成 'undefined' 污染过滤
    ...Object.fromEntries(Object.entries(config.params ?? {}).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])),
  }
  let body: Record<string, unknown> = {}
  if (typeof config.data === 'string' && config.data !== '') {
    try {
      body = JSON.parse(config.data)
    }
    catch {}
  }

  const route = routes.find(candidate => candidate.method === method && matchPath(candidate.path, pathname) !== null)
  if (!route)
    return respond(config, { code: 40404, message: `mock 未实现该接口：${method.toUpperCase()} ${pathname}` })

  const ctx: MockCtx = {
    auth: parseAuth(config.headers?.Authorization),
    query,
    body,
    pathParams: matchPath(route.path, pathname) ?? [],
  }
  try {
    return respond(config, { code: 0, message: 'ok', data: await route.handler(ctx) })
  }
  catch (error) {
    if (error instanceof MockError)
      return respond(config, { code: error.code, message: error.message })
    throw error
  }
}

function respond(config: InternalAxiosRequestConfig, data: Record<string, unknown>): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, config }
}

export function getMockAdapterConfig(): AxiosRequestConfig | undefined {
  if (import.meta.env.VITE_USE_MOCK !== 'true')
    return undefined
  return { adapter: mockAdapter }
}
