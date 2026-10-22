import type { CSSProperties } from 'vue'

/**
 * useModal 与 MeModal 共用的组件类型定义，独立成文件以避免二者循环依赖
 */

/** MeModal.open() 的入参（组件 props 与运行时 options 合并后的形状） */
export interface ModalOptions {
  width?: string
  title?: string
  closable?: boolean
  cancelText?: string
  okText?: string
  showFooter?: boolean
  showCancel?: boolean
  showOk?: boolean
  modalStyle?: CSSProperties
  contentStyle?: CSSProperties
  /** 返回 false 可阻止弹窗关闭 */
  onOk?: (data?: unknown) => Promise<unknown> | unknown
  onCancel?: (data?: unknown) => Promise<unknown> | unknown
  /** 运行时内部字段，由 modal 自身维护，调用方不传 */
  okLoading?: boolean
}

/** MeModal 组件 defineExpose 必须满足的形状 */
export interface MeModalExposed {
  open: (options?: Partial<ModalOptions>) => Promise<void>
  close: () => void
  handleOk: (data?: unknown) => Promise<void>
  handleCancel: (data?: unknown) => Promise<void>
  okLoading: boolean
  options: ModalOptions
}

/** MeCrud 组件 defineExpose 的形状：页面侧 $table 模板 ref 统一引用此类型，契约单一来源 */
export interface MeCrudExposed {
  /** 发起搜索（keepCurrentPage true 按当前页码重查；常规搜索一律回第 1 页） */
  handleSearch: (keepCurrentPage?: boolean) => void
  /** 重置查询条件并回第 1 页 */
  handleReset: () => void
  /** 导出当前表格为 Excel */
  handleExport: () => void
}
