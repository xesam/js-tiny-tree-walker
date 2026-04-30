# @js-tiny/tree-walker

零依赖、惰性求值的 JavaScript/TypeScript 树遍历工具库。

## 安装

```bash
npm install @js-tiny/tree-walker
```

## TreeWalker

将任意嵌套数据结构包装为 `for...of` 接口。返回带有完整路径和深度信息的类型化 `TreeNode` 对象。

默认支持普通对象。提供自定义 `getChildren` 回调函数，可遍历任意树形结构。

### 基本用法

```javascript
import { TreeWalker } from '@js-tiny/tree-walker'

const walker = new TreeWalker({
    a: 1,
    b: 2,
    c: {
        d: 3,
        e: 4,
    },
})

for (const node of walker) {
    console.log(node)
}
// { key: 'a', value: 1,          path: ['a'],    depth: 0, isLeaf: true  }
// { key: 'b', value: 2,          path: ['b'],    depth: 0, isLeaf: true  }
// { key: 'c', value: { d, e },   path: ['c'],    depth: 0, isLeaf: false }
// { key: 'd', value: 3,          path: ['c','d'],depth: 1, isLeaf: true  }
// { key: 'e', value: 4,          path: ['c','e'],depth: 1, isLeaf: true  }
```

### 遍历策略

`for...of` 和 `.pre()` 默认使用前序 DFS。

```javascript
// 前序 DFS（默认）— 父节点优先于子节点
for (const node of walker.pre()) { ... }
for (const node of walker) { ... }        // 等价

// 后序 DFS — 子节点优先于父节点
for (const node of walker.post()) { ... }

// 广度优先 — 按层级遍历
for (const node of walker.bfs()) { ... }
```

同一个实例可以多次迭代，使用不同的遍历策略：

```javascript
const leaves = [...walker].filter(n => n.isLeaf).map(n => n.value)
const paths  = [...walker.bfs()].map(n => n.path.join('.'))
```

### 自定义 getChildren

传入 `getChildren` 回调函数，可以遍历任意树形结构，而不仅限于普通对象。

```javascript
const categories = {
    id: 1,
    name: 'root',
    children: [
        { id: 2, name: 'clothing' },
        { id: 3, name: 'electronics', children: [
            { id: 4, name: 'phones' },
        ]},
    ],
}

const walker = new TreeWalker(categories, {
    getChildren: (node) =>
        node.children?.map((child, i) => [String(i), child]) ?? null,
})

for (const node of walker) {
    console.log(node.value.name, node.depth)
}
// clothing     0
// electronics  0
// phones       1
```

### API

#### `new TreeWalker(data, options?)`

| 参数 | 类型 | 描述 |
|---|---|---|
| `data` | `V` | 根数据值 |
| `options.getChildren` | `GetChildren<V>` | 可选。返回节点的 `[key, child][]` 对，如果为叶子节点则返回 `null`/`undefined` |

默认 `getChildren` 通过 `Object.entries` 将普通（非数组、非null）对象视为分支。其他类型 — 原始类型、数组、null — 均为叶子节点。

#### `TreeNode<V>`

```typescript
type TreeNode<V> = {
    key: string      // 属性名或父节点中的索引
    value: V         // 节点值
    path: string[]    // 从根节点开始的完整路径，如 ['c', 'd']
    depth: number    // 深度，0 = 根节点的直接子节点
    isLeaf: boolean  // 如果 getChildren 返回 null/undefined/[] 则为 true
}
```

#### `GetChildren<V>`

```typescript
type GetChildren<V> = (value: V) => Array<[string, V]> | null | undefined
```

## License

MIT
