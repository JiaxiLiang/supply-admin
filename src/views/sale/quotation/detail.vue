<template>
  <CommonPage back>
    <template #title-suffix>
      <NTag v-if="form.quotationNo" class="ml-12" type="info" :bordered="false">
        {{ form.quotationNo }}
      </NTag>
      <NTag class="ml-12" :type="STATUS_META[form.status].tagType" :bordered="false">
        {{ STATUS_META[form.status].label }}
      </NTag>
    </template>
    <template #action>
      <div v-if="!pageLoading">
        <template v-if="canEdit">
          <NButton :loading="saving" type="primary" ghost @click="saveDraft()">
            <i class="i-material-symbols:save-outline mr-4 text-18" />
            保存草稿
          </NButton>
          <NButton :loading="saving" class="ml-12" type="primary" @click="handleSend()">
            <i class="i-material-symbols:send-outline mr-4 text-18" />
            发送报价单
          </NButton>
        </template>
        <template v-else-if="form.status !== 'void'">
          <NButton ghost type="primary" @click="goPrint()">
            <i class="i-material-symbols:print-outline mr-4 text-18" />
            打印 PI
          </NButton>
          <NButton
            v-if="form.status === 'sent'"
            class="ml-12"
            ghost
            type="error"
            @click="handleVoid()"
          >
            <i class="i-material-symbols:block mr-4 text-18" />
            作废
          </NButton>
        </template>
      </div>
    </template>

    <n-spin :show="pageLoading">
      <n-card title="基本信息" :bordered="false" class="mb-16">
        <n-form
          label-placement="left"
          label-align="left"
          :label-width="80"
          :model="form"
          :disabled="!canEdit"
        >
          <n-grid :cols="24" :x-gap="12">
            <n-form-item-gi
              :span="10"
              label="客户名称"
              path="customerName"
              :rule="{ required: true, message: '请输入客户名称', trigger: ['input', 'blur'] }"
            >
              <n-input v-model:value="form.customerName" placeholder="客户名称" :maxlength="60" />
            </n-form-item-gi>
            <n-form-item-gi :span="4" label="币种" path="currency">
              <n-select v-model:value="form.currency" :options="CURRENCY_OPTIONS" />
            </n-form-item-gi>
            <n-form-item-gi :span="4" label="汇率" path="exchangeRate">
              <n-input-number
                v-model:value="form.exchangeRate"
                class="w-full"
                :min="0.0001"
                :step="0.01"
                :precision="4"
              />
            </n-form-item-gi>
            <n-form-item-gi :span="6" label="贸易条款" path="tradeTerm">
              <n-select v-model:value="form.tradeTerm" :options="TRADE_TERM_OPTIONS" />
            </n-form-item-gi>
            <n-form-item-gi :span="8" label="有效期" path="validUntil">
              <n-date-picker
                v-model:formatted-value="form.validUntil"
                class="w-full"
                type="date"
                value-format="yyyy-MM-dd"
                :is-date-disabled="disablePastDate"
              />
            </n-form-item-gi>
            <n-form-item-gi :span="16" label="备注" path="remark">
              <n-input v-model:value="form.remark" placeholder="贸易背景、费用口径等备注" :maxlength="200" />
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-card>

      <n-card title="商品明细" :bordered="false">
        <template #header-extra>
          <NButton v-if="canEdit" size="small" type="primary" secondary @click="skuPickerRef?.open()">
            <i class="i-material-symbols:playlist-add mr-4 text-16" />
            添加商品
          </NButton>
        </template>

        <QuotationItemTable
          v-model:items="form.items"
          :currency="form.currency"
          :exchange-rate="form.exchangeRate"
          :readonly="!canEdit"
        />

        <n-alert v-if="canEdit && hasBelowCost" type="warning" class="mt-12" :bordered="false">
          存在低于成本的明细行（红字标出），请复核定价
        </n-alert>

        <div class="mt-16 flex flex-wrap justify-end gap-x-32 gap-y-8 text-14">
          <span>报价总额 <b class="text-16">{{ formatMoney(totals.totalAmount, form.currency) }}</b></span>
          <span>折合人民币 <b class="text-16">{{ formatMoney(totals.totalAmountCny, 'CNY') }}</b></span>
          <span>总成本 <b>{{ formatMoney(totals.totalCostCny, 'CNY') }}</b></span>
          <span>
            毛利率
            <b class="text-16" :class="marginIsNegative ? 'color-#d03050' : 'color-primary'">
              {{ formatGrossMargin(totals.grossMargin) }}
            </b>
          </span>
        </div>
      </n-card>
    </n-spin>

    <SkuPickerModal ref="skuPickerRef" @confirm="onPicked" />
  </CommonPage>
</template>

<script setup lang="ts">
// 报价单详情页：新建（无 id）与编辑/只读（?id=）共用。
// 状态机：草稿可编辑全部内容并可发送；已发送整单只读，仅保留打印 PI 与作废；确认/作废为终态。
// 商品信息经选品弹窗以快照带入，行内仅开放单价与数量；行小计、整单总额与毛利率由
// calcQuotationTotals 从 items 派生，随输入实时联动。
// 按钮显隐按「当前状态」门控——本页是隐藏路由（meta 无按钮权限点），与 role-user 先例一致，
// 按钮权限点（发送/作废）在列表页经 v-permission 生效
import type { Quotation, QuotationItem, SkuOption } from '@/types/models'
import dayjs from 'dayjs'
import { NButton, NTag } from 'naive-ui'
import { formatGrossMargin, formatMoney } from '@/utils/money'
import api from './api'
import QuotationItemTable from './components/QuotationItemTable.vue'
import SkuPickerModal from './components/SkuPickerModal.vue'
import {
  calcQuotationTotals,
  CURRENCY_OPTIONS,
  isBelowCost,
  STATUS_META,
  TRADE_TERM_OPTIONS,
} from './model'

defineOptions({ name: 'QuotationDetail' })

const route = useRoute()
const router = useRouter()

/** 详情表单形态：聚合根去掉服务端身份与审计字段，本地起草时全部可填 */
interface QuotationForm {
  customerName: string
  currency: Quotation['currency']
  exchangeRate: number
  tradeTerm: Quotation['tradeTerm']
  validUntil: string
  remark: string
  status: Quotation['status']
  quotationNo: string
  items: QuotationItem[]
}

/** 选品带入的默认数量（按百件起报的业务惯例，可在行内修改） */
const DEFAULT_PICK_QUANTITY = 100

function emptyForm(): QuotationForm {
  return {
    customerName: '',
    currency: 'USD',
    exchangeRate: 7.24,
    tradeTerm: 'FOB',
    validUntil: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    remark: '',
    status: 'draft',
    quotationNo: '',
    items: [],
  }
}

const form = ref<QuotationForm>(emptyForm())
const pageLoading = ref(false)
const saving = ref(false)

/** 单据 id：新建流程保存成功后由服务端分配；URL 同步仅作刷新恢复的展示用途 */
const savedId = ref<number | null>(Number(route.query.id ?? 0) || null)

const canEdit = computed(() => !savedId.value || form.value.status === 'draft')

const totals = computed(() => calcQuotationTotals(form.value.items, form.value.exchangeRate))
const marginIsNegative = computed(() => totals.value.grossMargin !== null && totals.value.grossMargin < 0)
const hasBelowCost = computed(() => form.value.items.some(item => isBelowCost(item, form.value.exchangeRate)))

/** 有效期禁选过去：报价单有效期天然不得早于今天（当天允许） */
function disablePastDate(current: number) {
  return dayjs(current).isBefore(dayjs(), 'day')
}

onMounted(() => {
  loadDetail()
})

/** 拉取单据详情回填表单；拉取失败（不存在/无权访问）提示后回到列表 */
async function loadDetail() {
  if (!savedId.value)
    return
  pageLoading.value = true
  try {
    const { data } = await api.getDetail(savedId.value)
    form.value = {
      customerName: data.customerName,
      currency: data.currency,
      exchangeRate: data.exchangeRate,
      tradeTerm: data.tradeTerm,
      validUntil: data.validUntil,
      remark: data.remark ?? '',
      status: data.status,
      quotationNo: data.quotationNo,
      items: data.items,
    }
  }
  catch (error) {
    console.error(error)
    router.replace({ name: 'QuotationMgt' })
  }
  finally {
    pageLoading.value = false
  }
}

/** 草稿保存：新建走 create（回填服务端单号与 id），已有单走 update；校验不过打断保存 */
async function saveDraft(): Promise<number | null> {
  if (!form.value.customerName.trim()) {
    $message.warning('请输入客户名称')
    return null
  }
  if (!form.value.items.length) {
    $message.warning('请至少带入一条商品明细')
    return null
  }
  saving.value = true
  try {
    if (savedId.value) {
      await api.update({ ...pickFormPayload(), id: savedId.value })
      $message.success('草稿已保存')
      return savedId.value
    }
    // 新建：mock/后端返回完整单据，从中取服务端身份（crud 工厂的 create 泛型为 unknown，在此收口）
    const { data } = await api.create(pickFormPayload())
    const created = data as { id?: number, quotationNo?: string }
    if (created.id) {
      savedId.value = created.id
      form.value.quotationNo = created.quotationNo ?? ''
      syncIdToUrl(created.id)
    }
    $message.success('草稿已保存')
    return created.id ?? null
  }
  catch (error) {
    console.error(error)
    return null
  }
  finally {
    saving.value = false
  }
}

/** 提交给服务端的草稿载荷（本地形态 → 契约形状，status/quotationNo 等服务端字段不外传） */
function pickFormPayload() {
  const { customerName, currency, exchangeRate, tradeTerm, validUntil, remark, items } = form.value
  return { customerName, currency, exchangeRate, tradeTerm, validUntil, remark, items }
}

/** 新建落库后就地改写地址栏 id（不经 router.replace，避免 fullPath 变化触发整页重挂丢表单态） */
function syncIdToUrl(id: number) {
  const href = router.resolve({ path: route.path, query: { ...route.query, id: String(id) } }).href
  window.history.replaceState(window.history.state ?? null, '', href)
}

/** 发送 = 先落草稿再状态迁移；成功后重拉单据进入只读锁定态 */
async function handleSend() {
  const id = await saveDraft()
  if (!id)
    return
  try {
    await api.transition(id, 'send')
    $message.success('报价单已发送，单据已锁定')
    await loadDetail()
  }
  catch (error) {
    console.error(error)
  }
}

function handleVoid() {
  $dialog.confirm({
    content: '作废后单据进入终态且不可恢复，确定作废该报价单？',
    async confirm() {
      if (!savedId.value)
        return
      try {
        await api.transition(savedId.value, 'void')
        $message.success('报价单已作废')
        await loadDetail()
      }
      catch (error) {
        console.error(error)
      }
    },
  })
}

function goPrint() {
  if (!savedId.value)
    return
  router.push({ name: 'QuotationPrint', query: { id: String(savedId.value) } })
}

// ── 选品带入 ──

const skuPickerRef = ref<{ open: () => void } | null>(null)

// 临时行 id 用负数自减，与服务端主键空间隔离；保存后由服务端统一重排
let tempItemSeq = 0

function onPicked(options: SkuOption[]) {
  form.value.items = [
    ...form.value.items,
    ...options.map(option => ({
      id: --tempItemSeq,
      productId: option.productId,
      skuId: option.skuId,
      styleNo: option.styleNo,
      title: option.title,
      color: option.color,
      size: option.size,
      cost: option.cost,
      // 初始报价即成本（毛利率 0 起步），由业务员在行内上调
      unitPrice: option.cost,
      quantity: DEFAULT_PICK_QUANTITY,
    })),
  ]
  $message.success(`已带入 ${options.length} 条明细`)
}
</script>
