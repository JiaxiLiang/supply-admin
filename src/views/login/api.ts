import type { LoginToken } from '@/types/models'
import { request } from '@/utils'

export default {
  // 用户登录：username 用户名，password 密码，captcha 图形验证码，isQuick 为 true 时走免验证码的快捷登录；返回 token 信息
  login: (data: { username: string, password: string, captcha?: string, isQuick?: boolean }) =>
    request.post<LoginToken>('/auth/login', data, { needToken: false }),

  // 验证码地址：mock 模式经适配器取 SVG 数据 URL（静态托管下无后端图片接口）；
  // 真实后端直连图片地址，时间戳绕过缓存。mock 分支收口在 api 边界，页面保持无感知
  getCaptchaUrl: (): Promise<string> => {
    if (import.meta.env.VITE_USE_MOCK === 'true')
      return request.get<string>('/auth/captcha', { needToken: false }).then(({ data }) => data)
    return Promise.resolve(`${import.meta.env.VITE_AXIOS_BASE_URL}/auth/captcha?${Date.now()}`)
  },
}
