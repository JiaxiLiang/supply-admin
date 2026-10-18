<template>
  <div class="min-h-full bg-#f0f2f5 dark:bg-#111815">
    <!-- 打印工具栏：print 态整体隐藏，只留 A4 版面 -->
    <div class="no-print mx-auto max-w-210mm flex items-center justify-between px-8 py-12">
      <NButton @click="router.back()">
        <i class="i-material-symbols:arrow-left-alt mr-4 text-16" />
        返回
      </NButton>
      <NButton type="primary" :disabled="!quotation" @click="handlePrint()">
        <i class="i-material-symbols:print-outline mr-4 text-16" />
        打印 / 存为 PDF
      </NButton>
    </div>

    <div class="mx-auto max-w-210mm px-8 pb-24">
      <n-spin :show="!quotation">
        <PiPrintTemplate v-if="quotation" :quotation="quotation" />
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
// PI 打印页：empty 布局（无侧栏/页签），按 ?id= 拉取单据后交由 PiPrintTemplate 渲染 A4 版面，
// 一键调起浏览器打印（可另存 PDF）。页面自身只负责取数与打印动作，版式全部在模板组件内
import type { Quotation } from '@/types/models'
import { NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import api from './api'
import PiPrintTemplate from './components/PiPrintTemplate.vue'

defineOptions({ name: 'QuotationPrint' })

const router = useRouter()
const route = useRoute()

const quotation = ref<Quotation | null>(null)

onMounted(async () => {
  const id = Number(route.query.id ?? 0)
  if (!id) {
    $message.error('缺少单据参数')
    return
  }
  try {
    const { data } = await api.getDetail(id)
    quotation.value = data
  }
  catch (error) {
    // 拉取失败（单据不存在或无权访问）：错误提示由 http 层统一弹出，此处留空版面
    console.error(error)
  }
})

function handlePrint() {
  window.print()
}
</script>

<style>
/* 打印态裁剪：工具栏与页面底色不进纸面，A4 版面独占输出 */
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
