# AGENTS.md

此文件为 Codex 在该仓库中工作时提供指导。

## 语言偏好

所有回答和对话使用简体中文。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (http://localhost:5173)
npm run build    # 生产构建（输出到 dist/）
npm run preview  # 预览生产构建
npm run deploy   # 构建 + 推送到 GitHub Pages（gh-pages 分支）
```

## Git 仓库

- GitHub: `git@github.com:Feilixy/Baby-Growth-Record.git`
- GitHub Pages: https://feilixy.github.io/Baby-Growth-Record/
- 部署分支: `gh-pages`（仅含 dist/ 内容，由 `npm run deploy` 自动管理）

## 技术架构

- **React 18** + **Vite 5**，移动端优先 SPA（`max-width: 480px`）
- **HashRouter**（`react-router-dom` v6），6 个页面路由
- **recharts** 图表库，**lucide-react** 图标，**date-fns** 日期工具
- **数据持久化**: Firebase Firestore（主） + localStorage（离线缓存/降级）
- **认证**: PIN 码（4-6 位数字），存储在 Firestore 的 `data/{pin}/` 路径下
- CSS 变量主题系统（粉色系），楷体系列可爱字体（`--font-cute`）

## 性能优化（2026-06-06 已完成）

### 构建优化
- **Firebase 拆分为独立 chunk**（`vite.config.js` 中 `manualChunks` 配置）：
  - 主 JS 包从 740 kB（193 kB gzip）降至 195 kB（**63 kB gzip**）
  - Firebase SDK（544 kB / 130 kB gzip）在后台按需加载，不阻塞首屏渲染
- **代码分割**：六个页面使用 `React.lazy()` 按需加载，首屏只下载当前页面代码
- 其他页面 chunk 均为 4-19 kB，极小

### 缓存策略
- **三级缓存**：内存 Map → localStorage → Firestore，逐级回退
- **缓存优先读取**：所有数据读取先从内存/本地缓存返回（< 5ms），Firestore 后台静默同步刷新
- **写入后自动失效**：增/删/改操作自动清除对应缓存，保证数据一致性
- **Firestore 离线持久化**：`enableMultiTabIndexedDbPersistence` 启用 IndexedDB 缓存

### Firebase 连接优化
- **匿名登录不阻塞**：`signInAnonymously()` 改为 fire-and-forget，`firebaseReady` 立即为 true
- **HTTP 长轮询**：`experimentalForceLongPolling: true` 替代 WebSocket，更好穿越防火墙
- **无限制缓存**：`cacheSizeBytes: CACHE_SIZE_UNLIMITED`

### 渲染优化
- **启动屏**：`index.html` 内置 CSS 动画启动屏（👶 宝宝成长记录 + 加载条），JS 加载前即刻显示
- **无全屏 loading**：Dashboard 始终立即渲染，各区块独立加载，数据到达后自动填充
- **profile 不阻塞整页**：profile=null 时显示&#34;正在加载宝宝信息...&#34;骨架，其他区块正常展示
- **Google Fonts 完全移除**：ZCOOL KuaiLe 在中国被墙，改用系统内置楷体（`Kaiti SC / KaiTi`），零外部资源依赖

### 预取策略
- **PIN 验证时预取**：`handleSetPin` 同步启动 5 个集合的数据读取，Dashboard 挂载时数据已在传输中
- **`firebaseReady` 依赖修复**：Dashboard 的 `refresh()` 依赖 `[today, firebaseReady]`，Firebase 就绪后自动重新拉取数据

### 禁止事项（性能角度）
- 不要添加新的外部字体/外部 CSS 资源（境外 CDN 从中国加载极慢）
- 不要在首页使用全屏 loading 指示器
- 不要在数据读取路径上等待 Firestore 响应

## ⚠️ 关键注意事项

- **`.env` 文件极易丢失**：被 .gitignore 忽略，`git checkout --orphan` 等操作会清除工作区文件。丢失后需手动重建（内容见下方 Firebase 配置）。
- **GitHub Pages 部署**：`vite.config.js` 必须设置 `base: '/Baby-Growth-Record/'`，否则资源路径错误导致白屏。
- **Firestore 安全规则**：首次创建或重置 Firebase 项目后，必须在 [Firebase Console](https://console.firebase.google.com/project/baby-growth-2d7a7/firestore/rules) 手动部署 `firestore.rules`，否则所有读写被拒绝。
- **沙箱 SSH 限制**：沙箱默认屏蔽 SSH 外连，git push/pull 需申请提权（`require_escalated`）。

## 项目结构

```
src/
├── main.jsx              # 入口，HashRouter + PinProvider 挂载
├── App.jsx               # 路由定义（Layout 嵌套路由）+ 登录判断
├── App.css               # 全局样式 + CSS 变量主题
├── components/
│   ├── Layout.jsx        # 页面布局壳（顶部内容区 + 底部导航）
│   ├── BottomNav.jsx     # 底部 5 标签导航栏
│   └── GrowthChart.jsx   # 生长曲线图（recharts，含百分位参考线）
├── pages/
│   ├── Dashboard.jsx     # 首页：宝宝信息、今日统计、快捷入口
│   ├── Growth.jsx        # 身高体重：记录 CRUD + 生长曲线图
│   ├── Photos.jsx        # 照片记录（Base64 存储）
│   ├── Milestones.jsx    # 里程碑记录
│   ├── Diaper.jsx        # 尿布记录
│   └── Settings.jsx      # 宝宝档案（姓名/生日/性别）+ 家庭码 + 数据清除
├── data/
│   └── growthStandards.js # WHO/中国卫健委生长参考数据（按月LMS参数，按周插值）
└── utils/
    ├── storage.js         # Firestore CRUD + localStorage 缓存封装
    ├── firebase.js        # Firebase 初始化（Firestore + Auth 匿名登录）
    ├── PinContext.jsx     # PIN 码登录 Context Provider
    └── dateUtils.js       # 日期工具
```

## 数据层

Firestore 路径结构：`data/{pin}/{collection}/{docId}`

| Collection | 结构 | 说明 |
|-----------|------|------|
| `profile/default` | `{ name, birthDate, gender }` | 宝宝档案 |
| `growth_records/{id}` | `{ id, date, height, weight }` | 身高(cm)/体重(kg) |
| `photos/{id}` | `{ id, date, data, note }` | data 为 Base64 图片 |
| `milestones/{id}` | `{ id, date, title, note }` | 里程碑事件 |
| `diaper_records/{id}` | `{ id, date, time, type }` | type: `'pee'`/`'poop'`/`'both'` |
| `daily_todos/{id}` | `{ id, text, period, order, lastCompletedDate }` | 每日待办，分上午/下午/晚上，lastCompletedDate 控制每日重置 |
| `upcoming_todos/{id}` | `{ id, text, order, targetDate, done, completedAt }` | 近期待办，带完成日期，done 后移入已完成列表 |

`storage.js` 使用三级缓存策略：内存 Map → localStorage → Firestore 后台同步。所有读取优先从缓存返回（< 5ms），Firestore 在后台静默刷新。写入时先写缓存再写 Firestore（fire-and-forget）。`getDb()` 返回 null 表示 Firebase 未配置。

## Firebase 配置

`.env` 文件（gitignore，需手动维护）：
```
VITE_FIREBASE_API_KEY=AIzaSyBLeuLru9FOyPkWS9bCFBteSdbZ-u3kFDs
VITE_FIREBASE_AUTH_DOMAIN=baby-growth-2d7a7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=baby-growth-2d7a7
VITE_FIREBASE_STORAGE_BUCKET=baby-growth-2d7a7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=92142155064
VITE_FIREBASE_APP_ID=1:92142155064:web:2f2431f8d393f7e0b0fdcd
```

`firestore.rules` 需在 Firebase Console 手动部署，当前规则为开放 `data/{pin}/` 下所有读写。

## 关键设计模式

- **数据流**：页面级 `useState` + 异步 `refresh()` 从 Firestore/缓存读取
- **PIN 认证**：`PinContext` 管理登录状态，`usePin()` hook 提供 `pinCode`/`isAuthenticated`/`firebaseReady`
- **ID 生成**：`Date.now().toString(36) + Math.random().toString(36).substring(2, 8)`
- **记录排序**：新增时自动按日期排序（生长记录升序，其他倒序）
- **生长曲线**：从 `Settings` 读取宝宝生日和性别 → 计算每条记录的周数 → 叠加 P1/P30/P50/P70/P99 五条参考线

## 生长标准数据

`src/data/growthStandards.js` 导出：
- `getReferenceValues(standard, gender, metric, week)` — 按周获取 P1/P30/P50/P70/P99 参考值
- `standard`: `'who'` | `'china'`，`gender`: `'boy'` | `'girl'`，`metric`: `'height'` | `'weight'`
- 数据来源：WHO 2006 + 中国 WS/T 423-2022，按月 LMS 参数存储，线性插值获得周级数据
