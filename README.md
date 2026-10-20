# Holiday-Statistics-Calendar
多人共享的假期统计日历：任何人都可以添加姓名和日期区间，所有人都能看到彼此的假期。

- `backend/`：Node.js + Express + SQLite 的 REST API（见 `backend/README.md`）
- `frontend/`：静态网站（HTML/CSS/JS），可部署到 GitHub Pages

## 本地运行
```bash
cd backend && npm install && npm start   # http://localhost:3000
# 另开终端，打开 frontend/index.html（或 npx serve frontend）
```

## 部署
1. 后端部署到 Render / Railway（Root Directory 设为 `backend`，Start 命令 `npm start`）。
2. 修改 `frontend/script.js` 顶部的 `API_BASE` 为后端地址（或在 `index.html` 引入脚本前设置 `window.API_BASE`）。
3. GitHub Pages：Settings → Pages → 选择分支，目录选 `/frontend`（如无此选项可用 GitHub Actions 部署 `frontend` 目录）。
