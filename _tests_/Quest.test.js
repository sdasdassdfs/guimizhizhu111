/**
 * Quest 单元测试
 */
import { 
  Quest, QuestType, QuestStatus, 
  Objective, ObjectiveType,
  Reward,
  QuestLog 
} from '../game/models/Quest.js';

describe('Objective 类', () => {
  test('构造函数正确初始化目标', () => {
    const obj = new Objective({
      id: 'obj1',
      description: '收集3个黑曜石',
      type: ObjectiveType.COLLECT,
      requiredCount: 3,
      currentCount: 0,
      targetId: '黑曜石'
    });
    
    expect(obj.id).toBe('obj1');
    expect(obj.description).toBe('收集3个黑曜石');
    expect(obj.type).toBe(ObjectiveType.COLLECT);
    expect(obj.requiredCount).toBe(3);
    expect(obj.currentCount).toBe(0);
    expect(obj.targetId).toBe('黑曜石');
  });

  test('updateProgress 更新进度并检查完成', () => {
    const obj = new Objective({
      id: 'obj2',
      description: '击杀5个怪物',
      type: ObjectiveType.KILL,
      requiredCount: 5,
      currentCount: 0
    });
    
    expect(obj.isCompleted()).toBe(false);
    
    const completed = obj.updateProgress(3);
    expect(obj.currentCount).toBe(3);
    expect(completed).toBe(false);
    
    const completed2 = obj.updateProgress(3); // 总共6，超过5
    expect(obj.currentCount).toBe(5);
    expect(completed2).toBe(true);
    expect(obj.isCompleted()).toBe(true);
  });
});

describe('Reward 类', () => {
  test('构造函数正确初始化奖励', () => {
    const reward = new Reward({
      experience: 1000,
      gold: 500,
      items: ['非凡特性'],
      reputation: { '教会': 10 },
      attributePoints: 2,
      skillPoints: 1,
      unlockFeatures: ['占卜']
    });
    
    expect(reward.experience).toBe(1000);
    expect(reward.gold).toBe(500);
    expect(reward.items).toEqual(['非凡特性']);
    expect(reward.reputation).toEqual({ '教会': 10 });
    expect(reward.attributePoints).toBe(2);
    expect(reward.skillPoints).toBe(1);
    expect(reward.unlockFeatures).toEqual(['占卜']);
  });

  test('toDict 和 fromDict 序列化', () => {
    const original = new Reward({
      experience: 500,
      gold: 200
    });
    
    const dict = original.toDict();
    const restored = Reward.fromDict(dict);
    
    expect(restored.experience).toBe(original.experience);
    expect(restored.gold).toBe(original.gold);
  });
});

describe('Quest 类', () => {
  test('构造函数正确初始化任务', () => {
    const quest = new Quest({
      id: 'quest1',
      name: '新手任务',
      type: QuestType.MAIN,
      description: '第一个任务',
      giverId: 'npc1',
      objectives: [
        new Objective({ id: 'obj1', description: '目标1' })
      ],
      rewards: new Reward({ experience: 100 }),
      prerequisites: [],
      sequenceRequirement: 9,
      timeLimit: null,
      status: QuestStatus.AVAILABLE
    });
    
    expect(quest.id).toBe('quest1');
    expect(quest.name).toBe('新手任务');
    expect(quest.type).toBe(QuestType.MAIN);
    expect(quest.description).toBe('第一个任务');
    expect(quest.giverId).toBe('npc1');
    expect(quest.objectives.length).toBe(1);
    expect(quest.rewards.experience).toBe(100);
    expect(quest.sequenceRequirement).toBe(9);
    expect(quest.status).toBe(QuestStatus.AVAILABLE);
  });

  test('任务状态转换: 开始、更新、完成', () => {
    const quest = new Quest({
      id: 'quest2',
      name: '状态测试',
      type: QuestType.SIDE,
      objectives: [
        new Objective({ id: 'obj1', description: '目标', requiredCount: 2 })
      ],
      status: QuestStatus.AVAILABLE
    });
    
    // 开始任务
    expect(quest.start()).toBe(true);
    expect(quest.status).toBe(QuestStatus.ACTIVE);
    expect(quest.startTime).toBeInstanceOf(Date);
    
    // 更新进度
    const updated = quest.updateObjective('obj1', 1);
    expect(updated).toBe(false); // 未完成
    expect(quest.objectives[0].currentCount).toBe(1);
    
    const updated2 = quest.updateObjective('obj1', 1);
    expect(updated2).toBe(true); // 完成
    expect(quest.objectives[0].currentCount).toBe(2);
    
    // 任务应自动完成
    expect(quest.status).toBe(QuestStatus.COMPLETED);
    expect(quest.completionTime).toBeInstanceOf(Date);
  });

  test('canAccept 检查序列要求', () => {
    const quest = new Quest({
      id: 'quest3',
      sequenceRequirement: 8, // 需要序列8
      status: QuestStatus.AVAILABLE
    });
    
    // 角色序列等级为7，无法接取
    expect(quest.canAccept(7)).toBe(false);
    // 角色序列等级为8，可以接取
    expect(quest.canAccept(8)).toBe(true);
    // 角色序列等级为9，可以接取
    expect(quest.canAccept(9)).toBe(true);
    
    // 状态不是AVAILABLE，无法接取
    quest.status = QuestStatus.ACTIVE;
    expect(quest.canAccept(9)).toBe(false);
  });

  test('toDict 和 fromDict 序列化', () => {
    const original = new Quest({
      id: 'quest4',
      name: '序列化测试',
      type: QuestType.ADVANCEMENT,
      objectives: [
        new Objective({ id: 'obj1', description: '目标' })
      ],
      rewards: new Reward({ experience: 300 }),
      sequenceRequirement: 7,
      status: QuestStatus.ACTIVE
    });
    original.startTime = new Date('2026-01-01');
    
    const dict = original.toDict();
    const restored = Quest.fromDict(dict);
    
    expect(restored.id).toBe(original.id);
    expect(restored.name).toBe(original.name);
    expect(restored.type).toBe(original.type);
    expect(restored.objectives.length).toBe(1);
    expect(restored.rewards.experience).toBe(300);
    expect(restored.sequenceRequirement).toBe(7);
    expect(restored.status).toBe(QuestStatus.ACTIVE);
  });
});

describe('QuestLog 类', () => {
  test('添加和获取任务', () => {
    const log = new QuestLog();
    const quest = new Quest({
      id: 'q1',
      name: '日志测试',
      status: QuestStatus.ACTIVE
    });
    
    log.addQuest(quest);
    expect(log.activeQuests['q1']).toBe(quest);
    
    const retrieved = log.getQuest('q1');
    expect(retrieved).toBe(quest);
  });

  test('acceptQuest 和 updateQuest', () => {
    const log = new QuestLog();
    const quest = new Quest({
      id: 'q2',
      name: '接取测试',
      status: QuestStatus.AVAILABLE,
      objectives: [
        new Objective({ id: 'obj1', description: '目标', requiredCount: 1 })
      ]
    });
    
    // 接取任务
    expect(log.acceptQuest(quest)).toBe(true);
    expect(log.activeQuests['q2']).toBe(quest);
    expect(quest.status).toBe(QuestStatus.ACTIVE);
    
    // 更新任务进度
    const updated = log.updateQuest('q2', 'obj1', 1);
    expect(updated).toBe(true);
    expect(quest.status).toBe(QuestStatus.COMPLETED);
    expect(log.completedQuests['q2']).toBe(quest);
    expect(log.activeQuests['q2']).toBeUndefined();
  });
});