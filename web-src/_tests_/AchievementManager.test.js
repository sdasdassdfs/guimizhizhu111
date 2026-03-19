/**
 * AchievementManager 单元测试
 */

import { AchievementManager } from '../game/managers/AchievementManager.js';
import { AchievementData } from '../game/models/Achievement.js';
import { CollectibleData } from '../game/models/Collectible.js';

describe('AchievementManager', () => {
    let manager;
    let mockGameState;

    beforeEach(() => {
        mockGameState = {
            character: {
                gold: 0,
                skills: [],
                titles: []
            },
            combatStats: {
                enemiesDefeated: {}
            },
            collectibles: {},
            quests: {}
        };

        manager = new AchievementManager(mockGameState);
    });

    describe('构造函数', () => {
        test('应正确初始化成就管理器', () => {
            expect(manager.gameState).toBe(mockGameState);
            expect(manager.achievements).toBeInstanceOf(Map);
            expect(manager.achievements.size).toBeGreaterThan(0);
        });

        test('应初始化所有预定义成就', () => {
            const allAchievements = manager.getAllAchievements();
            expect(allAchievements.length).toBeGreaterThan(0);
            
            // 检查至少包含一些预定义成就
            const achievementIds = allAchievements.map(a => a.id);
            expect(achievementIds).toContain('achievement_first_blood');
            expect(achievementIds).toContain('achievement_shepherd_slayer');
        });
    });

    describe('updateAllProgress() 方法', () => {
        test('应更新所有成就进度', () => {
            // 设置游戏状态
            mockGameState.combatStats.enemiesDefeated = {
                enemy_shepherd: 1
            };

            manager.updateAllProgress();
            
            const firstBlood = manager.achievements.get('achievement_first_blood');
            const shepherdSlayer = manager.achievements.get('achievement_shepherd_slayer');
            
            expect(firstBlood.progress).toBe(100);
            expect(shepherdSlayer.progress).toBe(100);
        });

        test('应解锁满足条件的成就', () => {
            // 设置满足首杀条件
            mockGameState.combatStats.enemiesDefeated = {
                test_enemy: 1
            };

            manager.updateAllProgress();
            
            const firstBlood = manager.achievements.get('achievement_first_blood');
            expect(firstBlood.unlocked).toBe(true);
        });
    });

    describe('解锁成就', () => {
        test('应正确解锁成就', () => {
            const achievementId = 'achievement_first_blood';
            const achievement = manager.unlockAchievement(achievementId);
            
            expect(achievement).toBeDefined();
            expect(achievement.unlocked).toBe(true);
            expect(mockGameState.character.gold).toBe(100); // 首杀奖励100金币
        });

        test('重复解锁应返回null', () => {
            const achievementId = 'achievement_first_blood';
            
            manager.unlockAchievement(achievementId);
            const secondUnlock = manager.unlockAchievement(achievementId);
            
            expect(secondUnlock).toBeNull();
        });

        test('不存在的成就应返回null', () => {
            const achievement = manager.unlockAchievement('non_existent_achievement');
            expect(achievement).toBeNull();
        });
    });

    describe('奖励发放', () => {
        test('应正确发放金币奖励', () => {
            const achievementId = 'achievement_first_blood';
            const initialGold = mockGameState.character.gold;
            
            manager.unlockAchievement(achievementId);
            
            expect(mockGameState.character.gold).toBe(initialGold + 100);
        });

        test('应正确发放物品奖励', () => {
            const achievementId = 'achievement_shepherd_slayer';
            
            manager.unlockAchievement(achievementId);
            
            expect(mockGameState.collectibles.material_dark_crystal).toBeDefined();
            expect(mockGameState.collectibles.material_dark_crystal.count).toBe(5);
        });

        test('应正确发放称号奖励', () => {
            const achievementId = 'achievement_first_blood';
            
            manager.unlockAchievement(achievementId);
            
            expect(mockGameState.character.titles).toContain('新手猎人');
        });
    });

    describe('事件处理', () => {
        test('应正确处理敌人被击败事件', () => {
            manager.handleEvent('enemy_defeated', { enemyId: 'test_enemy' });
            
            expect(mockGameState.combatStats.enemiesDefeated.test_enemy).toBe(1);
        });

        test('应正确处理物品收集事件', () => {
            manager.handleEvent('item_collected', { 
                itemId: 'material_dark_crystal',
                quantity: 3 
            });
            
            const collectible = mockGameState.collectibles.material_dark_crystal;
            expect(collectible).toBeDefined();
            expect(collectible.count).toBe(3);
            expect(collectible.obtained).toBe(true);
        });

        test('应正确处理技能解锁事件', () => {
            manager.handleEvent('skill_unlocked', { 
                skillId: 'skill_berserk_rage'
            });
            
            expect(mockGameState.character.skills).toContain('skill_berserk_rage');
        });

        test('应正确处理任务完成事件', () => {
            manager.handleEvent('quest_completed', { 
                questId: 'quest_chapter1_1'
            });
            
            expect(mockGameState.quests.quest_chapter1_1.completed).toBe(true);
        });

        test('处理事件后应更新成就进度', () => {
            // 初始进度应为0
            const firstBlood = manager.achievements.get('achievement_first_blood');
            expect(firstBlood.progress).toBe(0);
            
            // 处理敌人被击败事件
            manager.handleEvent('enemy_defeated', { enemyId: 'test_enemy' });
            
            // 进度应更新
            expect(firstBlood.progress).toBe(100);
        });
    });

    describe('成就查询', () => {
        test('应返回所有成就', () => {
            const all = manager.getAllAchievements();
            expect(Array.isArray(all)).toBe(true);
            expect(all.length).toBeGreaterThan(0);
        });

        test('应返回已解锁成就', () => {
            // 解锁一个成就
            manager.unlockAchievement('achievement_first_blood');
            
            const unlocked = manager.getUnlockedAchievements();
            expect(unlocked.length).toBe(1);
            expect(unlocked[0].id).toBe('achievement_first_blood');
        });

        test('应返回未解锁成就', () => {
            // 解锁一个成就
            manager.unlockAchievement('achievement_first_blood');
            
            const locked = manager.getLockedAchievements();
            expect(locked.length).toBeGreaterThan(0);
            expect(locked.every(a => !a.unlocked)).toBe(true);
        });

        test('应返回隐藏成就', () => {
            const hidden = manager.getHiddenAchievements();
            expect(hidden.length).toBeGreaterThan(0);
            expect(hidden.every(a => a.hidden)).toBe(true);
        });
    });

    describe('序列化与反序列化', () => {
        test('应正确序列化成管理器状态', () => {
            // 解锁一个成就
            manager.unlockAchievement('achievement_first_blood');
            
            const dict = manager.toDict();
            
            expect(typeof dict).toBe('object');
            expect(dict.achievement_first_blood).toBeDefined();
            expect(dict.achievement_first_blood.unlocked).toBe(true);
        });

        test('应正确从字典恢复管理器状态', () => {
            // 准备序列化数据
            const serializedData = {
                achievement_first_blood: {
                    id: 'achievement_first_blood',
                    name: '首杀',
                    description: '第一次击败敌人',
                    type: 'kill',
                    icon: '🩸',
                    requirements: { totalKills: 1 },
                    rewards: [
                        { type: 'gold', value: 100 },
                        { type: 'title', value: '新手猎人' }
                    ],
                    hidden: false,
                    unlocked: true,
                    progress: 100,
                    unlockDate: '2026-03-14T01:00:00.000Z',
                    flavorText: '第一次面对非凡世界的力量，你迈出了第一步。'
                }
            };

            const restoredManager = AchievementManager.fromDict(serializedData, mockGameState);
            
            expect(restoredManager).toBeInstanceOf(AchievementManager);
            expect(restoredManager.gameState).toBe(mockGameState);
            
            const firstBlood = restoredManager.achievements.get('achievement_first_blood');
            expect(firstBlood.unlocked).toBe(true);
            expect(firstBlood.progress).toBe(100);
        });
    });

    describe('成就进度', () => {
        test('应正确计算击杀成就进度', () => {
            const achievementId = 'achievement_first_blood';
            const achievement = manager.achievements.get(achievementId);
            
            // 设置部分进度
            mockGameState.combatStats.enemiesDefeated = {
                test_enemy: 0
            };
            
            manager.updateAllProgress();
            expect(achievement.progress).toBe(0);
            
            // 增加进度
            mockGameState.combatStats.enemiesDefeated.test_enemy = 1;
            manager.updateAllProgress();
            expect(achievement.progress).toBe(100);
        });

        test('应正确计算收集成就进度', () => {
            const achievementId = 'achievement_collector_beginner';
            const achievement = manager.achievements.get(achievementId);
            
            // 设置空收集品
            mockGameState.collectibles = {};
            
            manager.updateAllProgress();
            expect(achievement.progress).toBe(0);
            
            // 添加收集品
            mockGameState.collectibles = {
                feature_sequence_5: { obtained: true },
                material_dark_crystal: { obtained: true }
            };
            
            manager.updateAllProgress();
            expect(achievement.progress).toBe(20); // 2/10 = 20%
        });
    });
});