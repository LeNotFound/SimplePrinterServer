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
