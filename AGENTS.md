# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 语言偏好

所有回答和对话使用简体中文。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (http://localhost:5173)
npm run build    # 生产构建 (输出到 dist/)
npm run preview  # 预览生产构建
```

## 技术架构

- **React 18** + **Vite 5**，移动端优先 SPA（`max-width: 480px`）
- **HashRouter**（`react-router-dom` v6），6 个页面路由
- **recharts** 图表库，**lucide-react** 图标，**date-fns** 日期工具
- 所有数据持久化在 **localStorage**，无后端/数据库
- CSS 变量主题系统（粉色系），`ZCOOL KuaiLe` 可爱字体

## 项目结构

```
src/
├── main.jsx              # 入口，HashRouter 挂载
├── App.jsx               # 路由定义（Layout 嵌套路由）
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
│   └── Settings.jsx      # 宝宝档案（姓名/生日/性别）+ 数据清除
├── data/
│   └── growthStandards.js # WHO 和中国卫健委生长参考数据（按月LMS参数，支持按周插值）
└── utils/
    ├── storage.js        # localStorage CRUD 封装（profile/growth/photos/milestones/diaper）
    └── dateUtils.js      # 日期工具（formatDate/getAge/todayStr 等）
```

## 关键设计模式

- **数据流**：页面级 `useState` 管理状态，通过 `storage.js` 工具函数读写 localStorage，修改后调用 `refresh()` 重新读取
- **ID 生成**：`Date.now().toString(36) + Math.random().toString(36).substring(2, 8)`
- **记录排序**：新增时自动按日期排序（生长记录升序，其他倒序），编辑/更新后不重新排序
- **模态表单**：`showForm` + `editing` 双状态控制，复用同一表单组件处理添加/编辑
- **生长曲线**：从 `Settings` 读取宝宝生日和性别 → 计算每条记录的周数 → 在 recharts 中叠加 P1/P30/P50/P70/P99 五条参考百分位线

## localStorage 数据结构

| Key | 结构 | 说明 |
|-----|------|------|
| `baby_profile` | `{ name, birthDate, gender }` | 宝宝档案，gender 为 `'boy'`/`'girl'` |
| `growth_records` | `[{ id, date, height, weight }]` | 身高(cm)/体重(kg)，date 为 `YYYY-MM-DD` |
| `photos` | `[{ id, date, data, note }]` | data 为 Base64 图片 |
| `milestones` | `[{ id, date, title, note }]` | 里程碑事件 |
| `diaper_records` | `[{ id, date, time, type }]` | type: `'pee'`/`'poop'`/`'both'` |

## 生长标准数据

`src/data/growthStandards.js` 导出：
- `getReferenceValues(standard, gender, metric, week)` — 按周获取 P1/P30/P50/P70/P99 参考值
- `standard`: `'who'` | `'china'`，`gender`: `'boy'` | `'girl'`，`metric`: `'height'` | `'weight'`
- 数据来源：WHO 2006 + 中国 WS/T 423-2022，按月 LMS 参数存储，线性插值获得周级数据
