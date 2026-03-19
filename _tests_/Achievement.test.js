/**
 * Achievement 单元测试
 */

import { 
    Achievement, 
    AchievementData, 
    AchievementType, 
    RewardType 
} from '../game/models/Achievement.js';

describe('Achievement', () => {
    describe('构造函数', () => {
        test('应正确创建成就实例', () => {
            const achievement = new Achievement({
                id: 'test_achievement',
                name: '测试成就',
                description: '这是一个测试成就',
                type: AchievementType.KILL,
                icon: '🎯',
                requirements: { enemyId: 'test_enemy', count: 5 },
                rewards: [
                    { type: RewardType.GOLD, value: 100 },
                    { type: RewardType.TITLE, value: '测试者' }
                ],
                hidden: false,
                unlocked: false,
                progress: 0,
                flavorText: '测试背景故事'
            });

            expect(achievement.id).toBe('test_achievement');
            expect(achievement.name).toBe('测试成就');
            expect(achievement.description).toBe('这是一个测试成就');
            expect(achievement.type).toBe(AchievementType.KILL);
            expect(achievement.icon).toBe('🎯');
            expect(achievement.requirements).toEqual({ enemyId: 'test_enemy', count: 5 });
            expect(achievement.rewards).toHaveLength(2);
            expect(achievement.hidden).toBe(false);
            expect(achievement.unlocked).toBe(false);
            expect(achievement.progress).toBe(0);
            expect(achievement.flavorText).toBe('测试背景故事');
        });

        test('应使用默认值创建成就实例', () => {
            const achievement = new Achievement({
                id: 'default_achievement',
                name: '默认成就',
                description: '默认描述'
            });

            expect(achievement.type).toBe(AchievementType.KILL);
            expect(achievement.icon).toBe('🏆');
            expect(achievement.requirements).toEqual({});
            expect(achievement.rewards).toEqual([]);
            expect(achievement.hidden).toBe(false);
            expect(achievement.unlocked).toBe(false);
            expect(achievement.progress).toBe(0);
        });
    });

    describe('checkRequirements() 方法', () => {
        test('应正确检查击杀成就条件', () => {
            const achievement = new Achievement({
                id: 'kill_achievement',
                type: AchievementType.KILL,
                requirements: { enemyId: 'test_enemy', count: 3 }
            });

            const context = {
                kills: { test_enemy: 5 }
            };

            expect(achievement.checkRequirements(context)).toBe(true);
        });

        test('应正确处理未满足的击杀成就条件', () => {
            const achievement = new Achievement({
                id: 'kill_achievement',
                type: AchievementType.KILL,
                requirements: { enemyId: 'test_enemy', count: 10 }
            });

            const context = {
                kills: { test_enemy: 5 }
            };

            expect(achievement.checkRequirements(context)).toBe(false);
        });

        test('应正确检查收集成就条件', () => {
            const achievement = new Achievement({
                id: 'collect_achievement',
                type: AchievementType.COLLECT,
                requirements: { itemId: 'feature_sequence_5' }
            });

            const context = {
                collectibles: {
                    feature_sequence_5: { obtained: true }
                }
            };

            expect(achievement.checkRequirements(context)).toBe(true);
        });

        test('应正确检查技能成就条件', () => {
            const achievement = new Achievement({
                id: 'skill_achievement',
                type: AchievementType.SKILL,
                requirements: { skillId: 'skill_berserk_rage' }
            });

            const context = {
                skills: ['skill_berserk_rage', 'skill_divination']
            };

            expect(achievement.checkRequirements(context)).toBe(true);
        });

        test('应正确检查剧情成就条件', () => {
            const achievement = new Achievement({
                id: 'story_achievement',
                type: AchievementType.STORY,
                requirements: { questId: 'quest_chapter1_1', completed: true }
            });

            const context = {
                quests: {
                    quest_chapter1_1: { completed: true }
                }
            };

            expect(achievement.checkRequirements(context)).toBe(true);
        });

        test('已解锁的成就不应再次检查条件', () => {
            const achievement = new Achievement({
                id: 'unlocked_achievement',
                unlocked: true
            });

            expect(achievement.checkRequirements({})).toBe(true);
        });
    });

    describe('updateProgress() 方法', () => {
        test('应正确更新击杀成就进度', () => {
            const achievement = new Achievement({
                id: 'kill_progress',
                type: AchievementType.KILL,
                requirements: { enemyId: 'test_enemy', count: 10 }
            });

            const context = {
                kills: { test_enemy: 7 }
            };

            achievement.updateProgress(context);
            expect(achievement.progress).toBe(70); // 7/10 = 70%
        });

        test('应正确更新收集成就进度', () => {
            const achievement = new Achievement({
                id: 'collect_progress',
                type: AchievementType.COLLECT,
                requirements: { type: 'feature', count: 5 }
            });

            const context = {
                collectibles: {
                    feature_sequence_5: { obtained: true, type: 'feature' },
                    feature_sequence_4: { obtained: true, type: 'feature' },
                    material_dark_crystal: { obtained: true, type: 'material' }
                }
            };

            achievement.updateProgress(context);
            expect(achievement.progress).toBe(40); // 2/5 = 40%
        });

        test('应正确更新技能成就进度', () => {
            const achievement = new Achievement({
                id: 'skill_progress',
                type: AchievementType.SKILL,
                requirements: { skillCount: 8 }
            });

            const context = {
                skills: ['skill1', 'skill2', 'skill3', 'skill4']
            };

            achievement.updateProgress(context);
            expect(achievement.progress).toBe(50); // 4/8 = 50%
        });

        test('已解锁的成就进度应为100%', () => {
            const achievement = new Achievement({
                id: 'fully_unlocked',
                unlocked: true
            });

            achievement.updateProgress({});
            expect(achievement.progress).toBe(100);
        });
    });

    describe('unlock() 方法', () => {
        test('应正确解锁成就', () => {
            const achievement = new Achievement({
                id: 'lockable_achievement',
                unlocked: false
            });

            const result = achievement.unlock();
            
            expect(result).toBe(true);
            expect(achievement.unlocked).toBe(true);
            expect(achievement.progress).toBe(100);
            expect(achievement.unlockDate).toBeDefined();
        });

        test('已解锁的成就不应再次解锁', () => {
            const achievement = new Achievement({
                id: 'already_unlocked',
                unlocked: true
            });

            const result = achievement.unlock();
            
            expect(result).toBe(false);
        });
    });

    describe('toDict() 和 fromDict() 方法', () => {
        test('应正确序列化和反序列化', () => {
            const original = new Achievement({
                id: 'serializable_achievement',
                name: '可序列化成',
                description: '测试序列化',
                type: AchievementType.STORY,
                icon: '📖',
                requirements: { questId: 'test_quest' },
                rewards: [{ type: RewardType.GOLD, value: 500 }],
                hidden: true,
                flavorText: '背景故事'
            });

            original.unlock();

            const dict = original.toDict();
            const restored = Achievement.fromDict(dict);

            expect(restored.id).toBe(original.id);
            expect(restored.name).toBe(original.name);
            expect(restored.description).toBe(original.description);
            expect(restored.type).toBe(original.type);
            expect(restored.icon).toBe(original.icon);
            expect(restored.requirements).toEqual(original.requirements);
            expect(restored.rewards).toEqual(original.rewards);
            expect(restored.hidden).toBe(original.hidden);
            expect(restored.unlocked).toBe(original.unlocked);
            expect(restored.progress).toBe(original.progress);
            expect(restored.unlockDate).toBe(original.unlockDate);
            expect(restored.flavorText).toBe(original.flavorText);
        });
    });

    describe('预定义成就', () => {
        test('应包含首杀成就', () => {
            expect(AchievementData.achievement_first_blood).toBeDefined();
            expect(AchievementData.achievement_first_blood.name).toBe('首杀');
            expect(AchievementData.achievement_first_blood.type).toBe(AchievementType.KILL);
        });

        test('应包含牧羊人猎手成就', () => {
            expect(AchievementData.achievement_shepherd_slayer).toBeDefined();
            expect(AchievementData.achievement_shepherd_slayer.name).toBe('牧羊人猎手');
            expect(AchievementData.achievement_shepherd_slayer.requirements.enemyId).toBe('enemy_shepherd');
        });

        test('应包含隐藏成就', () => {
            const hiddenAchievement = AchievementData.achievement_pathway_expert;
            expect(hiddenAchievement).toBeDefined();
            expect(hiddenAchievement.hidden).toBe(true);
        });

        test('应包含剧情成就', () => {
            expect(AchievementData.achievement_story_initiate).toBeDefined();
            expect(AchievementData.achievement_story_initiate.type).toBe(AchievementType.STORY);
        });
    });
});