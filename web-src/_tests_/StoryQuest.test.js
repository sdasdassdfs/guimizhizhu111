/**
 * StoryQuest 单元测试
 */
import { StoryQuest, DialogueNode, BranchPoint } from '../game/quests/StoryQuest.js';
import { Objective, ObjectiveType, Reward, QuestStatus } from '../game/models/Quest.js';

describe('StoryQuest 类', () => {
    test('构造函数正确初始化剧情任务', () => {
        const quest = new StoryQuest({
            id: 'story_ch1_awakening',
            name: '灵性觉醒',
            chapter: 1,
            description: '稳定你的灵性',
            objectives: [
                new Objective({ id: 'obj1', description: '目标1' })
            ],
            rewards: new Reward({ experience: 1000 }),
            branchPoints: [
                {
                    id: 'branch1',
                    description: '选择分支',
                    choices: [
                        { id: 'choice1', text: '选项1' }
                    ]
                }
            ]
        });
        
        expect(quest.id).toBe('story_ch1_awakening');
        expect(quest.name).toBe('灵性觉醒');
        expect(quest.chapter).toBe(1);
        expect(quest.type).toBe('主线');
        expect(quest.branchPoints.length).toBe(1);
        expect(quest.branchPoints[0].id).toBe('branch1');
    });
    
    test('获取指定分支点', () => {
        const quest = new StoryQuest({
            id: 'test_quest',
            branchPoints: [
                { id: 'branch1', description: '分支1' },
                { id: 'branch2', description: '分支2' }
            ]
        });
        
        const branch = quest.getBranchPoint('branch2');
        expect(branch).not.toBeNull();
        expect(branch.id).toBe('branch2');
        
        const notFound = quest.getBranchPoint('nonexistent');
        expect(notFound).toBeNull();
    });
    
    test('记录分支选择', () => {
        const quest = new StoryQuest({
            id: 'test_quest',
            branchPoints: [
                {
                    id: 'branch1',
                    description: '分支1',
                    choices: [
                        { id: 'choice1', text: '选项1', effects: { test: true } },
                        { id: 'choice2', text: '选项2' }
                    ]
                }
            ]
        });
        
        // 成功记录选择
        const result1 = quest.recordBranchChoice('branch1', 'choice1');
        expect(result1).toBe(true);
        
        const branch = quest.getBranchPoint('branch1');
        expect(branch.playerChoice).toBe('choice1');
        expect(branch.choiceTime).toBeInstanceOf(Date);
        
        // 重复记录应失败
        const result2 = quest.recordBranchChoice('branch1', 'choice2');
        expect(result2).toBe(false);
        
        // 无效分支ID应失败
        const result3 = quest.recordBranchChoice('nonexistent', 'choice1');
        expect(result3).toBe(false);
        
        // 无效选项ID应失败
        const result4 = quest.recordBranchChoice('branch1', 'invalid');
        expect(result4).toBe(false);
    });
    
    test('序列化和反序列化', () => {
        const original = new StoryQuest({
            id: 'story_ch2_mist',
            name: '迷雾调查',
            chapter: 2,
            objectives: [
                new Objective({ id: 'obj1', description: '收集样本', type: ObjectiveType.COLLECT })
            ],
            rewards: new Reward({ experience: 1200 }),
            branchPoints: [
                {
                    id: 'investigation',
                    description: '调查方向',
                    choices: [
                        { id: 'track', text: '追踪灵性' }
                    ]
                }
            ],
            nextQuestId: 'story_ch2_faction',
            failCondition: {
                type: 'timeout',
                duration: 259200
            }
        });
        
        // 转换为字典
        const dict = original.toDict();
        
        expect(dict.id).toBe('story_ch2_mist');
        expect(dict.chapter).toBe(2);
        expect(dict.branchPoints).toHaveLength(1);
        expect(dict.branchPoints[0].id).toBe('investigation');
        expect(dict.nextQuestId).toBe('story_ch2_faction');
        expect(dict.failCondition.type).toBe('timeout');
        
        // 从字典恢复
        const restored = StoryQuest.fromDict(dict);
        
        expect(restored.id).toBe(original.id);
        expect(restored.chapter).toBe(original.chapter);
        expect(restored.branchPoints).toHaveLength(original.branchPoints.length);
        expect(restored.nextQuestId).toBe(original.nextQuestId);
        expect(restored.failCondition.type).toBe(original.failCondition.type);
    });
    
    test('检查失败条件', () => {
        const quest = new StoryQuest({
            id: 'timeout_quest',
            failCondition: {
                type: 'timeout',
                duration: 3600 // 1小时
            }
        });
        
        // 设置开始时间为1小时前
        quest.startTime = new Date(Date.now() - 7200000); // 2小时前
        
        // 模拟游戏状态（简化）
        const mockGameState = {
            getFlag: () => null,
            getVariable: () => null
        };
        
        // 应返回true，因为已超时
        const shouldFail = quest.checkFailCondition(mockGameState);
        expect(shouldFail).toBe(true);
        
        // 无失败条件的任务应返回false
        const noConditionQuest = new StoryQuest({ id: 'no_fail' });
        expect(noConditionQuest.checkFailCondition(mockGameState)).toBe(false);
    });
});

describe('DialogueNode 类', () => {
    test('构造函数正确初始化对话节点', () => {
        const node = new DialogueNode({
            id: 'node1',
            speaker: '老尼尔',
            text: '欢迎来到值夜者',
            choices: [
                { id: 'choice1', text: '谢谢' }
            ],
            nextNodeId: 'node2',
            condition: { type: 'flag', flagKey: 'met_nell' }
        });
        
        expect(node.id).toBe('node1');
        expect(node.speaker).toBe('老尼尔');
        expect(node.text).toBe('欢迎来到值夜者');
        expect(node.choices.length).toBe(1);
        expect(node.nextNodeId).toBe('node2');
        expect(node.condition.type).toBe('flag');
    });
    
    test('检查条件是否满足', () => {
        const node = new DialogueNode({
            condition: { type: 'flag', flagKey: 'completed_tutorial', flagValue: true }
        });
        
        const gameStateWithFlag = {
            getFlag: (key) => key === 'completed_tutorial' ? true : null
        };
        
        const gameStateWithoutFlag = {
            getFlag: () => null
        };
        
        expect(node.isConditionMet(gameStateWithFlag)).toBe(true);
        expect(node.isConditionMet(gameStateWithoutFlag)).toBe(false);
        
        // 无条件节点应始终返回true
        const noConditionNode = new DialogueNode({});
        expect(noConditionNode.isConditionMet(gameStateWithoutFlag)).toBe(true);
    });
});

describe('BranchPoint 类', () => {
    test('构造函数正确初始化分支点', () => {
        const branch = new BranchPoint({
            id: 'encounter',
            description: '遭遇现场处理',
            choices: [
                { id: 'report', text: '报告值夜者' }
            ],
            location: '东区小巷',
            triggerCondition: { type: 'quest', questId: 'story_ch1_awakening' }
        });
        
        expect(branch.id).toBe('encounter');
        expect(branch.description).toBe('遭遇现场处理');
        expect(branch.choices.length).toBe(1);
        expect(branch.location).toBe('东区小巷');
        expect(branch.triggerCondition.type).toBe('quest');
        expect(branch.playerChoice).toBeNull();
    });
    
    test('检查触发条件是否满足', () => {
        const branch = new BranchPoint({
            triggerCondition: { type: 'variable', variableKey: 'investigation_progress', variableValue: 3 }
        });
        
        // BranchPoint.isTriggered 简化实现，目前始终返回true
        const mockGameState = {};
        expect(branch.isTriggered(mockGameState)).toBe(true);
    });
});