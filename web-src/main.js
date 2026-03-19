/**
 * 《诡秘之主》网页游戏 - 主JavaScript文件
 * 
 * 核心功能：
 * 1. 游戏状态管理
 * 2. 命令解析与处理
 * 3. 本地存储集成（进度保存）
 * 4. 界面更新与交互
 */

// 游戏状态对象
const GameState = {
    // 角色信息
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
    
    // 物品栏
    inventory: [],
    
    // 收集品
    collectibles: {},
    
    // 成就数据
    achievements: {},
    
    // 当前任务
    currentQuest: null,
    
    // 游戏进度
    progress: {
        gameStarted: false,
        currentLocation: '初始之地',
        completedQuests: [],
        discoveredPathways: []
    },
    
    // 游戏设置
    settings: {
        autoSave: true,
        fontSize: 'medium',
        theme: 'dark'
    }
};

// 命令处理器映射
const commandHandlers = {};

// 游戏管理器对象（供UI管理器调用）
const gameManager = {
    // 获取途径数据
    getPathways: function() {
        // 这里应该从游戏模块获取实际数据
        // 暂时返回模拟数据
        return [
            { id: 'fool', name: '愚者', sequence: '序列9：占卜家 → 序列0：愚者', description: '掌握命运与诡秘的途径，擅长占卜、欺诈和时空操作。', type: 'fool' },
            { id: 'door', name: '门', sequence: '序列9：学徒 → 序列0：门', description: '掌控空间与传送的途径，擅长空间移动和维度操作。', type: 'door' },
            { id: 'error', name: '错误', sequence: '序列9：偷盗者 → 序列0：错误', description: '擅长窃取能力与命运，掌握错误与欺诈的权柄。', type: 'error' },
            { id: 'darkness', name: '黑暗', sequence: '序列9：不眠者 → 序列0：黑暗', description: '掌控黑暗与隐秘的途径，擅长潜行、暗杀和隐秘行动。', type: 'darkness' },
            { id: 'death', name: '死神', sequence: '序列9：收尸人 → 序列0：死神', description: '掌控死亡与亡者的途径，擅长操纵尸体和灵魂。', type: 'death' },
            { id: 'tyrant', name: '暴君', sequence: '序列9：水手 → 序列0：暴君', description: '掌控海洋与风暴的途径，擅长雷电、风暴和海洋操控。', type: 'tyrant' }
        ];
    },
    
    // 选择途径
    selectPathway: function(pathwayId) {
        GameState.character.pathway = pathwayId;
        GameState.progress.discoveredPathways.push(pathwayId);
        updateUI();
        saveGameState();
        return true;
    },
    
    // 接受任务
    acceptQuest: function(questId) {
        // 这里应该实现实际的任务接受逻辑
        console.log(`接受任务: ${questId}`);
        return true;
    },
    
    // 使用战斗技能
    useCombatSkill: function(skillId) {
        console.log(`使用战斗技能: ${skillId}`);
    },
    
    // 执行战斗回合
    executeCombatTurn: function() {
        console.log('执行战斗回合');
    },
    
    // 逃离战斗
    fleeCombat: function() {
        console.log('尝试逃离战斗');
        return true;
    }
};

// DOM 元素引用
let outputPanel, commandInput, submitButton, commandHistory, quickActions;
let charNameSpan, charPathwaySpan, charLevelSpan, charSanitySpan, charSpiritSpan;
let inventoryList, currentQuestSpan;

/**
 * 初始化游戏
 */
function initGame() {
    // 获取DOM元素
    outputPanel = document.getElementById('output-panel');
    commandInput = document.getElementById('command-input');
    submitButton = document.getElementById('submit-command');
    commandHistory = document.getElementById('command-history');
    quickActions = document.getElementById('quick-actions');
    
    charNameSpan = document.getElementById('char-name');
    charPathwaySpan = document.getElementById('char-pathway');
    charLevelSpan = document.getElementById('char-level');
    charSanitySpan = document.getElementById('char-sanity');
    charSpiritSpan = document.getElementById('char-spirit');
    
    inventoryList = document.getElementById('inventory-list');
    currentQuestSpan = document.getElementById('current-quest');
    
    // 加载保存的游戏进度
    loadGameState();
    
    // 初始化成就管理器
    if (typeof AchievementManager !== 'undefined') {
        window.achievementManager = new AchievementManager(GameState);
        // 同步成就状态（如果有保存的数据）
        if (GameState.achievements && typeof GameState.achievements === 'object') {
            window.achievementManager = AchievementManager.fromDict(GameState.achievements, GameState);
        }
    }
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化命令处理器
    initCommandHandlers();
    
    // 更新界面显示
    updateUI();
    
    // 输出欢迎消息
    addOutput('<div class="game-text system">游戏系统已初始化。输入"帮助"查看可用命令。</div>');
    
    // 设置UI管理器的游戏管理器引用
    if (window.UIManager) {
        window.UIManager.setGameManager(gameManager);
    }
    
    console.log('《诡秘之主》网页游戏初始化完成');
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 提交命令按钮
    submitButton.addEventListener('click', handleCommandSubmit);
    
    // 输入框回车键
    commandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCommandSubmit();
        }
    });
    
    // 快速动作按钮
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const command = e.target.dataset.command || 
                           e.target.closest('.quick-btn').dataset.command;
            executeCommand(command);
        });
    });
    
    // 自动保存监听器
    window.addEventListener('beforeunload', () => {
        if (GameState.settings.autoSave) {
            saveGameState();
        }
    });
    
    // 定期自动保存（每30秒）
    setInterval(() => {
        if (GameState.settings.autoSave && GameState.progress.gameStarted) {
            saveGameState();
            console.log('游戏进度已自动保存');
        }
    }, 30000);
}

/**
 * 初始化命令处理器
 */
function initCommandHandlers() {
    // 帮助命令
    commandHandlers['帮助'] = commandHandlers['help'] = () => {
        addOutput('<div class="game-text system"><strong>可用命令:</strong></div>');
        addOutput('<div class="game-text">');
        addOutput('<strong>游戏控制:</strong><br>');
        addOutput('• 开始游戏 - 创建新角色并开始冒险<br>');
        addOutput('• 继续游戏 - 加载上次保存的进度<br>');
        addOutput('• 保存进度 - 手动保存当前游戏状态<br>');
        addOutput('• 加载进度 - 从本地存储加载游戏状态<br>');
        addOutput('• 重置游戏 - 清除所有进度重新开始<br>');
        addOutput('</div>');
        
        addOutput('<div class="game-text">');
        addOutput('<strong>角色操作:</strong><br>');
        addOutput('• 状态 - 查看角色当前状态<br>');
        addOutput('• 物品栏 - 查看拥有的物品<br>');
        addOutput('• 途径 - 查看可选的序列途径<br>');
        addOutput('• 选择途径 [名称] - 选择序列途径<br>');
        addOutput('</div>');
        
        addOutput('<div class="game-text">');
        addOutput('<strong>游戏功能:</strong><br>');
        addOutput('• 任务 - 查看当前任务<br>');
        addOutput('• 探索 - 开始探索当前地点<br>');
        addOutput('• 战斗 - 进入战斗状态（如果适用）<br>');
        addOutput('• 休息 - 恢复理智和灵性<br>');
        addOutput('</div>');
        
        addOutput('<div class="game-text">');
        addOutput('<strong>系统命令:</strong><br>');
        addOutput('• 设置 - 修改游戏设置<br>');
        addOutput('• 关于 - 显示游戏信息<br>');
        addOutput('• 清屏 - 清除输出面板内容<br>');
        addOutput('</div>');
    };
    
    // 开始游戏命令
    commandHandlers['开始游戏'] = () => {
        if (GameState.progress.gameStarted) {
            addOutput('<div class="game-text error">游戏已经开始！</div>');
            return;
        }
        
        GameState.progress.gameStarted = true;
        addOutput('<div class="game-text success">新游戏开始！</div>');
        addOutput('<div class="game-text">欢迎来到诡秘世界。你发现自己站在一座古老的图书馆前，空气中弥漫着陈旧羊皮纸和神秘香料的味道。</div>');
        addOutput('<div class="game-text">首先，请使用"途径"命令查看可选的序列途径，然后使用"选择途径 [名称]"来选择你的道路。</div>');
        
        updateUI();
        saveGameState();
    };
    
    // 状态命令
    commandHandlers['状态'] = commandHandlers['status'] = () => {
        const char = GameState.character;
        addOutput('<div class="game-text system"><strong>角色状态:</strong></div>');
        addOutput('<div class="game-text">');
        addOutput(`<strong>名称:</strong> ${char.name || '未命名'}<br>`);
        addOutput(`<strong>序列:</strong> ${char.pathway || '未选择'}<br>`);
        addOutput(`<strong>等级:</strong> ${char.level}<br>`);
        addOutput(`<strong>理智:</strong> ${char.sanity}/${char.maxSanity}<br>`);
        addOutput(`<strong>灵性:</strong> ${char.spirit}/${char.maxSpirit}<br>`);
        addOutput(`<strong>经验:</strong> ${char.experience}<br>`);
        addOutput('</div>');
        
        addOutput('<div class="game-text"><strong>属性:</strong></div>');
        addOutput('<div class="game-text">');
        for (const [attr, value] of Object.entries(char.attributes)) {
            addOutput(`• ${attr}: ${value}<br>`);
        }
        addOutput('</div>');
    };
    
    // 保存进度命令
    commandHandlers['保存进度'] = commandHandlers['save'] = () => {
        saveGameState();
        addOutput('<div class="game-text success">游戏进度已保存！</div>');
    };
    
    // 继续游戏命令
    commandHandlers['继续游戏'] = commandHandlers['continue'] = () => {
        loadGameState();
        if (GameState.progress.gameStarted) {
            addOutput('<div class="game-text success">游戏进度已加载！</div>');
            addOutput(`<div class="game-text">欢迎回来，${GameState.character.name || '冒险者'}！</div>`);
        } else {
            addOutput('<div class="game-text">没有找到保存的游戏进度。请使用"开始游戏"命令开始新游戏。</div>');
        }
        updateUI();
    };
    
    // 关于命令
    commandHandlers['关于'] = commandHandlers['about'] = () => {
        addOutput('<div class="game-text system"><strong>《诡秘之主》网页交互式文字游戏</strong></div>');
        addOutput('<div class="game-text">');
        addOutput('• 基于爱潜水的乌贼《诡秘之主》小说设定<br>');
        addOutput('• 纯前端实现，使用LocalStorage保存进度<br>');
        addOutput('• 响应式设计，支持桌面和移动设备<br>');
        addOutput('• 当前版本: 原型 v1.0.0<br>');
        addOutput('</div>');
    };
    
    // 清屏命令
    commandHandlers['清屏'] = commandHandlers['clear'] = () => {
        outputPanel.innerHTML = '';
        addOutput('<div class="game-text system">输出已清空。</div>');
    };
}

/**
 * 处理命令提交
 */
function handleCommandSubmit() {
    const command = commandInput.value.trim();
    if (!command) return;
    
    // 添加到命令历史
    addToHistory(command);
    
    // 执行命令
    executeCommand(command);
    
    // 清空输入框
    commandInput.value = '';
    commandInput.focus();
}

/**
 * 执行命令
 * @param {string} command - 用户输入的命令
 */
function executeCommand(command) {
    // 记录命令
    console.log(`执行命令: ${command}`);
    
    // 添加命令到输出面板
    addOutput(`<div class="game-text"><strong>&gt; ${command}</strong></div>`);
    
    // 转换为小写以便匹配
    const cmdLower = command.toLowerCase();
    let handlerFound = false;
    
    // 查找匹配的命令处理器
    for (const [cmd, handler] of Object.entries(commandHandlers)) {
        if (cmdLower === cmd.toLowerCase() || 
            cmdLower.startsWith(cmd.toLowerCase() + ' ')) {
            handler(command);
            handlerFound = true;
            break;
        }
    }
    
    // 如果没有找到处理器
    if (!handlerFound) {
        addOutput('<div class="game-text error">未知命令。输入"帮助"查看可用命令。</div>');
    }
    
    // 更新界面
    updateUI();
    
    // 自动保存
    if (GameState.settings.autoSave && GameState.progress.gameStarted) {
        saveGameState();
    }
}

/**
 * 添加输出到面板
 * @param {string} html - 要添加的HTML内容
 */
function addOutput(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    outputPanel.appendChild(div);
    
    // 滚动到底部
    outputPanel.scrollTop = outputPanel.scrollHeight;
}

/**
 * 添加到命令历史
 * @param {string} command - 命令文本
 */
function addToHistory(command) {
    const timestamp = new Date().toLocaleTimeString();
    const historyItem = document.createElement('div');
    historyItem.textContent = `${timestamp}: ${command}`;
    commandHistory.appendChild(historyItem);
    
    // 保持历史记录不超过5条
    while (commandHistory.children.length > 5) {
        commandHistory.removeChild(commandHistory.firstChild);
    }
}

/**
 * 保存游戏状态到本地存储
 * 简单直接的实现，避免模块依赖问题
 */
function saveGameState(slotId = 1, saveName = '手动存档') {
    try {
        // 创建存档对象，包含版本信息和时间戳
        const saveData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            slotId: slotId,
            saveName: saveName,
            gameData: {
                character: GameState.character,
                inventory: GameState.inventory,
                collectibles: GameState.collectibles,
                achievements: GameState.achievements,
                currentQuest: GameState.currentQuest,
                progress: GameState.progress,
                settings: GameState.settings
            }
        };
        
        // 序列化并保存到localStorage
        const serialized = JSON.stringify(saveData);
        localStorage.setItem('gods-web-game-save', serialized);
        
        console.log(`游戏进度已保存到存档位 ${slotId}: ${saveName}`);
        return true;
    } catch (error) {
        console.error('保存游戏状态失败:', error);
        // 检查是否是localStorage已满
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            addOutput('<div class="game-text error">保存失败：本地存储空间已满。请尝试清除浏览器数据。</div>');
        } else {
            addOutput('<div class="game-text error">保存失败：本地存储可能被禁用或无权限。</div>');
        }
        return false;
    }
}

/**
 * 从本地存储加载游戏状态
 * 兼容新旧存档格式
 */
function loadGameState() {
    try {
        const saved = localStorage.getItem('gods-web-game-save');
        if (!saved) return false;
        
        const loadedData = JSON.parse(saved);
        
        // 确定数据格式：新格式（包含version和gameData）还是旧格式（扁平）
        let gameData = loadedData;
        if (loadedData.version && loadedData.gameData) {
            // 新格式
            console.log(`加载存档版本: ${loadedData.version}, 保存时间: ${loadedData.timestamp}`);
            gameData = loadedData.gameData;
        } else {
            // 旧格式（扁平）
            console.log('加载旧格式存档（无版本信息）');
        }
        
        // 深度合并函数（针对GameState结构）
        function deepMerge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    // 如果是对象（非数组），递归合并
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    deepMerge(target[key], source[key]);
                } else {
                    // 基本类型或数组，直接替换
                    target[key] = source[key];
                }
            }
            return target;
        }
        
        // 恢复游戏状态，深度合并以保留未保存的默认值
        if (gameData.character) {
            deepMerge(GameState.character, gameData.character);
        }
        if (gameData.inventory) {
            GameState.inventory = gameData.inventory;
        }
        if (gameData.collectibles) {
            GameState.collectibles = gameData.collectibles;
        }
        if (gameData.achievements) {
            GameState.achievements = gameData.achievements;
        }
        if (gameData.currentQuest !== undefined) {
            GameState.currentQuest = gameData.currentQuest;
        }
        if (gameData.progress) {
            deepMerge(GameState.progress, gameData.progress);
        }
        if (gameData.settings) {
            deepMerge(GameState.settings, gameData.settings);
        }
        
        console.log('游戏状态已加载');
        return true;
    } catch (error) {
        console.error('加载游戏状态失败:', error);
        addOutput('<div class="game-text error">加载失败：存档数据可能已损坏。</div>');
        return false;
    }
}

/**
 * 更新界面显示
 */
function updateUI() {
    const char = GameState.character;
    
    // 更新角色状态
    charNameSpan.textContent = char.name || '未创建';
    charPathwaySpan.textContent = char.pathway || '未选择';
    charLevelSpan.textContent = char.level;
    charSanitySpan.textContent = `${char.sanity}/${char.maxSanity}`;
    charSpiritSpan.textContent = `${char.spirit}/${char.maxSpirit}`;
    
    // 更新物品栏
    inventoryList.innerHTML = '';
    if (GameState.inventory.length === 0) {
        const li = document.createElement('li');
        li.textContent = '暂无物品';
        inventoryList.appendChild(li);
    } else {
        GameState.inventory.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            inventoryList.appendChild(li);
        });
    }
    
    // 更新当前任务
    currentQuestSpan.textContent = GameState.currentQuest || '无';
}

// 扩展命令处理器以支持UI界面
commandHandlers['途径'] = commandHandlers['pathway'] = () => {
    if (window.UIManager) {
        window.UIManager.showPathwaySelection();
        addOutput('<div class="game-text system">打开途径选择界面。</div>');
    } else {
        addOutput('<div class="game-text error">UI管理器未初始化。</div>');
    }
};

commandHandlers['任务'] = commandHandlers['quest'] = () => {
    if (window.UIManager) {
        window.UIManager.showQuestInterface();
        addOutput('<div class="game-text system">打开任务界面。</div>');
    } else {
        addOutput('<div class="game-text error">UI管理器未初始化。</div>');
    }
};

commandHandlers['战斗'] = commandHandlers['combat'] = () => {
    if (window.UIManager) {
        window.UIManager.showCombatInterface();
        addOutput('<div class="game-text system">打开战斗界面。</div>');
    } else {
        addOutput('<div class="game-text error">UI管理器未初始化。</div>');
    }
};

// 新增团队养成系统命令处理器
commandHandlers['天赋树'] = commandHandlers['talent'] = commandHandlers['talents'] = () => {
    if (window.UIManager) {
        window.UIManager.showTalentTree();
        addOutput('<div class="game-text system">打开天赋树界面。</div>');
    } else {
        addOutput('<div class="game-text error">UI管理器未初始化。</div>');
    }
};

commandHandlers['NPC招募'] = commandHandlers['recruitment'] = commandHandlers['recruit'] = () => {
    if (window.UIManager) {
        window.UIManager.showNPCRecruitment();
        addOutput('<div class="game-text system">打开NPC招募界面。</div>');
    } else {
        addOutput('<div class="game-text error">UI管理器未初始化。</div>');
    }
};

commandHandlers['团队管理'] = commandHandlers['team'] = commandHandlers['teammanage'] = () => {
    if (window.UIManager) {
        window.UIManager.showTeamManagement();
        addOutput('<div class="game-text system">打开团队管理界面。</div>');
    } else {
        addOutput('<div class="game-text error">UI管理器未初始化。</div>');
    }
};

commandHandlers['技能强化'] = commandHandlers['skillupgrade'] = commandHandlers['upgrade'] = () => {
    if (window.UIManager) {
        window.UIManager.showSkillUpgrade();
        addOutput('<div class="game-text system">打开技能强化界面。</div>');
    } else {
        addOutput('<div class="game-text error">UI管理器未初始化。</div>');
    }
};

/**
 * 导出游戏API（供测试使用）
 */
window.GodsWebGame = {
    GameState,
    commandHandlers,
    initGame,
    executeCommand,
    saveGameState,
    loadGameState,
    updateUI
};

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);