/**
 * GameState 单元测试（作为战斗相关功能的替代）
 */
import { GameState } from '../game/models/GameState.js';
import { Character } from '../game/models/Character.js';
import { Inventory } from '../game/models/Item.js';
import { QuestLog } from '../game/models/Quest.js';
import { Background } from '../game/models/Attribute.js';

describe('GameState 类', () => {
  test('构造函数正确初始化游戏状态', () => {
    const char = new Character({
      name: '测试角色',
      background: Background.NOBLE
    });
    const inventory = new Inventory();
    const questLog = new QuestLog();
    
    const gameState = new GameState({
      character: char,
      inventory: inventory,
      questLog: questLog,
      currentChapter: '第一章',
      currentLocation: '贝克兰德'
    });
    
    expect(gameState.character).toBe(char);
    expect(gameState.inventory).toBe(inventory);
    expect(gameState.questLog).toBe(questLog);
    expect(gameState.currentChapter).toBe('第一章');
    expect(gameState.currentLocation).toBe('贝克兰德');
    expect(gameState.gameTime).toBe(0);
    expect(gameState.realStartTime).toBeInstanceOf(Date);
    expect(gameState.lastSaveTime).toBeNull();
    expect(gameState.playTimeSeconds).toBe(0);
    expect(gameState.pathwayAffinities).toBeDefined();
    expect(gameState.unlockedPathways).toBeInstanceOf(Set);
    expect(gameState.activePathwayId).toBeNull();
    expect(gameState.flags).toEqual({});
    expect(gameState.variables).toEqual({});
  });

  test('updatePathwayAffinity 更新途径倾向', () => {
    const char = new Character({ name: '测试', background: Background.COMMONER });
    const gameState = new GameState({
      character: char,
      inventory: new Inventory(),
      questLog: new QuestLog()
    });
    
    const pathwayId = 'pathway_5';
    const initialValue = gameState.pathwayAffinities[pathwayId] || 1.0;
    
    // 增加倾向值
    gameState.updatePathwayAffinity(pathwayId, 2.0);
    expect(gameState.pathwayAffinities[pathwayId]).toBe(initialValue + 2.0);
    
    // 检查是否同步到角色
    expect(char.pathwayAffinities[pathwayId]).toBe(initialValue + 2.0);
    
    // 减少倾向值（不能低于0）
    gameState.updatePathwayAffinity(pathwayId, -10.0);
    expect(gameState.pathwayAffinities[pathwayId]).toBe(0.0);
  });

  test('getMainPathway 返回倾向最高的途径', () => {
    const char = new Character({ name: '测试', background: Background.ORPHAN });
    const gameState = new GameState({
      character: char,
      inventory: new Inventory(),
      questLog: new QuestLog()
    });
    
    // 设置一些倾向值
    gameState.updatePathwayAffinity('pathway_1', 3.0);
    gameState.updatePathwayAffinity('pathway_2', 5.0);
    gameState.updatePathwayAffinity('pathway_3', 4.0);
    
    const mainPathway = gameState.getMainPathway();
    expect(mainPathway).toBe('pathway_2');
  });

  test('开始和完成章节', () => {
    const gameState = new GameState({
      character: new Character({ name: '测试', background: Background.MYSTIC }),
      inventory: new Inventory(),
      questLog: new QuestLog()
    });
    
    gameState.startChapter('第二章');
    expect(gameState.currentChapter).toBe('第二章');
    expect(gameState.checkFlag('chapter_第二章_started')).toBe(true);
    
    gameState.completeChapter('第二章');
    expect(gameState.checkFlag('chapter_第二章_completed')).toBe(true);
  });

  test('游戏标记和变量管理', () => {
    const gameState = new GameState({
      character: new Character({ name: '测试', background: Background.NOBLE }),
      inventory: new Inventory(),
      questLog: new QuestLog()
    });
    
    gameState.addFlag('has_met_aragon');
    expect(gameState.checkFlag('has_met_aragon')).toBe(true);
    
    gameState.addFlag('defeated_boss', false);
    expect(gameState.checkFlag('defeated_boss')).toBe(false);
    
    gameState.setVariable('player_choice', 'join_church');
    expect(gameState.getVariable('player_choice')).toBe('join_church');
    expect(gameState.getVariable('nonexistent', 'default')).toBe('default');
  });

  test('推进游戏时间', () => {
    const gameState = new GameState({
      character: new Character({ name: '测试', background: Background.COMMONER }),
      inventory: new Inventory(),
      questLog: new QuestLog()
    });
    
    const initialGameTime = gameState.gameTime;
    const initialPlayTime = gameState.playTimeSeconds;
    
    gameState.advanceTime(2); // 推进2小时
    
    expect(gameState.gameTime).toBe(initialGameTime + 2);
    expect(gameState.playTimeSeconds).toBe(initialPlayTime + 2 * 3600);
  });

  test('toDict 和 fromDict 序列化', () => {
    const originalChar = new Character({
      name: '存档测试',
      background: Background.ORPHAN,
      level: 7,
      experience: 1250
    });
    const original = new GameState({
      character: originalChar,
      inventory: new Inventory(),
      questLog: new QuestLog(),
      currentChapter: '第三章',
      currentLocation: '海上',
      gameTime: 150,
      playTimeSeconds: 54000
    });
    
    // 设置一些数据
    original.updatePathwayAffinity('pathway_10', 6.0);
    original.addFlag('special_event');
    original.setVariable('secret', 'revealed');
    
    const dict = original.toDict();
    const restored = GameState.fromDict(dict);
    
    expect(restored.character.name).toBe(original.character.name);
    expect(restored.character.level).toBe(original.character.level);
    expect(restored.currentChapter).toBe(original.currentChapter);
    expect(restored.gameTime).toBe(original.gameTime);
    expect(restored.pathwayAffinities['pathway_10']).toBe(6.0);
    expect(restored.checkFlag('special_event')).toBe(true);
    expect(restored.getVariable('secret')).toBe('revealed');
  });
});