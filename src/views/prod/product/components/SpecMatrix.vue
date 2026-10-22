<template>
  <div class="w-full">
    <n-form-item label="颜色" :show-feedback="false">
      <n-dynamic-tags :value="colors" :disabled="disabled" @update:value="onColorsChange" />
    </n-form-item>
    <n-form-item label="尺码" :show-feedback="false">
      <n-dynamic-tags :value="sizes" :disabled="disabled" @update:value="onSizesChange" />
    </n-form-item>
    <n-form-item label="规格明细" :show-feedback="false">
      <NDataTable
        class="flex-1"
        size="small"
        :columns="columns"
        :data="rows"
        :max-height="260"
        :scroll-x="420"
      />
    </n-form-item>
  </div>
</template>

<script setup lang="ts">
// 规格矩阵：颜色/尺码两组动态标签做笛卡尔积，实时生成 SKU 行（明细表格随组合自动增删）。
// 已录入的成本按「颜色|尺码」键在重建时保留；成本以元输入、以分上抛（存储契约见 models.ts）。
// seed 只在挂载时读取一次：弹窗每次打开由页面侧用 :key 重挂本组件实现重新播种，
// 单向数据流（seed 进、change 出）不回灌内部状态，避免「标签输入 → 重建 → 重置」的反馈回路
import type { DataTableColumns } from 'naive-ui'
import type { Sku } from '@/types/models'
import { NDataTable, NInputNumber } from 'naive-ui'
import { yuanToFen } from '@/utils/money'
import { buildSkuMatrix } from '../model'

const props = defineProps<{
  /** 打开弹窗时的 SKU 快照（编辑态回填颜色/尺码/成本；新增态为空数组） */
  seed?: Sku[]
  /** 查看态整体只读 */
  disabled?: boolean
}>()

const emit = defineEmits<{
  change: [skus: Sku[]]
}>()

const seed = props.seed ?? []
const colors = ref<string[]>([...new Set(seed.map(sku => sku.color))])
const sizes = ref<string[]>([...new Set(seed.map(sku => sku.size))])
const rows = ref<Sku[]>(buildSkuMatrix(colors.value, sizes.value, seed))

function onColorsChange(value: string[]) {
  colors.value = value
  rebuild()
}

function onSizesChange(value: string[]) {
  sizes.value = value
  rebuild()
}

/** 重建矩阵：以当前行为 prev（保留存量成本），重建结果即时上抛给弹窗表单 */
function rebuild() {
  rows.value = buildSkuMatrix(colors.value, sizes.value, rows.value)
  emit('change', rows.value)
}

/** 成本输入（元）→ 分存储，行数据整体替换保持不可变更新 */
function updateCost(index: number, yuan: number | null) {
  rows.value = rows.value.map((row, i) => (i === index ? { ...row, cost: yuanToFen(yuan ?? 0) } : row))
  emit('change', rows.value)
}

const columns: DataTableColumns<Sku> = [
  { title: '颜色', key: 'color', width: 100 },
  { title: '尺码', key: 'size', width: 100 },
  {
    title: '成本价（元）',
    key: 'cost',
    width: 200,
    render: (row, index) =>
      h(NInputNumber, {
        value: row.cost / 100,
        precision: 2,
        min: 0,
        size: 'small',
        disabled: props.disabled,
        placeholder: '成本价',
        onUpdateValue: (value: number | null) => updateCost(index, value),
      }),
  },
]
</script>
