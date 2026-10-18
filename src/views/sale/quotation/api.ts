import type { QuotationAction } from './model'
import type { Quotation, QuotationQuery, QuotationRow, SkuOption } from '@/types/models'
import { createCrudApi } from '@/api'
import { request } from '@/utils'

// 报价单的增删改查/分页接口由工厂统一生成；列表行实体为聚合行 QuotationRow（金额由服务端
// 按明细聚合，不携带明细数组），查询契约 QuotationQuery 经 MeCrud 反向推断到页面
const crud = createCrudApi<QuotationRow, QuotationQuery>('/quotation')

export default {
  ...crud,

  // 详情：报价单为聚合根，明细行随单返回（列表接口则不携带明细，走 QuotationRow 聚合行）
  getDetail: (id: number) => request.get<Quotation>(`/quotation/${id}`),

  // 状态机迁移：action 与目标状态的合法映射见 model.ts 的 QUOTATION_TRANSITIONS
  transition: (id: number, action: QuotationAction) => request.post(`/quotation/${id}/${action}`),

  // 选品数据源：SKU 维度的上架商品选项（含快照字段），供选品弹窗按关键字/品类筛选
  getSkuOptions: (params: { keyword?: string, category?: string }, signal?: AbortSignal) =>
    request.get<SkuOption[]>('/product/sku/options', { params, signal }),
}
