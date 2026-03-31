# 域名展示面板

## 一个Web端域名状态监控、支持多方式到期提醒、可视化展示，支持多平台部署



<p align="center">
  <img src="./logo.webp" alt="logo" />
</p>

<p align="center">
  <a href="https://reactjs.org/">
    <img src="https://img.shields.io/badge/React-18.3.1-lightblue.svg?logo=react&logoColor=61DAFB" alt="React">
  </a>
  <a href="https://vitejs.dev/">
    <img src="https://img.shields.io/badge/Vite-5.4.8-violet.svg?logo=vite&logoColor=646CFF" alt="Vite">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-4.9.5-blue.svg?logo=typescript&logoColor=3178C6" alt="TypeScript">
  </a>
  <a href="https://github.com/zxlwq/domain">
    <img src="https://img.shields.io/badge/GitHub-Repo-black.svg?logo=github&logoColor=black" alt="GitHub Repo">
  </a>
  <a href="https://pages.cloudflare.com/">
    <img src="https://img.shields.io/badge/Cloudflare-Pages-orange.svg?logo=cloudflare&logoColor=F38020" alt="Cloudflare Pages">
  </a>
  <a href="https://vercel.com/">
    <img src="https://img.shields.io/badge/Vercel-Deploy-black.svg?logo=vercel&logoColor=white" alt="Vercel">
  </a>
  <a href="https://pages.edgeone.ai/">
    <img src="https://img.shields.io/badge/EdgeOne-Pages-blue.svg?logo=cloudflare&logoColor=blue" alt="EdgeOne Pages">
  </a>
</p>


![domain](./domain.webp)




---




## 📦 多平台部署

本项目支持多平台部署：

| 部署平台 | 数据库 |
|---------|--------|
| Cloudflare Pages | D1数据库 |
| EdgeOne Pages | Neon数据库 |
| Vercel | Neon数据库 |
| Hugging Face Spaces | Neon数据库 |
| Koyeb | Neon数据库 |
| Render | Neon数据库 |
| Docker | Neon数据库 |




---





# 🚀 快速部署

## Cloudflare 部署
1. Fork该项目
2. 进入 [Workers 和 Pages](https://dash.cloudflare.com/workers-and-pages)  点击 **创建应用程序**
3. 选择 **Continue with GitHub** 或者点击下方的 **想要部署 Pages？开始使用**
4. 选择 **导入现有 Git 存储库**
3. 选择 Fork 的该项目 Git 存储库
4. 框架预设：**React(Vite)**
5. 添加环境变量
6. 部署完成后绑定D1数据库
7. 添加自定义域名




---



## Vercel 部署
1. Fork该项目
2. 进入 [Vercel](https://vercel.com/dashboard)
3. Storage选项栏点击 "Create Database" 创建Neon数据库并获取数据库连接字符串：DATABASE_URL=postgresql://
4. 点击 "Add new project"，连接你的 GitHub 仓库
5. 添加环境变量
6. 部署完成后添加自定义域名




---




## EdgeOne Pages部署
1. Fork该项目
2. 创建[Neon数据库](https://neon.tech/)并获取数据库连接字符串：DATABASE_URL=postgresql://
3. 进入 [EdgeOne Pages](https://console.tencentcloud.com/edgeone/pages)
4. 点击 "创建项目"，连接你的 GitHub 仓库
5. 添加环境变量
6. 部署完成后添加自定义域名



---




## Hugging Face Spaces部署
### 使用 [domain-api.yml](.github/workflows/domain-api.yml) 创建 Spaces

1. 创建[Neon数据库](https://neon.tech/)并获取数据库连接字符串：DATABASE_URL=postgresql://

2. **创建Token（需要写权限）**

3. **运行GitHub Actions**

4. **自动创建 Spaces**
   - 脚本会自动创建 Hugging Face Spaces
   - 设置所有必要的环境变量




---



## 🔔 通知方式支持
   - Wxpush (Webhook)
   - Telegram Bot
   - Server酱
   - Qmsg酱


---




## 🔧 环境变量配置

**配置环境变量 (必需)**
   - `DATABASE_URL`: Neon数据库连接字符串，除Cloudflare以外平台部署需Neon数据库
   - `PASSWORD`: 管理员密码
   - `CF_KEY`: 导入托管在Cloudflare的域名
   - `WXPUSH_URL`: 部署的wxpush服务地址，推荐部署该项目[WXPush - 微信消息推送服务](https://github.com/frankiejun/wxpush)
   - `API_TOKEN`: 用于接口调用的访问令牌，请设置一个足够复杂的随机字符串

| 变量名 | 是否必需 | 说明 | 示例 |
|--------|------|------|------|
| `DATABASE_URL` | ✅ | Neon 数据库连接字符串 | postgresql://xxxx |
| `PASSWORD` | ✅ | 管理员密码 | 123456 |
| `GIT_TOKEN` | ❌ | GitHub Token | ghp_xxxxxxxx |
| `CF_KEY` | ✅ | Cloudflare API Token | xxxxxxx |
| `WEBDAV_URL` | ❌ | WebDAV 服务器地址 | https://dav.example.com/ |
| `WEBDAV_USER` | ❌ | WebDAV 用户名 | admin |
| `WEBDAV_PASS` | ❌ | WebDAV 密码 | admin |
| `WXPUSH_URL` | ✅ | wxpush服务地址| https://wxpush.pages.dev |
| `API_TOKEN` | ✅ | 与wxpush项目的 API_TOKEN 一致 | a123b45c6 |
| `TG_BOT_TOKEN` | ❌ | Telegram Bot Token | 123456789:AAxxxx |
| `TG_USER_ID` | ❌ | Telegram User ID | 1001234567890 |
| `WECHAT_SENDKEY` | ❌ | Server酱 Token | SCTxxxxxx |
| `QMSG_KEY` | ❌ | Qmsg酱 Token | xxxxxx |
| `QMSG_QQ` | ❌ | QQ号 | `123456789` |





---



# 配置数据库

## Cloudflare Pages (D1 数据库)
1. 在 Cloudflare 创建 D1 数据库，命名为 `domain`
2. 在 D1 控制台执行以下 SQL 初始化建表语句
3. 在 Pages 项目设置中绑定 D1 数据库，绑定名为 `DOMAIN`

```sql
CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT UNIQUE NOT NULL,
  registrar TEXT NOT NULL,
  register_date TEXT NOT NULL,
  expire_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  renewUrl TEXT
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address TEXT,
  device_info TEXT,
  domain TEXT,
  notification_method TEXT,
  error_details TEXT
);

CREATE TABLE IF NOT EXISTS notification_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warning_days TEXT NOT NULL,
  notification_enabled TEXT NOT NULL,
  notification_interval TEXT NOT NULL,
  notification_method TEXT NOT NULL,
  bg_image_url TEXT,
  carousel_interval INT,
  carousel_enabled TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_expire_date ON domains(expire_date);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_logs_domain ON logs(domain);
```



> 其它平台部署先注册 [Neon](https://neon.tech/) 并创建数据库
> 获取数据库连接字符串：DATABASE_URL=postgresql://username:password@host:port/database


## 如果您喜欢这个项目，请给一个⭐星标！