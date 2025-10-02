# 前端（Vue 3 + Element Plus）

仅支持 PDF、JPG、PNG 文件的上传与预览/打印。

后端地址默认自动推断为 `http(s)://<当前主机>:3002`，无需本地强写 `localhost`。
如需自定义，可在 `.env` 设置：`VITE_BACKEND_URL` 覆盖。

## 启动

1. 安装依赖

```
npm install
```

2. 本地开发（默认 3003）

```
npm run dev
```

3. 构建 & 预览

```
npm run build
npm run preview
```

可在 `.env` 中设置后端地址：

```
VITE_BACKEND_URL=http://<后端服务器IP>:3002
```

## 移动端适配说明

- 布局：小屏下文件列表与预览区域上下堆叠（xs=24），中屏及以上左右布局（md=8/16）。
- 触控：列表项与按钮的触控区域加大，方便手机操作。
- 预览高度：桌面端约 600px；移动端按 70vh 自适应。
- PDF 预览：内嵌 iframe 并允许全屏，同时提供“在新窗口打开 PDF”按钮以兼容 iOS/Safari 的限制。

## 常见问题（移动端）

1) iOS Safari 内嵌 PDF 黑屏/不显示？
	- 点击“在新窗口打开 PDF”，让系统内置查看器处理；或使用支持内嵌 PDF 的第三方浏览器。

2) 预览报 Mixed Content？
	- 若前端是 HTTPS 而后端是 HTTP，浏览器会拦截混合内容。建议用反向代理把 `/api` 转发到同域同协议，或给后端提供 HTTPS。

3) 无法全屏？
	- 已设置 allowfullscreen，但不同设备/浏览器限制各异。可尝试新窗口打开。
