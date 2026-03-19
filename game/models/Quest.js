/**
 * 任务与任务日志数据模型
 */

/**
 * 任务类型枚举
 */
export const QuestType = Object.freeze({
    MAIN: '主线',
    SIDE: '支线',
    ADVANCEMENT: '晋升',
    REPEATABLE: '可重复',
    EVENT: '事件'
});

/**
 * 任务状态枚举
 */
export const QuestStatus = Object.freeze({
    AVAILABLE: '可接取',
    ACTIVE: '进行中',
    COMPLETED: '已完成',
    FAILED: '失败',
    LOCKED: '锁定'
});

/**
 * 目标类型枚举
 */
export const ObjectiveType = Object.freeze({
    COLLECT: '收集',
    KILL: '击杀',
    TALK: '交谈',
    EXPLORE: '探索',
    USE: '使用',
    CRAFT: '制作',
    ESCORT: '护送',
    DEFEND: '防守'
});

/**
 * 任务目标
 */
export class Objective {
    constructor({
        id = '',
        description = '',
        type = ObjectiveType.COLLECT,
        requiredCount = 1,
        currentCount = 0,
        targetId = null
    } = {}) {
        this.id = id;
        this.description = description;
        this.type = type;
        this.requiredCount = requiredCount;
        this.currentCount = currentCount;
        this.targetId = targetId;
    }

    /**
     * 检查是否已完成
     * @returns {boolean}
     */
    isCompleted() {
        return this.currentCount >= this.requiredCount;
    }

    /**
     * 更新进度
     * @param {number} amount - 增加量，默认为1
     * @returns {boolean} 更新后是否完成
     */
    updateProgress(amount = 1) {
        if (amount <= 0) {
            return false;
        }

        const newCount = this.currentCount + amount;
        if (newCount > this.requiredCount) {
            this.currentCount = this.requiredCount;
        } else {
            this.currentCount = newCount;
        }

        return this.isCompleted();
    }

    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            id: this.id,
            text: this.description, // 保存为text字段以匹配JSON
            type: this.type,
            requiredCount: this.requiredCount,
            currentCount: this.currentCount,
            targetId: this.targetId
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {Objective}
     */
    static fromDict(data) {
        const type = data.type || ObjectiveType.COLLECT;
        const description = data.description || data.text || '';
        
        return new Objective({
            id: data.id || '',
            description: description,
            type: type,
            requiredCount: data.requiredCount || 1,
            currentCount: data.currentCount || 0,
            targetId: data.targetId
        });
    }
}

/**
 * 任务奖励
 */
export class Reward {
    constructor({
        experience = 0,
        gold = 0,
        items = [],
        reputation = {},
        attributePoints = 0,
        skillPoints = 0,
        unlockFeatures = []
    } = {}) {
        this.experience = experience;
        this.gold = gold;
        this.items = items;
        this.reputation = reputation;
        this.attributePoints = attributePoints;
        this.skillPoints = skillPoints;
        this.unlockFeatures = unlockFeatures;
    }

    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            experience: this.experience,
            gold: this.gold,
            items: this.items,
            reputation: this.reputation,
            attributePoints: this.attributePoints,
            skillPoints: this.skillPoints,
            unlockFeatures: this.unlockFeatures
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {Reward}
     */
    static fromDict(data) {
        return new Reward({
            experience: data.experience || 0,
            gold: data.gold || 0,
            items: data.items || [],
            reputation: data.reputation || {},
            attributePoints: data.attributePoints || 0,
            skillPoints: data.skillPoints || 0,
            unlockFeatures: data.unlockFeatures || []
        });
    }
}

/**
 * 任务数据类
 */
export class Quest {
    constructor({
        id = '',
        name = '',
        type = QuestType.MAIN,
        description = '',
        giverId = null,
        objectives = [],
        rewards = new Reward(),
        prerequisites = [],
        sequenceRequirement = 0,
        timeLimit = null,
        startTime = null,
        completionTime = null,
        status = QuestStatus.AVAILABLE
    } = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description;
        this.giverId = giverId;
        this.objectives = objectives;
        this.rewards = rewards;
        this.prerequisites = prerequisites;
        this.sequenceRequirement = sequenceRequirement;
        this.timeLimit = timeLimit;
        this.startTime = startTime;
        this.completionTime = completionTime;
        this.status = status;

        // 确保类型为正确的枚举值
        this._normalizeEnums();
    }

    /**
     * 规范化枚举值
     */
    _normalizeEnums() {
        // 如果type是字符串，确保它在QuestType中
        if (typeof this.type === 'string') {
            const found = Object.values(QuestType).find(value => value === this.type);
            if (!found) {
                this.type = QuestType.MAIN;
            }
        }
        
        // 如果status是字符串，确保它在QuestStatus中
        if (typeof this.status === 'string') {
            const found = Object.values(QuestStatus).find(value => value === this.status);
            if (!found) {
                this.status = QuestStatus.AVAILABLE;
            }
        }
    }

    /**
     * 检查角色是否可以接取任务
     * @param {number} characterSequence - 角色当前序列等级（数字）
     * @returns {boolean}
     */
    canAccept(characterSequence) {
        if (this.status !== QuestStatus.AVAILABLE) {
            return false;
        }

        if (characterSequence < this.sequenceRequirement) {
            return false;
        }

        return true;
    }

    /**
     * 开始任务
     * @returns {boolean} 是否成功开始
     */
    start() {
        if (this.status !== QuestStatus.AVAILABLE) {
            return false;
        }

        this.status = QuestStatus.ACTIVE;
        this.startTime = new Date();
        return true;
    }

    /**
     * 更新任务目标进度
     * @param {string} objectiveId - 目标ID
     * @param {number} amount - 进度增加量，默认为1
     * @returns {boolean} 更新是否成功
     */
    updateObjective(objectiveId, amount = 1) {
        for (const obj of this.objectives) {
            if (obj.id === objectiveId) {
                const completed = obj.updateProgress(amount);

                // 检查所有目标是否完成
                if (this.isCompleted()) {
                    this.complete();
                }

                return completed;
            }
        }

        return false;
    }

    /**
     * 检查任务是否完成（所有目标完成）
     * @returns {boolean}
     */
    isCompleted() {
        return this.objectives.every(obj => obj.isCompleted());
    }

    /**
     * 完成任务
     * @returns {boolean} 是否成功完成
     */
    complete() {
        if (!this.isCompleted()) {
            return false;
        }

        this.status = QuestStatus.COMPLETED;
        this.completionTime = new Date();
        return true;
    }

    /**
     * 任务失败
     * @returns {boolean} 是否成功标记为失败
     */
    fail() {
        if (this.status !== QuestStatus.ACTIVE) {
            return false;
        }

        this.status = QuestStatus.FAILED;
        return true;
    }

    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            description: this.description,
            giverId: this.giverId,
            objectives: this.objectives.map(obj => obj.toDict()),
            rewards: this.rewards.toDict(),
            prerequisites: this.prerequisites,
            sequenceRequirement: this.sequenceRequirement,
            timeLimit: this.timeLimit ? this.timeLimit.totalSeconds : null,
            startTime: this.startTime ? this.startTime.toISOString() : null,
            completionTime: this.completionTime ? this.completionTime.toISOString() : null,
            status: this.status
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {Quest}
     */
    static fromDict(data) {
        // 解析时间限制（秒转换为时间间隔对象）
        let timeLimit = null;
        if (data.timeLimit) {
            timeLimit = {
                totalSeconds: data.timeLimit,
                getHours() { return Math.floor(this.totalSeconds / 3600); },
                getMinutes() { return Math.floor((this.totalSeconds % 3600) / 60); }
            };
        }

        // 解析时间
        let startTime = null;
        if (data.startTime) {
            startTime = new Date(data.startTime);
        }

        let completionTime = null;
        if (data.completionTime) {
            completionTime = new Date(data.completionTime);
        }

        // 创建任务
        return new Quest({
            id: data.id || '',
            name: data.name || '',
            type: data.type || QuestType.MAIN,
            description: data.description || '',
            giverId: data.giverId,
            objectives: (data.objectives || []).map(obj => Objective.fromDict(obj)),
            rewards: Reward.fromDict(data.rewards || {}),
            prerequisites: data.prerequisites || [],
            sequenceRequirement: data.sequenceRequirement || 0,
            timeLimit: timeLimit,
            startTime: startTime,
            completionTime: completionTime,
            status: data.status || QuestStatus.AVAILABLE
        });
    }
}

/**
 * 任务日志管理类
 */
export class QuestLog {
    constructor({
        activeQuests = {},
        completedQuests = {},
        failedQuests = {}
    } = {}) {
        this.activeQuests = activeQuests;         // 进行中的任务
        this.completedQuests = completedQuests;   // 已完成的任务
        this.failedQuests = failedQuests;         // 失败的任务
    }

    /**
     * 添加任务到日志
     * @param {Quest} quest - 任务对象
     */
    addQuest(quest) {
        if (quest.status === QuestStatus.ACTIVE) {
            this.activeQuests[quest.id] = quest;
        } else if (quest.status === QuestStatus.COMPLETED) {
            this.completedQuests[quest.id] = quest;
        } else if (quest.status === QuestStatus.FAILED) {
            this.failedQuests[quest.id] = quest;
        }
    }

    /**
     * 接取任务
     * @param {Quest} quest - 任务对象
     * @returns {boolean} 是否成功接取
     */
    acceptQuest(quest) {
        // 序列检查已经在QuestSystem中完成
        // 这里直接尝试开始任务
        if (quest.start()) {
            this.addQuest(quest);
            return true;
        }

        return false;
    }

    /**
     * 更新任务进度
     * @param {string} questId - 任务ID
     * @param {string} objectiveId - 目标ID
     * @param {number} amount - 进度增加量，默认为1
     * @returns {boolean} 更新是否成功
     */
    updateQuest(questId, objectiveId, amount = 1) {
        if (questId in this.activeQuests) {
            const quest = this.activeQuests[questId];
            const updated = quest.updateObjective(objectiveId, amount);

            // 如果任务完成，移动到相应列表
            if (quest.status === QuestStatus.COMPLETED) {
                delete this.activeQuests[questId];
                this.completedQuests[questId] = quest;
            } else if (quest.status === QuestStatus.FAILED) {
                delete this.activeQuests[questId];
                this.failedQuests[questId] = quest;
            }

            return updated;
        }

        return false;
    }

    /**
     * 获取任务（检查所有列表）
     * @param {string} questId - 任务ID
     * @returns {Quest|null}
     */
    getQuest(questId) {
        if (questId in this.activeQuests) {
            return this.activeQuests[questId];
        } else if (questId in this.completedQuests) {
            return this.completedQuests[questId];
        } else if (questId in this.failedQuests) {
            return this.failedQuests[questId];
        }

        return null;
    }

    /**
     * 获取所有进行中的任务
     * @returns {Quest[]}
     */
    getActiveQuests() {
        return Object.values(this.activeQuests);
    }

    /**
     * 获取所有已完成的任务
     * @returns {Quest[]}
     */
    getCompletedQuests() {
        return Object.values(this.completedQuests);
    }

    /**
     * 获取角色可接取的任务（简化版本）
     * @param {number} characterSequence - 角色序列等级
     * @returns {Quest[]}
     */
    getAvailableQuests(characterSequence) {
        // 这里应该从任务库中筛选可接取任务
        // 简化处理：返回空列表，实际游戏需要任务管理器
        return [];
    }

    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            activeQuests: Object.fromEntries(
                Object.entries(this.activeQuests).map(([k, v]) => [k, v.toDict()])
            ),
            completedQuests: Object.fromEntries(
                Object.entries(this.completedQuests).map(([k, v]) => [k, v.toDict()])
            ),
            failedQuests: Object.fromEntries(
                Object.entries(this.failedQuests).map(([k, v]) => [k, v.toDict()])
            )
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {QuestLog}
     */
    static fromDict(data) {
        const log = new QuestLog();

        if (data.activeQuests) {
            Object.entries(data.activeQuests).forEach(([k, v]) => {
                log.activeQuests[k] = Quest.fromDict(v);
            });
        }

        if (data.completedQuests) {
            Object.entries(data.completedQuests).forEach(([k, v]) => {
                log.completedQuests[k] = Quest.fromDict(v);
            });
        }

        if (data.failedQuests) {
            Object.entries(data.failedQuests).forEach(([k, v]) => {
                log.failedQuests[k] = Quest.fromDict(v);
            });
        }

        return log;
    }
}