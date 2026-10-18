<template>
  <NDataTable
    :columns="columns"
    :data="items"
    :scroll-x="1020"
    :row-class-name="rowClassName"
    size="small"
  />
</template>

<script setup lang="ts">
// 报价明细行表格：商品快照列只读展示，行内仅开放「单价、数量」编辑，
// 行小计随输入即时重算（整单聚合在详情页基于 items 派生，本组件只管行级交互与展示）。
// 折人民币后低于成本的行整行红字告警（rowClassName 挂标，样式见文件底部）
import type { DataTableColumns } from 'naive-ui'
import type { QuotationCurrency, QuotationItem } from '@/types/models'
import { NButton, NInputNumber } from 'naive-ui'
import { formatMoney, yuanToFen } from '@/utils/money'
import { isBelowCost } from '../model'

const props = defineProps<{
  items: QuotationItem[]
  /** 报价币种（单价与小计的展示币种） */
  currency: QuotationCurrency
  /** 对人民币汇率（低于成本判定用） */
  exchangeRate: number
  /** 非草稿态整单只读 */
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:items': [items: QuotationItem[]]
}>()

/** 不可变行更新：以整组 items 上抛，详情页据以重算整单聚合 */
function updateRow(index: number, patch: Partial<QuotationItem>) {
  emit('update:items', props.items.map((row, i) => (i === index ? { ...row, ...patch } : row)))
}

function removeRow(index: number) {
  emit('update:items', props.items.filter((_, i) => i !== index))
}

const columns = computed<DataTableColumns<QuotationItem>>(() => [
  { title: '款号', key: 'styleNo', width: 110, ellipsis: { tooltip: true } },
  { title: '品名', key: 'title', minWidth: 150, ellipsis: { tooltip: true } },
  { title: '颜色', key: 'color', width: 70 },
  { title: '尺码', key: 'size', width: 70 },
  {
    title: '成本',
    key: 'cost',
    width: 100,
    render: row => formatMoney(row.cost, 'CNY'),
  },
  {
    title: `单价`,
    key: 'unitPrice',
    width: 160,
    render: (row, index) => (props.readonly
      ? formatMoney(row.unitPrice, props.currency)
      : h(NInputNumber, {
          value: row.unitPrice / 100,
          precision: 2,
          min: 0,
          size: 'small',
          onUpdateValue: (value: number | null) => updateRow(index, { unitPrice: yuanToFen(value ?? 0) }),
        })),
  },
  {
    title: '数量',
    key: 'quantity',
    width: 140,
    render: (row, index) => (props.readonly
      ? String(row.quantity)
      : h(NInputNumber, {
          value: row.quantity,
          precision: 0,
          min: 1,
          size: 'small',
          onUpdateValue: (value: number | null) => updateRow(index, { quantity: value ?? 1 }),
        })),
  },
  {
    title: '小计',
    key: 'subtotal',
    width: 120,
    render: row => formatMoney(row.unitPrice * row.quantity, props.currency),
  },
  ...(props.readonly
    ? []
    : [{
        title: '操作',
        key: 'actions',
        width: 70,
        align: 'right' as const,
        render: (_: QuotationItem, index: number) =>
          h(
            NButton,
            { size: 'small', type: 'error', quaternary: true, onClick: () => removeRow(index) },
            { default: () => '删行', icon: () => h('i', { class: 'i-material-symbols:delete-outline text-14' }) },
          ),
      }]),
])

/** 低于成本行整行告警：单价折人民币与成本快照比较 */
function rowClassName(row: QuotationItem): string {
  return isBelowCost(row, props.exchangeRate) ? 'row-below-cost' : ''
}
</script>

<style>
/* 明细行低于成本告警：naive-ui 的 td 背景优先级高，需 !important 压过斑马纹 */
.row-below-cost td {
  background: rgb(208 48 80 / 6%) !important;
}
.row-below-cost td {
  color: #d03050;
}
</style>
