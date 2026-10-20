# 后端 (Node.js + Express + SQLite)

```bash
npm install
npm start        # 默认端口 3000，可用 PORT 环境变量修改
```

数据保存在 `holidays.db`（首次启动自动创建，可用 `DB_PATH` 指定路径）。

## API
- `GET /api/holidays` 获取所有假期
- `POST /api/holidays` 添加，JSON: `{"name":"张三","start_date":"2026-12-20","end_date":"2026-12-22"}`
- `DELETE /api/holidays/:id` 删除

## 部署到 Render / Railway
- Root Directory: `backend`，Build: `npm install`，Start: `npm start`
- 免费实例文件系统可能不持久；如需持久保存请挂载磁盘并设置 `DB_PATH`。
