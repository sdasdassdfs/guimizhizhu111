import { TalentTree } from '../game/models/TalentTree.js';
import { TalentNode } from '../game/models/TalentNode.js';

describe('TalentTree', () => {
    let treeData;
    
    beforeEach(() => {
        treeData = {
            id: 'test_tree',
            name: '测试天赋树',
            pathwayId: 'fool',
            rootNodeId: 'node1',
            maxTalentPoints: 50,
            respecCostFormula: 'gold = level * 100',
            unlockLevel: 1,
            unlockSequence: '序列9',
            nodes: {
                node1: {
                    id: 'node1',
                    name: '节点1',
                    description: '根节点',
                    type: 'pathway',
                    tier: 1,
                    column: 0,
                    prerequisites: [],
                    requiredLevel: 1,
                    cost: 0,
                    effects: []
                },
                node2: {
                    id: 'node2',
                    name: '节点2',
                    description: '第二层节点',
                    type: 'combat',
                    tier: 2,
                    column: 0,
                    prerequisites: ['node1'],
                    requiredLevel: 3,
                    cost: 1,
                    effects: []
                },
                node3: {
                    id: 'node3',
                    name: '节点3',
                    description: '第二层另一个节点',
                    type: 'combat',
                    tier: 2,
                    column: 1,
                    prerequisites: ['node1'],
                    requiredLevel: 3,
                    cost: 1,
                    effects: []
                }
            }
        };
    });
    
    test('应该正确创建天赋树', () => {
        const tree = new TalentTree(treeData);
        
        expect(tree.id).toBe('test_tree');
        expect(tree.name).toBe('测试天赋树');
        expect(tree.pathwayId).toBe('fool');
        expect(tree.rootNodeId).toBe('node1');
        expect(tree.maxTalentPoints).toBe(50);
        expect(tree.nodes).toHaveProperty('node1');
        expect(tree.nodes).toHaveProperty('node2');
        expect(tree.nodes).toHaveProperty('node3');
    });
    
    test('应该正确获取根节点', () => {
        const tree = new TalentTree(treeData);
        const rootNode = tree.getRootNode();
        
        expect(rootNode).toBeInstanceOf(TalentNode);
        expect(rootNode.id).toBe('node1');
    });
    
    test('应该正确获取连接关系', () => {
        const tree = new TalentTree(treeData);
        const connections = tree.getConnections();
        
        expect(connections).toHaveLength(2);
        expect(connections).toEqual([
            { from: 'node1', to: 'node2', type: 'required' },
            { from: 'node1', to: 'node3', type: 'required' }
        ]);
    });
    
    test('应该正确获取可激活节点', () => {
        const tree = new TalentTree(treeData);
        
        // 只有根节点已解锁
        const unlockedNodes = new Set(['node1']);
        const available = tree.getAvailableNodes(unlockedNodes, 5, '序列8');
        
        expect(available).toHaveLength(2);
        expect(available.map(n => n.id)).toEqual(['node2', 'node3']);
        
        // 等级不足
        const available2 = tree.getAvailableNodes(unlockedNodes, 2, '序列8');
        expect(available2).toHaveLength(0);
        
        // 序列不足
        const available3 = tree.getAvailableNodes(unlockedNodes, 5, '序列9');
        expect(available3).toHaveLength(0);
    });
    
    test('应该正确激活节点', () => {
        const tree = new TalentTree(treeData);
        
        // 激活根节点（应该总是成功）
        const result1 = tree.activateNode('node1', new Set(), 1, '序列9');
        expect(result1.success).toBe(true);
        expect(result1.unlockedNodes).toEqual(['node1']);
        
        // 激活第二层节点
        const result2 = tree.activateNode('node2', new Set(['node1']), 5, '序列8');
        expect(result2.success).toBe(true);
        expect(result2.unlockedNodes).toContain('node1');
        expect(result2.unlockedNodes).toContain('node2');
        
        // 尝试激活不存在节点
        const result3 = tree.activateNode('node99', new Set(), 1, '序列9');
        expect(result3.success).toBe(false);
        expect(result3.reasons).toContain('天赋节点 node99 不存在');
        
        // 尝试激活但不满足前置
        const result4 = tree.activateNode('node2', new Set(), 5, '序列8');
        expect(result4.success).toBe(false);
        expect(result4.reasons).toContain('需要前置天赋: node1');
    });
    
    test('应该正确重置天赋树', () => {
        const tree = new TalentTree(treeData);
        
        const unlockedNodes = new Set(['node1', 'node2', 'node3']);
        const newSet = tree.respecTree(unlockedNodes);
        
        expect(newSet.size).toBe(1); // 只保留根节点
        expect(newSet.has('node1')).toBe(true);
    });
    
    test('应该正确计算洗点消耗', () => {
        const tree = new TalentTree(treeData);
        
        // 使用默认公式
        expect(tree.calculateRespecCost(10, 5)).toBe(10 * 100); // level * 100
        
        // 修改公式
        tree.respecCostFormula = 'gold = points * 50';
        expect(tree.calculateRespecCost(10, 5)).toBe(5 * 50); // points * 50
        
        // 未知公式，使用默认
        tree.respecCostFormula = 'unknown';
        expect(tree.calculateRespecCost(10, 5)).toBeGreaterThan(0);
    });
    
    test('应该正确计算总天赋点需求', () => {
        const tree = new TalentTree(treeData);
        
        // 三个节点：node1(cost=0), node2(cost=1), node3(cost=1)
        expect(tree.getTotalTalentPointRequirement()).toBe(2);
    });
    
    test('应该正确按类型筛选节点', () => {
        const tree = new TalentTree(treeData);
        
        const pathwayNodes = tree.getNodesByType('pathway');
        expect(pathwayNodes).toHaveLength(1);
        expect(pathwayNodes[0].id).toBe('node1');
        
        const combatNodes = tree.getNodesByType('combat');
        expect(combatNodes).toHaveLength(2);
        expect(combatNodes.map(n => n.id)).toEqual(['node2', 'node3']);
    });
    
    test('应该正确检查天赋树是否已解锁', () => {
        const tree = new TalentTree(treeData);
        
        // 满足条件
        expect(tree.isUnlocked(5, '序列8')).toBe(true);
        
        // 等级不足
        expect(tree.isUnlocked(0, '序列8')).toBe(false);
        
        // 序列不足
        expect(tree.isUnlocked(5, '序列10')).toBe(false);
        
        // 无序列要求
        tree.unlockSequence = null;
        expect(tree.isUnlocked(5, '序列10')).toBe(true);
    });
    
    test('应该正确转换为字典', () => {
        const tree = new TalentTree(treeData);
        const dict = tree.toDict();
        
        expect(dict.id).toBe('test_tree');
        expect(dict.name).toBe('测试天赋树');
        expect(dict.nodes).toHaveProperty('node1');
        expect(dict.nodes).toHaveProperty('node2');
        expect(dict.nodes['node1'].id).toBe('node1');
    });
    
    test('应该从字典正确创建', () => {
        const tree = TalentTree.fromDict(treeData);
        expect(tree).toBeInstanceOf(TalentTree);
        expect(tree.id).toBe('test_tree');
    });
    
    test('应该正确创建途径专属天赋树', () => {
        const pathwayData = {
            nameZh: '愚者途径'
        };
        
        const tree = TalentTree.createPathwayTalentTree('fool', pathwayData);
        
        expect(tree).toBeInstanceOf(TalentTree);
        expect(tree.id).toBe('tree_fool');
        expect(tree.pathwayId).toBe('fool');
        expect(tree.nodes).toHaveProperty('fool_tier1_root');
    });
    
    test('应该正确创建通用天赋树', () => {
        const tree = TalentTree.createGeneralTalentTree();
        
        expect(tree).toBeInstanceOf(TalentTree);
        expect(tree.id).toBe('tree_general');
        expect(tree.pathwayId).toBeNull();
        expect(tree.nodes).toHaveProperty('general_tier1_survival');
        expect(tree.nodes).toHaveProperty('general_tier1_combat');
    });
});