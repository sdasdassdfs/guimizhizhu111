/**
 * 收集品数据模型
 */

/**
 * 收集品类型枚举
 */
export const CollectibleType = Object.freeze({
    FEATURE: 'feature',      // 非凡特性
    MATERIAL: 'material',    // 材料
    RELIC: 'relic'          // 遗物
});

/**
 * 收集品稀有度枚举
 */
export const CollectibleRarity = Object.freeze({
    COMMON: 'common',       // 普通
    UNCOMMON: 'uncommon',   // 罕见
    RARE: 'rare',           // 稀有
    EPIC: 'epic',           // 史诗
    LEGENDARY: 'legendary'  // 传说
});

/**
 * 收集品数据类
 */
export class Collectible {
    constructor({
        id,
        name,
        description,
        type = CollectibleType.MATERIAL,
        rarity = CollectibleRarity.COMMON,
        icon = '📦',
        source = '',           // 来源描述（如"牧羊人掉落"）
        value = 0,             // 价值（金币）
        stackable = true,      // 是否可堆叠
        maxStack = 99,         // 最大堆叠数
        effect = null,         // 使用效果（如有）
        flavorText = '',       // 背景描述文本
        obtained = false,      // 是否已获得
        count = 0              // 当前数量（对于可堆叠物品）
    } = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type;
        this.rarity = rarity;
        this.icon = icon;
        this.source = source;
        this.value = value;
        this.stackable = stackable;
        this.maxStack = maxStack;
        this.effect = effect;
        this.flavorText = flavorText;
        this.obtained = obtained;
        this.count = count;
    }

    /**
     * 获得物品
     */
    obtain(quantity = 1) {
        if (this.stackable) {
            this.count += quantity;
            if (this.count > this.maxStack) {
                this.count = this.maxStack;
            }
        } else {
            this.count = 1;
        }
        this.obtained = true;
    }

    /**
     * 使用物品
     */
    use(quantity = 1) {
        if (!this.obtained || this.count < quantity) {
            return false;
        }
        this.count -= quantity;
        if (this.count <= 0) {
            this.count = 0;
            this.obtained = false;
        }
        return true;
    }

    /**
     * 转换为字典（用于序列化）
     */
    toDict() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            rarity: this.rarity,
            icon: this.icon,
            source: this.source,
            value: this.value,
            stackable: this.stackable,
            maxStack: this.maxStack,
            effect: this.effect,
            flavorText: this.flavorText,
            obtained: this.obtained,
            count: this.count
        };
    }

    /**
     * 从字典创建
     */
    static fromDict(data) {
        const collectible = new Collectible({
            id: data.id,
            name: data.name,
            description: data.description,
            type: data.type,
            rarity: data.rarity,
            icon: data.icon,
            source: data.source,
            value: data.value,
            stackable: data.stackable,
            maxStack: data.maxStack,
            effect: data.effect,
            flavorText: data.flavorText
        });
        collectible.obtained = data.obtained;
        collectible.count = data.count;
        return collectible;
    }
}

/**
 * 预定义收集品数据
 */

// 非凡特性
export const FEATURE_SEQUENCE_5 = new Collectible({
    id: 'feature_sequence_5',
    name: '序列5非凡特性',
    description: '序列5级别的非凡特性，蕴含强大的非凡力量，是晋升的关键材料。',
    type: CollectibleType.FEATURE,
    rarity: CollectibleRarity.EPIC,
    icon: '🌟',
    source: '高序列敌人掉落',
    value: 5000,
    stackable: true,
    maxStack: 10,
    flavorText: '非凡特性聚合定律的体现，蕴含着特定途径的力量本质。'
});

export const FEATURE_SEQUENCE_4 = new Collectible({
    id: 'feature_sequence_4',
    name: '序列4非凡特性',
    description: '序列4级别的非凡特性，蕴含半神级别的非凡力量，极为稀有。',
    type: CollectibleType.FEATURE,
    rarity: CollectibleRarity.LEGENDARY,
    icon: '✨',
    source: '半神级敌人掉落',
    value: 20000,
    stackable: true,
    maxStack: 5,
    flavorText: '半神特性的凝聚，凡人触及神性的第一步。'
});

// 材料
export const MATERIAL_DARK_CRYSTAL = new Collectible({
    id: 'material_dark_crystal',
    name: '黑暗水晶',
    description: '蕴含黑暗力量的水晶，常用于制作非凡物品或进行黑暗仪式。',
    type: CollectibleType.MATERIAL,
    rarity: CollectibleRarity.UNCOMMON,
    icon: '💎',
    source: '黑暗系敌人掉落',
    value: 150,
    stackable: true,
    maxStack: 99,
    flavorText: '从黑暗深处开采的水晶，表面似乎有阴影在流动。'
});

export const MATERIAL_SILVER_WEAPON = new Collectible({
    id: 'material_silver_weapon',
    name: '银质武器',
    description: '镀银的武器，对灵体、吸血鬼等黑暗生物有额外伤害。',
    type: CollectibleType.MATERIAL,
    rarity: CollectibleRarity.RARE,
    icon: '⚔️',
    source: '宝箱或任务奖励',
    value: 800,
    stackable: false,
    maxStack: 1,
    flavorText: '银质对许多黑暗生物有天然的克制作用。'
});

// 遗物
export const RELIC_JUDGMENT_SCROLL = new Collectible({
    id: 'relic_judgment_scroll',
    name: '审判卷轴',
    description: '记载着古代审判途径力量的卷轴，使用后可对敌人施加神圣审判效果。',
    type: CollectibleType.RELIC,
    rarity: CollectibleRarity.EPIC,
    icon: '📜',
    source: '完成审判途径任务',
    value: 3000,
    stackable: false,
    maxStack: 1,
    effect: '对单个敌人造成神圣伤害并附加审判标记',
    flavorText: '卷轴上用金色墨水书写着古老的律法条文，散发出神圣的气息。'
});

export const RELIC_SEER_EYE = new Collectible({
    id: 'relic_seer_eye',
    name: '先知之眼',
    description: '据说是古代先知遗留的非凡物品，使用后可预知接下来3回合的敌人行动。',
    type: CollectibleType.RELIC,
    rarity: CollectibleRarity.LEGENDARY,
    icon: '👁️',
    source: '隐藏任务或稀有事件',
    value: 10000,
    stackable: false,
    maxStack: 1,
    effect: '预知未来3回合的战斗发展',
    flavorText: '这颗眼睛似乎永远在注视着过去、现在和未来。'
});

/**
 * 收集品数据映射
 */
export const CollectibleData = {
    'feature_sequence_5': FEATURE_SEQUENCE_5,
    'feature_sequence_4': FEATURE_SEQUENCE_4,
    'material_dark_crystal': MATERIAL_DARK_CRYSTAL,
    'material_silver_weapon': MATERIAL_SILVER_WEAPON,
    'relic_judgment_scroll': RELIC_JUDGMENT_SCROLL,
    'relic_seer_eye': RELIC_SEER_EYE
};