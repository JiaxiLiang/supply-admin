<template>
  <n-dropdown :options="options" @select="handleSelect">
    <div id="user-dropdown" class="flex cursor-pointer items-center">
      <n-avatar round :size="36" :src="userStore.avatar" />
      <div v-if="userStore.userInfo" class="ml-12 flex-shrink-0">
        <span class="text-14">{{ userStore.nickName ?? userStore.username }}</span>
      </div>
    </div>
  </n-dropdown>

  <RoleSelect ref="roleSelectRef" />
</template>

<script setup lang="ts">
// 顶栏用户头像下拉：多角色时的角色切换弹窗、退出登录确认；id 供新手引导定位
import type { DropdownOption } from 'naive-ui'
import api from '@/api'
import { RoleSelect } from '@/layouts/components'
import { useAuthStore, useUserStore } from '@/store'

const userStore = useUserStore()
const authStore = useAuthStore()

// computed 组装使选项随权限/角色实时显隐（n-dropdown 按 show 隐藏项）
const options = computed<DropdownOption[]>(() => [
  {
    label: '切换角色',
    key: 'toggleRole',
    icon: () => h('i', { class: 'i-basil:exchange-solid text-14' }),
    show: userStore.roles.length > 1,
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h('i', { class: 'i-mdi:exit-to-app text-14' }),
  },
])

const roleSelectRef = ref<InstanceType<typeof RoleSelect> | null>(null)
/** 按下拉 key 分发：开角色弹窗（成功回调里整页刷新以重建权限与环境）/ 确认后退出登录 */
function handleSelect(key: string | number) {
  switch (key) {
    case 'toggleRole':
      roleSelectRef.value?.open({
        onOk() {
          location.reload()
        },
      })
      break
    case 'logout':
      $dialog.confirm({
        title: '提示',
        type: 'info',
        content: '确认退出？',
        async confirm() {
          try {
            await api.logout()
          }
          catch (error) {
            console.error(error)
          }
          authStore.logout()
          $message.success('已退出登录')
        },
      })
      break
  }
}
</script>
