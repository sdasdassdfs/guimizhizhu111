/**
 * 游戏状态管理与存档系统
 */
import { Character } from './Character.js';
import { Inventory } from './Item.js';
import { QuestLog } from './Quest.js';

/**
 * 游戏状态数据类
 */
export class GameState {
    constructor({
        character,
        inventory,
        questLog,
        currentChapter = '第一章',
        currentLocation = '贝克兰德',
        gameTime = 0,
        realStartTime = new Date(),
        lastSaveTime = null,
        playTimeSeconds = 0,
        pathwayAffinities = {},
        unlockedPathways = new Set(),
        activePathwayId = null,
        flags = {},
        variables = {}
    } = {}) {
        this.character = character;
        this.inventory = inventory;
        this.questLog = questLog;
        this.currentChapter = currentChapter;
        this.currentLocation = currentLocation;
        this.gameTime = gameTime;
        this.realStartTime = realStartTime;
        this.lastSaveTime = lastSaveTime;
        this.playTimeSeconds = playTimeSeconds;
        this.pathwayAffinities = pathwayAffinities;
        this.unlockedPathways = unlockedPathways;
        this.activePathwayId = activePathwayId;
        this.flags = flags;
        this.variables = variables;

        // 初始化途径倾向向量（如果为空）
        this._initializePathwayAffinities();
        
        // 确保character的途径倾向同步
        this._syncCharacterAffinities();
    }

    /**
     * 初始化途径倾向向量
     */
    _initializePathwayAffinities() {
        if (!this.pathwayAffinities || Object.keys(this.pathwayAffinities).length === 0) {
            // 简化初始化：所有途径倾向为1.0
            this.pathwayAffinities = {};
            for (let i = 0; i < 22; i++) {
                this.pathwayAffinities[`pathway_${i}`] = 1.0;
            }
        }
    }

    /**
     * 同步途径倾向到角色
     */
    _syncCharacterAffinities() {
        this.character.pathwayAffinities = { ...this.pathwayAffinities };
    }

    /**
     * 更新途径倾向值
     * @param {string} pathwayId - 途径ID
     * @param {number} delta - 增减值
     */
    updatePathwayAffinity(pathwayId, delta) {
        const current = this.pathwayAffinities[pathwayId] || 1.0;
        const newValue = Math.max(0.0, current + delta);
        this.pathwayAffinities[pathwayId] = newValue;

        // 同步到角色
        this._syncCharacterAffinities();

        // 检查是否解锁新途径（简化条件：倾向>5.0）
        if (newValue >= 5.0) {
            this.unlockedPathways.add(pathwayId);
        }
    }

    /**
     * 获取当前主要途径（倾向值最高）
     * @returns {string|null}
     */
    getMainPathway() {
        if (Object.keys(this.pathwayAffinities).length === 0) {
            return null;
        }

        let maxPathway = null;
        let maxValue = -Infinity;

        Object.entries(this.pathwayAffinities).forEach(([pathwayId, value]) => {
            if (value > maxValue) {
                maxValue = value;
                maxPathway = pathwayId;
            }
        });

        return maxPathway;
    }

    /**
     * 开始新章节
     * @param {string} chapterId - 章节ID
     */
    startChapter(chapterId) {
        this.currentChapter = chapterId;
        this.flags[`chapter_${chapterId}_started`] = true;
    }

    /**
     * 完成章节
     * @param {string} chapterId - 章节ID
     */
    completeChapter(chapterId) {
        this.flags[`chapter_${chapterId}_completed`] = true;
    }

    /**
     * 添加游戏标记
     * @param {string} flagName - 标记名称
     * @param {boolean} value - 标记值，默认为true
     */
    addFlag(flagName, value = true) {
        this.flags[flagName] = value;
    }

    /**
     * 检查游戏标记
     * @param {string} flagName - 标记名称
     * @returns {boolean}
     */
    checkFlag(flagName) {
        return !!this.flags[flagName];
    }

    /**
     * 设置游戏变量
     * @param {string} varName - 变量名称
     * @param {*} value - 变量值
     */
    setVariable(varName, value) {
        this.variables[varName] = value;
    }

    /**
     * 获取游戏变量
     * @param {string} varName - 变量名称
     * @param {*} defaultValue - 默认值
     * @returns {*}
     */
    getVariable(varName, defaultValue = null) {
        return varName in this.variables ? this.variables[varName] : defaultValue;
    }

    /**
     * 推进游戏时间
     * @param {number} hours - 小时数，默认为1
     */
    advanceTime(hours = 1) {
        this.gameTime += hours;
        this.playTimeSeconds += hours * 3600; // 简化：1游戏小时=1现实小时
    }

    /**
     * 转换为字典（用于JSON序列化）
     * @returns {Object}
     */
    toDict() {
        return {
            version: '1.0.0', // 存档版本号，用于向后兼容
            character: this.character.toDict(),
            inventory: this.inventory.toDict(),
            questLog: this.questLog.toDict(),
            currentChapter: this.currentChapter,
            currentLocation: this.currentLocation,
            gameTime: this.gameTime,
            realStartTime: this.realStartTime.toISOString(),
            lastSaveTime: this.lastSaveTime ? this.lastSaveTime.toISOString() : null,
            playTimeSeconds: this.playTimeSeconds,
            pathwayAffinities: this.pathwayAffinities,
            unlockedPathways: Array.from(this.unlockedPathways),
            activePathwayId: this.activePathwayId,
            flags: this.flags,
            variables: this.variables
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {GameState}
     */
    static fromDict(data) {
        // 检查版本号，处理向后兼容
        const version = data.version || '0.9.0'; // 旧存档没有版本号
        
        // 解析时间
        const realStartTime = new Date(data.realStartTime);
        let lastSaveTime = null;
        if (data.lastSaveTime) {
            lastSaveTime = new Date(data.lastSaveTime);
        }

        // 创建游戏状态
        const state = new GameState({
            character: Character.fromDict(data.character),
            inventory: Inventory.fromDict(data.inventory),
            questLog: QuestLog.fromDict(data.questLog),
            currentChapter: data.currentChapter || '第一章',
            currentLocation: data.currentLocation || '贝克兰德',
            gameTime: data.gameTime || 0,
            realStartTime: realStartTime,
            lastSaveTime: lastSaveTime,
            playTimeSeconds: data.playTimeSeconds || 0,
            pathwayAffinities: data.pathwayAffinities || {},
            unlockedPathways: new Set(data.unlockedPathways || []),
            activePathwayId: data.activePathwayId,
            flags: data.flags || {},
            variables: data.variables || {}
        });

        return state;
    }
}

/**
 * 存档槽位
 */
export class SaveSlot {
    constructor({
        slotId,
        saveName,
        saveTime,
        characterName,
        characterLevel,
        characterSequence,
        currentChapter,
        playTimeHours,
        thumbnailData = null
    } = {}) {
        this.slotId = slotId;
        this.saveName = saveName;
        this.saveTime = saveTime;
        this.characterName = characterName;
        this.characterLevel = characterLevel;
        this.characterSequence = characterSequence;
        this.currentChapter = currentChapter;
        this.playTimeHours = playTimeHours;
        this.thumbnailData = thumbnailData;
    }

    toDict() {
        return {
            slotId: this.slotId,
            saveName: this.saveName,
            saveTime: this.saveTime.toISOString(),
            characterName: this.characterName,
            characterLevel: this.characterLevel,
            characterSequence: this.characterSequence,
            currentChapter: this.currentChapter,
            playTimeHours: this.playTimeHours,
            thumbnailData: this.thumbnailData ? Array.from(this.thumbnailData).map(b => b.toString(16).padStart(2, '0')).join('') : null
        };
    }

    static fromDict(data) {
        const saveTime = new Date(data.saveTime);
        let thumbnail = null;
        if (data.thumbnailData) {
            const bytes = new Uint8Array(data.thumbnailData.length / 2);
            for (let i = 0; i < data.thumbnailData.length; i += 2) {
                bytes[i / 2] = parseInt(data.thumbnailData.substr(i, 2), 16);
            }
            thumbnail = bytes;
        }

        return new SaveSlot({
            slotId: data.slotId,
            saveName: data.saveName,
            saveTime: saveTime,
            characterName: data.characterName,
            characterLevel: data.characterLevel,
            characterSequence: data.characterSequence,
            currentChapter: data.currentChapter,
            playTimeHours: data.playTimeHours,
            thumbnailData: thumbnail
        });
    }
}

/**
 * 存档系统管理类
 */
export class SaveSystem {
    constructor(saveDir = 'saves') {
        this.saveDir = saveDir;
        this.metadataFile = `${saveDir}/metadata.json`;
        
        // 确保保存目录存在（在浏览器环境中，使用localStorage模拟）
        this._ensureSaveDir();
        
        // 加载元数据
        this.metadata = this._loadMetadata();
    }

    /**
     * 确保保存目录存在（浏览器环境使用localStorage）
     */
    _ensureSaveDir() {
        // 在浏览器环境中，我们使用localStorage来模拟文件系统
        // 这里只进行初始化检查
        if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available, save system will use in-memory storage');
        }
    }

    /**
     * 加载存档元数据
     * @returns {Object}
     */
    _loadMetadata() {
        try {
            if (typeof localStorage !== 'undefined') {
                const metadataStr = localStorage.getItem('game_metadata');
                if (metadataStr) {
                    return JSON.parse(metadataStr);
                }
            }
        } catch (error) {
            console.error('Error loading metadata:', error);
        }
        
        return { saveSlots: {}, nextSlotId: 1 };
    }

    /**
     * 保存存档元数据
     */
    _saveMetadata() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('game_metadata', JSON.stringify(this.metadata));
            }
        } catch (error) {
            console.error('Error saving metadata:', error);
        }
    }

    /**
     * 获取所有可用存档槽位
     * @returns {SaveSlot[]}
     */
    getAvailableSlots() {
        const slots = [];
        Object.values(this.metadata.saveSlots || {}).forEach(slotData => {
            slots.push(SaveSlot.fromDict(slotData));
        });

        // 按时间倒序排序
        slots.sort((a, b) => b.saveTime - a.saveTime);
        return slots;
    }

    /**
     * 保存游戏
     * @param {GameState} gameState - 游戏状态
     * @param {number|null} slotId - 槽位ID，null表示自动槽位
     * @param {string} saveName - 存档名称，默认为"自动存档"
     * @returns {boolean}
     */
    saveGame(gameState, slotId = null, saveName = '自动存档') {
        try {
            // 如果未指定槽位，使用自动槽位
            if (slotId === null) {
                slotId = this.metadata.nextSlotId || 1;
            }

            // 更新时间
            gameState.lastSaveTime = new Date();

            // 保存游戏状态
            const saveData = gameState.toDict();
            const saveKey = `game_save_${slotId}`;

            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(saveKey, JSON.stringify(saveData));
                }
            } catch (storageError) {
                console.error('Error saving to localStorage:', storageError);
                return false;
            }

            // 创建存档槽位信息
            const saveSlot = new SaveSlot({
                slotId: slotId,
                saveName: saveName,
                saveTime: gameState.lastSaveTime,
                characterName: gameState.character.name,
                characterLevel: gameState.character.level,
                characterSequence: gameState.character.currentSequence,
                currentChapter: gameState.currentChapter,
                playTimeHours: gameState.gameTime
            });

            // 更新元数据
            this.metadata.saveSlots = this.metadata.saveSlots || {};
            this.metadata.saveSlots[slotId] = saveSlot.toDict();
            if (slotId >= (this.metadata.nextSlotId || 1)) {
                this.metadata.nextSlotId = slotId + 1;
            }

            this._saveMetadata();

            return true;
        } catch (error) {
            console.error('Save failed:', error);
            return false;
        }
    }

    /**
     * 加载游戏
     * @param {number} slotId - 槽位ID
     * @returns {GameState|null}
     */
    loadGame(slotId) {
        try {
            const saveKey = `game_save_${slotId}`;
            let saveDataStr;

            if (typeof localStorage !== 'undefined') {
                saveDataStr = localStorage.getItem(saveKey);
            }

            if (!saveDataStr) {
                console.error(`Save file not found: ${saveKey}`);
                return null;
            }

            // 加载游戏状态
            const saveData = JSON.parse(saveDataStr);
            const gameState = GameState.fromDict(saveData);

            // 更新最后加载时间
            gameState.lastSaveTime = new Date();

            return gameState;
        } catch (error) {
            console.error('Load failed:', error);
            return null;
        }
    }

    /**
     * 删除存档
     * @param {number} slotId - 槽位ID
     * @returns {boolean}
     */
    deleteSave(slotId) {
        try {
            // 删除存档数据
            const saveKey = `game_save_${slotId}`;
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(saveKey);
            }

            // 更新元数据
            const saveSlots = this.metadata.saveSlots || {};
            delete saveSlots[slotId];
            this.metadata.saveSlots = saveSlots;
            this._saveMetadata();

            return true;
        } catch (error) {
            console.error('Delete failed:', error);
            return false;
        }
    }

    /**
     * 创建新游戏
     * @param {string} characterName - 角色名称
     * @param {string} background - 出身背景
     * @returns {GameState}
     */
    createNewGame(characterName, background) {
        // 创建角色
        const character = new Character({
            name: characterName,
            background: background
        });

        // 创建初始游戏状态
        const gameState = new GameState({
            character: character,
            inventory: new Inventory({ gold: 100 }),
            questLog: new QuestLog()
        });

        return gameState;
    }

    /**
     * 获取存档信息
     * @param {number} slotId - 槽位ID
     * @returns {SaveSlot|null}
     */
    getSaveInfo(slotId) {
        const saveSlots = this.metadata.saveSlots || {};
        const slotData = saveSlots[slotId];

        if (slotData) {
            return SaveSlot.fromDict(slotData);
        }

        return null;
    }
}

/**
 * 创建默认保存系统
 * @returns {SaveSystem}
 */
export function createDefaultSaveSystem() {
    return new SaveSystem();
}

/**
 * 快速保存（使用自动槽位）
 * @param {GameState} gameState - 游戏状态
 * @returns {boolean}
 */
export function quickSave(gameState) {
    const saveSystem = new SaveSystem();
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return saveSystem.saveGame(gameState, null, `快速保存 ${timestamp}`);
}

/**
 * 快速加载（最新存档）
 * @returns {GameState|null}
 */
export function quickLoad() {
    const saveSystem = new SaveSystem();
    const slots = saveSystem.getAvailableSlots();

    if (!slots.length) {
        return null;
    }

    // 返回最新的存档
    const latestSlot = slots[0];
    return saveSystem.loadGame(latestSlot.slotId);
}