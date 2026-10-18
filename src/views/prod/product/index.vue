<template>
  <CommonPage>
    <template #action>
      <NButton v-permission="'AddProduct'" type="primary" @click="handleOpenAdd()">
        <i class="i-material-symbols:add mr-4 text-18" />
        新增商品
      </NButton>
      <NButton class="ml-12" ghost type="primary" @click="$table?.handleExport()">
        <i class="i-fe:download mr-4 text-18" />
        导出
      </NButton>
    </template>

    <MeCrud
      ref="$table"
      v-model:query-items="queryItems"
      :scroll-x="1200"
      :columns="columns"
      :get-data="api.read"
    >
      <MeQueryItem label="关键词" :label-width="50">
        <n-input
          v-model:value="queryItems.keyword"
          type="text"
          placeholder="款号 / 标题"
          clearable
        />
      </MeQueryItem>

      <MeQueryItem label="品类" :label-width="34">
        <n-select v-model:value="queryItems.category" clearable :options="CATEGORY_OPTIONS" />
      </MeQueryItem>

      <MeQueryItem label="状态" :label-width="34">
        <n-select
          v-model:value="queryItems.enable"
          clearable
          :options="[
            { label: '上架', value: 1 },
            { label: '下架', value: 0 },
          ]"
        />
      </MeQueryItem>
    </MeCrud>

    <MeModal ref="modalRef" width="720px">
      <n-form
        ref="modalFormRef"
        label-placement="left"
        label-align="left"
        :label-width="80"
        :model="modalForm"
        :disabled="modalAction === 'view'"
      >
        <n-form-item
          label="款号"
          path="styleNo"
          :rule="{ required: true, message: '请输入款号', trigger: ['input', 'blur'] }"
        >
          <n-input v-model:value="modalForm.styleNo" placeholder="如 CT-8100" :maxlength="30" />
        </n-form-item>
        <n-form-item
          label="标题"
          path="title"
          :rule="{ required: true, message: '请输入商品标题', trigger: ['input', 'blur'] }"
        >
          <n-input v-model:value="modalForm.title" placeholder="商品标题" :maxlength="60" />
        </n-form-item>
        <n-form-item
          label="品类"
          path="category"
          :rule="{ required: true, message: '请选择品类', trigger: ['blur', 'change'] }"
        >
          <n-select v-model:value="modalForm.category" :options="CATEGORY_OPTIONS" />
        </n-form-item>

        <SpecMatrix
          :key="specMatrixKey"
          :seed="modalForm.skus"
          :disabled="modalAction === 'view'"
          @update:skus="skus => (modalForm.skus = skus)"
        />
      </n-form>
    </MeModal>
  </CommonPage>
</template>

<script setup lang="ts">
import type { ProductTableColumn } from './model'
// 商品管理页：MeCrud 维护 SPU 列表，弹窗内以 SpecMatrix 笛卡尔积维护 SKU。
// 列表行的 SKU 数与成本区间为服务端聚合字段；上架开关走 useEnableRow 行级标准件；
// 新增/编辑经 v-permission="'AddProduct'" 与权限点联动显隐
import type { ProductQuery, ProductRow } from '@/types/models'
import { NButton, NSwitch, NTag } from 'naive-ui'
import { MeCrud, MeModal, MeQueryItem } from '@/components'
import { useCrud, useEnableRow, useRouteQuery } from '@/composables'
import { CATEGORY_OPTIONS } from '@/types/models'
import { fenToYuanStr } from '@/utils/money'
import api from './api'
import SpecMatrix from './components/SpecMatrix.vue'

defineOptions({ name: 'ProductMgt' })

const $table = ref<{ handleSearch: (keepCurrentPage?: boolean) => void, handleExport: () => void } | null>(null)
// 筛选条件经 useRouteQuery 同步到 URL，刷新不丢（项目既有约定，见用户页同款写法）
const queryItems = useRouteQuery<ProductQuery>({ keyword: undefined, category: undefined, enable: undefined })

onMounted(() => {
  $table.value?.handleSearch()
})

const {
  modalRef,
  modalFormRef,
  modalForm,
  modalAction,
  handleDelete,
  handleOpen,
  handleSave,
} = useCrud<ProductRow>({
  name: '商品',
  doCreate: api.create,
  doDelete: api.delete,
  doUpdate: api.update,
  refresh: () => $table.value?.handleSearch(),
})

const { handleEnable } = useEnableRow(api.update, () => $table.value?.handleSearch())

// 规格矩阵重挂键：每次打开弹窗自增，SpecMatrix 以全新状态播种（seed 仅挂载时读取）
const specMatrixKey = ref(0)

function handleOpenAdd() {
  specMatrixKey.value += 1
  handleOpen({ action: 'add', title: '新增商品', row: { enable: true, skus: [] }, onOk: onSave })
}

// 编辑态剥离服务端聚合字段（skuCount/成本区间），它们不属于商品实体，回传属于契约噪音
function handleOpenEdit(row: ProductRow) {
  specMatrixKey.value += 1
  const { skuCount: _skuCount, costMin: _costMin, costMax: _costMax, ...product } = row
  handleOpen({ action: 'edit', title: '编辑商品', row: product, onOk: onSave })
}

// 保存守卫：SPU 必须至少带一条 SKU；通过后走 useCrud 默认 add/edit 保存链路
function onSave() {
  if (!modalForm.value.skus?.length) {
    $message.warning('请至少录入一条规格（颜色 × 尺码）')
    return false
  }
  return handleSave()
}

const columns: ProductTableColumn[] = [
  {
    title: '主图',
    key: 'image',
    width: 70,
    align: 'center',
    hideInExcel: true,
    render: row =>
      row.image
        ? h('img', { src: row.image, class: 'h-50 w-50 rounded-6', alt: row.title })
        : h('i', { class: 'i-fe:image text-26 opacity-30' }),
  },
  { title: '款号', key: 'styleNo', width: 130, ellipsis: { tooltip: true } },
  { title: '标题', key: 'title', minWidth: 160, ellipsis: { tooltip: true } },
  {
    title: '品类',
    key: 'category',
    width: 90,
    render: row => h(NTag, { type: 'info', size: 'small', bordered: false }, { default: () => row.category }),
  },
  { title: 'SKU 数', key: 'skuCount', width: 80, align: 'center' },
  {
    title: '成本区间',
    key: 'costMin',
    width: 190,
    render: row => (row.costMin === null
      ? '--'
      : `¥${fenToYuanStr(row.costMin)} ~ ¥${fenToYuanStr(row.costMax ?? row.costMin)}`),
  },
  {
    title: '上架状态',
    key: 'enable',
    width: 100,
    hideInExcel: true,
    render: row =>
      h(
        NSwitch,
        {
          size: 'small',
          rubberBand: false,
          value: row.enable,
          loading: !!row.enableLoading,
          onUpdateValue: () => handleEnable(row),
        },
        {
          checked: () => '上架',
          unchecked: () => '下架',
        },
      ),
  },
  { title: '创建时间', key: 'createTime', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    align: 'right',
    fixed: 'right',
    hideInExcel: true,
    render: row => [
      h(
        NButton,
        { size: 'small', type: 'primary', secondary: true, onClick: () => handleOpenEdit(row) },
        { default: () => '编辑', icon: () => h('i', { class: 'i-material-symbols:edit-outline text-14' }) },
      ),
      h(
        NButton,
        {
          size: 'small',
          type: 'error',
          secondary: true,
          class: 'ml-12px',
          onClick: () => handleDelete(row.id),
        },
        { default: () => '删除', icon: () => h('i', { class: 'i-material-symbols:delete-outline text-14' }) },
      ),
    ],
  },
]
</script>
