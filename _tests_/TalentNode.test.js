import { TalentNode, TalentEffect } from '../game/models/TalentNode.js';

describe('TalentEffect', () => {
    test('应该正确创建天赋效果', () => {
        const effect = new TalentEffect({
            type: 'stat_boost',
            stat: 'strength',
            value: 5
        });
        
        expect(effect.type).toBe('stat_boost');
        expect(effect.stat).toBe('strength');
        expect(effect.value).toBe(5);
    });
    
    test('应该正确转换为字典', () => {
        const effect = new TalentEffect({
            type: 'skill_modifier',
            skillId: 'fireball',
            value: 1.2
        });
        
        const dict = effect.toDict();
        expect(dict.type).toBe('skill_modifier');
        expect(dict.skillId).toBe('fireball');
        expect(dict.value).toBe(1.2);
    });
    
    test('应该从字典正确创建', () => {
        const data = {
            type: 'team_buff',
            stat: 'attack',
            value: 10
        };
        
        const effect = TalentEffect.fromDict(data);
        expect(effect.type).toBe('team_buff');
        expect(effect.stat).toBe('attack');
        expect(effect.value).toBe(10);
    });
});

describe('TalentNode', () => {
    test('应该正确创建天赋节点', () => {
        const node = new TalentNode({
            id: 'test_node',
            name: '测试节点',
            description: '这是一个测试天赋节点',
            type: 'combat',
            tier: 1,
            column: 0,
            prerequisites: ['prereq_1'],
            requiredLevel: 5,
            cost: 1,
            effects: [
                {
                    type: 'stat_boost',
                    stat: 'strength',
                    value: 3
                }
            ]
        });
        
        expect(node.id).toBe('test_node');
        expect(node.name).toBe('测试节点');
        expect(node.type).toBe('combat');
        expect(node.tier).toBe(1);
        expect(node.cost).toBe(1);
        expect(node.effects).toHaveLength(1);
        expect(node.effects[0].value).toBe(3);
    });
    
    test('应该正确获取节点位置', () => {
        const node = new TalentNode({
            tier: 2,
            column: 3
        });
        
        const position = node.getPosition();
        expect(position.x).toBe(3 * 120); // column * 120
        expect(position.y).toBe(2 * 100); // tier * 100
    });
    
    test('应该正确检查激活条件', () => {
        const node = new TalentNode({
            id: 'test_node',
            requiredLevel: 10,
            prerequisites: ['prereq_1', 'prereq_2'],
            exclusiveWith: ['exclusive_1']
        });
        
        // 测试条件满足
        const unlockedNodes = new Set(['prereq_1', 'prereq_2']);
        const result1 = node.checkActivationConditions(unlockedNodes, 15, '序列7');
        expect(result1.canActivate).toBe(true);
        expect(result1.reasons).toHaveLength(0);
        
        // 测试等级不足
        const result2 = node.checkActivationConditions(unlockedNodes, 8, '序列7');
        expect(result2.canActivate).toBe(false);
        expect(result2.reasons).toContain('需要等级 10');
        
        // 测试前置天赋不足
        const unlockedNodes2 = new Set(['prereq_1']);
        const result3 = node.checkActivationConditions(unlockedNodes2, 15, '序列7');
        expect(result3.canActivate).toBe(false);
        expect(result3.reasons).toContain('需要前置天赋: prereq_2');
        
        // 测试互斥天赋冲突
        const unlockedNodes3 = new Set(['prereq_1', 'prereq_2', 'exclusive_1']);
        const result4 = node.checkActivationConditions(unlockedNodes3, 15, '序列7');
        expect(result4.canActivate).toBe(false);
        expect(result4.reasons).toContain('与已激活天赋互斥: exclusive_1');
    });
    
    test('应该正确检查基本要求', () => {
        const node = new TalentNode({
            requiredLevel: 5,
            requiredSequence: '序列8'
        });
        
        // 测试满足要求
        expect(node.meetsBasicRequirements(8, '序列7')).toBe(true);
        
        // 测试等级不足
        expect(node.meetsBasicRequirements(3, '序列7')).toBe(false);
        
        // 测试序列不足
        expect(node.meetsBasicRequirements(8, '序列9')).toBe(false);
    });
    
    test('应该正确转换为字典', () => {
        const node = new TalentNode({
            id: 'test_node',
            name: '测试节点',
            effects: [
                { type: 'stat_boost', stat: 'agility', value: 2 }
            ]
        });
        
        const dict = node.toDict();
        expect(dict.id).toBe('test_node');
        expect(dict.name).toBe('测试节点');
        expect(dict.effects).toHaveLength(1);
        expect(dict.effects[0].value).toBe(2);
    });
    
    test('应该从字典正确创建', () => {
        const data = {
            id: 'test_node',
            name: '测试节点',
            effects: [
                { type: 'stat_boost', stat: 'intelligence', value: 3 }
            ]
        };
        
        const node = TalentNode.fromDict(data);
        expect(node.id).toBe('test_node');
        expect(node.name).toBe('测试节点');
        expect(node.effects).toHaveLength(1);
        expect(node.effects[0].value).toBe(3);
    });
});