/**
 * NPC 单元测试
 */

import { NPC } from '../game/models/NPC.js';
import { AttributeSet } from '../game/models/Attribute.js';

describe('NPC', () => {
    // 测试数据
    const mockTemplate = {
        templateId: 'test_npc_001',
        name: '测试NPC',
        type: 'human_extraordinary',
        rarity: 'common',
        baseAttributes: {
            strength: 12,
            agility: 10,
            constitution: 14,
            intelligence: 8,
            perception: 9,
            charisma: 7
        },
        growthCurve: {
            type: 'linear',
            baseLevel: 1,
            maxLevel: 30,
            statsPerLevel: {
                strength: 0.5,
                constitution: 0.7,
                agility: 0.3
            }
        },
        teamPosition: 'front',
        teamBuff: {
            type: 'defense_boost',
            value: 0.1,
            affects: ['frontline'],
            description: '前排防御力提升10%'
        }
    };

    describe('构造函数', () => {
        test('应正确创建NPC实例', () => {
            const npc = new NPC({
                npcId: 'npc_test_001',
                templateId: 'test_npc_001',
                name: '测试NPC',
                type: 'human_extraordinary',
                rarity: 'common',
                attributes: new AttributeSet({
                    strength: 12,
                    agility: 10,
                    constitution: 14,
                    intelligence: 8,
                    perception: 9,
                    charisma: 7
                }),
                level: 1,
                experience: 0,
                health: 100,
                maxHealth: 100,
                spirit: 100,
                maxSpirit: 100,
                loyalty: 50,
                teamPosition: 'front',
                growthCurve: {
                    type: 'linear',
                    baseLevel: 1,
                    maxLevel: 30,
                    statsPerLevel: {
                        strength: 0.5,
                        constitution: 0.7,
                        agility: 0.3
                    }
                }
            });

            expect(npc.npcId).toBe('npc_test_001');
            expect(npc.templateId).toBe('test_npc_001');
            expect(npc.name).toBe('测试NPC');
            expect(npc.type).toBe('human_extraordinary');
            expect(npc.rarity).toBe('common');
            expect(npc.level).toBe(1);
            expect(npc.loyalty).toBe(50);
            expect(npc.teamPosition).toBe('front');
            expect(npc.growthCurve.type).toBe('linear');
            expect(npc.attributes.get('strength')).toBe(12);
        });

        test('应使用默认值创建NPC实例', () => {
            const npc = new NPC({
                npcId: 'npc_default',
                name: '默认NPC'
            });

            expect(npc.templateId).toBe('');
            expect(npc.type).toBe('human_extraordinary');
            expect(npc.rarity).toBe('common');
            expect(npc.loyalty).toBe(50);
            expect(npc.teamPosition).toBe('middle');
            expect(npc.growthCurve).toEqual({});
            expect(npc.level).toBe(1);
        });
    });

    describe('静态工厂方法', () => {
        test('fromTemplate - 应从模板创建NPC实例', () => {
            const npc = NPC.fromTemplate(mockTemplate, 'instance_001');
            
            expect(npc.npcId).toBe('instance_001');
            expect(npc.templateId).toBe('test_npc_001');
            expect(npc.name).toBe('测试NPC');
            expect(npc.type).toBe('human_extraordinary');
            expect(npc.rarity).toBe('common');
            expect(npc.teamPosition).toBe('front');
            expect(npc.attributes.get('strength')).toBe(12);
            expect(npc.attributes.get('constitution')).toBe(14);
        });

        test('fromDict - 应从字典数据创建NPC实例', () => {
            const dictData = {
                npcId: 'npc_from_dict',
                templateId: 'test_template',
                name: '字典NPC',
                type: 'human_extraordinary',
                rarity: 'rare',
                attributes: {
                    strength: 15,
                    agility: 12,
                    constitution: 16,
                    intelligence: 10,
                    perception: 11,
                    charisma: 9
                },
                level: 3,
                experience: 150,
                health: 80,
                maxHealth: 120,
                spirit: 70,
                maxSpirit: 90,
                loyalty: 65,
                teamPosition: 'middle',
                growthCurve: {
                    type: 'exponential',
                    baseLevel: 1,
                    maxLevel: 40,
                    statsPerLevel: {
                        intelligence: 0.8,
                        perception: 0.6
                    }
                }
            };

            const npc = NPC.fromDict(dictData);
            
            expect(npc.npcId).toBe('npc_from_dict');
            expect(npc.templateId).toBe('test_template');
            expect(npc.name).toBe('字典NPC');
            expect(npc.rarity).toBe('rare');
            expect(npc.level).toBe(3);
            expect(npc.loyalty).toBe(65);
            expect(npc.teamPosition).toBe('middle');
            expect(npc.attributes.get('strength')).toBe(15);
            expect(npc.attributes.get('intelligence')).toBe(10);
        });
    });

    describe('忠诚度管理', () => {
        let npc;

        beforeEach(() => {
            npc = new NPC({
                npcId: 'test_loyalty',
                name: '忠诚度测试NPC',
                loyalty: 50
            });
        });

        test('increaseLoyalty - 应增加忠诚度', () => {
            npc.increaseLoyalty(20);
            expect(npc.loyalty).toBe(70);
            
            npc.increaseLoyalty(40);
            expect(npc.loyalty).toBe(100); // 不应超过100
        });

        test('decreaseLoyalty - 应减少忠诚度', () => {
            npc.decreaseLoyalty(20);
            expect(npc.loyalty).toBe(30);
            
            npc.decreaseLoyalty(40);
            expect(npc.loyalty).toBe(0); // 不应低于0
        });
    });

    describe('位置加成', () => {
        test('getPositionBonus - 应返回正确的前排加成', () => {
            const npc = new NPC({
                npcId: 'front_npc',
                name: '前排NPC',
                teamPosition: 'front'
            });
            
            const bonus = npc.getPositionBonus();
            expect(bonus.damageReduction).toBe(0.15);
            expect(bonus.tauntChance).toBe(0.2);
        });

        test('getPositionBonus - 应返回正确的中排加成', () => {
            const npc = new NPC({
                npcId: 'middle_npc',
                name: '中排NPC',
                teamPosition: 'middle'
            });
            
            const bonus = npc.getPositionBonus();
            expect(bonus.criticalChance).toBe(0.1);
            expect(bonus.skillRange).toBe(1.2);
        });

        test('getPositionBonus - 应返回正确的后排加成', () => {
            const npc = new NPC({
                npcId: 'back_npc',
                name: '后排NPC',
                teamPosition: 'back'
            });
            
            const bonus = npc.getPositionBonus();
            expect(bonus.skillRange).toBe(1.5);
            expect(bonus.healingBoost).toBe(0.15);
        });

        test('getPositionBonus - 对于无效位置应返回空对象', () => {
            const npc = new NPC({
                npcId: 'invalid_npc',
                name: '无效位置NPC',
                teamPosition: 'invalid'
            });
            
            const bonus = npc.getPositionBonus();
            expect(bonus).toEqual({});
        });
    });

    describe('序列化与反序列化', () => {
        test('toDict - 应正确序列化NPC数据', () => {
            const npc = new NPC({
                npcId: 'serialize_test',
                templateId: 'test_template',
                name: '序列化测试NPC',
                type: 'human_extraordinary',
                rarity: 'rare',
                attributes: new AttributeSet({ strength: 15, intelligence: 12 }),
                level: 5,
                experience: 300,
                health: 85,
                maxHealth: 120,
                loyalty: 75,
                teamPosition: 'back',
                growthCurve: {
                    type: 'linear',
                    baseLevel: 1,
                    maxLevel: 30,
                    statsPerLevel: { intelligence: 0.5 }
                }
            });

            const dict = npc.toDict();
            
            expect(dict.npcId).toBe('serialize_test');
            expect(dict.templateId).toBe('test_template');
            expect(dict.name).toBe('序列化测试NPC');
            expect(dict.type).toBe('human_extraordinary');
            expect(dict.rarity).toBe('rare');
            expect(dict.level).toBe(5);
            expect(dict.loyalty).toBe(75);
            expect(dict.teamPosition).toBe('back');
            expect(dict.attributes.strength).toBe(15);
            expect(dict.attributes.intelligence).toBe(12);
            expect(dict.growthCurve.type).toBe('linear');
        });

        test('fromDict + toDict - 应保持数据完整性', () => {
            const original = new NPC({
                npcId: 'roundtrip_test',
                templateId: 'test_template',
                name: '往返测试NPC',
                attributes: new AttributeSet({ strength: 20, constitution: 18 }),
                level: 10,
                loyalty: 90,
                teamPosition: 'middle',
                growthCurve: {
                    type: 'exponential',
                    baseLevel: 1,
                    maxLevel: 50,
                    statsPerLevel: { strength: 1.0 }
                }
            });

            const dict = original.toDict();
            const restored = NPC.fromDict(dict);
            
            expect(restored.npcId).toBe(original.npcId);
            expect(restored.templateId).toBe(original.templateId);
            expect(restored.name).toBe(original.name);
            expect(restored.level).toBe(original.level);
            expect(restored.loyalty).toBe(original.loyalty);
            expect(restored.teamPosition).toBe(original.teamPosition);
            expect(restored.attributes.get('strength')).toBe(original.attributes.get('strength'));
            expect(restored.growthCurve.type).toBe(original.growthCurve.type);
        });
    });

    describe('成长曲线应用', () => {
        test('_applyGrowthCurve - 应应用成长加成', () => {
            const npc = new NPC({
                npcId: 'growth_test',
                name: '成长测试NPC',
                level: 10,
                attributes: new AttributeSet({
                    strength: 10,
                    constitution: 10,
                    agility: 10
                }),
                growthCurve: {
                    type: 'linear',
                    baseLevel: 1,
                    statsPerLevel: {
                        strength: 0.5,
                        constitution: 0.7,
                        agility: 0.3
                    }
                }
            });

            // 等级10，基础等级1，相差9级
            // 力量: 10 + 0.5 * 9 = 14.5
            // 体质: 10 + 0.7 * 9 = 16.3
            // 敏捷: 10 + 0.3 * 9 = 12.7
            expect(npc.attributes.get('strength')).toBeCloseTo(14.5);
            expect(npc.attributes.get('constitution')).toBeCloseTo(16.3);
            expect(npc.attributes.get('agility')).toBeCloseTo(12.7);
        });

        test('_applyGrowthCurve - 无成长曲线时应不做处理', () => {
            const npc = new NPC({
                npcId: 'no_growth_test',
                name: '无成长测试NPC',
                level: 10,
                attributes: new AttributeSet({ strength: 10 }),
                growthCurve: {}
            });

            expect(npc.attributes.get('strength')).toBe(10);
        });
    });

    describe('团队角色描述', () => {
        test('getTeamRoleDescription - 应返回正确的角色描述', () => {
            const frontNpc = new NPC({
                npcId: 'front_desc',
                teamPosition: 'front'
            });
            expect(frontNpc.getTeamRoleDescription()).toBe('防御型 - 前排坦克，承受伤害');

            const middleNpc = new NPC({
                npcId: 'middle_desc',
                teamPosition: 'middle'
            });
            expect(middleNpc.getTeamRoleDescription()).toBe('平衡型 - 中排输出，灵活应对');

            const backNpc = new NPC({
                npcId: 'back_desc',
                teamPosition: 'back'
            });
            expect(backNpc.getTeamRoleDescription()).toBe('支援型 - 后排辅助，远程治疗');

            const invalidNpc = new NPC({
                npcId: 'invalid_desc',
                teamPosition: 'unknown'
            });
            expect(invalidNpc.getTeamRoleDescription()).toBe('未知角色');
        });
    });

    describe('战斗力计算', () => {
        test('calculateCombatPower - 应考虑忠诚度和位置加成', () => {
            const npc = new NPC({
                npcId: 'combat_test',
                name: '战斗力测试NPC',
                attributes: new AttributeSet({
                    strength: 15,
                    agility: 12,
                    constitution: 14,
                    intelligence: 10,
                    perception: 11,
                    charisma: 9
                }),
                level: 5,
                loyalty: 80,
                teamPosition: 'front'
            });

            const combatPower = npc.calculateCombatPower();
            
            // 基础属性总和: 15+12+14+10+11+9 = 71
            // 等级加成: 5 * 5 = 25
            // 基础战斗力: 71 + 25 = 96
            // 忠诚度加成: 80% -> 加成系数 0.4 (80/100 * 0.5)
            // 位置加成: 伤害减免15% -> 加成系数 0.15
            // 总战斗力: 96 * (1 + 0.4 + 0.15) = 96 * 1.55 = 148.8 ≈ 149
            expect(combatPower).toBeGreaterThan(140);
            expect(combatPower).toBeLessThan(160);
        });
    });
});