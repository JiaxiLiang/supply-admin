<template>
  <MeModal ref="modalRef" title="选品带入" width="860px" :show-ok="false" cancel-text="关 闭">
    <MeCrud
      ref="$table"
      v-model:query-items="queryItems"
      :remote="false"
      :is-pagination="true"
      :scroll-x="820"
      :columns="columns"
      :get-data="api.getSkuOptions"
      @checked-change="handleChecked"
      @data-change="handleDataChange"
    >
      <MeQueryItem label="关键词" :label-width="50">
        <n-input v-model:value="queryItems.keyword" type="text" placeholder="款号 / 标题" clearable />
      </MeQueryItem>
      <MeQueryItem label="品类" :label-width="34">
        <n-select v-model:value="queryItems.category" clearable :options="CATEGORY_OPTIONS" />
      </MeQueryItem>
    </MeCrud>

    <template #footer>
      <footer class="flex items-center justify-between">
        <span class="text-13 opacity-60">已选 {{ checkedSkuIds.size }} 个规格，带入后商品信息以快照固化</span>
        <div>
          <n-button @click="close()">
            取 消
          </n-button>
          <n-button type="primary" class="ml-16" :disabled="!checkedSkuIds.size" @click="confirmPick()">
            带入所选（{{ checkedSkuIds.size }}）
          </n-button>
        </div>
      </footer>
    </template>
  </MeModal>
</template>

<script setup lang="ts">
// 选品弹窗：以 SKU 维度展示全部上架商品，勾选后把快照字段交给报价详情页组装明细行。
// 数据走报价模块自己的选品接口（服务端展平），不横向引用商品模块的页面或 api；
// MeCrud 关闭远端分页（:remote="false"），候选 SKU 全量拉取后本地翻页；
// n-modal 内容默认按需挂载，每次 open 都会重新走 MeCrud 首查
import type { DataTableColumns } from 'naive-ui'
import type { MeCrudExposed } from '@/types/me-components'
import type { ProductCategory, SkuOption } from '@/types/models'
import { NTag } from 'naive-ui'
import { MeCrud, MeModal, MeQueryItem } from '@/components'
import { useModal } from '@/composables'
import { CATEGORY_OPTIONS } from '@/types/models'
import { formatMoney } from '@/utils/money'
import api from '../api'

interface SkuPickerQuery {
  keyword?: string
  category?: ProductCategory
}

const emit = defineEmits<{
  confirm: [options: SkuOption[]]
}>()

const [modalRef] = useModal()
const $table = ref<MeCrudExposed | null>(null)

const queryItems = ref<SkuPickerQuery>({})

/** 勾选集合：以 skuId 为主键，翻页勾选不丢（本地分页下即全量勾选状态） */
const checkedSkuIds = ref<Set<number>>(new Set())

/** 全量候选快照（MeCrud 每次查询后经 data-change 回传），确认时据此还原勾选行 */
const allOptions = ref<SkuOption[]>([])

const columns: DataTableColumns<SkuOption> = [
  { type: 'selection' },
  { title: '款号', key: 'styleNo', width: 110, ellipsis: { tooltip: true } },
  { title: '品名', key: 'title', minWidth: 150, ellipsis: { tooltip: true } },
  {
    title: '品类',
    key: 'category',
    width: 90,
    render: row => h(NTag, { size: 'small', bordered: false }, { default: () => row.category }),
  },
  { title: '颜色', key: 'color', width: 70 },
  { title: '尺码', key: 'size', width: 70 },
  {
    title: '成本',
    key: 'cost',
    width: 100,
    render: row => formatMoney(row.cost, 'CNY'),
  },
]

function handleChecked(rowKeys: Array<string | number>) {
  checkedSkuIds.value = new Set(rowKeys as number[])
}

function handleDataChange(data: SkuOption[]) {
  allOptions.value = data
}

/** 确认带入：把勾选的 SKU 选项交给父页面组装明细行 */
function confirmPick() {
  const picked = allOptions.value.filter(option => checkedSkuIds.value.has(option.skuId))
  if (!picked.length)
    return $message.warning('请先勾选要带入的规格')
  emit('confirm', picked)
  close()
}

/** 打开弹窗：重置勾选与筛选后重新拉取候选 */
async function open() {
  checkedSkuIds.value = new Set()
  queryItems.value = {}
  modalRef.value?.open()
  await nextTick()
  $table.value?.handleSearch()
}

function close() {
  modalRef.value?.close()
}

defineExpose({ open, close })
</script>
