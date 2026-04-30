import { TreeWalker, TreeNode, GetChildren, TreeWalkerOptions } from '../src/index'

describe('src/index.ts – public exports', () => {
    it('re-exports TreeWalker class', () => {
        expect(typeof TreeWalker).toBe('function')
        expect(new TreeWalker({ a: 1 })).toBeInstanceOf(TreeWalker)
    })

    it('re-exported TreeWalker is fully functional', () => {
        const nodes = [...new TreeWalker({ a: 1, b: 2 })]
        expect(nodes).toHaveLength(2)
        expect(nodes[0]).toMatchObject({ key: 'a', value: 1, depth: 0, isLeaf: true })
    })

    it('type exports compile (TreeNode, GetChildren, TreeWalkerOptions)', () => {
        const node: TreeNode<number> = { key: 'x', value: 1, path: ['x'], depth: 0, isLeaf: true }
        const gc: GetChildren<number> = () => null
        const opts: TreeWalkerOptions<number> = { getChildren: gc }
        expect(node).toBeTruthy()
        expect(opts).toBeTruthy()
    })
})
