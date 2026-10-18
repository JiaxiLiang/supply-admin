// 报价单模块的页面级模型：状态机、金额联动计算、下拉选项。
// 纯函数不依赖 vue，可在任意 node 测试环境中直接验证
import type { DataTableColumn } from 'naive-ui'
import type { QuotationCurrency, QuotationItem, QuotationRow, QuotationStatus, TradeTerm } from '@/types/models'
import { calcGrossMargin, mulFen } from '@/utils/money'

/** hideInExcel 是 MeCrud 导出 Excel 的自定义字段，naive-ui 列类型上没有，交叉类型补上 */
export type QuotationTableColumn = DataTableColumn<QuotationRow> & { hideInExcel?: boolean }

export const CURRENCY_OPTIONS = [
  { label: '美元 USD', value: 'USD' },
  { label: '欧元 EUR', value: 'EUR' },
  { label: '英镑 GBP', value: 'GBP' },
] satisfies { label: string, value: QuotationCurrency }[]

export const TRADE_TERM_OPTIONS = [
  { label: 'FOB（离岸价）', value: 'FOB' },
  { label: 'CIF（到岸价）', value: 'CIF' },
  { label: 'DDP（完税交货）', value: 'DDP' },
] satisfies { label: string, value: TradeTerm }[]

/** 状态展示元信息：标签文案与颜色，列表与详情共用（Record 键为状态全集，新增状态编译期即报漏） */
export const STATUS_META = {
  draft: { label: '草稿', tagType: 'default' },
  sent: { label: '已发送', tagType: 'info' },
  confirmed: { label: '已确认', tagType: 'success' },
  void: { label: '已作废', tagType: 'error' },
} satisfies Record<QuotationStatus, { label: string, tagType: 'default' | 'info' | 'success' | 'error' | 'warning' }>

/** 状态筛选下拉：从展示元信息派生，两处不重复维护 */
export const STATUS_OPTIONS = Object.entries(STATUS_META)
  .map(([value, meta]) => ({ label: meta.label, value: value as QuotationStatus }))

/** 状态机上允许的动作：发送（草稿→已发送）、确认/作废（已发送→终态） */
export type QuotationAction = 'send' | 'confirm' | 'void'

/**
 * 状态机迁移表：当前状态 → 允许的动作集合。
 * draft 可编辑可发送；sent 整单只读、仅保留确认与作废；confirmed/void 为终态，无出边。
 * 显式标注 Record（而非 satisfies）：空数组字面量在 satisfies 下保持字面量窄型，
 * includes 的参数会塌缩成 never，宽化到契约型才能正常调用
 */
export const QUOTATION_TRANSITIONS: Record<QuotationStatus, readonly QuotationAction[]> = {
  draft: ['send'],
  sent: ['confirm', 'void'],
  confirmed: [],
  void: [],
}

/** 动作 → 目标状态 */
const ACTION_TARGET = {
  send: 'sent',
  confirm: 'confirmed',
  void: 'void',
} satisfies Record<QuotationAction, QuotationStatus>

/** 是否允许从当前状态执行该动作（终态对任何动作均返回 false） */
export function canTransition(status: QuotationStatus, action: QuotationAction): boolean {
  return QUOTATION_TRANSITIONS[status].includes(action)
}

/** 执行迁移后的目标状态；调用方须先经 canTransition 校验（终态迁移无定义，返回原状态兜底） */
export function nextStatus(status: QuotationStatus, action: QuotationAction): QuotationStatus {
  return canTransition(status, action) ? ACTION_TARGET[action] : status
}

/** 明细是否低于成本报价：单价折人民币后与成本快照比较（汇率乘法经 mulFen 一次取整） */
export function isBelowCost(item: QuotationItem, exchangeRate: number): boolean {
  return mulFen(item.unitPrice, exchangeRate) < item.cost
}

/** 整单金额聚合：求和全程整数分，仅折人民币时经 mulFen 取整一次 */
export interface QuotationTotals {
  /** 报价币种总额（分） */
  totalAmount: number
  /** 折合人民币总额（分） */
  totalAmountCny: number
  /** 总成本（人民币分） */
  totalCostCny: number
  /** 毛利率（0~1，可负；无销售额时为 null） */
  grossMargin: number | null
}

export function calcQuotationTotals(items: QuotationItem[], exchangeRate: number): QuotationTotals {
  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const totalCostCny = items.reduce((sum, item) => sum + item.cost * item.quantity, 0)
  const totalAmountCny = mulFen(totalAmount, exchangeRate)
  return { totalAmount, totalAmountCny, totalCostCny, grossMargin: calcGrossMargin(totalAmountCny, totalCostCny) }
}

/** PI 抬头的卖方固定信息（演示口径：公司主体不做配置化） */
export const PI_SELLER = {
  name: 'Bridgex Cross-Border Supply Co., Ltd.',
  address: 'No.88 Zhangjiang Rd, Pudong, Shanghai, China',
  contact: 'sales@bridgex.demo · +86 21 8888 6666',
}
