# web-highlighter-plus

现代化的高亮文本处理库。基于原生 DOM API 实现，提供 Range 序列化、跨标签渲染、批量回显等功能。零运行时依赖，零外部库依赖。

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

## 项目结构

```
web-highlighter-plus/
├── src/
│   ├── core/
│   │   ├── Highlighter.tsx   # 核心类，对外 API
│   │   ├── Painter.ts        # DOM 渲染器，负责包装文本节点
│   │   └── Serializer.ts     # 序列化/反序列化器
│   ├── model/
│   │   ├── Range.ts          # HighlightRange 数据结构
│   │   └── Source.ts         # HighlightSource 数据结构
│   ├── types/
│   │   └── index.ts          # TypeScript 类型定义
│   ├── utils/
│   │   ├── const.ts          # 常量定义
│   │   ├── dom.ts            # DOM 工具函数
│   │   └── uuid.ts           # UUID 生成
│   └── index.ts              # 入口文件
├── index.html                # 演示页面
├── dist/                     # 构建输出
└── package.json
```

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
# 开发环境构建
pnpm build

# 预览生产构建
pnpm preview
```

构建产物输出到 `dist/` 目录。

## 快速开始

### 初始化

```typescript
import { HighlighterPlus } from 'web-highlighter-plus';

const hp = new HighlighterPlus({
  root: document.getElementById('content'),  // 根容器
  wrapTag: 'span',                           // 包装标签，默认 'span'
  className: 'highlight-wrap',               // 默认类名
  exceptSelectors: ['code', 'pre', 'a'],     // 排除元素，不参与高亮
  verbose: true,                             // 调试日志
});
```

### F1: 序列化选区

将浏览器用户选择的文本序列化为可存储的数据结构：

```typescript
// 从 Range 对象序列化
const source = hp.fromRange(range);
if (source) {
  // source.id        - 唯一 ID (UUID)
  // source.text      - 选中的文本内容
  // source.startMeta - 起始位置元数据
  // source.endMeta   - 结束位置元数据
  console.log(source);
}

// 从当前 window.getSelection() 序列化
const source2 = hp.fromSelection();
```

### F2: 渲染 Source 到 DOM

将 Source 对象渲染为多个 span 包装元素：

```typescript
// 渲染单个 Source
const doms = hp.render(source);
console.log(`渲染了 ${doms.length} 个元素`);

// 批量渲染
const domsAll = hp.renderAll([source1, source2, source3]);
```

### F3: 类样式控制

为高亮添加或移除 CSS 类：

```typescript
// 添加自定义类
hp.addClass(source.id, 'custom-highlight');

// 移除自定义类
hp.removeClass(source.id, 'custom-highlight');
```

### F4: 批量回显

从存储的数据恢复高亮：

```typescript
// 从 localStorage 或服务端获取数据
const storedSources = JSON.parse(localStorage.getItem('highlights') || '[]');

// 批量恢复
hp.restore(storedSources);
```

### F5: 清除功能

```typescript
// 清除单个高亮
hp.remove(source.id);

// 清除所有高亮
hp.removeAll();
```

## API 参考

### 构造函数选项

```typescript
interface Options {
  root?: HTMLElement | Document;    // 根容器，默认 document.body
  wrapTag?: string;                 // 包装标签，默认 'span'
  className?: string | string[];    // 默认类名
  exceptSelectors?: string[] | null; // 排除选择器，匹配的元素及其内容不参与高亮
  verbose?: boolean;                // 启用调试日志
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
| `restore(sources)` | `HTMLElement[]` | 批量回显（renderAll 别名） |
| `remove(id)` | `void` | 移除单个高亮 |
| `removeAll()` | `void` | 移除所有高亮 |
| `addClass(id, className)` | `void` | 添加 CSS 类 |
| `removeClass(id, className)` | `void` | 移除 CSS 类 |

### 工具方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getDoms(id?)` | `HTMLElement[]` | 获取包装元素，不传 id 返回全部 |
| `getIdByDom(dom)` | `string` | 从 DOM 节点获取高亮 ID |
| `getSources()` | `Source[]` | 获取所有已序列化的 Source |
| `getSource(id)` | `Source \| undefined` | 根据 ID 获取 Source |

### 数据结构

#### Source

可序列化的数据结构，可 JSON.stringify 后存储到 localStorage 或服务端：

```typescript
interface Source {
  id: string;           // UUID
  text: string;         // 文本内容
  startMeta: DomMeta;   // 起始位置
  endMeta: DomMeta;     // 结束位置
  extra?: unknown;      // 扩展数据
}
```

#### DomMeta

描述 DOM 中的精确位置：

```typescript
interface DomMeta {
  parentTagName: string;  // 父元素标签名，如 'P', 'DIV', 'STRONG'
  parentIndex: number;    // 在同标签兄弟中的索引位置
  textOffset: number;     // 在父元素文本中的字符偏移量
}
```

#### SelectedNode

渲染过程中使用的中间数据结构：

```typescript
interface SelectedNode {
  $node: Node | Text;     // DOM 节点
  type: 'text' | 'span';  // 节点类型
  splitType: 'none' | 'head' | 'tail' | 'both';  // 分割类型
}
```

## 核心概念

### 跨标签渲染原理

当用户选择的文本跨越多个 HTML 标签时（如 `<strong>加粗</strong>和<em>斜体</em>`），渲染器会：

1. 将每个标签内的文本分割为独立的文本节点
2. 为每个文本节点创建独立的 span 包装元素
3. 所有 span 使用相同的 `data-highlight-id`

### exceptSelectors 排除机制

`exceptSelectors` 用于指定哪些元素不参与高亮：

```typescript
const hp = new HighlighterPlus({
  exceptSelectors: ['code', 'pre', 'a', '.no-highlight'],
});
```

当选择区域经过这些元素时，元素内的文本不会被高亮渲染。

### 叠加高亮处理

当新的高亮区域与现有高亮重叠时：

1. **完全重叠**：在 `data-highlight-id-extra` 中记录额外的 ID
2. **部分重叠**：分割现有包装元素
3. 移除时会正确处理 ID 转移逻辑

## 导出

```typescript
// 主要类
export { HighlighterPlus };

// 数据模型
export { HighlightSource, HighlightRange };

// 类型
export type { Source, DomMeta, DomNode, Options, RangeData, SelectedNode };

// 常量
export {
  ATTR_IDENTIFIER,        // 'data-highlight-id'
  ATTR_IDENTIFIER_EXTRA,  // 'data-highlight-id-extra'
  ATTR_SPLIT_TYPE,        // 'data-highlight-split-type'
  ROOT_IDX,               // -2
  UNKNOWN_IDX,            // -1
  DEFAULT_WRAP_TAG,       // 'span'
  DEFAULT_CLASS_NAME,     // 'highlight-wrap'
  ID_DIVISION,            // '||'
};

// 工具函数
export { createUUID };
```

## 构建说明

本项目使用 Vite 构建，零运行时依赖。

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

构建产物支持：
- ESM 模块 (`dist/index.js`)
- CJS 兼容（通过 `dist/index.cjs.js`，如需可配置）
- TypeScript 类型内联

## 浏览器兼容性

- 现代浏览器（Chrome、Firefox、Safari、Edge 最新版）
- 需要支持 `Node.TEXT_NODE`、`TreeWalker`、`splitText()` 等原生 DOM API

## License

MIT
