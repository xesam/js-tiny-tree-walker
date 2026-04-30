export type TreeNode<V = unknown> = {
    key: string
    value: V
    path: string[]
    depth: number
    isLeaf: boolean
}

export type GetChildren<V> = (value: V) => Array<[string, V]> | null | undefined

export type TreeWalkerOptions<V> = {
    getChildren?: GetChildren<V>
}

function defaultGetChildren<V>(value: V): Array<[string, V]> | null {
    if (value === null || value === undefined) return null
    if (typeof value !== 'object') return null
    if (Array.isArray(value)) return null
    return Object.entries(value) as Array<[string, V]>
}

function makeIterable<V>(generatorFn: () => Generator<TreeNode<V>>): Iterable<TreeNode<V>> {
    return {
        [Symbol.iterator](): Iterator<TreeNode<V>> {
            return generatorFn()
        },
    }
}

export class TreeWalker<V = unknown> {
    #data: V
    #getChildren: GetChildren<V>

    constructor(data: V, options?: TreeWalkerOptions<V>) {
        this.#data = data
        this.#getChildren = options?.getChildren ?? (defaultGetChildren as GetChildren<V>)
    }

    pre(): Iterable<TreeNode<V>> {
        return makeIterable(() => this.#walkPre())
    }

    post(): Iterable<TreeNode<V>> {
        return makeIterable(() => this.#walkPost())
    }

    bfs(): Iterable<TreeNode<V>> {
        return makeIterable(() => this.#walkBfs())
    }

    [Symbol.iterator](): Iterator<TreeNode<V>> {
        return this.pre()[Symbol.iterator]()
    }

    *#walkPre(): Generator<TreeNode<V>> {
        type Frame = { key: string; value: V; path: string[]; depth: number }
        const rootChildren = this.#getChildren(this.#data)
        if (!rootChildren || rootChildren.length === 0) return
        const stack: Frame[] = []
        for (let i = rootChildren.length - 1; i >= 0; i--) {
            const [key, value] = rootChildren[i]
            stack.push({ key, value, path: [key], depth: 0 })
        }
        while (stack.length > 0) {
            const frame = stack.pop()!
            const children = this.#getChildren(frame.value)
            const isLeaf = !children || children.length === 0
            yield { key: frame.key, value: frame.value, path: frame.path, depth: frame.depth, isLeaf }
            if (children && children.length > 0) {
                for (let i = children.length - 1; i >= 0; i--) {
                    const [childKey, childValue] = children[i]
                    stack.push({
                        key: childKey,
                        value: childValue,
                        path: [...frame.path, childKey],
                        depth: frame.depth + 1,
                    })
                }
            }
        }
    }

    *#walkPost(): Generator<TreeNode<V>> {
        type Frame = { key: string; value: V; path: string[]; depth: number }
        const self = this

        function* visit(frame: Frame): Generator<TreeNode<V>> {
            const children = self.#getChildren(frame.value)
            const isLeaf = !children || children.length === 0
            if (children && children.length > 0) {
                for (const [childKey, childValue] of children) {
                    yield* visit({ key: childKey, value: childValue, path: [...frame.path, childKey], depth: frame.depth + 1 })
                }
            }
            yield { key: frame.key, value: frame.value, path: frame.path, depth: frame.depth, isLeaf }
        }

        const rootChildren = this.#getChildren(this.#data)
        if (!rootChildren || rootChildren.length === 0) return
        for (const [key, value] of rootChildren) {
            yield* visit({ key, value, path: [key], depth: 0 })
        }
    }

    *#walkBfs(): Generator<TreeNode<V>> {
        type Frame = { key: string; value: V; path: string[]; depth: number }
        const rootChildren = this.#getChildren(this.#data)
        if (!rootChildren || rootChildren.length === 0) return
        const queue: Frame[] = rootChildren.map(([key, value]) => ({
            key, value, path: [key], depth: 0,
        }))
        while (queue.length > 0) {
            const frame = queue.shift()!
            const children = this.#getChildren(frame.value)
            const isLeaf = !children || children.length === 0
            yield { key: frame.key, value: frame.value, path: frame.path, depth: frame.depth, isLeaf }
            if (children && children.length > 0) {
                for (const [childKey, childValue] of children) {
                    queue.push({ key: childKey, value: childValue, path: [...frame.path, childKey], depth: frame.depth + 1 })
                }
            }
        }
    }
}
