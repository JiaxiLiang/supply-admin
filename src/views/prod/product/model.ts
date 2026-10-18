// 商品模块的页面级模型：表格行/列扩展类型与规格矩阵生成。
// 纯函数不依赖 vue，可被 node 测试环境直接验证（tests/views/prod/product/model.spec.ts）
import type { DataTableColumn } from 'naive-ui'
import type { ProductRow, Sku } from '@/types/models'

/** 商品表格行：聚合行追加行级开关 loading（前端 UI 字段，不来自后端，约定同 UserRow） */
export type ProductTableRow = ProductRow & { enableLoading?: boolean }

/** hideInExcel 是 MeCrud 导出 Excel 的自定义字段，naive-ui 列类型上没有，交叉类型补上 */
export type ProductTableColumn = DataTableColumn<ProductTableRow> & { hideInExcel?: boolean }

/**
 * 规格矩阵：颜色 × 尺码笛卡尔积生成 SKU 行，新增行成本默认 0 分。
 * 已录入的成本按「颜色|尺码」键保留——改颜色/尺码组合时，未受影响的行不丢数据；
 * 颜色与尺码入参先去重，避免动态标签重复录入产生重复行
 */
export function buildSkuMatrix(colors: string[], sizes: string[], prevSkus: Sku[]): Sku[] {
  const prevCostByKey = new Map(prevSkus.map(sku => [`${sku.color}|${sku.size}`, sku.cost]))
  const skus: Sku[] = []
  for (const color of new Set(colors)) {
    for (const size of new Set(sizes)) {
      skus.push({ color, size, cost: prevCostByKey.get(`${color}|${size}`) ?? 0 })
    }
  }
  return skus
}
