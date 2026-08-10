# web-highlighter-plus

![web-highlighter-plus](https://raw.githubusercontent.com/alienzhou/web-highlighter/master/docs/img/logo.png)

> English | [中文](./README.zh-CN.md)

## 背景

最初有一个开源库 [web-highlighter](https://github.com/alienzhou/web-highlighter)，提供了文本高亮和序列化功能。然而，在生产环境中使用后，我遇到了以下问题：

- **功能缺失** — 跨标签渲染不完整，缺乏对高亮重叠和批量恢复的完善支持
- **Bug 较多** — 文本跨越嵌套元素时的偏移量计算错误，同节点文本分割问题
- **扩展性差** — 架构难以扩展或定制以满足特定需求

由于原项目维护有限，无法满足我的需求，我决定从头开始重新实现，参考原项目的架构，同时修复其缺陷。

**web-highlighter-plus** 是一款全新重构的库，具有以下特点：
- 更清晰、更易维护的代码结构
- 修复了偏移量计算算法
- 更好的 TypeScript 类型安全
- 更灵活的 API 设计

---

## 特性

| 功能 | 说明 |
|------|------|
| **F1 序列化** | 将浏览器选中的 Range 对象转换为可 JSON 序列化的 Source 数据结构 |
| **F2 跨标签渲染** | 将跨多个 HTML 标签（如 `<strong>`、`<em>`）的选区正确渲染为独立的 span 元素 |
| **F3 类样式控制** | 为指定 ID 的所有 span 包装元素添加/移除 CSS 类 |
| **F4 批量回显** | 从本地存储或服务端获取数据后批量恢复高亮 |
| **F5 清除功能** | 清除单个高亮或所有高亮 |

## 技术栈

- **TypeScript + TSX** - 类型安全，现代语法
- **Vite** - 极速开发构建
- **pnpm** - 高效包管理

## 安装

```bash
pnpm install
```

## 开发

```bash
pnpm dev
```

启动后访问 http://localhost:3000 查看交互式演示页面。

## 构建

```bash
# 构建 npm 包
pnpm build

# 构建演示页面（用于 GitHub Pages）
pnpm build:demo
```

## 快速开始

```typescript
import { HighlighterPlus } from 'web-highlighter-plus';

const hp = new HighlighterPlus({
  root: document.getElementById('content'),
  wrapTag: 'span',
  className: 'highlight-wrap',
  exceptSelectors: ['code', 'pre', 'a'],
});

// 序列化选区
const source = hp.fromRange(range);

// 渲染到 DOM
hp.render(source);

// 添加类
hp.addClass(source.id, 'custom-highlight');

// 从存储恢复
hp.restore(storedSources);

// 移除
hp.remove(source.id);
```

## API 参考

### 构造函数选项

```typescript
interface Options {
  root?: HTMLElement | Document;
  wrapTag?: string;
  className?: string | string[];
  exceptSelectors?: string[] | null;
  verbose?: boolean;
}
```

### 核心方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `fromRange(range)` | `Source \| null` | 从 Range 对象序列化 |
| `fromSelection()` | `Source \| null` | 从当前选区序列化 |
| `fromStore(...)` | `Source \| null` | 从存储数据创建 Source |
| `render(source)` | `HTMLElement[]` | 渲染 Source 到 DOM |
| `renderAll(sources)` | `HTMLElement[]` | 批量渲染 |
| `restore(sources)` | `HTMLElement[]` | 批量回显 |
| `remove(id)` | `void` | 移除单个高亮 |
| `removeAll()` | `void` | 移除所有高亮 |
| `addClass(id, className)` | `void` | 添加 CSS 类 |
| `removeClass(id, className)` | `void` | 移除 CSS 类 |

### 数据结构

#### Source

```typescript
interface Source {
  id: string;
  text: string;
  startMeta: DomMeta;
  endMeta: DomMeta;
  extra?: unknown;
}
```

#### DomMeta

```typescript
interface DomMeta {
  parentTagName: string;
  parentIndex: number;
  textOffset: number;
}
```

## License

MIT

## GitHub

https://github.com/ittking/web-highlighter-plus
