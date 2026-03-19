/**
 * 角色数据模型
 */
import { Attribute, AttributeSet, Background } from './Attribute.js';

/**
 * 角色数据类
 */
export class Character {
    constructor({
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
        gold = 100,
        inventorySlots = 20,
        pathwayAffinities = {},
        
        // 天赋系统扩展
        talentTreeId = null,
        unlockedTalents = [],
        availableTalentPoints = 0,
        talentTrees = {}
    } = {}) {
        this.name = name;
        this.background = background;
        this.attributes = attributes;
        this.currentPathwayId = currentPathwayId;
        this.currentSequence = currentSequence;
        this.level = level;
        this.experience = experience;
        this.health = health;
        this.maxHealth = maxHealth;
        this.spirit = spirit;
        this.maxSpirit = maxSpirit;
        this.sanity = sanity;
        this.gold = gold;
        this.inventorySlots = inventorySlots;
        this.pathwayAffinities = pathwayAffinities;
        
        // 天赋系统属性
        this.talentTreeId = talentTreeId;
        this.unlockedTalents = unlockedTalents;
        this.availableTalentPoints = availableTalentPoints;
        this.talentTrees = talentTrees;

        // 初始化
        this._applyBackgroundBonus();
        
        // 初始化健康值
        this.maxHealth = this.attributes.constitution * 10;
        this.health = this.maxHealth;
        
        // 初始化灵性值
        this.maxSpirit = (this.attributes.intelligence + this.attributes.perception) * 5;
        this.spirit = this.maxSpirit;
    }

    /**
     * 应用出身背景的属性加成
     */
    _applyBackgroundBonus() {
        if (this.background === Background.NOBLE) {
            this.attributes.modify(Attribute.CHARISMA, 2);
            this.attributes.modify(Attribute.INTELLIGENCE, 1);
        } else if (this.background === Background.COMMONER) {
            this.attributes.modify(Attribute.CONSTITUTION, 2);
            this.attributes.modify(Attribute.STRENGTH, 1);
        } else if (this.background === Background.ORPHAN) {
            this.attributes.modify(Attribute.PERCEPTION, 2);
            this.attributes.modify(Attribute.AGILITY, 1);
        } else if (this.background === Background.MYSTIC) {
            this.attributes.modify(Attribute.INTELLIGENCE, 2);
            this.attributes.modify(Attribute.PERCEPTION, 1);
        }
    }

    /**
     * 获取当前途径的主要侧重属性（简化版本）
     * @returns {string[]}
     */
    getMainAttributes() {
        // 这里根据途径ID返回对应的属性列表
        // 简化处理：返回通用属性
        return [Attribute.INTELLIGENCE, Attribute.PERCEPTION];
    }

    /**
     * 计算综合战斗力（简化）
     * @returns {number}
     */
    calculateCombatPower() {
        const base = this.attributes.total();
        const levelBonus = this.level * 5;
        return base + levelBonus;
    }

    /**
     * 获得经验值
     * @param {number} experience - 经验值
     */
    gainExperience(experience) {
        if (experience <= 0) {
            return;
        }

        this.experience += experience;

        // 检查升级（简化升级系统）
        // 每升一级需要100 * 当前等级的经验
        while (this.experience >= (this.level * 100)) {
            this.experience -= (this.level * 100);
            this.level += 1;

            // 每升一级增加2点属性点
            // 在实际游戏中，这里可能需要让玩家选择属性
            // 这里简化：自动分配到智力
            this.attributes.modify(Attribute.INTELLIGENCE, 2);
            
            // 升级时获得天赋点
            this.gainTalentPoints(1);

            // 升级时恢复部分生命和灵性
            this.health = Math.min(this.maxHealth, this.health + this.level * 5);
            this.spirit = Math.min(this.maxSpirit, this.spirit + this.level * 3);

            console.log(`等级提升至 ${this.level}！`);
        }
    }
    
    /**
     * 获得天赋点
     * @param {number} points - 天赋点数
     */
    gainTalentPoints(points) {
        this.availableTalentPoints += points;
    }
    
    /**
     * 激活天赋
     * @param {string} talentId - 天赋ID
     * @returns {boolean} 是否成功
     */
    activateTalent(talentId) {
        // 简化实现：直接添加到已解锁列表
        if (!this.unlockedTalents.includes(talentId)) {
            this.unlockedTalents.push(talentId);
            return true;
        }
        return false;
    }
    
    /**
     * 重置天赋树
     * @param {string} treeId - 天赋树ID
     * @returns {boolean} 是否成功
     */
    respecTalentTree(treeId) {
        // 简化实现：清空相关天赋
        this.unlockedTalents = [];
        this.availableTalentPoints = this.level; // 重置为等级数
        return true;
    }
    
    /**
     * 获取天赋效果
     * @returns {Array} 天赋效果数组
     */
    getTalentEffects() {
        // 简化实现：返回空数组
        // 实际实现中会根据unlockedTalents计算效果
        return [];
    }

    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            name: this.name,
            background: this.background,
            attributes: this.attributes.toDict(),
            currentPathwayId: this.currentPathwayId,
            currentSequence: this.currentSequence,
            level: this.level,
            experience: this.experience,
            health: this.health,
            maxHealth: this.maxHealth,
            spirit: this.spirit,
            maxSpirit: this.maxSpirit,
            sanity: this.sanity,
            gold: this.gold,
            inventorySlots: this.inventorySlots,
            pathwayAffinities: this.pathwayAffinities,
            talentTreeId: this.talentTreeId,
            unlockedTalents: this.unlockedTalents,
            availableTalentPoints: this.availableTalentPoints,
            talentTrees: this.talentTrees
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {Character}
     */
    static fromDict(data) {
        // 解析背景
        const bgValue = data.background || '贵族后裔';
        let background;
        
        // 查找匹配的背景
        Object.values(Background).forEach(value => {
            if (value === bgValue) {
                background = value;
            }
        });
        
        if (!background) {
            background = Background.NOBLE;
        }

        // 创建角色
        const character = new Character({
            name: data.name || '未知',
            background: background,
            attributes: AttributeSet.fromDict(data.attributes || {}),
            currentPathwayId: data.currentPathwayId,
            currentSequence: data.currentSequence || '9',
            level: data.level || 1,
            experience: data.experience || 0,
            health: data.health || 100,
            maxHealth: data.maxHealth || 100,
            spirit: data.spirit || 100,
            maxSpirit: data.maxSpirit || 100,
            sanity: data.sanity || 100,
            gold: data.gold || 100,
            inventorySlots: data.inventorySlots || 20,
            pathwayAffinities: data.pathwayAffinities || {},
            talentTreeId: data.talentTreeId || null,
            unlockedTalents: data.unlockedTalents || [],
            availableTalentPoints: data.availableTalentPoints || 0,
            talentTrees: data.talentTrees || {}
        });

        return character;
    }
}

/**
 * 创建新角色
 * @param {string} name - 角色名称
 * @param {string} background - 出身背景
 * @returns {Character}
 */
export function createCharacter(name, background) {
    return new Character({ name, background });
}