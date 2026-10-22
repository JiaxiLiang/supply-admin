import type { EnableRow } from './useEnableRow'
import { NSwitch } from 'naive-ui'
import { h } from 'vue'

/** 状态开关两侧的文案（缺省 启用/停用，商品页替换为 上架/下架） */
export interface EnableSwitchTexts {
  checked?: string
  unchecked?: string
}

/**
 * 表格「状态开关」单元格渲染工厂：NSwitch 行级开关（行 loading + 可换文案 + 可禁用）。
 * user/role/product/resource 四页同构渲染在此收口为唯一实现（跨页复用走 composables 通道）
 * @param row 行数据（enable + 行级 enableLoading，见 useEnableRow 的 EnableRow）
 * @param handleEnable 开关切换处理（一般来自 useEnableRow 标准件的 handleEnable）
 * @param texts 开关两侧文案
 * @param disabled 禁用开关（如角色页超管行不可编辑）
 */
export function renderEnableSwitch(
  row: EnableRow,
  handleEnable: (row: EnableRow) => void,
  texts: EnableSwitchTexts = {},
  disabled = false,
) {
  return h(
    NSwitch,
    {
      size: 'small',
      rubberBand: false,
      value: row.enable,
      loading: !!row.enableLoading,
      disabled,
      onUpdateValue: () => handleEnable(row),
    },
    {
      checked: () => texts.checked ?? '启用',
      unchecked: () => texts.unchecked ?? '停用',
    },
  )
}
