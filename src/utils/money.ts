/**
 * 金额纯工具：全项目金额一律以「最小货币单位的整数」（分）存储与运算，
 * 本模块是「分 ↔ 展示」的唯一换算出口——浮点只在展示层出现一次并当场取整，
 * 求和/乘法全程整数，杜绝 0.1 + 0.2 = 0.30000000000000004 类精度事故。
 * 不依赖 vue 与任何业务概念，可在 node 测试环境直接运行。
 */
import type { Currency } from '@/types/models'

/** 币种 → 符号映射：展示层格式化的唯一来源 */
const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CNY: '¥',
}

/**
 * 分 → 元字符串（定点两位小数）。
 * @param fen 金额（分，可为负）
 * @param digits 小数位（默认 2；日元类无小数位币种传 0）
 */
export function fenToYuanStr(fen: number, digits = 2): string {
  const yuan = fen / 100
  // toFixed 即本函数唯一的浮点舍入点：换算误差当场归零
  return yuan.toFixed(digits)
}

/**
 * 元（数字或字符串输入）→ 分整数。
 * 输入按两位小数以内的金额设计：先乘 100 再四舍五入，吃掉二进制浮点的表示误差
 * （如 0.29 * 100 = 28.999999999999996 → 29）
 */
export function yuanToFen(yuan: number | string): number {
  const value = typeof yuan === 'string' ? Number.parseFloat(yuan) : yuan
  // 非法输入（NaN/Infinity）按 0 分兜底，让表单校验而非计算层去拦截脏数据
  if (!Number.isFinite(value))
    return 0
  return Math.round(value * 100)
}

/**
 * 分 × 浮点系数 → 分整数（金额乘以汇率是全项目唯一需要浮点系数的场景）。
 * 只在结果处取整一次：中间不产生累积误差
 */
export function mulFen(fen: number, factor: number): number {
  return Math.round(fen * factor)
}

/** 千分位分组：整数部分从右每 3 位插逗号，小数部分原样保留 */
function groupThousands(integerPart: string): string {
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 分 → 带币种符号的展示串，如 fenToMoney(123456789, 'USD') → '$1,234,567.89'。
 * 负数符号放在币种符号外（如 -$12.34），符合发票惯例
 */
export function formatMoney(fen: number, currency: Currency, digits = 2): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  const text = fenToYuanStr(fen, digits)
  const negative = text.startsWith('-')
  const [integerPart, decimalPart] = (negative ? text.slice(1) : text).split('.')
  const grouped = groupThousands(integerPart ?? '0')
  const body = decimalPart !== undefined ? `${grouped}.${decimalPart}` : grouped
  return `${negative ? '-' : ''}${symbol}${body}`
}

/**
 * 整单毛利率：毛利 ÷ 折合人民币销售额。
 * @param totalAmountCny 销售额折合人民币（分）
 * @param totalCostCny 总成本（人民币分）
 * @returns 0~1 区间比率（可为负表示亏损）；销售额为 0 时无毛利率可言，返回 null
 */
export function calcGrossMargin(totalAmountCny: number, totalCostCny: number): number | null {
  if (totalAmountCny === 0)
    return null
  return (totalAmountCny - totalCostCny) / totalAmountCny
}

/** 毛利率比率 → 百分比文案（如 0.234 → '23.40%'；null 兜底为 '--'） */
export function formatGrossMargin(ratio: number | null): string {
  if (ratio === null)
    return '--'
  return `${(ratio * 100).toFixed(2)}%`
}
