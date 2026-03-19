/**
 * 成就数据模型
 */

/**
 * 成就类型枚举
 */
export const AchievementType = Object.freeze({
    KILL: 'kill',           // 击杀成就
    COLLECT: 'collect',     // 收集成就
    SKILL: 'skill',         // 技能成就
    STORY: 'story'          // 剧情成就
});

/**
 * 成就奖励类型枚举
 */
export const RewardType = Object.freeze({
    GOLD: 'gold',           // 金币
    ITEM: 'item',           // 物品
    TITLE: 'title',         // 称号
    UNLOCK: 'unlock'        // 解锁功能
});

/**
 * 成就数据类
 */
export class Achievement {
    constructor({
        id,
        name,
        description,
        type = AchievementType.KILL,
        icon = '🏆',
        requirements = {},           // 解锁条件（类型相关）
        rewards = [],                // 奖励列表
        hidden = false,              // 是否隐藏成就
        unlocked = false,            // 是否已解锁
        progress = 0,                // 当前进度（0-100）
        unlockDate = null,           // 解锁日期
        flavorText = ''              // 背景描述文本
    } = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type;
        this.icon = icon;
        this.requirements = requirements;
        this.rewards = rewards;
        this.hidden = hidden;
        this.unlocked = unlocked;
        this.progress = progress;
        this.unlockDate = unlockDate;
        this.flavorText = flavorText;
    }

    /**
     * 检查是否满足解锁条件
     * @param {Object} context 检查上下文（如当前击杀数、收集品等）
     * @returns {boolean} 是否满足条件
     */
    checkRequirements(context) {
        if (this.unlocked) return true;

        switch (this.type) {
            case AchievementType.KILL:
                return this._checkKillRequirements(context);
            case AchievementType.COLLECT:
                return this._checkCollectRequirements(context);
            case AchievementType.SKILL:
                return this._checkSkillRequirements(context);
            case AchievementType.STORY:
                return this._checkStoryRequirements(context);
            default:
                return false;
        }
    }

    /**
     * 检查击杀成就条件
     */
    _checkKillRequirements(context) {
        const { kills = {} } = context;
        const required = this.requirements;
        
        // 检查特定敌人击杀数
        if (required.enemyId && kills[required.enemyId] >= required.count) {
            return true;
        }
        
        // 检查总击杀数
        if (required.totalKills && context.totalKills >= required.totalKills) {
            return true;
        }
        
        // 检查途径击杀数
        if (required.pathway && kills[required.pathway] >= required.count) {
            return true;
        }
        
        return false;
    }

    /**
     * 检查收集成就条件
     */
    _checkCollectRequirements(context) {
        const { collectibles = {} } = context;
        const required = this.requirements;
        
        // 检查特定收集品
        if (required.itemId && collectibles[required.itemId] && collectibles[required.itemId].obtained) {
            return true;
        }
        
        // 检查收集品类型数量
        if (required.type && required.count) {
            let count = 0;
            for (const itemId in collectibles) {
                if (collectibles[itemId].type === required.type && collectibles[itemId].obtained) {
                    count++;
                }
            }
            if (count >= required.count) {
                return true;
            }
        }
        
        // 检查总收集品数量
        if (required.totalCollected && context.totalCollected >= required.totalCollected) {
            return true;
        }
        
        return false;
    }

    /**
     * 检查技能成就条件
     */
    _checkSkillRequirements(context) {
        const { skills = [] } = context;
        const required = this.requirements;
        
        // 检查特定技能解锁
        if (required.skillId && skills.includes(required.skillId)) {
            return true;
        }
        
        // 检查技能数量
        if (required.skillCount && skills.length >= required.skillCount) {
            return true;
        }
        
        // 检查途径技能解锁
        if (required.pathway && required.count) {
            let count = 0;
            for (const skillId of skills) {
                if (skillId.startsWith(required.pathway.toLowerCase())) {
                    count++;
                }
            }
            if (count >= required.count) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 检查剧情成就条件
     */
    _checkStoryRequirements(context) {
        const { quests = {} } = context;
        const required = this.requirements;
        
        // 检查特定任务完成
        if (required.questId && quests[required.questId] && quests[required.questId].completed) {
            return true;
        }
        
        // 检查章节完成
        if (required.chapter && quests[required.chapter] && quests[required.chapter].completed) {
            return true;
        }
        
        // 检查任务数量
        if (required.questCount && context.completedQuests >= required.questCount) {
            return true;
        }
        
        return false;
    }

    /**
     * 更新进度
     */
    updateProgress(context) {
        if (this.unlocked) {
            this.progress = 100;
            return;
        }

        switch (this.type) {
            case AchievementType.KILL:
                this._updateKillProgress(context);
                break;
            case AchievementType.COLLECT:
                this._updateCollectProgress(context);
                break;
            case AchievementType.SKILL:
                this._updateSkillProgress(context);
                break;
            case AchievementType.STORY:
                this._updateStoryProgress(context);
                break;
        }
    }

    /**
     * 更新击杀成就进度
     */
    _updateKillProgress(context) {
        const { kills = {} } = context;
        const required = this.requirements;
        
        if (required.enemyId) {
            const current = kills[required.enemyId] || 0;
            this.progress = Math.min(100, Math.floor((current / required.count) * 100));
        } else if (required.totalKills) {
            const current = context.totalKills || 0;
            this.progress = Math.min(100, Math.floor((current / required.totalKills) * 100));
        }
    }

    /**
     * 更新收集成就进度
     */
    _updateCollectProgress(context) {
        const { collectibles = {} } = context;
        const required = this.requirements;
        
        if (required.itemId) {
            const item = collectibles[required.itemId];
            this.progress = item && item.obtained ? 100 : 0;
        } else if (required.type && required.count) {
            let count = 0;
            for (const itemId in collectibles) {
                if (collectibles[itemId].type === required.type && collectibles[itemId].obtained) {
                    count++;
                }
            }
            this.progress = Math.min(100, Math.floor((count / required.count) * 100));
        }
    }

    /**
     * 更新技能成就进度
     */
    _updateSkillProgress(context) {
        const { skills = [] } = context;
        const required = this.requirements;
        
        if (required.skillId) {
            this.progress = skills.includes(required.skillId) ? 100 : 0;
        } else if (required.skillCount) {
            this.progress = Math.min(100, Math.floor((skills.length / required.skillCount) * 100));
        }
    }

    /**
     * 更新剧情成就进度
     */
    _updateStoryProgress(context) {
        const { quests = {} } = context;
        const required = this.requirements;
        
        if (required.questId) {
            const quest = quests[required.questId];
            this.progress = quest && quest.completed ? 100 : 0;
        } else if (required.questCount) {
            const completed = context.completedQuests || 0;
            this.progress = Math.min(100, Math.floor((completed / required.questCount) * 100));
        }
    }

    /**
     * 解锁成就
     */
    unlock() {
        if (!this.unlocked) {
            this.unlocked = true;
            this.progress = 100;
            this.unlockDate = new Date().toISOString();
            return true;
        }
        return false;
    }

    /**
     * 转换为字典（用于序列化）
     */
    toDict() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            icon: this.icon,
            requirements: this.requirements,
            rewards: this.rewards,
            hidden: this.hidden,
            unlocked: this.unlocked,
            progress: this.progress,
            unlockDate: this.unlockDate,
            flavorText: this.flavorText
        };
    }

    /**
     * 从字典创建
     */
    static fromDict(data) {
        const achievement = new Achievement({
            id: data.id,
            name: data.name,
            description: data.description,
            type: data.type,
            icon: data.icon,
            requirements: data.requirements,
            rewards: data.rewards,
            hidden: data.hidden,
            flavorText: data.flavorText
        });
        achievement.unlocked = data.unlocked;
        achievement.progress = data.progress;
        achievement.unlockDate = data.unlockDate;
        return achievement;
    }
}

/**
 * 预定义成就数据
 */

// 击杀成就
export const ACHIEVEMENT_FIRST_BLOOD = new Achievement({
    id: 'achievement_first_blood',
    name: '首杀',
    description: '第一次击败敌人',
    type: AchievementType.KILL,
    icon: '🩸',
    requirements: {
        totalKills: 1
    },
    rewards: [
        { type: RewardType.GOLD, value: 100 },
        { type: RewardType.TITLE, value: '新手猎人' }
    ],
    flavorText: '第一次面对非凡世界的力量，你迈出了第一步。'
});

export const ACHIEVEMENT_SHEPHERD_SLAYER = new Achievement({
    id: 'achievement_shepherd_slayer',
    name: '牧羊人猎手',
    description: '击败牧羊人（序列5·秘祈人）',
    type: AchievementType.KILL,
    icon: '👨‍🌾',
    requirements: {
        enemyId: 'enemy_shepherd',
        count: 1
    },
    rewards: [
        { type: RewardType.GOLD, value: 500 },
        { type: RewardType.ITEM, value: 'material_dark_crystal', count: 5 }
    ],
    flavorText: '即使是序列5的强者，也无法阻挡你的脚步。'
});

export const ACHIEVEMENT_DEMON_HUNTER_EXTERMINATOR = new Achievement({
    id: 'achievement_demon_hunter_exterminator',
    name: '恶魔猎手终结者',
    description: '击败恶魔猎手（序列5·战士）',
    type: AchievementType.KILL,
    icon: '⚔️',
    requirements: {
        enemyId: 'enemy_demon_hunter',
        count: 1
    },
    rewards: [
        { type: RewardType.GOLD, value: 600 },
        { type: RewardType.TITLE, value: '恶魔克星' }
    ],
    flavorText: '战士途径的非凡者在你面前也只能屈服。'
});

// 收集成就
export const ACHIEVEMENT_COLLECTOR_BEGINNER = new Achievement({
    id: 'achievement_collector_beginner',
    name: '初级收藏家',
    description: '获得10件不同的收集品',
    type: AchievementType.COLLECT,
    icon: '📚',
    requirements: {
        totalCollected: 10
    },
    rewards: [
        { type: RewardType.GOLD, value: 300 },
        { type: RewardType.UNLOCK, value: 'collectible_tracking' }
    ],
    flavorText: '收集之路的开始，每一次收获都是力量的积累。'
});

export const ACHIEVEMENT_FEATURE_HUNTER = new Achievement({
    id: 'achievement_feature_hunter',
    name: '特性猎人',
    description: '获得5种不同的非凡特性',
    type: AchievementType.COLLECT,
    icon: '🔮',
    requirements: {
        type: 'feature',
        count: 5
    },
    rewards: [
        { type: RewardType.GOLD, value: 1000 },
        { type: RewardType.TITLE, value: '特性专家' }
    ],
    flavorText: '非凡特性是途径的本质，理解它们就是理解力量本身。'
});

// 技能成就
export const ACHIEVEMENT_SKILL_MASTER = new Achievement({
    id: 'achievement_skill_master',
    name: '技能大师',
    description: '解锁20个不同的技能',
    type: AchievementType.SKILL,
    icon: '🎯',
    requirements: {
        skillCount: 20
    },
    rewards: [
        { type: RewardType.GOLD, value: 1500 },
        { type: RewardType.TITLE, value: '技能大师' }
    ],
    flavorText: '掌握多种非凡能力，你在非凡道路上越发游刃有余。'
});

export const ACHIEVEMENT_PATHWAY_EXPERT = new Achievement({
    id: 'achievement_pathway_expert',
    name: '途径专家',
    description: '解锁某个途径的所有专属技能',
    type: AchievementType.SKILL,
    icon: '🛤️',
    requirements: {
        pathway: 'diviner',
        count: 4  // 占卜家途径有4个专属技能
    },
    rewards: [
        { type: RewardType.GOLD, value: 2000 },
        { type: RewardType.ITEM, value: 'relic_seer_eye', count: 1 }
    ],
    hidden: true,
    flavorText: '完全掌握一条途径的力量，你已经触及了非凡世界的深层秘密。'
});

// 剧情成就
export const ACHIEVEMENT_STORY_INITIATE = new Achievement({
    id: 'achievement_story_initiate',
    name: '剧情入门',
    description: '完成第一章主线剧情',
    type: AchievementType.STORY,
    icon: '📖',
    requirements: {
        chapter: 'chapter1',
        completed: true
    },
    rewards: [
        { type: RewardType.GOLD, value: 500 },
        { type: RewardType.TITLE, value: '剧情探索者' }
    ],
    flavorText: '这只是开始，更大的秘密等待你去揭开。'
});

export const ACHIEVEMENT_CHAPTER_COMPLETER = new Achievement({
    id: 'achievement_chapter_completer',
    name: '章节完成者',
    description: '完成所有三章主线剧情',
    type: AchievementType.STORY,
    icon: '🏁',
    requirements: {
        questCount: 15  // 三章总任务数
    },
    rewards: [
        { type: RewardType.GOLD, value: 5000 },
        { type: RewardType.TITLE, value: '剧情大师' }
    ],
    flavorText: '你走过了完整的旅程，但非凡世界的秘密永无止境。'
});

/**
 * 成就数据映射
 */
export const AchievementData = {
    'achievement_first_blood': ACHIEVEMENT_FIRST_BLOOD,
    'achievement_shepherd_slayer': ACHIEVEMENT_SHEPHERD_SLAYER,
    'achievement_demon_hunter_exterminator': ACHIEVEMENT_DEMON_HUNTER_EXTERMINATOR,
    'achievement_collector_beginner': ACHIEVEMENT_COLLECTOR_BEGINNER,
    'achievement_feature_hunter': ACHIEVEMENT_FEATURE_HUNTER,
    'achievement_skill_master': ACHIEVEMENT_SKILL_MASTER,
    'achievement_pathway_expert': ACHIEVEMENT_PATHWAY_EXPERT,
    'achievement_story_initiate': ACHIEVEMENT_STORY_INITIATE,
    'achievement_chapter_completer': ACHIEVEMENT_CHAPTER_COMPLETER
};