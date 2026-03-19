/**
 * NPCStorage 单元测试
 */

import { NPCStorage } from '../game/storage/npc-storage.js';

// 模拟fetch函数
global.fetch = jest.fn();

// 模拟localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        length: 0
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

describe('NPCStorage', () => {
    let npcStorage;
    
    // 模拟模板数据
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
        }
    };
    
    // 模拟NPC数据
    const mockNpcData = [
        {
            npcId: 'npc_001',
            templateId: 'test_npc_001',
            name: '测试NPC实例',
            level: 5,
            loyalty: 75,
            teamPosition: 'front'
        }
    ];
    
    // 模拟图鉴数据
    const mockCatalogData = {
        entries: [
            {
                templateId: 'test_npc_001',
                isDiscovered: false,
                discoveredAt: null,
                firstDiscoveryPlayer: null
            },
            {
                templateId: 'test_npc_002',
                isDiscovered: true,
                discoveredAt: '2026-03-15T12:30:00Z',
                firstDiscoveryPlayer: 'test_player'
            }
        ]
    };

    beforeEach(() => {
        // 重置所有mock
        jest.clearAllMocks();
        localStorageMock.clear();
        
        // 创建NPCStorage实例
        npcStorage = new NPCStorage();
        
        // 模拟fetch响应
        fetch.mockImplementation((url) => {
            if (url.includes('templates/common/test_npc_001.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockTemplate)
                });
            }
            if (url.includes('templates/common/index.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        templates: ['test_npc_001']
                    })
                });
            }
            if (url.includes('templates/rare/index.json') || url.includes('templates/legendary/index.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        templates: []
                    })
                });
            }
            if (url.includes('catalog/index.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockCatalogData)
                });
            }
            return Promise.resolve({ ok: false });
        });
        
        // 设置默认玩家ID
        localStorageMock.setItem('player_id', 'test_player');
    });

    describe('存储类型设置', () => {
        test('setStorageType - 应设置有效的存储类型', () => {
            npcStorage.setStorageType('indexeddb');
            expect(npcStorage.storageType).toBe('indexeddb');
            
            npcStorage.setStorageType('api');
            expect(npcStorage.storageType).toBe('api');
            
            npcStorage.setStorageType('local');
            expect(npcStorage.storageType).toBe('local');
        });

        test('setStorageType - 无效类型应使用默认值', () => {
            const originalType = npcStorage.storageType;
            
            npcStorage.setStorageType('invalid_type');
            
            expect(npcStorage.storageType).toBe(originalType); // 应保持不变
        });
    });

    describe('模板加载', () => {
        test('loadTemplate - 应成功加载模板', async () => {
            const template = await npcStorage.loadTemplate('test_npc_001');
            
            expect(template).toBeTruthy();
            expect(template.templateId).toBe('test_npc_001');
            expect(template.name).toBe('测试NPC');
            expect(template.rarity).toBe('common');
            expect(template.baseAttributes.strength).toBe(12);
        });

        test('loadTemplate - 不存在的模板应返回null', async () => {
            fetch.mockResolvedValueOnce({ ok: false });
            
            const template = await npcStorage.loadTemplate('non_existent');
            
            expect(template).toBeNull();
        });

        test('loadTemplate - 缺少templateId应返回null', async () => {
            const template = await npcStorage.loadTemplate('');
            expect(template).toBeNull();
            
            const template2 = await npcStorage.loadTemplate(null);
            expect(template2).toBeNull();
        });

        test('loadAllTemplates - 应加载所有模板', async () => {
            const templates = await npcStorage.loadAllTemplates();
            
            expect(templates).toHaveLength(1);
            expect(templates[0].templateId).toBe('test_npc_001');
            expect(templates[0].name).toBe('测试NPC');
        });

        test('loadAllTemplates - 部分加载失败应继续加载其他', async () => {
            // 模拟一个索引文件加载失败
            fetch.mockImplementation((url) => {
                if (url.includes('templates/common/index.json')) {
                    return Promise.reject(new Error('Network error'));
                }
                return Promise.resolve({ ok: false });
            });
            
            const templates = await npcStorage.loadAllTemplates();
            
            // 应该返回空数组而不是抛出错误
            expect(Array.isArray(templates)).toBe(true);
            expect(templates).toHaveLength(0);
        });
    });

    describe('已招募NPC数据管理', () => {
        test('saveRecruitedNpcs - 应成功保存数据到localStorage', async () => {
            const playerId = 'test_player';
            const result = await npcStorage.saveRecruitedNpcs(playerId, mockNpcData);
            
            expect(result).toBe(true);
            
            // 验证保存的数据
            const savedData = JSON.parse(localStorageMock.getItem('npc_recruited_test_player'));
            expect(savedData).toBeTruthy();
            expect(savedData.playerId).toBe(playerId);
            expect(savedData.npcs).toHaveLength(1);
            expect(savedData.npcs[0].npcId).toBe('npc_001');
            expect(savedData.version).toBe('1.0.0');
        });

        test('saveRecruitedNpcs - 无效参数应失败', async () => {
            // 缺少playerId
            await expect(npcStorage.saveRecruitedNpcs('', mockNpcData)).resolves.toBe(false);
            
            // 缺少npcs数据
            await expect(npcStorage.saveRecruitedNpcs('test_player', null)).resolves.toBe(false);
            
            // npcs不是数组
            await expect(npcStorage.saveRecruitedNpcs('test_player', {})).resolves.toBe(false);
        });

        test('loadRecruitedNpcs - 应成功从localStorage加载数据', async () => {
            // 先保存数据
            const playerId = 'test_player';
            await npcStorage.saveRecruitedNpcs(playerId, mockNpcData);
            
            // 然后加载数据
            const loadedNpcs = await npcStorage.loadRecruitedNpcs(playerId);
            
            expect(loadedNpcs).toHaveLength(1);
            expect(loadedNpcs[0].npcId).toBe('npc_001');
            expect(loadedNpcs[0].templateId).toBe('test_npc_001');
            expect(loadedNpcs[0].level).toBe(5);
        });

        test('loadRecruitedNpcs - 无保存数据应返回空数组', async () => {
            const loadedNpcs = await npcStorage.loadRecruitedNpcs('non_existent_player');
            
            expect(loadedNpcs).toEqual([]);
        });

        test('saveRecruitedNpcs + loadRecruitedNpcs - 应保持数据完整性', async () => {
            const playerId = 'roundtrip_test';
            
            // 保存数据
            await npcStorage.saveRecruitedNpcs(playerId, mockNpcData);
            
            // 加载数据
            const loadedNpcs = await npcStorage.loadRecruitedNpcs(playerId);
            
            // 验证数据完整性
            expect(loadedNpcs).toHaveLength(mockNpcData.length);
            
            const original = mockNpcData[0];
            const loaded = loadedNpcs[0];
            
            expect(loaded.npcId).toBe(original.npcId);
            expect(loaded.templateId).toBe(original.templateId);
            expect(loaded.name).toBe(original.name);
            expect(loaded.level).toBe(original.level);
            expect(loaded.loyalty).toBe(original.loyalty);
            expect(loaded.teamPosition).toBe(original.teamPosition);
        });
    });

    describe('图鉴管理', () => {
        test('updateCatalog - 应成功更新图鉴', async () => {
            const result = await npcStorage.updateCatalog('test_npc_001', true);
            
            expect(result).toBe(true);
            
            // 验证图鉴数据被保存到localStorage
            const savedCatalog = JSON.parse(localStorageMock.getItem('npc_catalog_data'));
            expect(savedCatalog).toBeTruthy();
            expect(savedCatalog.entries).toHaveLength(2);
            
            // 验证特定条目被更新
            const entry = savedCatalog.entries.find(e => e.templateId === 'test_npc_001');
            expect(entry.isDiscovered).toBe(true);
            expect(entry.discoveredAt).toBeTruthy();
            expect(entry.firstDiscoveryPlayer).toBe('test_player');
        });

        test('updateCatalog - 已发现的条目再次发现应不覆盖首次发现者', async () => {
            // 先模拟一个已发现的条目
            const existingCatalog = {
                entries: [
                    {
                        templateId: 'test_npc_001',
                        isDiscovered: true,
                        discoveredAt: '2026-03-15T12:00:00Z',
                        firstDiscoveryPlayer: 'first_player'
                    }
                ]
            };
            
            localStorageMock.setItem('npc_catalog_data', JSON.stringify(existingCatalog));
            
            // 尝试用另一个玩家再次"发现"
            localStorageMock.setItem('player_id', 'second_player');
            await npcStorage.updateCatalog('test_npc_001', true);
            
            // 验证首次发现者未被覆盖
            const savedCatalog = JSON.parse(localStorageMock.getItem('npc_catalog_data'));
            const entry = savedCatalog.entries.find(e => e.templateId === 'test_npc_001');
            
            expect(entry.firstDiscoveryPlayer).toBe('first_player'); // 应保持原首次发现者
            expect(entry.discoveredAt).toBe('2026-03-15T12:00:00Z'); // 发现时间也不应变
        });

        test('getCatalogStats - 应返回正确的统计信息', async () => {
            // 设置图鉴数据
            localStorageMock.setItem('npc_catalog_data', JSON.stringify(mockCatalogData));
            
            const stats = await npcStorage.getCatalogStats();
            
            expect(stats.total).toBe(2);
            expect(stats.discovered).toBe(1); // 只有test_npc_002已发现
            expect(stats.discoveryRate).toBe(0.5); // 1/2 = 0.5
            
            // 验证按稀有度分组
            expect(stats.byRarity).toBeTruthy();
            expect(stats.byRarity.common).toBeTruthy();
            expect(stats.byRarity.common.total).toBe(2); // 两个模板都是common
        });

        test('getCatalogStats - 无图鉴数据时应返回空统计', async () => {
            // 确保没有图鉴数据
            localStorageMock.removeItem('npc_catalog_data');
            
            const stats = await npcStorage.getCatalogStats();
            
            expect(stats.total).toBe(0);
            expect(stats.discovered).toBe(0);
            expect(stats.discoveryRate).toBe(0);
        });
    });

    describe('团队配置管理', () => {
        test('saveTeamConfiguration - 应成功保存团队配置', async () => {
            const playerId = 'test_player';
            const config = {
                npcIds: ['npc_001', 'npc_002'],
                positions: {
                    'npc_001': 'front',
                    'npc_002': 'back'
                }
            };
            
            const result = await npcStorage.saveTeamConfiguration(playerId, config);
            
            expect(result).toBe(true);
            
            // 验证配置被保存
            const savedConfig = JSON.parse(localStorageMock.getItem('npc_team_config_test_player'));
            expect(savedConfig).toEqual(config);
        });

        test('loadTeamConfiguration - 应成功加载团队配置', async () => {
            // 先保存配置
            const playerId = 'test_player';
            const config = {
                npcIds: ['npc_001', 'npc_002'],
                positions: {
                    'npc_001': 'front',
                    'npc_002': 'back'
                }
            };
            
            await npcStorage.saveTeamConfiguration(playerId, config);
            
            // 然后加载配置
            const loadedConfig = await npcStorage.loadTeamConfiguration(playerId);
            
            expect(loadedConfig).toEqual(config);
        });

        test('loadTeamConfiguration - 无保存配置时应返回默认配置', async () => {
            const loadedConfig = await npcStorage.loadTeamConfiguration('non_existent_player');
            
            expect(loadedConfig).toEqual({ npcIds: [], positions: {} });
        });
    });

    describe('数据导入导出', () => {
        test('exportNpcData - 应导出完整数据', async () => {
            // 设置测试数据
            const playerId = 'export_test';
            
            // 保存已招募NPC
            await npcStorage.saveRecruitedNpcs(playerId, mockNpcData);
            
            // 保存团队配置
            const teamConfig = {
                npcIds: ['npc_001'],
                positions: { 'npc_001': 'front' }
            };
            await npcStorage.saveTeamConfiguration(playerId, teamConfig);
            
            // 执行导出
            const exportJson = await npcStorage.exportNpcData(playerId);
            
            expect(exportJson).toBeTruthy();
            
            // 验证导出的数据结构
            const exportData = JSON.parse(exportJson);
            
            expect(exportData.version).toBe('1.0.0');
            expect(exportData.playerId).toBe(playerId);
            expect(exportData.exportedAt).toBeTruthy();
            expect(exportData.npcs).toHaveLength(1);
            expect(exportData.teamConfig).toEqual(teamConfig);
            expect(exportData.catalog).toBeTruthy();
        });

        test('importNpcData - 应成功导入数据', async () => {
            const playerId = 'import_test';
            
            // 创建要导入的数据
            const importData = {
                version: '1.0.0',
                playerId: playerId,
                exportedAt: '2026-03-15T12:30:00Z',
                npcs: mockNpcData,
                teamConfig: {
                    npcIds: ['npc_001'],
                    positions: { 'npc_001': 'front' }
                }
            };
            
            const importJson = JSON.stringify(importData);
            
            // 执行导入
            const result = await npcStorage.importNpcData(playerId, importJson);
            
            expect(result).toBe(true);
            
            // 验证数据被正确导入
            const loadedNpcs = await npcStorage.loadRecruitedNpcs(playerId);
            expect(loadedNpcs).toHaveLength(1);
            expect(loadedNpcs[0].npcId).toBe('npc_001');
            
            const loadedConfig = await npcStorage.loadTeamConfiguration(playerId);
            expect(loadedConfig.npcIds).toEqual(['npc_001']);
        });

        test('importNpcData - 无效JSON应失败', async () => {
            const result = await npcStorage.importNpcData('test_player', 'invalid_json');
            
            expect(result).toBe(false);
        });
    });

    describe('数据清理', () => {
        test('cleanupOldData - 应执行清理操作', async () => {
            const playerId = 'cleanup_test';
            
            // 保存一些数据
            await npcStorage.saveRecruitedNpcs(playerId, mockNpData);
            
            // 执行清理（默认30天阈值）
            const result = await npcStorage.cleanupOldData(playerId, 30);
            
            expect(result).toBe(true);
            
            // 验证清理操作完成（简化实现中，cleanup只是记录日志）
            // 实际实现中这里会验证数据被正确过滤
        });

        test('cleanupOldData - 异常情况应优雅处理', async () => {
            // 模拟清理过程中出现异常
            // 这里测试的是cleanup方法不会抛出异常
            const result = await npcStorage.cleanupOldData('non_existent', 30);
            
            // 应该返回false或true，但不应抛出异常
            expect(typeof result).toBe('boolean');
        });
    });

    describe('实用方法', () => {
        test('_getRarityFromTemplateId - 应正确识别稀有度', () => {
            // 测试已知模板ID
            expect(npcStorage._getRarityFromTemplateId('guardian_001')).toBe('common');
            expect(npcStorage._getRarityFromTemplateId('mystic_001')).toBe('common');
            expect(npcStorage._getRarityFromTemplateId('hunter_001')).toBe('common');
            expect(npcStorage._getRarityFromTemplateId('witch_001')).toBe('rare');
            expect(npcStorage._getRarityFromTemplateId('seer_001')).toBe('rare');
            expect(npcStorage._getRarityFromTemplateId('angel_001')).toBe('legendary');
            expect(npcStorage._getRarityFromTemplateId('ancient_one_001')).toBe('legendary');
            
            // 测试未知模板ID
            expect(npcStorage._getRarityFromTemplateId('unknown_template')).toBe('common'); // 默认值
        });

        test('_getCurrentPlayerId - 应返回当前玩家ID', () => {
            // 测试有player_id的情况
            localStorageMock.setItem('player_id', 'test_player_123');
            expect(npcStorage._getCurrentPlayerId()).toBe('test_player_123');
            
            // 测试无player_id的情况
            localStorageMock.removeItem('player_id');
            expect(npcStorage._getCurrentPlayerId()).toBe('default_player');
        });

        test('getStorageStats - 应返回存储统计信息', () => {
            // 设置一些测试数据
            localStorageMock.setItem('npc_recruited_test_player', JSON.stringify({ npcs: mockNpcData }));
            localStorageMock.setItem('other_key', 'test_value');
            
            const stats = npcStorage.getStorageStats();
            
            expect(stats.type).toBe('local');
            expect(stats.version).toBe('1.0.0');
            expect(stats.localStorage).toBeTruthy();
            expect(stats.localStorage.totalKeys).toBeGreaterThan(0);
            expect(stats.localStorage.npcKeys).toBeGreaterThan(0);
            expect(stats.localStorage.totalSize).toBeGreaterThan(0);
        });
    });

    describe('错误处理', () => {
        test('网络错误时应优雅处理', async () => {
            // 模拟网络错误
            fetch.mockRejectedValueOnce(new Error('Network error'));
            
            const template = await npcStorage.loadTemplate('test_npc_001');
            
            // 应该返回null而不是抛出异常
            expect(template).toBeNull();
        });

        test('JSON解析错误时应优雅处理', async () => {
            // 模拟返回无效JSON
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.reject(new Error('Invalid JSON'))
            });
            
            const template = await npcStorage.loadTemplate('test_npc_001');
            
            expect(template).toBeNull();
        });

        test('localStorage错误时应优雅处理', async () => {
            // 模拟localStorage.setItem抛出错误
            localStorageMock.setItem.mockImplementationOnce(() => {
                throw new Error('Storage full');
            });
            
            const result = await npcStorage.saveRecruitedNpcs('test_player', mockNpcData);
            
            // 应该返回false而不是抛出异常
            expect(result).toBe(false);
        });
    });
});