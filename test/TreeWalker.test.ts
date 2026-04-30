import { TreeWalker, GetChildren } from '../src/TreeWalker'

describe('TreeWalker – public API', () => {
    it('can be instantiated with a plain object', () => {
        const tree = new TreeWalker({ a: 1 })
        expect(tree).toBeInstanceOf(TreeWalker)
    })

    it('exposes pre(), post(), bfs() methods', () => {
        const tree = new TreeWalker({ a: 1 })
        expect(typeof tree.pre).toBe('function')
        expect(typeof tree.post).toBe('function')
        expect(typeof tree.bfs).toBe('function')
    })

    it('[Symbol.iterator] is defined', () => {
        const tree = new TreeWalker({ a: 1 })
        expect(typeof tree[Symbol.iterator]).toBe('function')
    })

    it('pre(), post(), bfs() each return an iterable', () => {
        const tree = new TreeWalker({ a: 1 })
        expect(typeof tree.pre()[Symbol.iterator]).toBe('function')
        expect(typeof tree.post()[Symbol.iterator]).toBe('function')
        expect(typeof tree.bfs()[Symbol.iterator]).toBe('function')
    })

    it('accepts an optional getChildren option', () => {
        const getChildren: GetChildren<{ id: number }> = (v) =>
            v.id === 1 ? [['child', { id: 2 }]] : null
        const tree = new TreeWalker({ id: 1 }, { getChildren })
        expect(tree).toBeInstanceOf(TreeWalker)
    })
})

// ─── shared fixture (used across traversal tests) ───────────────────────────
const fixture = {
    a: 1,
    b: 2,
    c: 3,
    d: { e: 4, f: 5 },
    g: 6,
}

describe('TreeWalker – pre-order DFS', () => {
    const tree = new TreeWalker(fixture)

    it('yields all nodes in pre-order', () => {
        expect([...tree.pre()]).toEqual([
            { key: 'a', value: 1, path: ['a'], depth: 0, isLeaf: true },
            { key: 'b', value: 2, path: ['b'], depth: 0, isLeaf: true },
            { key: 'c', value: 3, path: ['c'], depth: 0, isLeaf: true },
            { key: 'd', value: { e: 4, f: 5 }, path: ['d'], depth: 0, isLeaf: false },
            { key: 'e', value: 4, path: ['d', 'e'], depth: 1, isLeaf: true },
            { key: 'f', value: 5, path: ['d', 'f'], depth: 1, isLeaf: true },
            { key: 'g', value: 6, path: ['g'], depth: 0, isLeaf: true },
        ])
    })

    it('for...of tree delegates to pre-order', () => {
        const viaSymbol: unknown[] = []
        for (const node of tree) viaSymbol.push(node)
        expect(viaSymbol).toEqual([...tree.pre()])
    })

    it('same tree instance can be iterated multiple times', () => {
        expect([...tree.pre()]).toEqual([...tree.pre()])
    })

    it('empty object yields nothing', () => {
        expect([...new TreeWalker({}).pre()]).toEqual([])
    })

    it('flat object: all nodes are leaves at depth 0', () => {
        expect([...new TreeWalker({ x: 10, y: 20 }).pre()]).toEqual([
            { key: 'x', value: 10, path: ['x'], depth: 0, isLeaf: true },
            { key: 'y', value: 20, path: ['y'], depth: 0, isLeaf: true },
        ])
    })

    it('depth increments correctly for deeply nested objects', () => {
        expect([...new TreeWalker({ a: { b: { c: 42 } } }).pre()]).toEqual([
            { key: 'a', value: { b: { c: 42 } }, path: ['a'], depth: 0, isLeaf: false },
            { key: 'b', value: { c: 42 }, path: ['a', 'b'], depth: 1, isLeaf: false },
            { key: 'c', value: 42, path: ['a', 'b', 'c'], depth: 2, isLeaf: true },
        ])
    })

    it('array values are treated as leaves (not recursed)', () => {
        expect([...new TreeWalker({ items: [1, 2, 3] }).pre()]).toEqual([
            { key: 'items', value: [1, 2, 3], path: ['items'], depth: 0, isLeaf: true },
        ])
    })

    it('null values are treated as leaves', () => {
        expect([...new TreeWalker({ x: null }).pre()]).toEqual([
            { key: 'x', value: null, path: ['x'], depth: 0, isLeaf: true },
        ])
    })
})

describe('TreeWalker – post-order DFS', () => {
    const tree = new TreeWalker(fixture)

    it('yields all nodes in post-order', () => {
        expect([...tree.post()]).toEqual([
            { key: 'a', value: 1, path: ['a'], depth: 0, isLeaf: true },
            { key: 'b', value: 2, path: ['b'], depth: 0, isLeaf: true },
            { key: 'c', value: 3, path: ['c'], depth: 0, isLeaf: true },
            { key: 'e', value: 4, path: ['d', 'e'], depth: 1, isLeaf: true },
            { key: 'f', value: 5, path: ['d', 'f'], depth: 1, isLeaf: true },
            { key: 'd', value: { e: 4, f: 5 }, path: ['d'], depth: 0, isLeaf: false },
            { key: 'g', value: 6, path: ['g'], depth: 0, isLeaf: true },
        ])
    })

    it('same tree instance can be iterated multiple times via post()', () => {
        expect([...tree.post()]).toEqual([...tree.post()])
    })

    it('deeply nested: parent emits after all descendants', () => {
        expect([...new TreeWalker({ a: { b: { c: 42 } } }).post()]).toEqual([
            { key: 'c', value: 42, path: ['a', 'b', 'c'], depth: 2, isLeaf: true },
            { key: 'b', value: { c: 42 }, path: ['a', 'b'], depth: 1, isLeaf: false },
            { key: 'a', value: { b: { c: 42 } }, path: ['a'], depth: 0, isLeaf: false },
        ])
    })

    it('flat object: post-order equals pre-order', () => {
        const flat = new TreeWalker({ x: 10, y: 20 })
        expect([...flat.post()]).toEqual([...flat.pre()])
    })
})

describe('TreeWalker – BFS', () => {
    const tree = new TreeWalker(fixture)

    it('yields all nodes in breadth-first order', () => {
        expect([...tree.bfs()]).toEqual([
            { key: 'a', value: 1, path: ['a'], depth: 0, isLeaf: true },
            { key: 'b', value: 2, path: ['b'], depth: 0, isLeaf: true },
            { key: 'c', value: 3, path: ['c'], depth: 0, isLeaf: true },
            { key: 'd', value: { e: 4, f: 5 }, path: ['d'], depth: 0, isLeaf: false },
            { key: 'g', value: 6, path: ['g'], depth: 0, isLeaf: true },
            { key: 'e', value: 4, path: ['d', 'e'], depth: 1, isLeaf: true },
            { key: 'f', value: 5, path: ['d', 'f'], depth: 1, isLeaf: true },
        ])
    })

    it('same tree instance can be iterated multiple times via bfs()', () => {
        expect([...tree.bfs()]).toEqual([...tree.bfs()])
    })

    it('deeply nested: yields level by level', () => {
        expect([...new TreeWalker({ a: { b: { c: 42 } } }).bfs()]).toEqual([
            { key: 'a', value: { b: { c: 42 } }, path: ['a'], depth: 0, isLeaf: false },
            { key: 'b', value: { c: 42 }, path: ['a', 'b'], depth: 1, isLeaf: false },
            { key: 'c', value: 42, path: ['a', 'b', 'c'], depth: 2, isLeaf: true },
        ])
    })

    it('flat object: BFS order equals pre-order', () => {
        const flat = new TreeWalker({ x: 10, y: 20 })
        expect([...flat.bfs()]).toEqual([...flat.pre()])
    })
})

describe('TreeWalker – custom getChildren', () => {
    type Category = { id: number; name: string; children?: Category[] }

    const root: Category = {
        id: 1,
        name: 'root',
        children: [
            { id: 2, name: 'child1' },
            { id: 3, name: 'child2', children: [{ id: 4, name: 'grandchild1' }] },
        ],
    }

    const getChildren: GetChildren<Category> = (node) =>
        node.children?.map((c, i) => [String(i), c] as [string, Category]) ?? null

    const tree = new TreeWalker(root, { getChildren })

    it('pre-order with custom getChildren', () => {
        expect([...tree.pre()]).toEqual([
            { key: '0', value: { id: 2, name: 'child1' }, path: ['0'], depth: 0, isLeaf: true },
            { key: '1', value: { id: 3, name: 'child2', children: [{ id: 4, name: 'grandchild1' }] }, path: ['1'], depth: 0, isLeaf: false },
            { key: '0', value: { id: 4, name: 'grandchild1' }, path: ['1', '0'], depth: 1, isLeaf: true },
        ])
    })

    it('post-order with custom getChildren', () => {
        expect([...tree.post()]).toEqual([
            { key: '0', value: { id: 2, name: 'child1' }, path: ['0'], depth: 0, isLeaf: true },
            { key: '0', value: { id: 4, name: 'grandchild1' }, path: ['1', '0'], depth: 1, isLeaf: true },
            { key: '1', value: { id: 3, name: 'child2', children: [{ id: 4, name: 'grandchild1' }] }, path: ['1'], depth: 0, isLeaf: false },
        ])
    })

    it('bfs with custom getChildren', () => {
        expect([...tree.bfs()]).toEqual([
            { key: '0', value: { id: 2, name: 'child1' }, path: ['0'], depth: 0, isLeaf: true },
            { key: '1', value: { id: 3, name: 'child2', children: [{ id: 4, name: 'grandchild1' }] }, path: ['1'], depth: 0, isLeaf: false },
            { key: '0', value: { id: 4, name: 'grandchild1' }, path: ['1', '0'], depth: 1, isLeaf: true },
        ])
    })

    it('getChildren returning empty array: nothing yielded', () => {
        const t = new TreeWalker(root, { getChildren: () => [] })
        expect([...t.pre()]).toEqual([])
    })

    it('getChildren returning undefined marks subtree as leaf', () => {
        const shallowGetChildren: GetChildren<Category> = (node) =>
            node.id === 1
                ? node.children?.map((c, i) => [String(i), c] as [string, Category]) ?? null
                : undefined
        const t = new TreeWalker(root, { getChildren: shallowGetChildren })
        const nodes = [...t.pre()]
        expect(nodes).toHaveLength(2)
        expect(nodes.every((n) => n.isLeaf)).toBe(true)
    })
})
