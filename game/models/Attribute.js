/**
 * 基础属性枚举与属性集合管理
 */

/**
 * 基础属性枚举
 */
export const Attribute = Object.freeze({
    STRENGTH: 'strength',      // 力量
    AGILITY: 'agility',        // 敏捷
    CONSTITUTION: 'constitution', // 体质
    INTELLIGENCE: 'intelligence', // 智力
    PERCEPTION: 'perception',     // 感知
    CHARISMA: 'charisma'         // 魅力
});

/**
 * 角色属性集合
 */
export class AttributeSet {
    constructor({
        strength = 10,
        agility = 10,
        constitution = 10,
        intelligence = 10,
        perception = 10,
        charisma = 10
    } = {}) {
        this.strength = strength;
        this.agility = agility;
        this.constitution = constitution;
        this.intelligence = intelligence;
        this.perception = perception;
        this.charisma = charisma;
    }

    /**
     * 获取指定属性值
     * @param {string} attr - 属性枚举值
     * @returns {number}
     */
    get(attr) {
        return this[attr.toLowerCase()];
    }

    /**
     * 设置属性值
     * @param {string} attr - 属性枚举值
     * @param {number} value - 属性值
     */
    set(attr, value) {
        this[attr.toLowerCase()] = value;
    }

    /**
     * 修改属性值（增减）
     * @param {string} attr - 属性枚举值
     * @param {number} delta - 增减值
     */
    modify(attr, delta) {
        const current = this.get(attr);
        this.set(attr, current + delta);
    }

    /**
     * 属性总和
     * @returns {number}
     */
    total() {
        return this.strength + this.agility + this.constitution +
               this.intelligence + this.perception + this.charisma;
    }

    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            strength: this.strength,
            agility: this.agility,
            constitution: this.constitution,
            intelligence: this.intelligence,
            perception: this.perception,
            charisma: this.charisma
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {AttributeSet}
     */
    static fromDict(data) {
        return new AttributeSet({
            strength: data.strength || 10,
            agility: data.agility || 10,
            constitution: data.constitution || 10,
            intelligence: data.intelligence || 10,
            perception: data.perception || 10,
            charisma: data.charisma || 10
        });
    }
}

/**
 * 出身背景枚举
 */
export const Background = Object.freeze({
    NOBLE: '贵族后裔',
    COMMONER: '平民觉醒',
    ORPHAN: '教会孤儿',
    MYSTIC: '神秘遗孤'
});