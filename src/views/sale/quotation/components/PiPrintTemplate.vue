<template>
  <div class="pi-sheet mx-auto w-210mm bg-white px-14mm py-12mm text-#333">
    <!-- 抬头 -->
    <div class="flex items-start justify-between border-b-2 border-#333 pb-12">
      <div>
        <div class="text-22 font-bold tracking-wide">
          PROFORMA INVOICE
        </div>
        <div class="mt-2 text-12 opacity-60">
          形式发票 / 销售确认书
        </div>
      </div>
      <div class="text-right text-12 leading-6">
        <div>No. <b>{{ quotation.quotationNo }}</b></div>
        <div>Date: {{ quotation.createTime.slice(0, 10) }}</div>
        <div>Valid Until: {{ quotation.validUntil }}</div>
      </div>
    </div>

    <!-- 买卖双方 -->
    <div class="mt-12 flex gap-24 text-12 leading-6">
      <div class="flex-1">
        <div class="mb-4 font-bold">
          SELLER 卖方
        </div>
        <div class="font-semibold">
          {{ PI_SELLER.name }}
        </div>
        <div class="opacity-70">
          {{ PI_SELLER.address }}
        </div>
        <div class="opacity-70">
          {{ PI_SELLER.contact }}
        </div>
      </div>
      <div class="flex-1">
        <div class="mb-4 font-bold">
          BUYER 买方
        </div>
        <div class="font-semibold">
          {{ quotation.customerName }}
        </div>
        <div class="opacity-70">
          Attn: Purchase Dept.
        </div>
      </div>
    </div>

    <!-- 贸易条款 -->
    <div class="grid grid-cols-4 mt-12 gap-8 text-12">
      <div class="pi-term">
        <div class="opacity-60">
          Trade Term
        </div>
        <div class="font-semibold">
          {{ quotation.tradeTerm }}
        </div>
      </div>
      <div class="pi-term">
        <div class="opacity-60">
          Currency
        </div>
        <div class="font-semibold">
          {{ quotation.currency }}
        </div>
      </div>
      <div class="pi-term">
        <div class="opacity-60">
          Exchange Rate (→CNY)
        </div>
        <div class="font-semibold">
          {{ quotation.exchangeRate }}
        </div>
      </div>
      <div class="pi-term">
        <div class="opacity-60">
          Sales Confirmor
        </div>
        <div class="font-semibold">
          {{ quotation.creatorName }}
        </div>
      </div>
    </div>

    <!-- 明细表 -->
    <table class="mt-12 w-full border-collapse text-12">
      <thead>
        <tr class="bg-#f2f3f5 text-left">
          <th class="pi-td w-8">
            #
          </th>
          <th class="pi-td">
            Style No.
          </th>
          <th class="pi-td">
            Description 品名
          </th>
          <th class="pi-td">
            Color
          </th>
          <th class="pi-td">
            Size
          </th>
          <th class="pi-td text-right">
            Qty
          </th>
          <th class="pi-td text-right">
            Unit Price
          </th>
          <th class="pi-td text-right">
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in quotation.items" :key="item.id">
          <td class="pi-td">
            {{ index + 1 }}
          </td>
          <td class="pi-td whitespace-nowrap">
            {{ item.styleNo }}
          </td>
          <td class="pi-td">
            {{ item.title }}
          </td>
          <td class="pi-td">
            {{ item.color }}
          </td>
          <td class="pi-td">
            {{ item.size }}
          </td>
          <td class="pi-td text-right">
            {{ item.quantity.toLocaleString('en-US') }}
          </td>
          <td class="pi-td text-right">
            {{ formatMoney(item.unitPrice, quotation.currency) }}
          </td>
          <td class="pi-td text-right">
            {{ formatMoney(item.unitPrice * item.quantity, quotation.currency) }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 合计 -->
    <div class="mt-12 flex items-end justify-between">
      <div class="text-12 leading-6 opacity-70">
        <div>Remark: {{ quotation.remark || '--' }}</div>
        <div>Total in CNY (approx.): {{ formatMoney(totals.totalAmountCny, 'CNY') }}</div>
      </div>
      <div class="text-right text-14">
        <span class="mr-12 font-bold">TOTAL ({{ quotation.currency }})</span>
        <span class="text-18 font-bold">{{ formatMoney(totals.totalAmount, quotation.currency) }}</span>
      </div>
    </div>

    <!-- 签署栏 -->
    <div class="mt-48 flex justify-between text-12">
      <div class="w-210px">
        <div>For the Seller 卖方签署：</div>
        <div class="mt-36 border-t border-#999" />
      </div>
      <div class="w-210px">
        <div>For the Buyer 买方签署：</div>
        <div class="mt-36 border-t border-#999" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// PI 打印模板：把报价单渲染为 A4 形式发票。纯展示组件——只消费 quotation 契约与 money 工具，
// 不发请求、不弹交互；金额全部由分经 formatMoney 换算，与页面口径同源
import type { Quotation } from '@/types/models'
import { formatMoney } from '@/utils/money'
import { calcQuotationTotals, PI_SELLER } from '../model'

const props = defineProps<{
  quotation: Quotation
}>()

const totals = computed(() => calcQuotationTotals(props.quotation.items, props.quotation.exchangeRate))
</script>

<style>
/* A4 版面：屏幕态加投影便于预览，打印态由 @page 接管页边距（模板自身留白即页边距） */
.pi-sheet {
  min-height: 296mm;
  box-shadow: 0 2px 16px rgb(0 0 0 / 12%);
}
.pi-term {
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  padding: 6px 10px;
}
.pi-td {
  border: 1px solid #e5e6eb;
  padding: 6px 8px;
  vertical-align: top;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }
  body {
    background: #fff !important;
  }
  .pi-sheet {
    width: 100% !important;
    min-height: auto;
    box-shadow: none !important;
  }
}
</style>
