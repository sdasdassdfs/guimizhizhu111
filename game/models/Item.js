/**
 * 物品与背包数据模型
 */

/**
 * 物品类型枚举
 */
export const ItemType = Object.freeze({
    MATERIAL: '材料',     // 晋升材料
    EQUIPMENT: '装备',    // 武器装备
    CONSUMABLE: '消耗品', // 药剂等
    KEY_ITEM: '关键物品', // 任务物品
    SPECIAL: '特殊物品'   // 非凡特性等
});

/**
 * 装备部位枚举
 */
export const EquipmentSlot = Object.freeze({
    WEAPON: '武器',
    ARMOR: '护甲',
    HELMET: '头盔',
    ACCESSORY: '饰品'
});

/**
 * 物品数据类
 */
export class Item {
    constructor({
        id = '',
        name = '',
        type = ItemType.MATERIAL,
        description = '',
        quantity = 1,
        maxStack = 99,
        value = 0,
        weight = 0.0,
        usable = false,
        equipmentSlot = null,
        attackBonus = 0,
        defenseBonus = 0,
        attributeBonuses = {},
        requiredPathway = null,
        requiredSequence = 0,
        consumableEffects = {}
    } = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description;
        this.quantity = quantity;
        this.maxStack = maxStack;
        this.value = value;
        this.weight = weight;
        this.usable = usable;
        this.equipmentSlot = equipmentSlot;
        this.attackBonus = attackBonus;
        this.defenseBonus = defenseBonus;
        this.attributeBonuses = attributeBonuses;
        this.requiredPathway = requiredPathway;
        this.requiredSequence = requiredSequence;
        this.consumableEffects = consumableEffects;

        // 确保类型为正确的枚举值
        this._normalizeEnums();
    }

    /**
     * 规范化枚举值
     */
    _normalizeEnums() {
        // 如果type是字符串，确保它在ItemType中
        if (typeof this.type === 'string') {
            const found = Object.values(ItemType).find(value => value === this.type);
            if (!found) {
                this.type = ItemType.MATERIAL;
            }
        }
        
        // 如果equipmentSlot是字符串，确保它在EquipmentSlot中
        if (this.equipmentSlot && typeof this.equipmentSlot === 'string') {
            const found = Object.values(EquipmentSlot).find(value => value === this.equipmentSlot);
            if (found) {
                this.equipmentSlot = found;
            } else {
                this.equipmentSlot = null;
            }
        }
    }

    /**
     * 检查是否能与另一物品堆叠
     * @param {Item} other - 另一物品对象
     * @returns {boolean}
     */
    canStackWith(other) {
        return (this.id === other.id && 
                this.type === other.type && 
                this.maxStack > 1);
    }

    /**
     * 尝试堆叠物品（成功返回true）
     * @param {Item} other - 另一物品对象
     * @returns {boolean}
     */
    stack(other) {
        if (!this.canStackWith(other)) {
            return false;
        }

        const total = this.quantity + other.quantity;
        if (total <= this.maxStack) {
            this.quantity = total;
            return true;
        } else {
            // 只能部分堆叠
            const stackable = this.maxStack - this.quantity;
            this.quantity = this.maxStack;
            other.quantity = total - this.maxStack;
            return true;
        }
    }

    /**
     * 分裂物品，返回新物品对象（原物品数量减少）
     * @param {number} amount - 分裂数量
     * @returns {Item|null}
     */
    split(amount) {
        if (amount <= 0 || amount >= this.quantity) {
            return null;
        }

        // 创建新物品副本
        const newItem = new Item({
            id: this.id,
            name: this.name,
            type: this.type,
            description: this.description,
            quantity: amount,
            maxStack: this.maxStack,
            value: this.value,
            weight: this.weight,
            usable: this.usable,
            equipmentSlot: this.equipmentSlot,
            attackBonus: this.attackBonus,
            defenseBonus: this.defenseBonus,
            attributeBonuses: { ...this.attributeBonuses },
            requiredPathway: this.requiredPathway,
            requiredSequence: this.requiredSequence,
            consumableEffects: { ...this.consumableEffects }
        });

        // 减少原物品数量
        this.quantity -= amount;

        return newItem;
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
            quantity: this.quantity,
            maxStack: this.maxStack,
            value: this.value,
            weight: this.weight,
            usable: this.usable,
            equipmentSlot: this.equipmentSlot,
            attackBonus: this.attackBonus,
            defenseBonus: this.defenseBonus,
            attributeBonuses: this.attributeBonuses,
            requiredPathway: this.requiredPathway,
            requiredSequence: this.requiredSequence,
            consumableEffects: this.consumableEffects
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {Item}
     */
    static fromDict(data) {
        // 解析枚举
        let itemType = ItemType.MATERIAL;
        const typeStr = data.type || '材料';
        Object.values(ItemType).forEach(value => {
            if (value === typeStr) {
                itemType = value;
            }
        });

        let eqSlot = null;
        if (data.equipmentSlot) {
            Object.values(EquipmentSlot).forEach(value => {
                if (value === data.equipmentSlot) {
                    eqSlot = value;
                }
            });
        }

        return new Item({
            id: data.id || '',
            name: data.name || '未知',
            type: itemType,
            description: data.description || '',
            quantity: data.quantity || 1,
            maxStack: data.maxStack || 99,
            value: data.value || 0,
            weight: data.weight || 0.0,
            usable: data.usable || false,
            equipmentSlot: eqSlot,
            attackBonus: data.attackBonus || 0,
            defenseBonus: data.defenseBonus || 0,
            attributeBonuses: data.attributeBonuses || {},
            requiredPathway: data.requiredPathway,
            requiredSequence: data.requiredSequence || 0,
            consumableEffects: data.consumableEffects || {}
        });
    }
}

/**
 * 背包/库存管理类
 */
export class Inventory {
    constructor({
        items = {},
        gold = 0,
        capacity = 100,
        usedCapacity = 0
    } = {}) {
        this.items = items;           // 物品ID -> Item对象
        this.gold = gold;
        this.capacity = capacity;     // 总容量（格子数）
        this.usedCapacity = usedCapacity;
    }

    /**
     * 生成唯一的物品键
     * @param {Item} item - 物品对象
     * @returns {string}
     */
    _generateItemKey(item) {
        return `${item.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 添加物品到背包
     * @param {Item} item - 物品对象
     * @param {number} quantity - 数量，默认为1
     * @returns {boolean} 是否成功添加
     */
    addItem(item, quantity = 1) {
        if (quantity <= 0) {
            return false;
        }

        // 检查是否有相同物品可堆叠
        const existingKey = Object.keys(this.items).find(key => {
            const existingItem = this.items[key];
            return existingItem.id === item.id && existingItem.canStackWith(item);
        });

        if (existingKey) {
            const existing = this.items[existingKey];
            const totalQuantity = existing.quantity + quantity;

            if (totalQuantity <= existing.maxStack) {
                existing.quantity = totalQuantity;
                return true;
            } else {
                // 需要占用新格子
                const stackable = existing.maxStack - existing.quantity;
                existing.quantity = existing.maxStack;
                const remaining = quantity - stackable;

                // 创建新物品对象（如果需要）
                if (remaining > 0) {
                    const newItem = new Item({
                        id: item.id,
                        name: item.name,
                        type: item.type,
                        description: item.description,
                        quantity: remaining,
                        maxStack: item.maxStack,
                        value: item.value,
                        weight: item.weight,
                        usable: item.usable,
                        equipmentSlot: item.equipmentSlot,
                        attackBonus: item.attackBonus,
                        defenseBonus: item.defenseBonus,
                        attributeBonuses: { ...item.attributeBonuses },
                        requiredPathway: item.requiredPathway,
                        requiredSequence: item.requiredSequence,
                        consumableEffects: { ...item.consumableEffects }
                    });

                    const newKey = this._generateItemKey(newItem);
                    this.items[newKey] = newItem;
                    this.usedCapacity += 1;
                }

                return true;
            }
        } else {
            // 新物品类型
            if (this.usedCapacity >= this.capacity) {
                return false;
            }

            const newItem = new Item({
                id: item.id,
                name: item.name,
                type: item.type,
                description: item.description,
                quantity: quantity,
                maxStack: item.maxStack,
                value: item.value,
                weight: item.weight,
                usable: item.usable,
                equipmentSlot: item.equipmentSlot,
                attackBonus: item.attackBonus,
                defenseBonus: item.defenseBonus,
                attributeBonuses: { ...item.attributeBonuses },
                requiredPathway: item.requiredPathway,
                requiredSequence: item.requiredSequence,
                consumableEffects: { ...item.consumableEffects }
            });

            const newKey = this._generateItemKey(newItem);
            this.items[newKey] = newItem;
            this.usedCapacity += 1;
            return true;
        }
    }

    /**
     * 从背包移除物品
     * @param {string} itemKey - 物品键（不是物品ID）
     * @param {number} quantity - 移除数量，默认为1
     * @returns {boolean} 是否成功移除
     */
    removeItem(itemKey, quantity = 1) {
        if (!(itemKey in this.items)) {
            return false;
        }

        const item = this.items[itemKey];
        if (item.quantity < quantity) {
            return false;
        }

        item.quantity -= quantity;
        if (item.quantity <= 0) {
            delete this.items[itemKey];
            this.usedCapacity -= 1;
        }

        return true;
    }

    /**
     * 获取指定物品（通过物品键）
     * @param {string} itemKey - 物品键
     * @returns {Item|null}
     */
    getItem(itemKey) {
        return this.items[itemKey] || null;
    }

    /**
     * 获取所有物品列表
     * @returns {Item[]}
     */
    getAllItems() {
        return Object.values(this.items);
    }

    /**
     * 通过物品ID查找物品（返回第一个匹配的）
     * @param {string} itemId - 物品ID
     * @returns {Item|null}
     */
    findItemById(itemId) {
        const itemKey = Object.keys(this.items).find(key => {
            const item = this.items[key];
            return item.id === itemId;
        });

        return itemKey ? this.items[itemKey] : null;
    }

    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            items: Object.fromEntries(
                Object.entries(this.items).map(([k, v]) => [k, v.toDict()])
            ),
            gold: this.gold,
            capacity: this.capacity,
            usedCapacity: this.usedCapacity
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {Inventory}
     */
    static fromDict(data) {
        const inv = new Inventory({
            gold: data.gold || 0,
            capacity: data.capacity || 100,
            usedCapacity: data.usedCapacity || 0
        });

        const items = {};
        if (data.items) {
            Object.entries(data.items).forEach(([k, v]) => {
                items[k] = Item.fromDict(v);
            });
        }

        inv.items = items;
        return inv;
    }
}