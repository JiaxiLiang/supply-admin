import type { ProductQuery, ProductRow } from '@/types/models'
import { createCrudApi } from '@/api'

// 商品的增删改查/分页接口由工厂统一生成；列表行实体为聚合行 ProductRow（SKU 数与成本区间
// 由服务端按 SKU 集合聚合），查询契约 ProductQuery 经 MeCrud 的 :get-data 反向推断到页面
const crud = createCrudApi<ProductRow, ProductQuery>('/product')

export default {
  ...crud,
}
