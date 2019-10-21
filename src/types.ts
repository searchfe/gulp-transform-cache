export interface File {
  contents: Buffer,
  stat: {
    mtimeMs: number
  },
  path: string,
  /** 依赖的物理文件列表 */
  depFiles?: string[],
  /** md5缓存 减少后续插件计算时间 */
  _cacheMd5?: string
}
