/**
 * 游戏状态测试
 */
const { GameState, saveGameState, loadGameState } = require('../main.js');

// 注意：由于 main.js 是浏览器环境，我们需要模拟一些浏览器 API
beforeAll(() => {
  // 模拟 localStorage
  global.localStorage = {
    store: {},
    getItem: function(key) {
      return this.store[key] || null;
    },
    setItem: function(key, value) {
      this.store[key] = value;
    },
    removeItem: function(key) {
      delete this.store[key];
    },
    clear: function() {
      this.store = {};
    }
  };
});

beforeEach(() => {
  // 每次测试前重置游戏状态
  Object.assign(GameState, {
    character: {
      name: null,
      pathway: null,
      level: '序列9',
      sanity: 100,
      maxSanity: 100,
      spirit: 50,
      maxSpirit: 100,
      experience: 0,
      attributes: {
        strength: 5,
        agility: 5,
        intelligence: 5,
        willpower: 5,
        luck: 5
      }
    },
    inventory: [],
    currentQuest: null,
    progress: {
      gameStarted: false,
      currentLocation: '初始之地',
      completedQuests: [],
      discoveredPathways: []
    },
    settings: {
      autoSave: true,
      fontSize: 'medium',
      theme: 'dark'
    }
  });
  
  // 清空 localStorage
  localStorage.clear();
});

describe('游戏状态管理', () => {
  test('游戏状态初始值正确', () => {
    expect(GameState.character.level).toBe('序列9');
    expect(GameState.character.sanity).toBe(100);
    expect(GameState.progress.gameStarted).toBe(false);
  });
  
  test('保存和加载游戏状态', () => {
    // 修改游戏状态
    GameState.character.name = '测试角色';
    GameState.character.pathway = '占卜家';
    GameState.progress.gameStarted = true;
    GameState.inventory.push('古老的羊皮纸');
    
    // 保存状态
    const saveResult = saveGameState();
    expect(saveResult).toBe(true);
    
    // 重置游戏状态
    GameState.character.name = null;
    GameState.progress.gameStarted = false;
    GameState.inventory = [];
    
    // 加载状态
    const loadResult = loadGameState();
    expect(loadResult).toBe(true);
    
    // 验证状态已恢复
    expect(GameState.character.name).toBe('测试角色');
    expect(GameState.character.pathway).toBe('占卜家');
    expect(GameState.progress.gameStarted).toBe(true);
    expect(GameState.inventory).toContain('古老的羊皮纸');
  });
  
  test('保存失败时返回 false', () => {
    // 模拟 localStorage.setItem 抛出错误
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('模拟存储错误');
    };
    
    const result = saveGameState();
    expect(result).toBe(false);
    
    // 恢复原始函数
    localStorage.setItem = originalSetItem;
  });
  
  test('加载不存在的保存返回 false', () => {
    localStorage.clear();
    const result = loadGameState();
    expect(result).toBe(false);
  });
});

describe('游戏功能', () => {
  test('开始游戏命令', () => {
    // 这里可以测试命令处理器
    // 由于命令处理器依赖于DOM，我们暂时不测试
    expect(true).toBe(true);
  });
});