<template>
  <CommonPage>
    <template #action>
      <NButton v-permission="'AddQuotation'" type="primary" @click="goDetail()">
        <i class="i-material-symbols:add mr-4 text-18" />
        新建报价单
      </NButton>
      <NButton class="ml-12" ghost type="primary" @click="$table?.handleExport()">
        <i class="i-fe:download mr-4 text-18" />
        导出台账
      </NButton>
    </template>

    <MeCrud
      ref="$table"
      v-model:query-items="queryItems"
      :scroll-x="1300"
      :columns="columns"
      :get-data="api.read"
    >
      <MeQueryItem label="关键词" :label-width="50">
        <n-input
          v-model:value="queryItems.keyword"
          type="text"
          placeholder="单号 / 客户"
          clearable
        />
      </MeQueryItem>

      <MeQueryItem label="状态" :label-width="34">
        <n-select v-model:value="queryItems.status" clearable :options="STATUS_OPTIONS" />
      </MeQueryItem>

      <MeQueryItem label="币种" :label-width="34">
        <n-select v-model:value="queryItems.currency" clearable :options="CURRENCY_OPTIONS" />
      </MeQueryItem>
    </MeCrud>
  </CommonPage>
</template>

<script setup lang="ts">
// 报价单列表页：筛选（单号/客户关键词、状态、币种）+ 状态标签 + 台账导出。
// 行操作按状态机分派：草稿可编辑/删除，已发送可确认/作废/打印，已确认可查看/打印，终态只读；
// 确认与作废按钮经 withPermission 挂权限点（ConfirmQuotation/VoidQuotation）控制显隐。
// 行级数据权限由服务端实现（业务员仅可见本人创建的单据），本页无需感知
import type { VNode } from 'vue'
import type { QuotationTableColumn } from './model'
import type { MeCrudExposed } from '@/types/me-components'
import type { QuotationQuery, QuotationRow, QuotationStatus } from '@/types/models'
import { NButton, NTag } from 'naive-ui'
import { MeCrud, MeQueryItem } from '@/components'
import { useRouteQuery } from '@/composables'
import { withPermission } from '@/directives'
import { formatGrossMargin, formatMoney } from '@/utils/money'
import api from './api'
import { CURRENCY_OPTIONS, STATUS_META, STATUS_OPTIONS } from './model'

defineOptions({ name: 'QuotationMgt' })

const router = useRouter()

const $table = ref<MeCrudExposed | null>(null)
const queryItems = useRouteQuery<QuotationQuery>({ keyword: undefined, status: undefined, currency: undefined })

onMounted(() => {
  $table.value?.handleSearch()
})

function goDetail(row?: QuotationRow) {
  router.push({ name: 'QuotationDetail', query: row ? { id: String(row.id) } : {} })
}

function goPrint(row: QuotationRow) {
  router.push({ name: 'QuotationPrint', query: { id: String(row.id) } })
}

/** 状态迁移动作（确认/作废）：确认框 → 调接口 → 刷新列表 */
function transitionRow(row: QuotationRow, action: 'confirm' | 'void') {
  const isVoid = action === 'void'
  $dialog.confirm({
    content: isVoid
      ? `作废后单据进入终态且不可恢复，确定作废【${row.quotationNo}】？`
      : `确认客户已回签【${row.quotationNo}】？确认后单据进入终态。`,
    async confirm() {
      try {
        await api.transition(row.id, action)
        $message.success(isVoid ? '报价单已作废' : '报价单已确认')
        $table.value?.handleSearch(true)
      }
      catch (error) {
        console.error(error)
      }
    },
  })
}

/** 删除草稿单（仅草稿可删，服务端同责校验） */
function deleteRow(row: QuotationRow) {
  $dialog.warning({
    title: '提示',
    content: `确定删除草稿单【${row.quotationNo}】？`,
    positiveText: '确定',
    negativeText: '取消',
    async onPositiveClick() {
      try {
        await api.delete(row.id)
        $message.success('删除成功')
        $table.value?.handleSearch(true)
      }
      catch (error) {
        console.error(error)
      }
    },
  })
}

const columns: QuotationTableColumn[] = [
  { title: '单号', key: 'quotationNo', width: 160, ellipsis: { tooltip: true } },
  { title: '客户', key: 'customerName', minWidth: 150, ellipsis: { tooltip: true } },
  {
    title: '币种',
    key: 'currency',
    width: 80,
    render: row => h(NTag, { size: 'small', bordered: false }, { default: () => row.currency }),
  },
  {
    title: '总金额',
    key: 'totalAmount',
    width: 120,
    align: 'right',
    hideInExcel: true,
    render: row => formatMoney(row.totalAmount, row.currency),
  },
  {
    title: '毛利率',
    key: 'grossMargin',
    width: 100,
    align: 'right',
    hideInExcel: true,
    render: (row) => {
      const margin = formatGrossMargin(row.grossMargin)
      const negative = row.grossMargin !== null && row.grossMargin < 0
      return h('span', { class: negative ? 'color-#d03050' : '' }, margin)
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: row =>
      h(
        NTag,
        { size: 'small', bordered: false, type: STATUS_META[row.status].tagType },
        { default: () => STATUS_META[row.status].label },
      ),
  },
  { title: '贸易条款', key: 'tradeTerm', width: 90 },
  { title: '创建人', key: 'creatorName', width: 90 },
  { title: '创建时间', key: 'createTime', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 300,
    align: 'right',
    fixed: 'right',
    hideInExcel: true,
    render: (row) => {
      const viewBtn = h(
        NButton,
        { size: 'small', type: 'primary', secondary: true, onClick: () => goDetail(row) },
        { default: () => (row.status === 'draft' ? '编辑' : '查看'), icon: () => h('i', { class: 'i-material-symbols:visibility-outline text-14' }) },
      )
      const printBtn = h(
        NButton,
        { size: 'small', type: 'primary', secondary: true, class: 'ml-8px', onClick: () => goPrint(row) },
        { default: () => '打印 PI', icon: () => h('i', { class: 'i-material-symbols:print-outline text-14' }) },
      )
      const confirmBtn = withPermission(
        h(
          NButton,
          { size: 'small', type: 'success', secondary: true, class: 'ml-8px', onClick: () => transitionRow(row, 'confirm') },
          { default: () => '确认' },
        ),
        'ConfirmQuotation',
      )
      const voidBtn = withPermission(
        h(
          NButton,
          { size: 'small', type: 'error', secondary: true, class: 'ml-8px', onClick: () => transitionRow(row, 'void') },
          { default: () => '作废' },
        ),
        'VoidQuotation',
      )
      const deleteBtn = h(
        NButton,
        { size: 'small', type: 'error', secondary: true, class: 'ml-8px', onClick: () => deleteRow(row) },
        { default: () => '删除', icon: () => h('i', { class: 'i-material-symbols:delete-outline text-14' }) },
      )

      // 操作集合按状态机裁剪：draft 编辑/删除；sent 查看/打印/确认/作废；confirmed 查看/打印；void 仅查看
      const byStatus: Record<QuotationStatus, Array<VNode>> = {
        draft: [viewBtn, deleteBtn],
        sent: [viewBtn, printBtn, confirmBtn, voidBtn],
        confirmed: [viewBtn, printBtn],
        void: [viewBtn],
      }
      return byStatus[row.status]
    },
  },
]
</script>
