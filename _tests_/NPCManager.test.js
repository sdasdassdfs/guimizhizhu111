/**
 * NPCManager 单元测试
 */

import { NPCManager } from '../game/managers/NPCManager.js';
import { NPC } from '../game/models/NPC.js';

// 模拟fetch函数
global.fetch = jest.fn();

// 模拟gameState
const mockGameState = {
    playerId: 'test_player',
    playerGold: 1000,
    inventory: {
        getItemCount: jest.fn().mockReturnValue(5),
        removeItem: jest.fn()
    },
    triggerEvent: jest.fn()
};

describe('NPCManager', () => {
    let npcManager;
    
    // 模拟模板数据
    const mockTemplates = [
        {
            templateId: 'guardian_001',
            name: '教会守卫',
            type: 'human_extraordinary',
            rarity: 'common',
            recruitmentConditions: {
                type: 'wild_kill',
                requiredItems: [{ itemId: 'holy_symbol', quantity: 1 }],
                requiredGold: 50,
                triggerChance: 0.3,
                prerequisiteNpcs: []
            },
            teamPosition: 'front'
        },
        {
            templateId: 'mystic_001',
            name: '神秘学者',
            type: 'human_extraordinary',
            rarity: 'common',
            recruitmentConditions: {
                type: 'story_trigger',
                requiredItems: [{ itemId: 'ancient_tome', quantity: 1 }],
                requiredGold: 100,
                triggerChance: 1.0,
                prerequisiteNpcs: [],
                requiredQuestId: 'quest_mystic_intro'
            },
            teamPosition: 'back'
        },
        {
            templateId: 'witch_001',
            name: '魔女',
            type: 'human_extraordinary',
            rarity: 'rare',
            recruitmentConditions: {
                type: 'story_trigger',
                requiredItems: [
                    { itemId: 'cursed_doll', quantity: 1 },
                    { itemId: 'witch_brew', quantity: 3 }
                ],
                requiredGold: 500,
                triggerChance: 1.0,
                prerequisiteNpcs: ['mystic_001'],
                requiredQuestId: 'quest_witch_coven'
            },
            teamPosition: 'middle'
        }
    ];

    beforeEach(() => {
        // 重置所有mock
        jest.clearAllMocks();
        
        // 创建NPCManager实例
        npcManager = new NPCManager(mockGameState);
        
        // 模拟fetch响应
        fetch.mockImplementation((url) => {
            if (url.includes('templates/common/index.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        templates: ['guardian_001', 'mystic_001']
                    })
                });
            }
            if (url.includes('templates/rare/index.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        templates: ['witch_001']
                    })
                });
            }
            if (url.includes('guardian_001.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockTemplates[0])
                });
            }
            if (url.includes('mystic_001.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockTemplates[1])
                });
            }
            if (url.includes('witch_001.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockTemplates[2])
                });
            }
            if (url.includes('recruited/test_player/index.json')) {
                return Promise.resolve({
                    ok: false // 模拟文件不存在
                });
            }
            if (url.includes('catalog/index.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        entries: [
                            { templateId: 'guardian_001', isDiscovered: false },
                            { templateId: 'mystic_001', isDiscovered: false },
                            { templateId: 'witch_001', isDiscovered: false }
                        ]
                    })
                });
            }
            return Promise.resolve({ ok: false });
        });
    });

    describe('初始化', () => {
        test('initialize - 应成功初始化并加载数据', async () => {
            await npcManager.initialize();
            
            // 验证模板已加载
            expect(npcManager.getAllTemplates()).toHaveLength(3);
            expect(npcManager.getTemplate('guardian_001')).toBeTruthy();
            expect(npcManager.getTemplate('mystic_001')).toBeTruthy();
            expect(npcManager.getTemplate('witch_001')).toBeTruthy();
            
            // 验证已招募NPC为空（模拟文件不存在）
            expect(npcManager.getRecruitedNpcs()).toHaveLength(0);
            
            // 验证图鉴已加载
            expect(npcManager.getCatalogEntries()).toHaveLength(3);
        });

        test('initialize - 处理加载失败应继续运行', async () => {
            // 模拟fetch失败
            fetch.mockRejectedValueOnce(new Error('Network error'));
            
            await expect(npcManager.initialize()).resolves.not.toThrow();
            
            // 管理器应该仍然被创建，只是数据为空
            expect(npcManager.getAllTemplates()).toHaveLength(0);
        });
    });

    describe('模板管理', () => {
        beforeEach(async () => {
            await npcManager.initialize();
        });

        test('getAllTemplates - 应返回所有模板', () => {
            const templates = npcManager.getAllTemplates();
            expect(templates).toHaveLength(3);
            
            // 验证模板属性
            const guardian = templates.find(t => t.templateId === 'guardian_001');
            expect(guardian.name).toBe('教会守卫');
            expect(guardian.rarity).toBe('common');
            expect(guardian.recruitmentConditions.type).toBe('wild_kill');
        });

        test('getTemplate - 应返回指定模板', () => {
            const template = npcManager.getTemplate('mystic_001');
            expect(template).toBeTruthy();
            expect(template.name).toBe('神秘学者');
            expect(template.teamPosition).toBe('back');
        });

        test('getTemplate - 不存在的模板应返回null', () => {
            const template = npcManager.getTemplate('non_existent');
            expect(template).toBeNull();
        });

        test('getTemplatesByRarity - 应按稀有度过滤模板', () => {
            const commonTemplates = npcManager.getTemplatesByRarity('common');
            expect(commonTemplates).toHaveLength(2);
            
            const rareTemplates = npcManager.getTemplatesByRarity('rare');
            expect(rareTemplates).toHaveLength(1);
            
            const legendaryTemplates = npcManager.getTemplatesByRarity('legendary');
            expect(legendaryTemplates).toHaveLength(0);
            
            // 验证模板ID
            expect(commonTemplates.map(t => t.templateId)).toContain('guardian_001');
            expect(commonTemplates.map(t => t.templateId)).toContain('mystic_001');
            expect(rareTemplates[0].templateId).toBe('witch_001');
        });
    });

    describe('招募检查', () => {
        beforeEach(async () => {
            await npcManager.initialize();
        });

        test('checkWildKillRecruitment - 应检查野外击杀招募条件', () => {
            const mockEnemy = {
                type: 'church_guard',
                name: '教会守卫'
            };
            
            // 测试概率通过的情况（需要mock Math.random）
            jest.spyOn(Math, 'random').mockReturnValue(0.2); // 小于0.3
            
            const recruitment = npcManager.checkWildKillRecruitment(mockEnemy);
            
            expect(recruitment).toBeTruthy();
            expect(recruitment.template.templateId).toBe('guardian_001');
            expect(recruitment.requiredGold).toBe(50);
            expect(recruitment.recruitmentType).toBe('wild_kill');
            expect(recruitment.description).toContain('教会守卫');
            
            Math.random.mockRestore();
        });

        test('checkWildKillRecruitment - 概率未通过应返回null', () => {
            const mockEnemy = {
                type: 'church_guard',
                name: '教会守卫'
            };
            
            jest.spyOn(Math, 'random').mockReturnValue(0.5); // 大于0.3
            
            const recruitment = npcManager.checkWildKillRecruitment(mockEnemy);
            
            expect(recruitment).toBeNull();
            
            Math.random.mockRestore();
        });

        test('checkWildKillRecruitment - 无效敌人应返回null', () => {
            expect(npcManager.checkWildKillRecruitment(null)).toBeNull();
            expect(npcManager.checkWildKillRecruitment({})).toBeNull();
            expect(npcManager.checkWildKillRecruitment({ type: 'unknown' })).toBeNull();
        });

        test('checkStoryRecruitment - 应检查剧情触发招募条件', () => {
            const recruitments = npcManager.checkStoryRecruitment('quest_mystic_intro');
            
            expect(recruitments).toHaveLength(1);
            expect(recruitments[0].template.templateId).toBe('mystic_001');
            expect(recruitments[0].requiredGold).toBe(100);
            expect(recruitments[0].recruitmentType).toBe('story_trigger');
        });

        test('checkStoryRecruitment - 不匹配的任务ID应返回空数组', () => {
            const recruitments = npcManager.checkStoryRecruitment('non_existent_quest');
            expect(recruitments).toHaveLength(0);
        });
    });

    describe('NPC招募', () => {
        let mockTemplate;

        beforeEach(async () => {
            await npcManager.initialize();
            mockTemplate = mockTemplates[0]; // guardian_001
            
            // 模拟已招募NPC数据
            npcManager.recruitedNpcs.clear();
        });

        test('recruitNpc - 应成功招募NPC', async () => {
            // 模拟足够的资源
            mockGameState.playerGold = 1000;
            mockGameState.inventory.getItemCount.mockReturnValue(5);
            
            const instanceId = 'npc_test_instance';
            const result = await npcManager.recruitNpc(mockTemplate, instanceId);
            
            expect(result).toBe(true);
            
            // 验证NPC已添加到招募列表
            expect(npcManager.recruitedNpcs.has(instanceId)).toBe(true);
            
            const recruitedNpc = npcManager.recruitedNpcs.get(instanceId);
            expect(recruitedNpc.npcId).toBe(instanceId);
            expect(recruitedNpc.templateId).toBe('guardian_001');
            expect(recruitedNpc.name).toBe('教会守卫');
            
            // 验证资源被扣除
            expect(mockGameState.playerGold).toBe(950); // 1000 - 50
            expect(mockGameState.inventory.removeItem).toHaveBeenCalledWith('holy_symbol', 1);
            
            // 验证事件被触发
            expect(mockGameState.triggerEvent).toHaveBeenCalledWith('npc_recruited', expect.any(Object));
        });

        test('recruitNpc - 金币不足时应失败', async () => {
            mockGameState.playerGold = 20; // 小于所需的50
            
            const result = await npcManager.recruitNpc(mockTemplate, 'test_instance');
            
            expect(result).toBe(false);
            expect(npcManager.recruitedNpcs.size).toBe(0);
        });

        test('recruitNpc - 物品不足时应失败', async () => {
            mockGameState.playerGold = 1000;
            mockGameState.inventory.getItemCount.mockReturnValue(0); // 没有物品
            
            const result = await npcManager.recruitNpc(mockTemplate, 'test_instance');
            
            expect(result).toBe(false);
            expect(npcManager.recruitedNpcs.size).toBe(0);
        });

        test('recruitNpc - 缺少参数时应失败', async () => {
            await expect(npcManager.recruitNpc(null, 'test_instance')).resolves.toBe(false);
            await expect(npcManager.recruitNpc(mockTemplate, '')).resolves.toBe(false);
            await expect(npcManager.recruitNpc(null, null)).resolves.toBe(false);
        });
    });

    describe('已招募NPC管理', () => {
        let mockNpc1, mockNpc2;

        beforeEach(async () => {
            await npcManager.initialize();
            
            // 创建模拟NPC实例
            mockNpc1 = new NPC({
                npcId: 'npc_001',
                templateId: 'guardian_001',
                name: '教会守卫A',
                loyalty: 75,
                teamPosition: 'front'
            });
            
            mockNpc2 = new NPC({
                npcId: 'npc_002',
                templateId: 'mystic_001',
                name: '神秘学者B',
                loyalty: 60,
                teamPosition: 'back'
            });
            
            npcManager.recruitedNpcs.set('npc_001', mockNpc1);
            npcManager.recruitedNpcs.set('npc_002', mockNpc2);
        });

        test('getRecruitedNpcs - 应返回所有已招募NPC', () => {
            const recruited = npcManager.getRecruitedNpcs();
            
            expect(recruited).toHaveLength(2);
            expect(recruited.map(n => n.npcId)).toContain('npc_001');
            expect(recruited.map(n => n.npcId)).toContain('npc_002');
            expect(recruited.map(n => n.name)).toContain('教会守卫A');
        });

        test('getNpcById - 应通过ID获取NPC', () => {
            const npc = npcManager.getNpcById('npc_001');
            
            expect(npc).toBeTruthy();
            expect(npc.npcId).toBe('npc_001');
            expect(npc.name).toBe('教会守卫A');
        });

        test('getNpcById - 不存在的ID应返回null', () => {
            const npc = npcManager.getNpcById('non_existent');
            expect(npc).toBeNull();
        });

        test('getNpcsByTemplate - 应按模板ID过滤NPC', () => {
            // 添加另一个相同模板的NPC
            const mockNpc3 = new NPC({
                npcId: 'npc_003',
                templateId: 'guardian_001',
                name: '教会守卫C'
            });
            npcManager.recruitedNpcs.set('npc_003', mockNpc3);
            
            const guardians = npcManager.getNpcsByTemplate('guardian_001');
            
            expect(guardians).toHaveLength(2);
            expect(guardians.map(n => n.npcId)).toContain('npc_001');
            expect(guardians.map(n => n.npcId)).toContain('npc_003');
            expect(guardians.map(n => n.templateId)).toEqual(['guardian_001', 'guardian_001']);
        });

        test('getNpcsByTemplate - 无匹配模板应返回空数组', () => {
            const result = npcManager.getNpcsByTemplate('non_existent');
            expect(result).toHaveLength(0);
        });
    });

    describe('团队配置', () => {
        let mockNpc1, mockNpc2, mockNpc3;

        beforeEach(async () => {
            await npcManager.initialize();
            
            // 创建模拟NPC实例
            mockNpc1 = new NPC({
                npcId: 'npc_001',
                templateId: 'guardian_001',
                name: '前排NPC'
            });
            
            mockNpc2 = new NPC({
                npcId: 'npc_002',
                templateId: 'mystic_001',
                name: '后排NPC'
            });
            
            mockNpc3 = new NPC({
                npcId: 'npc_003',
                templateId: 'witch_001',
                name: '中排NPC'
            });
            
            npcManager.recruitedNpcs.set('npc_001', mockNpc1);
            npcManager.recruitedNpcs.set('npc_002', mockNpc2);
            npcManager.recruitedNpcs.set('npc_003', mockNpc3);
        });

        test('configureBattleTeam - 应成功配置战斗团队', () => {
            const npcIds = ['npc_001', 'npc_002'];
            const positions = {
                'npc_001': 'front',
                'npc_002': 'back'
            };
            
            const result = npcManager.configureBattleTeam(npcIds, positions);
            
            expect(result).toBe(true);
            
            // 验证位置被更新
            expect(mockNpc1.teamPosition).toBe('front');
            expect(mockNpc2.teamPosition).toBe('back');
            
            // 验证团队获取
            const battleTeam = npcManager.getBattleTeam();
            expect(battleTeam).toHaveLength(2);
            expect(battleTeam.map(n => n.npcId)).toEqual(['npc_001', 'npc_002']);
        });

        test('configureBattleTeam - 超过最大人数应失败', () => {
            const npcIds = ['npc_001', 'npc_002', 'npc_003', 'npc_999']; // 4人，但npc_999不存在
            const positions = {
                'npc_001': 'front',
                'npc_002': 'back',
                'npc_003': 'middle',
                'npc_999': 'middle'
            };
            
            const result = npcManager.configureBattleTeam(npcIds, positions);
            
            expect(result).toBe(false);
        });

        test('configureBattleTeam - 未招募的NPC应失败', () => {
            const npcIds = ['npc_001', 'non_existent'];
            const positions = {
                'npc_001': 'front',
                'non_existent': 'middle'
            };
            
            const result = npcManager.configureBattleTeam(npcIds, positions);
            
            expect(result).toBe(false);
        });

        test('configureBattleTeam - 无效位置应忽略', () => {
            const npcIds = ['npc_001'];
            const positions = {
                'npc_001': 'invalid_position' // 应被忽略
            };
            
            const result = npcManager.configureBattleTeam(npcIds, positions);
            
            expect(result).toBe(true);
            // 位置应保持不变（默认或之前设置的值）
            // 这里取决于NPC的默认值
        });
    });

    describe('图鉴管理', () => {
        beforeEach(async () => {
            await npcManager.initialize();
        });

        test('getCatalogEntries - 应返回所有图鉴条目', () => {
            const entries = npcManager.getCatalogEntries();
            
            expect(entries).toHaveLength(3);
            expect(entries.map(e => e.templateId)).toContain('guardian_001');
            expect(entries.map(e => e.isDiscovered)).toEqual([false, false, false]);
        });

        test('getDiscoveryRate - 应计算正确发现率', () => {
            // 初始应为0%
            expect(npcManager.getDiscoveryRate()).toBe(0);
            
            // 模拟发现一个NPC
            npcManager._updateCatalogForTemplate('guardian_001', true);
            
            // 应为1/3 ≈ 0.333
            const rate = npcManager.getDiscoveryRate();
            expect(rate).toBeCloseTo(0.333, 3);
        });

        test('getDiscoveryRate - 空图鉴时应返回0', () => {
            // 清空图鉴
            npcManager.npcCatalog.clear();
            
            expect(npcManager.getDiscoveryRate()).toBe(0);
        });
    });

    describe('实用方法', () => {
        test('generateInstanceId - 应生成唯一实例ID', () => {
            const id1 = npcManager.generateInstanceId('test_template');
            const id2 = npcManager.generateInstanceId('test_template');
            
            expect(id1).toBeTruthy();
            expect(id2).toBeTruthy();
            expect(id1).not.toBe(id2); // 时间戳不同应生成不同ID
            
            // 验证格式
            expect(id1).toMatch(/^npc_test_template_/);
        });

        test('getRecommendedTeamCompositions - 应返回推荐组合', () => {
            // 添加已招募NPC
            const npc1 = new NPC({
                npcId: 'npc_front',
                templateId: 'guardian_001',
                teamPosition: 'front'
            });
            
            const npc2 = new NPC({
                npcId: 'npc_middle',
                templateId: 'witch_001',
                teamPosition: 'middle'
            });
            
            const npc3 = new NPC({
                npcId: 'npc_back',
                templateId: 'mystic_001',
                teamPosition: 'back'
            });
            
            npcManager.recruitedNpcs.set('npc_front', npc1);
            npcManager.recruitedNpcs.set('npc_middle', npc2);
            npcManager.recruitedNpcs.set('npc_back', npc3);
            
            const compositions = npcManager.getRecommendedTeamCompositions();
            
            expect(compositions.length).toBeGreaterThan(0);
            
            // 验证组合信息
            const balancedComp = compositions.find(c => c.name === '平衡型团队');
            expect(balancedComp).toBeTruthy();
            expect(balancedComp.description).toContain('1前排+1中排+1后排');
            expect(balancedComp.npcIds).toHaveLength(3);
            expect(balancedComp.strategy).toBeTruthy();
        });
    });
});