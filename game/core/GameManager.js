/**
 * 游戏管理器 - 游戏核心逻辑协调器
 */
import { GameState, SaveSystem } from '../models/GameState.js';
import { Character, Background } from '../models/Character.js';
import { Pathway, Sequence, loadPathwayGroups } from '../models/Pathway.js';
import { Item, Inventory, ItemType } from '../models/Item.js';
import { QuestLog, Quest, QuestStatus, Objective, ObjectiveType, Reward } from '../models/Quest.js';

/**
 * 游戏管理器类，协调游戏所有子系统
 */
export class GameManager {
    /**
     * 初始化游戏管理器
     * @param {string} dataDir - 数据目录路径，默认为'data/game'
     */
    constructor(dataDir = 'data/game') {
        this.dataDir = dataDir;
        this.gameState = null;
        this.saveSystem = new SaveSystem();
        this.pathways = [];
        this.pathwayGroups = [];
        this.questTemplates = {};
        this.itemTemplates = {};

        this.loadGameData();
    }

    /**
     * 加载游戏数据
     */
    async loadGameData() {
        console.log('加载游戏数据...');

        try {
            // 加载途径数据
            const pathwaysFile = `${this.dataDir}/pathways.json`;
            const pathwaysResponse = await fetch(pathwaysFile);
            if (pathwaysResponse.ok) {
                const pathwaysData = await pathwaysResponse.json();
                this.pathways = pathwaysData.map(p => Pathway.fromDict(p));
                console.log(`已加载 ${this.pathways.length} 条途径`);
            }

            // 加载途径组
            this.pathwayGroups = loadPathwayGroups();
            console.log(`已加载 ${this.pathwayGroups.length} 个途径组`);

            // 加载物品数据
            const itemsFile = `${this.dataDir}/items.json`;
            const itemsResponse = await fetch(itemsFile);
            if (itemsResponse.ok) {
                const itemsData = await itemsResponse.json();
                // 创建物品模板
                (itemsData.items || []).forEach(itemData => {
                    const item = Item.fromDict(itemData);
                    this.itemTemplates[item.id] = item;
                });
                console.log(`已加载 ${Object.keys(this.itemTemplates).length} 个物品模板`);
            }

            // 加载任务数据
            const questsFile = `${this.dataDir}/quests.json`;
            const questsResponse = await fetch(questsFile);
            if (questsResponse.ok) {
                const questsData = await questsResponse.json();
                // 创建任务模板
                (questsData.quests || []).forEach(questData => {
                    const quest = Quest.fromDict(questData);
                    this.questTemplates[quest.id] = quest;
                });
                console.log(`已加载 ${Object.keys(this.questTemplates).length} 个任务模板`);
            }
        } catch (error) {
            console.error('加载游戏数据失败:', error);
        }
    }

    /**
     * 开始新游戏
     * @param {string} characterName - 角色名称
     * @param {string} background - 出身背景
     * @returns {boolean}
     */
    startNewGame(characterName, background) {
        try {
            // 创建游戏状态
            this.gameState = this.saveSystem.createNewGame(characterName, background);

            // 初始化默认途径倾向（简化）
            // 根据背景设置初始倾向
            const baseAffinity = 2.0;
            if (background === Background.NOBLE) {
                this.gameState.pathwayAffinities['judge'] = baseAffinity + 1.0;
                this.gameState.pathwayAffinities['white_tower'] = baseAffinity + 0.5;
            } else if (background === Background.COMMONER) {
                this.gameState.pathwayAffinities['dusk_giant'] = baseAffinity + 1.0;
                this.gameState.pathwayAffinities['tyrant'] = baseAffinity + 0.5;
            } else if (background === Background.ORPHAN) {
                this.gameState.pathwayAffinities['darkness'] = baseAffinity + 1.0;
                this.gameState.pathwayAffinities['death'] = baseAffinity + 0.5;
            } else if (background === Background.MYSTIC) {
                this.gameState.pathwayAffinities['fool'] = baseAffinity + 1.0;
                this.gameState.pathwayAffinities['door'] = baseAffinity + 0.5;
            }

            // 同步到角色
            this.gameState.character.pathwayAffinities = { ...this.gameState.pathwayAffinities };

            // 创建初始任务
            this._initializeStartingQuests();

            // 保存初始状态
            this.saveGame('初始存档');

            console.log(`新游戏已开始: ${characterName} (${background})`);
            return true;
        } catch (error) {
            console.error(`开始新游戏失败: ${error}`);
            return false;
        }
    }

    /**
     * 初始化起始任务
     */
    _initializeStartingQuests() {
        if (!this.gameState) {
            return;
        }

        // 添加第一个主线任务
        if ('main_ch_001' in this.questTemplates) {
            const startQuest = this.questTemplates['main_ch_001'];
            const questInstance = Quest.fromDict(startQuest.toDict());
            questInstance.start();
            this.gameState.questLog.addQuest(questInstance);
        }
    }

    /**
     * 根据ID获取途径
     * @param {string} pathwayId - 途径ID
     * @returns {Pathway|null}
     */
    getPathwayById(pathwayId) {
        return this.pathways.find(pathway => pathway.id === pathwayId) || null;
    }

    /**
     * 获取角色当前序列数据
     * @returns {Sequence|null}
     */
    getCurrentSequence() {
        if (!this.gameState || !this.gameState.character.currentPathwayId) {
            return null;
        }

        const pathway = this.getPathwayById(this.gameState.character.currentPathwayId);
        if (!pathway) {
            return null;
        }

        return pathway.getSequence(this.gameState.character.currentSequence);
    }

    /**
     * 检查是否可以晋升序列
     * @returns {Array} [是否可以晋升, 原因列表]
     */
    canAdvanceSequence() {
        if (!this.gameState) {
            return [false, []];
        }

        // 获取当前序列数据
        const currentSeq = this.getCurrentSequence();
        if (!currentSeq) {
            return [false, ['未找到当前序列数据']];
        }

        const reasons = [];

        // 检查扮演值/消化度（简化：固定值）
        if (this.gameState.character.level < 5) {
            reasons.push('角色等级不足');
        }

        // 检查材料（简化）
        // 在实际游戏中，这里需要检查背包中是否有足够材料

        // 检查仪式条件（简化）
        // 在实际游戏中，这里需要检查是否满足仪式要求

        return [reasons.length === 0, reasons];
    }

    /**
     * 晋升序列
     * @param {string|null} targetPathwayId - 目标途径ID，null表示晋升当前途径的下一个序列
     * @returns {Array} [是否成功, 消息]
     */
    advanceSequence(targetPathwayId = null) {
        if (!this.gameState) {
            return [false, '游戏状态未初始化'];
        }

        // 如果未指定目标途径，则晋升当前途径的下一个序列
        if (!targetPathwayId) {
            targetPathwayId = this.gameState.character.currentPathwayId;
        }

        if (!targetPathwayId) {
            return [false, '未选择晋升途径'];
        }

        // 检查是否可以晋升
        const [canAdvance, reasons] = this.canAdvanceSequence();
        if (!canAdvance) {
            return [false, `晋升条件不足: ${reasons.join(', ')}`];
        }

        // 获取当前序列数字
        const currentSeqNum = parseInt(this.gameState.character.currentSequence);

        // 检查是否是跨途径转职
        let isConversion = false;
        if (targetPathwayId !== this.gameState.character.currentPathwayId) {
            isConversion = true;

            // 检查途径是否相邻
            if (!this._arePathwaysAdjacent(this.gameState.character.currentPathwayId, targetPathwayId)) {
                return [false, '途径不相邻，无法转职'];
            }
        }

        // 计算新序列（如果是晋升：当前序列-1；如果是转职：保持相同序列）
        let newSeqNum;
        if (isConversion) {
            newSeqNum = currentSeqNum; // 转职保持相同序列等级
        } else {
            newSeqNum = currentSeqNum - 1; // 晋升到更高序列（数字更小）
        }

        // 检查序列是否有效
        if (newSeqNum < 0 || newSeqNum > 9) {
            return [false, `无效序列等级: ${newSeqNum}`];
        }

        // 更新角色状态
        this.gameState.character.currentPathwayId = targetPathwayId;
        this.gameState.character.currentSequence = String(newSeqNum);
        this.gameState.character.level += 1;

        // 随机属性提升
        const attributes = ['STRENGTH', 'AGILITY', 'CONSTITUTION', 'INTELLIGENCE', 'PERCEPTION', 'CHARISMA'];
        const attrsToBoost = [];
        while (attrsToBoost.length < 3) {
            const randomAttr = attributes[Math.floor(Math.random() * attributes.length)];
            if (!attrsToBoost.includes(randomAttr)) {
                attrsToBoost.push(randomAttr);
            }
        }

        attrsToBoost.forEach(attr => {
            this.gameState.character.attributes.modify(attr, Math.floor(Math.random() * 3) + 1);
        });

        // 更新健康值
        this.gameState.character.maxHealth = this.gameState.character.attributes.constitution * 10;
        this.gameState.character.health = Math.min(
            this.gameState.character.maxHealth,
            this.gameState.character.health + 20
        );

        // 更新灵性值
        this.gameState.character.maxSpirit = (
            this.gameState.character.attributes.intelligence +
            this.gameState.character.attributes.perception
        ) * 5;
        this.gameState.character.spirit = Math.min(
            this.gameState.character.maxSpirit,
            this.gameState.character.spirit + 30
        );

        // 记录晋升
        const eventType = isConversion ? 'pathway_conversion' : 'sequence_advancement';
        const now = new Date();

        this.gameState.flags[`last_${eventType}_time`] = now.toISOString();
        this.gameState.flags[`last_${eventType}_from`] = this.gameState.character.currentPathwayId;
        this.gameState.flags[`last_${eventType}_to`] = targetPathwayId;

        // 保存游戏
        this.saveGame(`${isConversion ? '转职' : '晋升'}存档`);

        const action = isConversion ? '转职' : '晋升';
        return [true, `成功${action}到${targetPathwayId}序列${newSeqNum}`];
    }

    /**
     * 检查两个途径是否相邻（在同一组内）
     * @param {string} sourceId - 源途径ID
     * @param {string} targetId - 目标途径ID
     * @returns {boolean}
     */
    _arePathwaysAdjacent(sourceId, targetId) {
        return this.pathwayGroups.some(group =>
            group.pathwayIds.includes(sourceId) && group.pathwayIds.includes(targetId)
        );
    }

    /**
     * 获取可接取的任务
     * @returns {Quest[]}
     */
    getAvailableQuests() {
        if (!this.gameState) {
            return [];
        }

        const available = [];

        // 检查任务模板
        Object.values(this.questTemplates).forEach(quest => {
            // 简单可用性检查
            if (quest.status === QuestStatus.AVAILABLE) {
                // 检查前置任务
                let prereqMet = true;
                quest.prerequisites.forEach(prereqId => {
                    if (!(prereqId in this.gameState.questLog.completedQuests)) {
                        prereqMet = false;
                    }
                });

                if (prereqMet) {
                    available.push(quest);
                }
            }
        });

        return available;
    }

    /**
     * 接取任务
     * @param {string} questId - 任务ID
     * @returns {boolean}
     */
    acceptQuest(questId) {
        if (!this.gameState) {
            return false;
        }

        if (!(questId in this.questTemplates)) {
            return false;
        }

        const questTemplate = this.questTemplates[questId];

        // 创建任务实例（复制模板）
        const questData = questTemplate.toDict();
        const questInstance = Quest.fromDict(questData);

        // 接取任务
        if (this.gameState.questLog.acceptQuest(questInstance)) {
            // 更新任务模板状态（防止重复接取）
            questTemplate.status = QuestStatus.ACTIVE;

            // 保存游戏
            this.saveGame(`接取任务: ${questInstance.name}`);

            return true;
        }

        return false;
    }

    /**
     * 更新任务进度
     * @param {string} questId - 任务ID
     * @param {string} objectiveId - 目标ID
     * @param {number} amount - 进度增加量，默认为1
     * @returns {boolean}
     */
    updateQuestProgress(questId, objectiveId, amount = 1) {
        if (!this.gameState) {
            return false;
        }

        return this.gameState.questLog.updateQuest(questId, objectiveId, amount);
    }

    /**
     * 保存游戏
     * @param {string} saveName - 存档名称，默认为"手动存档"
     * @returns {boolean}
     */
    saveGame(saveName = '手动存档') {
        if (!this.gameState) {
            return false;
        }

        return this.saveSystem.saveGame(this.gameState, null, saveName);
    }

    /**
     * 加载游戏
     * @param {number} slotId - 存档槽位ID
     * @returns {boolean}
     */
    loadGame(slotId) {
        const loadedState = this.saveSystem.loadGame(slotId);
        if (loadedState) {
            this.gameState = loadedState;
            // 重新加载途径倾向到角色
            this.gameState.character.pathwayAffinities = { ...this.gameState.pathwayAffinities };

            return true;
        }

        return false;
    }

    /**
     * 获取游戏摘要信息
     * @returns {Object}
     */
    getGameSummary() {
        if (!this.gameState) {
            return {};
        }

        // 获取当前序列
        const currentSeq = this.getCurrentSequence();
        const sequenceName = currentSeq ? currentSeq.name : '未选择';

        // 主途径
        const mainPathway = this.gameState.getMainPathway();
        const mainPathwayName = mainPathway || '未确定';

        return {
            characterName: this.gameState.character.name,
            characterLevel: this.gameState.character.level,
            currentSequence: sequenceName,
            mainPathway: mainPathwayName,
            currentChapter: this.gameState.currentChapter,
            currentLocation: this.gameState.currentLocation,
            playTimeHours: this.gameState.gameTime,
            activeQuests: Object.keys(this.gameState.questLog.activeQuests).length,
            completedQuests: Object.keys(this.gameState.questLog.completedQuests).length,
            gold: this.gameState.inventory.gold
        };
    }

    /**
     * 获取角色状态详情
     * @returns {Object}
     */
    getCharacterStatus() {
        if (!this.gameState) {
            return {};
        }

        const char = this.gameState.character;

        return {
            name: char.name,
            background: char.background,
            level: char.level,
            experience: char.experience,
            health: `${char.health}/${char.maxHealth}`,
            spirit: `${char.spirit}/${char.maxSpirit}`,
            sanity: char.sanity,
            gold: char.gold,
            attributes: {
                strength: char.attributes.strength,
                agility: char.attributes.agility,
                constitution: char.attributes.constitution,
                intelligence: char.attributes.intelligence,
                perception: char.attributes.perception,
                charisma: char.attributes.charisma
            },
            currentPathway: char.currentPathwayId,
            currentSequence: char.currentSequence
        };
    }
}