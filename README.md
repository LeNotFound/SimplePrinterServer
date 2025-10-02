# 简易局域网 Web 打印平台

本项目在 `SimplePrinterServer/` 目录下提供“前后端分离”的 Web 打印平台示例：
- 后端：Node.js + Express（端口 3002）
- 前端：Vue 3 + Element Plus + Vite（端口 3003）

功能概览：
- 上传文件（pdf、jpg、png），保存服务器临时目录并返回文件 ID
- 预览文件：
  - pdf 直接返回
  - 图片直接返回
- 打印：调用 `lp -d <打印机名> 文件路径` 发送到 CUPS
- 打印队列查询：`lpstat -o`
- 通过常量 `PRINTER_NAME` 配置打印机名称（也支持环境变量 PRINTER_NAME）

重要提示（平台/依赖）：
- 打印和队列依赖 CUPS（lp/lpstat 命令）。建议在 Linux 打印服务器上运行后端。
- 若你在 Windows 开发机上调试：
  - 后端可以运行，但 `lp`/`lpstat`/`libreoffice` 命令需要在系统可用（例如 WSL 中安装 CUPS 与 LibreOffice，并将后端在 WSL 运行）；
  - 或将后端部署到 Linux 主机（推荐）。

目录结构：

```
SimplePrinterServer/
  backend/
    package.json
    src/
      server.js
    uploads/           # 运行时生成（已 .gitignore）
    tmp/               # 转换生成（已 .gitignore）
  frontend/
    package.json
    vite.config.js
    index.html
    src/
      main.js
      App.vue
    .env.example
  config.json
```

## 后端启动（端口 3002）

依赖：Node.js 18+，系统安装 CUPS（lp/lpstat）。

1. 安装依赖

```cmd
cd SimplePrinterServer\backend
npm install
```

2. 配置打印机名（可选）

- 修改 `src/server.js` 中的 `PRINTER_NAME` 默认值，或在环境变量中设置：

```cmd
set PRINTER_NAME=YOUR_PRINTER_NAME
```

3. 启动

- 开发模式（自动重载）：

```cmd
npm run dev
```

- 生产模式：

```cmd
npm start
```

服务将监听 `http://0.0.0.0:3002`，局域网其他设备可通过后端机器的 IP 访问。

（不再支持 DOCX 文件的上传与预览/打印。）

## 前端启动（端口 3003）

1. 安装依赖

```cmd
cd SimplePrinterServer\frontend
npm install
```

2. 开发运行

```cmd
npm run dev
```

默认通过 `http://localhost:3003` 访问前端。如后端不在本机，可在 `frontend/.env` 中设置：

```
VITE_BACKEND_URL=http://<后端IP>:3002
```

3. 构建与本地预览（可选）

```cmd
npm run build
npm run preview
```

## API 速览

- POST `/api/upload` 表单字段 `file`，返回 `{ id, name }`
- GET `/api/files` 返回已上传文件列表
- GET `/api/preview/:id` 预览（pdf 或图片；docx 自动转 pdf）
- POST `/api/print/:id` 提交打印（使用 `lp -d PRINTER_NAME`）
- GET `/api/queue` 返回 `lpstat -o` 的每行结果

## 集中配置（根目录 config.json）

在 `SimplePrinterServer/config.json` 中集中管理常用配置：

```json
{
  "printerName": "YOUR_PRINTER_NAME",
  "backendPort": 3002,
  "frontendPort": 3003,
  "upload": {
    "maxSizeMB": 50
  },
  "allowOrigins": ["*"]
}
```

- printerName：CUPS 中的打印机名称（等价于环境变量 PRINTER_NAME）
- backendPort：后端监听端口（等价于环境变量 BACKEND_PORT）
- frontendPort：前端开发服务器端口
- upload.maxSizeMB：上传大小限制（MB）
- allowOrigins：CORS 允许的来源，默认 `[*]` 表示允许任意来源

环境变量优先级高于文件配置，例如：

- Windows cmd 临时覆盖：
  ```cmd
  set PRINTER_NAME=HP_LaserJet_Professional_P1106
  set BACKEND_PORT=3200
  npm start
  ```

修改后，前后端都会读取该文件：
- 后端：在启动时读取 `config.json`，并应用端口、打印机名、上传大小、CORS 来源
- 前端：开发服务器读取 `config.json`，并将后端端口注入到运行时，前端会自动用 `window.location` + 该端口拼接请求地址（也可用 `VITE_BACKEND_URL` 完全覆盖）

## 常见问题

- 看不到打印机任务？检查后端主机是否安装并运行 CUPS：
  - `lpstat -r` 应显示调度程序在运行。
  - `lpstat -p` 应能看到目标打印机。
- docx 转换失败？确保安装 `libreoffice`，命令行能正常执行：
  - `libreoffice --headless --convert-to pdf <docx>`
- 跨域访问：后端已启用 CORS，默认允许前端直接访问。

## 许可证

仅用于教学/演示，按需修改。