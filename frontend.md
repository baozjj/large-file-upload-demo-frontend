# Role

你是一名资深前端工程师。我们要开发 `large-file-upload-demo` 的前端。

# Requirements

1. **HTTPS 核心**：修改 `vite.config.js`，配置 `server.https` 选项，加载本地 `mkcert` 生成的证书，使 Vite 开发服务器运行在 HTTPS 下。
2. **UploadManager 类**：
   - 构造函数接收 `domainList` (数组)，例如 `['https://u1.local.com:443', 'https://u2.local.com:443']`。
   - 实现任务调度：使用 `chunkIndex % domainList.length` 轮询选取目标域名。
   - 实现并发控制：利用一个任务队列，确保同一时间向不同域名发送的分片请求总数不超过设定阈值。
3. **界面展示**：
   - 文件上传进度条。
   - 控制台输出每个分片上传的目标域名（用于验证是否真的在向不同域名发起请求）。

# Constraints

- 请解释为什么 Vite 配置 HTTPS 后，前端才能通过浏览器向后端发起 HTTP/2 请求。
- 请说明前端如何正确处理跨域请求（Fetch/Axios）时，确保 Cookie 或 Auth Token 能正常携带。
