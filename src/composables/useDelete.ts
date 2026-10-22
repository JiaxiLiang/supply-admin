import type { DialogOptions } from 'naive-ui'
import type { ApiResult } from '@/utils/http'

/**
 * 确认删除标准件：确认框 → 调删除接口 → 成功提示并回调刷新。
 * 与 useEnableRow 同级的行级动作标准件，useCrud 的 handleDelete 与资源管理页的按钮删除共用此实现
 * @param doDelete 删除接口（id 为后端主键，删除目标必存在，故参数必填）
 * @param onDeleted 删除成功后的回调（一般用于刷新列表，收下接口返回值自行决定用法）
 */
export function useDelete(
  doDelete: (id: number) => Promise<ApiResult<unknown>>,
  onDeleted: (data: ApiResult<unknown>) => void,
) {
  /** 删除：弹确认框后调删除接口并触发回调；id 缺省（且非 0）时静默返回，不弹确认框 */
  function handleDelete(id: number | undefined, confirmOptions?: Partial<DialogOptions>) {
    if (!id && id !== 0)
      return
    const d = $dialog.warning({
      content: '确定删除？',
      title: '提示',
      positiveText: '确定',
      negativeText: '取消',
      async onPositiveClick() {
        try {
          d.loading = true
          const data = await doDelete(id)
          $message.success('删除成功')
          d.loading = false
          onDeleted(data)
        }
        catch (error) {
          console.error(error)
          d.loading = false
        }
      },
      ...confirmOptions,
    })
  }
  return { handleDelete }
}
