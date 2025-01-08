addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * 核心处理逻辑
 * @param {Request} request 
 * @returns
 */
async function handleRequest(request) {
  // 获取用户访问的URL对象
  const url = new URL(request.url)
  // 移除开头的“/”以便获取真正目标链接
  // 例如：https://gh.mydomain.com/https://github.com/xxxx -> "https://github.com/xxxx"
  let targetUrl = url.pathname.replace(/^\/+/, '')

  // 如果你希望兼容“/raw/https://...”或其他自定义前缀路径，可自行在此处理
  // 例如：targetUrl = url.pathname.replace(/^\/raw\//, '')

  // 如果用户没有带 https:// 或 http://，则提示不合法
  if (!/^https?:\/\//i.test(targetUrl)) {
    return new Response(
      '请求路径不合法，请在 gh.mydomain.com/<完整目标URL> 的形式下访问',
      { status: 400 }
    )
  }

  // 解析出真实目标，供后续 fetch 使用
  const realTarget = new URL(targetUrl)

  // 复制原请求头，准备传给目标服务
  const newHeaders = new Headers(request.headers)

  // 调整 Host、Origin 等头，避免后端识别错误
  // 也可以选择保留原始 header
  newHeaders.set('Host', realTarget.host)
  newHeaders.set('Origin', realTarget.origin)

  // 根据需要自定义 UA 等，如果不想改则可注释掉
  // newHeaders.set('User-Agent', 'Mozilla/5.0 (compatible; Cloudflare-Worker/1.0)')

  // 构造新的请求，method、body 等保持和原请求一致
  // 一般下载仅需 GET/HEAD，但也可兼容其他请求
  const newRequestInit = {
    method: request.method,
    headers: newHeaders,
    redirect: 'follow'
  }

  // 如果是 GET/HEAD 以外的方法，可能需要传递 body
  // 例如 POST 时：将 request.body 继续透传
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // body 只能在可读取的情况下继续传
    newRequestInit.body = request.body
  }

  // 发起到 GitHub (或其他目标地址) 的请求
  // 可选择开启 Cloudflare 的缓存功能，如 cacheEverything
  // 需要注意 GitHub 是否会对某些文件的缓存行为有限制
  let fetchResponse
  try {
    fetchResponse = await fetch(realTarget, {
      ...newRequestInit,
      cf: {
        // 是否缓存一切，按需决定
        cacheEverything: true,
        // 缓存TTL, 单位秒，例如 1 小时
        cacheTtl: 3600
      }
    })
  } catch (err) {
    return new Response(`请求目标文件失败: ${err.toString()}`, { status: 502 })
  }

  // 将 GitHub 返回的响应透传给客户端
  // 如果需要，可以根据返回码或头信息做更多处理
  // 例如强制添加跨域头，或去除某些不必要的头
  const responseHeaders = new Headers(fetchResponse.headers)

  // 示例：添加 CORS 头以供前端 JS 等跨域访问（可选）
  // responseHeaders.set('Access-Control-Allow-Origin', '*')
  // responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS')

  return new Response(fetchResponse.body, {
    status: fetchResponse.status,
    statusText: fetchResponse.statusText,
    headers: responseHeaders
  })
}
