/**
 * 状态效果数据模型
 */

/**
 * 状态效果类型枚举
 */
export const StatusEffectType = Object.freeze({
    BUFF: 'buff',
    DEBUFF: 'debuff',
    DOT: 'dot', // 持续伤害
    HOT: 'hot', // 持续治疗
    CONTROL: 'control',
    SPECIAL: 'special'
});

/**
 * 状态效果触发时机枚举
 */
export const StatusTrigger = Object.freeze({
    TURN_START: 'turn_start',
    TURN_END: 'turn_end',
    BEFORE_ACTION: 'before_action',
    AFTER_ACTION: 'after_action',
    ON_DAMAGE: 'on_damage',
    ON_HEAL: 'on_heal',
    ON_DEATH: 'on_death'
});

/**
 * 状态效果数据类
 */
export class StatusEffect {
    constructor({
        id,
        name,
        description,
        type = StatusEffectType.DEBUFF,
        icon = '❓',
        maxStacks = 1,
        durationTurns = 3,
        triggers = [],
        onApply = null,
        onRemove = null,
        onTrigger = null,
        data = {}
    } = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type;
        this.icon = icon;
        this.maxStacks = maxStacks;
        this.durationTurns = durationTurns;
        this.remainingTurns = durationTurns;
        this.stacks = 1;
        this.triggers = triggers;
        this.onApply = onApply;
        this.onRemove = onRemove;
        this.onTrigger = onTrigger;
        this.data = data;
    }

    /**
     * 每回合递减
     */
    decreaseTurn() {
        if (this.remainingTurns > 0) {
            this.remainingTurns--;
        }
        return this.remainingTurns;
    }

    /**
     * 是否已过期
     */
    isExpired() {
        return this.remainingTurns <= 0;
    }

    /**
     * 添加堆叠层数
     */
    addStack(count = 1) {
        this.stacks = Math.min(this.maxStacks, this.stacks + count);
        this.remainingTurns = this.durationTurns; // 刷新持续时间
    }

    /**
     * 转换为字典
     */
    toDict() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            icon: this.icon,
            maxStacks: this.maxStacks,
            durationTurns: this.durationTurns,
            remainingTurns: this.remainingTurns,
            stacks: this.stacks,
            data: this.data
        };
    }

    /**
     * 从字典创建
     */
    static fromDict(data) {
        const effect = new StatusEffect({
            id: data.id,
            name: data.name,
            type: data.type,
            icon: data.icon,
            maxStacks: data.maxStacks,
            durationTurns: data.durationTurns,
            data: data.data
        });
        effect.remainingTurns = data.remainingTurns;
        effect.stacks = data.stacks;
        return effect;
    }
}

/**
 * 预定义状态效果
 */

// 疯狂状态
export const INSANITY = new StatusEffect({
    id: 'status_insanity',
    name: '疯狂',
    description: '理智崩溃，陷入疯狂。每回合开始时受到理智伤害，行动有概率失败或攻击随机目标。',
    type: StatusEffectType.DEBUFF,
    icon: '🤪',
    durationTurns: 3,
    triggers: [StatusTrigger.TURN_START],
    data: {
        sanityDamagePerTurn: 15,
        actionFailChance: 0.4,
        randomTargetChance: 0.6
    }
});

// 污染状态
export const CORRUPTION = new StatusEffect({
    id: 'status_corruption',
    name: '污染',
    description: '被非凡力量污染，身体和精神持续腐化。每回合受到暗影伤害，治疗效果减半，且污染会传播给相邻队友。',
    type: StatusEffectType.DEBUFF,
    icon: '☣️',
    durationTurns: 5,
    triggers: [StatusTrigger.TURN_END, StatusTrigger.ON_HEAL],
    data: {
        shadowDamagePerTurn: 25,
        healReduction: 0.5,
        spreadChance: 0.2
    }
});

// 神性侵蚀状态
export const DIVINE_EROSION = new StatusEffect({
    id: 'status_divine_erosion',
    name: '神性侵蚀',
    description: '被神性力量侵蚀，逐渐失去自我。每回合最大生命值降低，防御力下降，且无法被治疗。',
    type: StatusEffectType.DEBUFF,
    icon: '👁️',
    durationTurns: 4,
    triggers: [StatusTrigger.TURN_START, StatusTrigger.ON_HEAL],
    data: {
        maxHealthReductionPerTurn: 0.1, // 每回合降低10%最大生命值
        defenseReduction: 0.3,
        cannotBeHealed: true
    }
});

/**
 * 状态效果管理器
 */
export class StatusEffectManager {
    constructor() {
        this.effects = new Map();
    }

    /**
     * 添加状态效果
     */
    addEffect(effect, targetId) {
        if (!this.effects.has(targetId)) {
            this.effects.set(targetId, []);
        }
        const targetEffects = this.effects.get(targetId);
        
        // 检查是否已有相同效果
        const existingIndex = targetEffects.findIndex(e => e.id === effect.id);
        if (existingIndex >= 0) {
            // 刷新持续时间并堆叠
            targetEffects[existingIndex].addStack();
        } else {
            // 添加新效果
            const newEffect = new StatusEffect({ ...effect });
            targetEffects.push(newEffect);
        }
    }

    /**
     * 移除状态效果
     */
    removeEffect(effectId, targetId) {
        if (this.effects.has(targetId)) {
            const targetEffects = this.effects.get(targetId);
            const filtered = targetEffects.filter(e => e.id !== effectId);
            this.effects.set(targetId, filtered);
        }
    }

    /**
     * 触发状态效果
     */
    triggerEffects(trigger, targetId, context = {}) {
        if (!this.effects.has(targetId)) return [];
        
        const targetEffects = this.effects.get(targetId);
        const results = [];
        
        for (const effect of targetEffects) {
            if (effect.triggers.includes(trigger) && effect.onTrigger) {
                const result = effect.onTrigger({ ...context, targetId, effect });
                results.push(result);
            }
        }
        
        return results;
    }

    /**
     * 更新所有状态（回合结束）
     */
    updateTurn() {
        for (const [targetId, effects] of this.effects.entries()) {
            const remaining = [];
            for (const effect of effects) {
                effect.decreaseTurn();
                if (!effect.isExpired()) {
                    remaining.push(effect);
                }
            }
            this.effects.set(targetId, remaining);
        }
    }
}