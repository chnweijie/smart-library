
# 智慧图书管理系统

一个功能丰富的图书管理系统，包含人脸情绪分析、人脸识别登录、图书借阅、评论、消息通知等功能。

## 技术栈

- **前端**: React + JavaScript + Vite + Ant Design
- **后端**: Spring Boot + MyBatis Plus + MySQL
- **移动端**: React Native
- **人脸分析**: face-api.js
- **其他**: Redis (可选, 用于缓存)

## 项目结构

```
daxiangmu/
├── frontend/          # React 前端
├── backend/           # Spring Boot 后端
├── mobile/            # React Native 移动端
├── docs/              # 文档
├── scripts/           # 脚本 (数据库初始化等)
└── README.md          # 项目说明
```

## 功能特性

### 用户系统
- 游客模式（可浏览，不可操作）
- 用户注册/登录
- 账号密码登录
- 人脸识别登录
- 人脸信息录入
- 个人中心

### 图书管理
- 图书浏览、搜索、筛选
- 图书详情
- 图书分类
- 图书评论/评分
- 评论点赞/回复

### 借阅系统
- 图书借阅
- 申请归还
- 管理员审核归还
- 借阅历史
- 图书预约

### 智能功能
- 人脸情绪分析
- 基于情绪的图书推荐
- 情绪历史记录

### 消息通知
- 借阅到期提醒
- 预约到馆通知
- 评论回复通知
- 审核结果通知
- 系统公告

### 管理员功能
- 图书管理 (CRUD)
- 用户管理
- 借阅记录管理
- 归还审核
- 数据统计
- 系统公告发布

## 快速开始

### 1. 数据库初始化

确保已安装 MySQL，然后执行：

```bash
mysql -u root -p < scripts/init-database.sql
```

默认测试账号：
- 管理员: `admin` / `admin123`
- 普通用户: `user` / `user123`

### 2. 后端启动

默认使用 `dev` 配置。生产环境请设置环境变量：

- `DB_USERNAME` / `DB_PASSWORD` — 数据库账号
- `JWT_SECRET` — JWT 签名密钥（建议 Base64 随机串，长度 ≥ 32 字节）
- `CORS_ORIGINS` — 允许的前端源，逗号分隔（默认 `http://localhost:3000`）

详见 `backend/README.md`

### 3. 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端使用 React Router，主要路径：`/` 首页、`/borrow` 借阅、`/emotion` 情绪分析、`/admin/comments` 评论审核等。

生产构建后需配置 Web 服务器将所有路由回退到 `index.html`（Vite 开发服务器已启用 `historyApiFallback`）。

详见 `frontend/README.md`

### 4. 移动端启动

详见 `mobile/README.md`

## API 文档

启动后端后，访问 `http://localhost:8080/doc.html` 查看 Knife4j 接口文档。

## 数据库设计

详见 `docs/database-design.md`

## 开发计划

- [ ] 第一阶段: 基础功能 (用户注册登录、图书管理、基础借阅)
- [ ] 第二阶段: 增强功能 (评论系统、消息通知、数据统计)
- [ ] 第三阶段: 人脸功能 (人脸识别登录、情绪分析)
- [ ] 第四阶段: 智能推荐 (基于情绪和历史的推荐)

## 许可证

MIT

