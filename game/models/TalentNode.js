/**
 * 天赋节点数据模型
 */

/**
 * 天赋效果类
 */
export class TalentEffect {
    constructor({
        type = '',
        value = 0,
        stat = null,
        skillId = null,
        skillType = null,
        effectId = null,
        duration = 0,
        conditions = []
    } = {}) {
        this.type = type;                    // 效果类型
        this.value = value;                  // 效果数值或配置
        this.stat = stat;                    // 影响的属性（如"strength"）
        this.skillId = skillId;              // 影响的技能ID
        this.skillType = skillType;          // 影响的技能类型
        this.effectId = effectId;            // 特殊效果ID
        this.duration = duration;            // 持续时间（回合数，0表示永久）
        this.conditions = conditions;        // 触发条件数组
    }
    
    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            type: this.type,
            value: this.value,
            stat: this.stat,
            skillId: this.skillId,
            skillType: this.skillType,
            effectId: this.effectId,
            duration: this.duration,
            conditions: this.conditions
        };
    }
    
    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {TalentEffect}
     */
    static fromDict(data) {
        return new TalentEffect(data);
    }
    
    /**
     * 检查效果是否满足触发条件
     * @param {Object} context - 触发上下文
     * @returns {boolean}
     */
    checkConditions(context) {
        if (!this.conditions || this.conditions.length === 0) {
            return true;
        }
        
        // 简化实现：假设条件总是满足
        // 实际实现中需要根据具体条件逻辑检查
        return true;
    }
}

/**
 * 天赋节点类
 */
export class TalentNode {
    constructor({
        id = '',
        name = '',
        description = '',
        type = 'combat',
        tier = 1,
        column = 0,
        prerequisites = [],
        requiredSequence = null,
        requiredLevel = 1,
        cost = 1,
        effects = [],
        icon = '',
        colorTheme = '#000000',
        exclusiveWith = []
    } = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type;
        this.tier = tier;
        this.column = column;
        this.prerequisites = prerequisites;
        this.requiredSequence = requiredSequence;
        this.requiredLevel = requiredLevel;
        this.cost = cost;
        this.effects = effects.map(e => new TalentEffect(e));
        this.icon = icon;
        this.colorTheme = colorTheme;
        this.exclusiveWith = exclusiveWith;
    }
    
    /**
     * 获取节点在天赋树中的显示位置
     * @returns {Object} {x, y} 坐标
     */
    getPosition() {
        // 根据tier和column计算坐标
        // tier: 1-5, column: 0-...
        const x = this.column * 120;  // 每个列间距120px
        const y = this.tier * 100;    // 每个层级间距100px
        return { x, y };
    }
    
    /**
     * 检查节点是否可激活
     * @param {Set} unlockedNodes - 已解锁节点ID集合
     * @param {number} characterLevel - 角色等级
     * @param {string} characterSequence - 角色当前序列
     * @returns {Object} {canActivate: boolean, reasons: string[]}
     */
    checkActivationConditions(unlockedNodes, characterLevel, characterSequence) {
        const reasons = [];
        
        // 检查等级要求
        if (characterLevel < this.requiredLevel) {
            reasons.push(`需要等级 ${this.requiredLevel}`);
        }
        
        // 检查序列要求
        if (this.requiredSequence) {
            const requiredNum = parseInt(this.requiredSequence.replace('序列', ''));
            const currentNum = parseInt(characterSequence.replace('序列', ''));
            if (currentNum > requiredNum) {
                reasons.push(`需要序列 ${this.requiredSequence}`);
            }
        }
        
        // 检查前置天赋
        for (const prereqId of this.prerequisites) {
            if (!unlockedNodes.has(prereqId)) {
                reasons.push(`需要前置天赋: ${prereqId}`);
            }
        }
        
        // 检查互斥天赋
        for (const exclusiveId of this.exclusiveWith) {
            if (unlockedNodes.has(exclusiveId)) {
                reasons.push(`与已激活天赋互斥: ${exclusiveId}`);
            }
        }
        
        const canActivate = reasons.length === 0;
        return { canActivate, reasons };
    }
    
    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            tier: this.tier,
            column: this.column,
            prerequisites: this.prerequisites,
            requiredSequence: this.requiredSequence,
            requiredLevel: this.requiredLevel,
            cost: this.cost,
            effects: this.effects.map(e => e.toDict()),
            icon: this.icon,
            colorTheme: this.colorTheme,
            exclusiveWith: this.exclusiveWith
        };
    }
    
    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {TalentNode}
     */
    static fromDict(data) {
        return new TalentNode(data);
    }
    
    /**
     * 检查节点是否满足基本激活条件（不检查前置）
     * @param {number} characterLevel - 角色等级
     * @param {string} characterSequence - 角色当前序列
     * @returns {boolean}
     */
    meetsBasicRequirements(characterLevel, characterSequence) {
        if (characterLevel < this.requiredLevel) {
            return false;
        }
        
        if (this.requiredSequence) {
            const requiredNum = parseInt(this.requiredSequence.replace('序列', ''));
            const currentNum = parseInt(characterSequence.replace('序列', ''));
            if (currentNum > requiredNum) {
                return false;
            }
        }
        
        return true;
    }
}