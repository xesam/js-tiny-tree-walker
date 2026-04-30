# @js-tiny/tree-walker

[中文说明](./README.zh-CN.md)

A zero-dependency, lazy tree traversal utility for JavaScript and TypeScript.

## Install

```bash
npm install @js-tiny/tree-walker
```

## TreeWalker

Wraps any nested data structure behind a `for...of` interface. Yields typed `TreeNode` objects with full path and depth information.

Works with plain objects by default. Accepts a custom `getChildren` callback to traverse any tree-shaped structure.

### Basic usage

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

### Traversal strategies

`for...of` and `.pre()` use pre-order DFS by default.

```javascript
// Pre-order DFS (default) — parent before children
for (const node of walker.pre()) { ... }
for (const node of walker) { ... }        // same

// Post-order DFS — children before parent
for (const node of walker.post()) { ... }

// Breadth-first — level by level
for (const node of walker.bfs()) { ... }
```

The same instance can be iterated multiple times with different strategies:

```javascript
const leaves = [...walker].filter(n => n.isLeaf).map(n => n.value)
const paths  = [...walker.bfs()].map(n => n.path.join('.'))
```

### Custom `getChildren`

Pass a `getChildren` callback to traverse any tree structure, not just plain objects.

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

| Parameter | Type | Description |
|---|---|---|
| `data` | `V` | Root data value |
| `options.getChildren` | `GetChildren<V>` | Optional. Returns `[key, child][]` pairs for a node, or `null`/`undefined` if leaf |

Default `getChildren` treats plain (non-array, non-null) objects as branches via `Object.entries`. Everything else — primitives, arrays, `null` — is a leaf.

#### `TreeNode<V>`

```typescript
type TreeNode<V> = {
    key: string      // property name or index in parent
    value: V         // node value
    path: string[]   // full path from root, e.g. ['c', 'd']
    depth: number    // 0 = direct child of root
    isLeaf: boolean  // true if getChildren returns null/undefined/[]
}
```

#### `GetChildren<V>`

```typescript
type GetChildren<V> = (value: V) => Array<[string, V]> | null | undefined
```

## License

MIT
