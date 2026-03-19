import { Character } from './Character.js';
import { AttributeSet } from './Attribute.js';

/**
 * NPC数据类，继承自Character
 */
export class NPC extends Character {
    constructor({
        // Character基类参数
        name,
        background,
        attributes = new AttributeSet(),
        currentPathwayId = null,
        currentSequence = '9',
        level = 1,
        experience = 0,
        health = 100,
        maxHealth = 100,
        spirit = 100,
        maxSpirit = 100,
        sanity = 100,
        gold = 0,
        inventorySlots = 10,
        pathwayAffinities = {},
        
        // NPC专属参数
        npcId = '',
        templateId = '',
        type = 'human_extraordinary',
        rarity = 'common',
        growthCurve = {},
        loyalty = 50,
        teamPosition = 'middle',
        teamBuff = null,
        comboSkills = [],
        recruitmentConditions = {},
        storyRelations = {},
        catalogInfo = {},
        talentTreeId = null,
        unlockedTalents = [],
        availableTalentPoints = 0
    } = {}) {
        super({
            name, background, attributes, currentPathwayId, currentSequence,
            level, experience, health, maxHealth, spirit, maxSpirit,
            sanity, gold, inventorySlots, pathwayAffinities,
            talentTreeId, unlockedTalents, availableTalentPoints, talentTrees
        });
        
        this.npcId = npcId;
        this.templateId = templateId;
        this.type = type;
        this.rarity = rarity;
        this.growthCurve = growthCurve;
        this.loyalty = loyalty;
        this.teamPosition = teamPosition;
        this.teamBuff = teamBuff;
        this.comboSkills = comboSkills;
        this.recruitmentConditions = recruitmentConditions;
        this.storyRelations = storyRelations;
        this.catalogInfo = catalogInfo;
        this.talentTreeId = talentTreeId;
        this.unlockedTalents = unlockedTalents;
        this.availableTalentPoints = availableTalentPoints;
        
        // 应用成长曲线
        this._applyGrowthCurve();
    }
    
    /**
     * 应用成长曲线到当前属性
     */
    _applyGrowthCurve() {
        if (!this.growthCurve || !this.growthCurve.statsPerLevel) {
            return;
        }
        
        const levelDiff = this.level - (this.growthCurve.baseLevel || 1);
        if (levelDiff <= 0) {
            return;
        }
        
        const stats = this.growthCurve.statsPerLevel;
        Object.keys(stats).forEach(stat => {
            const increase = stats[stat] * levelDiff;
            this.attributes.modify(stat, increase);
        });
    }
    
    /**
     * 提升忠诚度
     * @param {number} amount - 提升值
     */
    increaseLoyalty(amount) {
        this.loyalty = Math.min(100, this.loyalty + amount);
    }
    
    /**
     * 降低忠诚度
     * @param {number} amount - 降低值
     */
    decreaseLoyalty(amount) {
        this.loyalty = Math.max(0, this.loyalty - amount);
    }
    
    /**
     * 获取位置加成值
     * @returns {Object} 位置加成对象
     */
    getPositionBonus() {
        const bonuses = {
            front: {
                damageReduction: 0.15,
                tauntChance: 0.2
            },
            middle: {
                criticalChance: 0.1,
                skillRange: 1.2
            },
            back: {
                skillRange: 1.5,
                healingBoost: 0.15
            }
        };
        
        return bonuses[this.teamPosition] || {};
    }
    
    /**
     * 检查是否满足招募条件
     * @param {Object} playerState - 玩家状态
     * @returns {boolean} 是否满足条件
     */
    checkRecruitmentConditions(playerState) {
        const conditions = this.recruitmentConditions;
        
        // 检查金币
        if (playerState.gold < (conditions.requiredGold || 0)) {
            return false;
        }
        
        // 检查物品
        if (conditions.requiredItems) {
            for (const itemReq of conditions.requiredItems) {
                const playerItemCount = playerState.inventory.getItemCount(itemReq.itemId);
                if (playerItemCount < itemReq.quantity) {
                    return false;
                }
            }
        }
        
        // 检查前置NPC
        if (conditions.prerequisiteNpcs && conditions.prerequisiteNpcs.length > 0) {
            // 这里需要访问NPC管理器检查已招募NPC
            // 简化处理：假设玩家有所有前置NPC
            console.log('需要检查前置NPC:', conditions.prerequisiteNpcs);
        }
        
        // 检查任务条件
        if (conditions.requiredQuestId) {
            const questCompleted = playerState.questLog.isQuestCompleted(conditions.requiredQuestId);
            if (!questCompleted) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 获取招募所需资源描述
     * @returns {Object} 资源描述
     */
    getRecruitmentCostDescription() {
        const conditions = this.recruitmentConditions;
        return {
            gold: conditions.requiredGold || 0,
            items: conditions.requiredItems || [],
            description: `招募${this.name}需要${conditions.requiredGold || 0}金币`
        };
    }
    
    /**
     * 转换为字典（覆盖父类方法）
     * @returns {Object}
     */
    toDict() {
        const baseDict = super.toDict();
        return {
            ...baseDict,
            npcId: this.npcId,
            templateId: this.templateId,
            type: this.type,
            rarity: this.rarity,
            growthCurve: this.growthCurve,
            loyalty: this.loyalty,
            teamPosition: this.teamPosition,
            teamBuff: this.teamBuff,
            comboSkills: this.comboSkills,
            recruitmentConditions: this.recruitmentConditions,
            storyRelations: this.storyRelations,
            catalogInfo: this.catalogInfo,
            talentTreeId: this.talentTreeId,
            unlockedTalents: this.unlockedTalents,
            availableTalentPoints: this.availableTalentPoints
        };
    }
    
    /**
     * 从字典创建（静态工厂方法）
     * @param {Object} data - 字典数据
     * @returns {NPC}
     */
    static fromDict(data) {
        const characterData = {
            name: data.name,
            background: data.background,
            attributes: AttributeSet.fromDict(data.attributes || {}),
            currentPathwayId: data.currentPathwayId,
            currentSequence: data.currentSequence,
            level: data.level || 1,
            experience: data.experience || 0,
            health: data.health || 100,
            maxHealth: data.maxHealth || 100,
            spirit: data.spirit || 100,
            maxSpirit: data.maxSpirit || 100,
            sanity: data.sanity || 100,
            gold: data.gold || 0,
            inventorySlots: data.inventorySlots || 10,
            pathwayAffinities: data.pathwayAffinities || {}
        };
        
        return new NPC({
            ...characterData,
            npcId: data.npcId,
            templateId: data.templateId,
            type: data.type || 'human_extraordinary',
            rarity: data.rarity || 'common',
            growthCurve: data.growthCurve || {},
            loyalty: data.loyalty || 50,
            teamPosition: data.teamPosition || 'middle',
            teamBuff: data.teamBuff,
            comboSkills: data.comboSkills || [],
            recruitmentConditions: data.recruitmentConditions || {},
            storyRelations: data.storyRelations || {},
            catalogInfo: data.catalogInfo || {},
            talentTreeId: data.talentTreeId,
            unlockedTalents: data.unlockedTalents || [],
            availableTalentPoints: data.availableTalentPoints || 0
        });
    }
    
    /**
     * 从模板创建NPC实例
     * @param {Object} template - NPC模板数据
     * @param {string} instanceId - 实例ID
     * @returns {NPC}
     */
    static fromTemplate(template, instanceId) {
        return new NPC({
            npcId: instanceId,
            templateId: template.templateId,
            name: template.name,
            type: template.type,
            rarity: template.rarity,
            growthCurve: template.growthCurve,
            attributes: AttributeSet.fromDict(template.baseAttributes || {}),
            teamPosition: template.teamPosition || 'middle',
            teamBuff: template.teamBuff,
            comboSkills: template.comboSkills || [],
            recruitmentConditions: template.recruitmentConditions || {},
            storyRelations: template.storyRelations || {},
            catalogInfo: template.catalogInfo || {},
            talentTreeId: template.talentTreeId
        });
    }
    
    /**
     * 获取NPC的图鉴信息
     * @returns {Object} 图鉴信息
     */
    getCatalogInfo() {
        return {
            ...this.catalogInfo,
            isDiscovered: true,
            currentLoyalty: this.loyalty,
            currentLevel: this.level
        };
    }
    
    /**
     * 获取适合的团队角色描述
     * @returns {string} 角色描述
     */
    getTeamRoleDescription() {
        const roleMap = {
            front: '防御型 - 前排坦克，承受伤害',
            middle: '平衡型 - 中排输出，灵活应对',
            back: '支援型 - 后排辅助，远程治疗'
        };
        
        return roleMap[this.teamPosition] || '未知角色';
    }
    
    /**
     * 计算当前战斗力（考虑忠诚度和位置加成）
     * @returns {number} 综合战斗力
     */
    calculateCombatPower() {
        const basePower = super.calculateCombatPower();
        const loyaltyBonus = this.loyalty / 100; // 忠诚度加成系数
        const positionBonus = this.getPositionBonus();
        
        let totalPower = basePower * (1 + loyaltyBonus * 0.5); // 忠诚度最多增加50%战斗力
        
        // 位置加成
        if (positionBonus.damageReduction) {
            totalPower *= (1 + positionBonus.damageReduction);
        }
        if (positionBonus.criticalChance) {
            totalPower *= (1 + positionBonus.criticalChance);
        }
        
        return Math.round(totalPower);
    }
}