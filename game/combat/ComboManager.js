/**
 * 合击管理器
 * 处理NPC组合的合击条件检测、合击技能触发和效果应用
 */

/**
 * 合击技能定义
 */
export const ComboSkillType = Object.freeze({
    CHAIN_ATTACK: 'chainAttack',      // 连锁攻击
    FUSION_SKILL: 'fusionSkill',      // 融合技能
    SUPPORT_BOOST: 'supportBoost',    // 支援强化
    SYNERGY_BUFF: 'synergyBuff'       // 协同增益
});

/**
 * 合击效果定义
 */
export const ComboEffect = Object.freeze({
    DAMAGE_MULTIPLIER: 'damageMultiplier',  // 伤害倍率
    ADDITIONAL_HITS: 'additionalHits',      // 追加攻击次数
    STATUS_EFFECT: 'statusEffect',          // 状态效果
    HEALING: 'healing',                     // 治疗
    SHIELD: 'shield',                       // 护盾
    STAT_BUFF: 'statBuff',                  // 属性增益
    ENERGY_REGEN: 'energyRegen'             // 能量回复
});

/**
 * 合击条件类型
 */
export const ComboCondition = Object.freeze({
    FRIENDSHIP_LEVEL: 'friendshipLevel',    // 友好度要求
    POSITION_RELATION: 'positionRelation',  // 位置关系
    HEALTH_THRESHOLD: 'healthThreshold',    // 血量阈值
    ENERGY_COST: 'energyCost',              // 能量消耗
    COOLDOWN: 'cooldown',                   // 冷却时间
    CHANCE: 'chance'                        // 触发概率
});

/**
 * 合击管理器类
 */
export class ComboManager {
    constructor() {
        // 合击技能定义库
        this.comboDefinitions = this._loadComboDefinitions();
        
        // 已触发的合击记录（用于冷却和统计）
        this.triggeredCombos = new Map();
        
        // 团队能量管理器引用（外部传入）
        this.teamEnergyManager = null;
    }
    
    /**
     * 设置团队能量管理器
     * @param {Object} manager - 团队能量管理器实例
     */
    setTeamEnergyManager(manager) {
        this.teamEnergyManager = manager;
    }
    
    /**
     * 检查并获取可用的合击技能
     * @param {Character} actor - 主动行动的角色
     * @param {Array} team - 整个队伍
     * @param {Object} positionManager - 位置管理器实例
     * @returns {Array} 可用的合击技能列表
     */
    getAvailableCombos(actor, team, positionManager) {
        const availableCombos = [];
        
        // 检查所有可能的合击组合
        team.forEach(potentialPartner => {
            // 排除自己
            if (potentialPartner === actor) return;
            
            // 检查组合定义
            const comboDef = this._getComboDefinition(actor, potentialPartner);
            if (!comboDef) return;
            
            // 检查所有条件
            const conditionsMet = this._checkComboConditions(comboDef, actor, potentialPartner, team, positionManager);
            if (conditionsMet) {
                availableCombos.push({
                    definition: comboDef,
                    partner: potentialPartner,
                    conditions: conditionsMet
                });
            }
        });
        
        return availableCombos;
    }
    
    /**
     * 执行合击技能
     * @param {Object} comboData - 合击数据
     * @param {Array} targets - 目标数组
     * @param {Object} battleContext - 战斗上下文
     * @returns {Object} 合击结果
     */
    executeCombo(comboData, targets, battleContext) {
        const { definition, partner } = comboData;
        
        // 验证条件是否仍然满足
        const conditionsMet = this._checkComboConditions(
            definition, 
            comboData.actor || battleContext.currentActor, 
            partner, 
            battleContext.team, 
            battleContext.positionManager
        );
        
        if (!conditionsMet) {
            return { success: false, reason: '条件不再满足' };
        }
        
        // 消耗资源
        if (!this._consumeComboResources(definition, battleContext)) {
            return { success: false, reason: '资源不足' };
        }
        
        // 记录触发
        this._recordComboTrigger(definition);
        
        // 应用合击效果
        const results = this._applyComboEffects(definition, comboData, targets, battleContext);
        
        // 触发合击事件
        this._onComboExecuted(definition, comboData, results, battleContext);
        
        return {
            success: true,
            definition,
            partner,
            targets,
            results
        };
    }
    
    /**
     * 加载合击定义
     * @returns {Object} 合击定义库
     */
    _loadComboDefinitions() {
        // 这里简化实现，实际应从JSON文件加载
        return {
            // 守护者 + 神秘学者: 神圣守护阵
            'guardian_mystic': {
                id: 'guardian_mystic_combo',
                name: '神圣守护阵',
                description: '守护者与神秘学者协同，召唤神圣护盾保护全队',
                type: ComboSkillType.SUPPORT_BOOST,
                actors: ['guardian', 'mystic'],
                conditions: [
                    { type: ComboCondition.FRIENDSHIP_LEVEL, value: 60 },
                    { type: ComboCondition.POSITION_RELATION, value: 'adjacent' },
                    { type: ComboCondition.ENERGY_COST, value: 50 }
                ],
                effects: [
                    { type: ComboEffect.SHIELD, value: 30, target: 'team', duration: 3 },
                    { type: ComboEffect.STAT_BUFF, stat: 'defense', value: 20, target: 'team', duration: 3 }
                ],
                cooldown: 5,
                animation: 'holy_shield'
            },
            
            // 猎人 + 女巫: 追踪爆裂箭
            'hunter_witch': {
                id: 'hunter_witch_combo',
                name: '追踪爆裂箭',
                description: '猎人标记目标，女巫施加诅咒，箭矢追踪并爆炸',
                type: ComboSkillType.CHAIN_ATTACK,
                actors: ['hunter', 'witch'],
                conditions: [
                    { type: ComboCondition.FRIENDSHIP_LEVEL, value: 70 },
                    { type: ComboCondition.POSITION_RELATION, value: 'same_row' },
                    { type: ComboCondition.ENERGY_COST, value: 40 }
                ],
                effects: [
                    { type: ComboEffect.DAMAGE_MULTIPLIER, value: 1.8 },
                    { type: ComboEffect.ADDITIONAL_HITS, value: 2 },
                    { type: ComboEffect.STATUS_EFFECT, effect: 'burn', chance: 80, duration: 2 }
                ],
                cooldown: 4,
                animation: 'tracking_explosion'
            },
            
            // 天使 + 远古存在: 天国审判
            'angel_ancient_one': {
                id: 'angel_ancient_one_combo',
                name: '天国审判',
                description: '天使召唤圣光，远古存在引导时空之力，降下神圣审判',
                type: ComboSkillType.FUSION_SKILL,
                actors: ['angel', 'ancient_one'],
                conditions: [
                    { type: ComboCondition.FRIENDSHIP_LEVEL, value: 80 },
                    { type: ComboCondition.ENERGY_COST, value: 100 },
                    { type: ComboCondition.COOLDOWN, value: 8 }
                ],
                effects: [
                    { type: ComboEffect.DAMAGE_MULTIPLIER, value: 2.5 },
                    { type: ComboEffect.STATUS_EFFECT, effect: 'stun', chance: 100, duration: 1 },
                    { type: ComboEffect.HEALING, value: 25, target: 'team' }
                ],
                cooldown: 8,
                animation: 'divine_judgment'
            },
            
            // 愚者途径组合: 命运戏法
            'fool_sequence_combo': {
                id: 'fool_sequence_combo',
                name: '命运戏法',
                description: '愚者途径角色协同，操纵命运概率，大幅提升全队暴击',
                type: ComboSkillType.SYNERGY_BUFF,
                actors: ['fool_sequence'],
                conditions: [
                    { type: ComboCondition.FRIENDSHIP_LEVEL, value: 50 },
                    { type: ComboCondition.ENERGY_COST, value: 30 }
                ],
                effects: [
                    { type: ComboEffect.STAT_BUFF, stat: 'critChance', value: 30, target: 'team', duration: 4 },
                    { type: ComboEffect.STAT_BUFF, stat: 'critDamage', value: 50, target: 'team', duration: 4 }
                ],
                cooldown: 6,
                animation: 'fate_trick'
            }
        };
    }
    
    /**
     * 获取合击定义
     * @param {Character} actor1 - 角色1
     * @param {Character} actor2 - 角色2
     * @returns {Object|null} 合击定义
     */
    _getComboDefinition(actor1, actor2) {
        // 生成组合键
        const npcType1 = actor1.npcType || actor1.currentPathwayId;
        const npcType2 = actor2.npcType || actor2.currentPathwayId;
        
        // 尝试两种顺序
        const key1 = `${npcType1}_${npcType2}`;
        const key2 = `${npcType2}_${npcType1}`;
        
        return this.comboDefinitions[key1] || this.comboDefinitions[key2] || null;
    }
    
    /**
     * 检查合击条件
     * @param {Object} comboDef - 合击定义
     * @param {Character} actor1 - 角色1
     * @param {Character} actor2 - 角色2
     * @param {Array} team - 整个队伍
     * @param {Object} positionManager - 位置管理器
     * @returns {boolean|Object} 条件检查结果，返回false或详细条件数据
     */
    _checkComboConditions(comboDef, actor1, actor2, team, positionManager) {
        const conditionResults = {};
        
        for (const condition of comboDef.conditions) {
            const met = this._checkSingleCondition(condition, comboDef, actor1, actor2, team, positionManager);
            
            if (!met) {
                return false;
            }
            
            conditionResults[condition.type] = met;
        }
        
        return conditionResults;
    }
    
    /**
     * 检查单个条件
     * @param {Object} condition - 条件定义
     * @param {Object} comboDef - 合击定义
     * @param {Character} actor1 - 角色1
     * @param {Character} actor2 - 角色2
     * @param {Array} team - 整个队伍
     * @param {Object} positionManager - 位置管理器
     * @returns {boolean|any} 条件是否满足或具体数值
     */
    _checkSingleCondition(condition, comboDef, actor1, actor2, team, positionManager) {
        switch (condition.type) {
            case ComboCondition.FRIENDSHIP_LEVEL:
                // 检查友好度
                const friendship1 = actor1.getFriendshipLevel?.(actor2.id) || 50;
                const friendship2 = actor2.getFriendshipLevel?.(actor1.id) || 50;
                return Math.min(friendship1, friendship2) >= condition.value;
                
            case ComboCondition.POSITION_RELATION:
                // 检查位置关系
                const pos1 = positionManager.getCharacterPosition(actor1);
                const pos2 = positionManager.getCharacterPosition(actor2);
                
                if (!pos1 || !pos2) return false;
                
                switch (condition.value) {
                    case 'adjacent':
                        return positionManager._arePositionsAdjacent(pos1, pos2);
                    case 'same_row':
                        return pos1.row === pos2.row;
                    case 'same_col':
                        return pos1.col === pos2.col;
                    case 'front_back':
                        return (pos1.row === 'front' && pos2.row === 'back') ||
                               (pos1.row === 'back' && pos2.row === 'front');
                    default:
                        return false;
                }
                
            case ComboCondition.HEALTH_THRESHOLD:
                // 检查血量阈值
                const healthPercent = (actor1.health / actor1.maxHealth) * 100;
                return healthPercent <= condition.value;
                
            case ComboCondition.ENERGY_COST:
                // 检查团队能量是否足够
                if (!this.teamEnergyManager) return false;
                return this.teamEnergyManager.currentEnergy >= condition.value;
                
            case ComboCondition.COOLDOWN:
                // 检查冷却时间
                const lastTrigger = this.triggeredCombos.get(comboDef.id);
                if (!lastTrigger) return true;
                
                const currentTurn = this._getCurrentTurn?.(team) || 0;
                return (currentTurn - lastTrigger.turn) >= condition.value;
                
            case ComboCondition.CHANCE:
                // 概率检查
                const chance = condition.value;
                return Math.random() * 100 <= chance;
                
            default:
                console.warn(`未知的合击条件类型: ${condition.type}`);
                return false;
        }
    }
    
    /**
     * 消耗合击资源
     * @param {Object} comboDef - 合击定义
     * @param {Object} battleContext - 战斗上下文
     * @returns {boolean} 是否成功消耗
     */
    _consumeComboResources(comboDef, battleContext) {
        for (const condition of comboDef.conditions) {
            if (condition.type === ComboCondition.ENERGY_COST) {
                if (!this.teamEnergyManager) return false;
                
                if (!this.teamEnergyManager.consumeEnergy(condition.value)) {
                    return false;
                }
            }
        }
        
        // 消耗行动点（假设合击消耗与普通技能相同）
        const actor = battleContext.currentActor;
        if (actor && actor.actionPoints) {
            const actionCost = 100; // 标准行动点消耗
            if (actor.actionPoints < actionCost) {
                return false;
            }
            actor.actionPoints -= actionCost;
        }
        
        return true;
    }
    
    /**
     * 记录合击触发
     * @param {Object} comboDef - 合击定义
     */
    _recordComboTrigger(comboDef) {
        const currentTurn = this._getCurrentTurn?.() || 0;
        this.triggeredCombos.set(comboDef.id, {
            turn: currentTurn,
            timestamp: Date.now()
        });
    }
    
    /**
     * 应用合击效果
     * @param {Object} comboDef - 合击定义
     * @param {Object} comboData - 合击数据
     * @param {Array} targets - 目标数组
     * @param {Object} battleContext - 战斗上下文
     * @returns {Array} 效果结果数组
     */
    _applyComboEffects(comboDef, comboData, targets, battleContext) {
        const results = [];
        
        for (const effect of comboDef.effects) {
            const result = this._applySingleEffect(effect, comboData, targets, battleContext);
            results.push({
                effect,
                result
            });
        }
        
        return results;
    }
    
    /**
     * 应用单个效果
     * @param {Object} effect - 效果定义
     * @param {Object} comboData - 合击数据
     * @param {Array} targets - 目标数组
     * @param {Object} battleContext - 战斗上下文
     * @returns {Object} 应用结果
     */
    _applySingleEffect(effect, comboData, targets, battleContext) {
        const { definition, partner } = comboData;
        
        switch (effect.type) {
            case ComboEffect.DAMAGE_MULTIPLIER:
                // 伤害倍率效果
                const baseDamage = this._calculateBaseDamage(comboData.actor, battleContext);
                const finalDamage = baseDamage * effect.value;
                
                // 对每个目标应用伤害
                targets.forEach(target => {
                    target.takeDamage?.(finalDamage, 'combo');
                });
                
                return {
                    type: 'damage',
                    value: finalDamage,
                    multiplier: effect.value
                };
                
            case ComboEffect.ADDITIONAL_HITS:
                // 追加攻击次数
                const hits = effect.value;
                let totalDamage = 0;
                
                for (let i = 0; i < hits; i++) {
                    const hitDamage = this._calculateHitDamage(comboData.actor, battleContext);
                    targets.forEach(target => {
                        target.takeDamage?.(hitDamage, 'combo_hit');
                        totalDamage += hitDamage;
                    });
                }
                
                return {
                    type: 'additional_hits',
                    hits,
                    totalDamage
                };
                
            case ComboEffect.STATUS_EFFECT:
                // 状态效果
                const statusResult = {
                    type: 'status_effect',
                    effect: effect.effect,
                    chance: effect.chance || 100,
                    applied: []
                };
                
                // 检查概率
                if (Math.random() * 100 > (effect.chance || 100)) {
                    return statusResult;
                }
                
                targets.forEach(target => {
                    if (target.applyStatusEffect) {
                        const applied = target.applyStatusEffect(effect.effect, effect.duration || 2);
                        if (applied) {
                            statusResult.applied.push({
                                target: target.id,
                                effect: effect.effect,
                                duration: effect.duration
                            });
                        }
                    }
                });
                
                return statusResult;
                
            case ComboEffect.HEALING:
                // 治疗效果
                const healValue = effect.value;
                const healTargets = effect.target === 'team' ? battleContext.team : targets;
                
                healTargets.forEach(target => {
                    if (target.heal) {
                        target.heal(healValue);
                    }
                });
                
                return {
                    type: 'healing',
                    value: healValue,
                    targets: healTargets.length
                };
                
            case ComboEffect.SHIELD:
                // 护盾效果
                const shieldValue = effect.value;
                const shieldTargets = effect.target === 'team' ? battleContext.team : targets;
                
                shieldTargets.forEach(target => {
                    if (target.applyShield) {
                        target.applyShield(shieldValue, effect.duration || 3);
                    }
                });
                
                return {
                    type: 'shield',
                    value: shieldValue,
                    duration: effect.duration,
                    targets: shieldTargets.length
                };
                
            case ComboEffect.STAT_BUFF:
                // 属性增益
                const buffResult = {
                    type: 'stat_buff',
                    stat: effect.stat,
                    value: effect.value,
                    duration: effect.duration,
                    targets: []
                };
                
                const buffTargets = effect.target === 'team' ? battleContext.team : targets;
                
                buffTargets.forEach(target => {
                    if (target.applyBuff) {
                        const buffId = `${definition.id}_${effect.stat}_${Date.now()}`;
                        const applied = target.applyBuff({
                            id: buffId,
                            stat: effect.stat,
                            value: effect.value,
                            duration: effect.duration,
                            source: 'combo'
                        });
                        
                        if (applied) {
                            buffResult.targets.push(target.id);
                        }
                    }
                });
                
                return buffResult;
                
            case ComboEffect.ENERGY_REGEN:
                // 能量回复
                const regenValue = effect.value;
                if (this.teamEnergyManager) {
                    this.teamEnergyManager.addEnergy(regenValue);
                }
                
                return {
                    type: 'energy_regen',
                    value: regenValue
                };
                
            default:
                console.warn(`未知的合击效果类型: ${effect.type}`);
                return { type: 'unknown', effect };
        }
    }
    
    /**
     * 计算基础伤害
     * @param {Character} actor - 行动角色
     * @param {Object} battleContext - 战斗上下文
     * @returns {number} 基础伤害值
     */
    _calculateBaseDamage(actor, battleContext) {
        // 简化计算，实际应基于角色属性、技能倍率等
        const baseAttack = actor.attributes?.get?.('strength') || 10;
        const skillMultiplier = 1.5; // 合击技能基础倍率
        
        return baseAttack * skillMultiplier;
    }
    
    /**
     * 计算单次攻击伤害
     * @param {Character} actor - 行动角色
     * @param {Object} battleContext - 战斗上下文
     * @returns {number} 伤害值
     */
    _calculateHitDamage(actor, battleContext) {
        const baseAttack = actor.attributes?.get?.('strength') || 10;
        const hitMultiplier = 0.7; // 追加攻击倍率较低
        
        return baseAttack * hitMultiplier;
    }
    
    /**
     * 合击执行事件
     * @param {Object} comboDef - 合击定义
     * @param {Object} comboData - 合击数据
     * @param {Array} results - 效果结果
     * @param {Object} battleContext - 战斗上下文
     */
    _onComboExecuted(comboDef, comboData, results, battleContext) {
        console.log(`合击触发: ${comboDef.name} (${comboDef.id})`, {
            actors: [comboData.actor?.name, comboData.partner?.name],
            results
        });
        
        // 触发游戏事件
        if (typeof window !== 'undefined' && window.gameEvents) {
            window.gameEvents.emit('comboExecuted', {
                combo: comboDef,
                actors: [comboData.actor, comboData.partner],
                targets: battleContext.targets,
                results
            });
        }
    }
    
    /**
     * 获取当前回合数（模拟方法，实际应从战斗引擎获取）
     * @returns {number} 当前回合
     */
    _getCurrentTurn() {
        // 简化实现，实际应从战斗引擎获取
        return window.currentBattle?.turnCount || 0;
    }
    
    /**
     * 发现新合击组合
     * @param {Character} actor1 - 角色1
     * @param {Character} actor2 - 角色2
     * @param {number} battleCount - 一起战斗次数
     */
    discoverNewCombo(actor1, actor2, battleCount) {
        const comboDef = this._getComboDefinition(actor1, actor2);
        if (comboDef) {
            // 已经存在的合击
            return null;
        }
        
        // 根据战斗次数和角色类型判断是否发现新合击
        if (battleCount >= 10) {
            // 生成新的合击定义
            const newCombo = this._generateNewCombo(actor1, actor2);
            if (newCombo) {
                this.comboDefinitions[newCombo.id] = newCombo;
                this._onNewComboDiscovered(newCombo);
                return newCombo;
            }
        }
        
        return null;
    }
    
    /**
     * 生成新合击定义
     * @param {Character} actor1 - 角色1
     * @param {Character} actor2 - 角色2
     * @returns {Object|null} 新合击定义
     */
    _generateNewCombo(actor1, actor2) {
        const npcType1 = actor1.npcType || actor1.currentPathwayId;
        const npcType2 = actor2.npcType || actor2.currentPathwayId;
        
        // 根据角色类型组合生成合击
        // 这里简化实现，实际应有更复杂的生成逻辑
        const comboId = `${npcType1}_${npcType2}_combo`;
        const comboName = `${actor1.name}与${actor2.name}的默契`;
        
        return {
            id: comboId,
            name: comboName,
            description: '通过多次并肩作战培养出的默契配合',
            type: ComboSkillType.CHAIN_ATTACK,
            actors: [npcType1, npcType2],
            conditions: [
                { type: ComboCondition.FRIENDSHIP_LEVEL, value: 50 },
                { type: ComboCondition.ENERGY_COST, value: 30 }
            ],
            effects: [
                { type: ComboEffect.DAMAGE_MULTIPLIER, value: 1.5 },
                { type: ComboEffect.ADDITIONAL_HITS, value: 1 }
            ],
            cooldown: 4,
            animation: 'basic_combo'
        };
    }
    
    /**
     * 新合击发现事件
     * @param {Object} newCombo - 新合击定义
     */
    _onNewComboDiscovered(newCombo) {
        console.log(`发现新合击: ${newCombo.name}`);
        
        if (typeof window !== 'undefined' && window.gameEvents) {
            window.gameEvents.emit('comboDiscovered', {
                combo: newCombo
            });
        }
    }
    
    /**
     * 获取合击定义库
     * @returns {Object}
     */
    getComboDefinitions() {
        return this.comboDefinitions;
    }
    
    /**
     * 导出合击数据
     * @returns {Object}
     */
    toDict() {
        return {
            definitions: this.comboDefinitions,
            triggeredCombos: Array.from(this.triggeredCombos.entries())
        };
    }
    
    /**
     * 从字典导入合击数据
     * @param {Object} data - 合击数据
     */
    fromDict(data) {
        if (!data) return;
        
        if (data.definitions) {
            this.comboDefinitions = data.definitions;
        }
        
        if (data.triggeredCombos) {
            this.triggeredCombos = new Map(data.triggeredCombos);
        }
    }
}

export default ComboManager;