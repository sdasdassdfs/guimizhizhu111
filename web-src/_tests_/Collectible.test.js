/**
 * Collectible 单元测试
 */

import { Collectible, CollectibleType, CollectibleRarity, CollectibleData } from '../game/models/Collectible.js';

describe('Collectible', () => {
    describe('构造函数', () => {
        test('应正确创建收集品实例', () => {
            const item = new Collectible({
                id: 'test_item',
                name: '测试物品',
                description: '这是一个测试物品',
                type: CollectibleType.MATERIAL,
                rarity: CollectibleRarity.RARE,
                icon: '🧪',
                source: '测试来源',
                value: 100,
                stackable: true,
                maxStack: 50
            });

            expect(item.id).toBe('test_item');
            expect(item.name).toBe('测试物品');
            expect(item.description).toBe('这是一个测试物品');
            expect(item.type).toBe(CollectibleType.MATERIAL);
            expect(item.rarity).toBe(CollectibleRarity.RARE);
            expect(item.icon).toBe('🧪');
            expect(item.source).toBe('测试来源');
            expect(item.value).toBe(100);
            expect(item.stackable).toBe(true);
            expect(item.maxStack).toBe(50);
            expect(item.obtained).toBe(false);
            expect(item.count).toBe(0);
        });

        test('应使用默认值创建收集品实例', () => {
            const item = new Collectible({
                id: 'default_item',
                name: '默认物品',
                description: '默认描述'
            });

            expect(item.type).toBe(CollectibleType.MATERIAL);
            expect(item.rarity).toBe(CollectibleRarity.COMMON);
            expect(item.icon).toBe('📦');
            expect(item.source).toBe('');
            expect(item.value).toBe(0);
            expect(item.stackable).toBe(true);
            expect(item.maxStack).toBe(99);
        });
    });

    describe('obtain() 方法', () => {
        test('应正确获得可堆叠物品', () => {
            const item = new Collectible({
                id: 'stackable_item',
                name: '可堆叠物品',
                stackable: true,
                maxStack: 10
            });

            item.obtain(3);
            expect(item.obtained).toBe(true);
            expect(item.count).toBe(3);

            item.obtain(8);
            expect(item.count).toBe(10); // 不应超过最大堆叠数
        });

        test('应正确处理不可堆叠物品', () => {
            const item = new Collectible({
                id: 'non_stackable_item',
                name: '不可堆叠物品',
                stackable: false
            });

            item.obtain(5);
            expect(item.obtained).toBe(true);
            expect(item.count).toBe(1); // 不可堆叠物品数量始终为1
        });

        test('多次获得不可堆叠物品不应增加数量', () => {
            const item = new Collectible({
                id: 'unique_item',
                name: '唯一物品',
                stackable: false
            });

            item.obtain();
            item.obtain();
            expect(item.count).toBe(1);
        });
    });

    describe('use() 方法', () => {
        test('应正确使用物品', () => {
            const item = new Collectible({
                id: 'usable_item',
                name: '可用物品',
                stackable: true
            });

            item.obtain(5);
            const result = item.use(2);
            
            expect(result).toBe(true);
            expect(item.count).toBe(3);
        });

        test('使用超过当前数量的物品应失败', () => {
            const item = new Collectible({
                id: 'scarce_item',
                name: '稀缺物品'
            });

            item.obtain(2);
            const result = item.use(3);
            
            expect(result).toBe(false);
            expect(item.count).toBe(2);
        });

        test('使用完所有物品后应标记为未获得', () => {
            const item = new Collectible({
                id: 'consumable_item',
                name: '消耗品'
            });

            item.obtain(1);
            item.use(1);
            
            expect(item.count).toBe(0);
            expect(item.obtained).toBe(false);
        });
    });

    describe('toDict() 和 fromDict() 方法', () => {
        test('应正确序列化和反序列化', () => {
            const original = new Collectible({
                id: 'serializable_item',
                name: '可序列化物品',
                description: '测试序列化',
                type: CollectibleType.RELIC,
                rarity: CollectibleRarity.EPIC,
                icon: '🔮',
                source: '任务奖励',
                value: 500,
                stackable: false,
                maxStack: 1,
                effect: '特殊效果',
                flavorText: '背景故事'
            });

            original.obtain(1);

            const dict = original.toDict();
            const restored = Collectible.fromDict(dict);

            expect(restored.id).toBe(original.id);
            expect(restored.name).toBe(original.name);
            expect(restored.description).toBe(original.description);
            expect(restored.type).toBe(original.type);
            expect(restored.rarity).toBe(original.rarity);
            expect(restored.icon).toBe(original.icon);
            expect(restored.source).toBe(original.source);
            expect(restored.value).toBe(original.value);
            expect(restored.stackable).toBe(original.stackable);
            expect(restored.maxStack).toBe(original.maxStack);
            expect(restored.effect).toBe(original.effect);
            expect(restored.flavorText).toBe(original.flavorText);
            expect(restored.obtained).toBe(original.obtained);
            expect(restored.count).toBe(original.count);
        });
    });

    describe('预定义收集品', () => {
        test('应包含预定义的非凡特性', () => {
            expect(CollectibleData.feature_sequence_5).toBeDefined();
            expect(CollectibleData.feature_sequence_5.name).toBe('序列5非凡特性');
            expect(CollectibleData.feature_sequence_5.type).toBe(CollectibleType.FEATURE);
            expect(CollectibleData.feature_sequence_5.rarity).toBe(CollectibleRarity.EPIC);
        });

        test('应包含预定义的材料', () => {
            expect(CollectibleData.material_dark_crystal).toBeDefined();
            expect(CollectibleData.material_dark_crystal.name).toBe('黑暗水晶');
            expect(CollectibleData.material_dark_crystal.type).toBe(CollectibleType.MATERIAL);
        });

        test('应包含预定义的遗物', () => {
            expect(CollectibleData.relic_judgment_scroll).toBeDefined();
            expect(CollectibleData.relic_judgment_scroll.name).toBe('审判卷轴');
            expect(CollectibleData.relic_judgment_scroll.type).toBe(CollectibleType.RELIC);
        });
    });
});