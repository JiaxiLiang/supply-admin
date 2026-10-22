<template>
  <AppCard bordered bg="#fafafc dark:black" class="mb-30 min-h-60">
    <!-- 包一层 form：搜索输入框内按回车即可触发搜索 -->
    <form class="flex justify-between p-16" @submit.prevent="emit('search')">
      <n-scrollbar x-scrollable>
        <!-- 可展开的搜索栏在收起态强制单行（超出部分横向滚动），展开后允许换行铺开 -->
        <n-space :wrap="!expand || isExpanded" :size="[32, 16]" class="p-10">
          <slot />
        </n-space>
      </n-scrollbar>
      <div class="flex-shrink-0 p-10">
        <n-button ghost type="primary" @click="emit('reset')">
          <i class="i-fe:rotate-ccw mr-4" />
          重置
        </n-button>
        <n-button attr-type="submit" class="ml-20" type="primary">
          <i class="i-fe:search mr-4" />
          搜索
        </n-button>

        <template v-if="expand">
          <n-button v-if="!isExpanded" type="primary" text @click="isExpanded = true">
            <i class="i-fe:chevrons-down ml-4" />
            展开
          </n-button>
          <n-button v-else text type="primary" @click="isExpanded = false">
            <i class="i-fe:chevrons-up ml-4" />
            收起
          </n-button>
        </template>
      </div>
    </form>
  </AppCard>
</template>

<script setup lang="ts">
// MeCrud 搜索栏：查询项插槽（页面经 MeQueryItem 填充）+ 重置/搜索按钮 + 可展开/收起。
// 展开收起是本栏私有的交互状态，自持不外泄；查询动作只上抛 search/reset 两个事件，
// 查询条件数据仍由页面持有（经 MeCrud 的 v-model:queryItems）
defineProps<{
  /** 是否显示展开/收起按钮 */
  expand?: boolean
}>()

const emit = defineEmits<{
  search: []
  reset: []
}>()

const isExpanded = ref(false)
</script>
