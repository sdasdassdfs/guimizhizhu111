/**
 * 剧情任务数据模型扩展
 * 继承自基础 Quest 类，添加剧情章节、分支点等专用字段
 */

import { Quest, QuestType, QuestStatus } from '../models/Quest.js';

/**
 * 剧情任务类
 * 扩展自 Quest，支持章节编号、分支点、对话树等剧情专用功能
 */
export class StoryQuest extends Quest {
    constructor({
        chapter = 1,
        branchPoints = [],
        dialogueTree = null,
        nextQuestId = null,
        failCondition = null,
        ...questParams
    } = {}) {
        super(questParams);

        this.chapter = chapter;
        this.branchPoints = branchPoints;
        this.dialogueTree = dialogueTree;
        this.nextQuestId = nextQuestId;
        this.failCondition = failCondition;

        // 标记为剧情任务类型
        this.type = QuestType.MAIN;
    }

    /**
     * 获取当前章节编号
     * @returns {number}
     */
    getChapter() {
        return this.chapter;
    }

    /**
     * 获取所有分支点数据
     * @returns {Array<Object>}
     */
    getBranchPoints() {
        return this.branchPoints;
    }

    /**
     * 获取指定ID的分支点
     * @param {string} branchId - 分支点ID
     * @returns {Object|null}
     */
    getBranchPoint(branchId) {
        return this.branchPoints.find(bp => bp.id === branchId) || null;
    }

    /**
     * 记录玩家在分支点的选择
     * @param {string} branchId - 分支点ID
     * @param {string} choiceId - 选项ID
     * @returns {boolean} 是否记录成功
     */
    recordBranchChoice(branchId, choiceId) {
        const branch = this.getBranchPoint(branchId);
        if (!branch) {
            return false;
        }

        // 如果分支点已经记录过选择，不允许重复记录（除非是重试机制）
        if (branch.playerChoice) {
            return false;
        }

        // 验证选项是否有效
        const validChoice = branch.choices.find(c => c.id === choiceId);
        if (!validChoice) {
            return false;
        }

        branch.playerChoice = choiceId;
        branch.choiceTime = new Date();

        // 触发选项效果（如果有）
        if (validChoice.effects) {
            this._applyChoiceEffects(validChoice.effects);
        }

        return true;
    }

    /**
     * 应用选择效果
     * @param {Object} effects - 效果对象
     * @private
     */
    _applyChoiceEffects(effects) {
        // 这里的效果会影响游戏状态，具体实现依赖于游戏状态管理器
        // 目前仅作占位，实际游戏中需要与GameState集成
        console.log(`剧情选择效果:`, effects);
        
        // 示例效果类型：
        // - reputation: { faction: '值夜者', amount: 10 }
        // - unlock: { feature: '占卜' }
        // - flag: { key: 'sided_with_sharon', value: true }
        // - variable: { key: 'mist_investigation', value: 'magic' }
    }

    /**
     * 获取对话树数据
     * @returns {Object|null}
     */
    getDialogueTree() {
        return this.dialogueTree;
    }

    /**
     * 获取下一个剧情任务ID
     * @returns {string|null}
     */
    getNextQuestId() {
        return this.nextQuestId;
    }

    /**
     * 检查失败条件是否满足
     * @param {GameState} gameState - 游戏状态
     * @returns {boolean}
     */
    checkFailCondition(gameState) {
        if (!this.failCondition) {
            return false;
        }

        // 根据失败条件类型检查
        switch (this.failCondition.type) {
            case 'timeout':
                if (this.startTime) {
                    const elapsed = (new Date() - this.startTime) / 1000; // 秒
                    return elapsed > this.failCondition.duration;
                }
                return false;
                
            case 'flag':
                return gameState.getFlag(this.failCondition.flagKey) === this.failCondition.flagValue;
                
            case 'variable':
                return gameState.getVariable(this.failCondition.variableKey) === this.failCondition.variableValue;
                
            default:
                return false;
        }
    }

    /**
     * 转换为字典（扩展父类方法）
     * @returns {Object}
     */
    toDict() {
        const base = super.toDict();
        return {
            ...base,
            chapter: this.chapter,
            branchPoints: this.branchPoints,
            dialogueTree: this.dialogueTree,
            nextQuestId: this.nextQuestId,
            failCondition: this.failCondition
        };
    }

    /**
     * 从字典创建（扩展父类方法）
     * @param {Object} data - 字典数据
     * @returns {StoryQuest}
     */
    static fromDict(data) {
        const baseQuest = super.fromDict(data);
        
        return new StoryQuest({
            ...baseQuest,
            chapter: data.chapter || 1,
            branchPoints: data.branchPoints || [],
            dialogueTree: data.dialogueTree || null,
            nextQuestId: data.nextQuestId || null,
            failCondition: data.failCondition || null
        });
    }
}

/**
 * NPC对话数据模型
 */
export class DialogueNode {
    constructor({
        id = '',
        speaker = '',
        text = '',
        choices = [],
        nextNodeId = null,
        condition = null,
        effects = null
    } = {}) {
        this.id = id;
        this.speaker = speaker;
        this.text = text;
        this.choices = choices;
        this.nextNodeId = nextNodeId;
        this.condition = condition;
        this.effects = effects;
    }

    /**
     * 检查条件是否满足
     * @param {GameState} gameState - 游戏状态
     * @returns {boolean}
     */
    isConditionMet(gameState) {
        if (!this.condition) {
            return true;
        }

        switch (this.condition.type) {
            case 'flag':
                return gameState.getFlag(this.condition.flagKey) === this.condition.flagValue;
                
            case 'variable':
                return gameState.getVariable(this.condition.variableKey) === this.condition.variableValue;
                
            case 'quest':
                const quest = gameState.questLog.getQuest(this.condition.questId);
                return quest && quest.status === this.condition.questStatus;
                
            default:
                return true;
        }
    }
}

/**
 * 分支点数据模型
 */
export class BranchPoint {
    constructor({
        id = '',
        description = '',
        choices = [],
        location = null,
        triggerCondition = null
    } = {}) {
        this.id = id;
        this.description = description;
        this.choices = choices;
        this.location = location;
        this.triggerCondition = triggerCondition;
        this.playerChoice = null;
        this.choiceTime = null;
    }

    /**
     * 检查触发条件是否满足
     * @param {GameState} gameState - 游戏状态
     * @returns {boolean}
     */
    isTriggered(gameState) {
        if (!this.triggerCondition) {
            return true;
        }

        // 简化处理，实际游戏中需要更复杂的条件判断
        return true;
    }
}