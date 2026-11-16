export class PlatformError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message)
  }
}

export class DeviceParameterError extends PlatformError {
  readonly details: {
    kind: 'DEVICE_PARAMETERS_REJECTED'
    path: string
    missingFields: string[]
  }
  constructor(path: string, device: Record<string, string | undefined>) {
    const missingFields = [
      'channel',
      'deviceType',
      'os',
      'brand',
      'model',
      'osVer',
      'appVer',
      'clientIp',
      'netStatus',
      'deviceId',
    ].filter((field) => !device[field]?.trim())
    super(
      400,
      `网易云拒绝当前设备参数。${missingFields.length ? `当前未配置：${missingFields.join('、')}。` : '已配置的 os/channel/brand 等字段未通过平台校验。'}这些字段需要与平台约定一致，不能由 AppID 或 PrivateKey 推导。个人应用的官方接入说明指向 ncm-cli；仅补充 AppSecret 无法解决此错误。`,
    )
    this.details = { kind: 'DEVICE_PARAMETERS_REJECTED', path, missingFields }
  }
}
