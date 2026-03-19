/**
 * 技能升级管理器
 */

/**
 * 技能升级路径类
 */
export class SkillUpgradePath {
    constructor({
        id = '',
        name = '',
        description = '',
        unlockLevel = 1,
        requiredTalents = [],
        requiredItems = [],
        modifications = [],
        upgradeCost = {
            gold: 0,
            materials: [],
            requiredSkillLevel: 1
        }
    } = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.unlockLevel = unlockLevel;
        this.requiredTalents = requiredTalents;
        this.requiredItems = requiredItems;
        this.modifications = modifications;
        this.upgradeCost = upgradeCost;
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
            unlockLevel: this.unlockLevel,
            requiredTalents: this.requiredTalents,
            requiredItems: this.requiredItems,
            modifications: this.modifications,
            upgradeCost: this.upgradeCost
        };
    }
    
    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {SkillUpgradePath}
     */
    static fromDict(data) {
        return new SkillUpgradePath(data);
    }
    
    /**
     * 检查升级条件是否满足
     * @param {Object} skill - 技能对象
     * @param {Object} character - 角色对象
     * @returns {Object} {canUpgrade: boolean, reasons: string[]}
     */
    checkUpgradeConditions(skill, character) {
        const reasons = [];
        
        // 检查技能等级
        if (skill.level < this.unlockLevel) {
            reasons.push(`需要技能等级 ${this.unlockLevel}`);
        }
        
        // 检查所需天赋
        if (this.requiredTalents && this.requiredTalents.length > 0) {
            const missingTalents = this.requiredTalents.filter(talentId =>
                !character.unlockedTalents || !character.unlockedTalents.includes(talentId)
            );
            if (missingTalents.length > 0) {
                reasons.push(`需要天赋: ${missingTalents.join(', ')}`);
            }
        }
        
        // 检查所需物品
        if (this.upgradeCost.materials && this.upgradeCost.materials.length > 0) {
            for (const material of this.upgradeCost.materials) {
                if (!character.inventory || 
                    !character.inventory.hasItem(material.itemId, material.quantity)) {
                    reasons.push(`需要物品: ${material.itemId} ×${material.quantity}`);
                }
            }
        }
        
        // 检查金币
        if (character.gold < this.upgradeCost.gold) {
            reasons.push(`需要金币: ${this.upgradeCost.gold}`);
        }
        
        const canUpgrade = reasons.length === 0;
        return { canUpgrade, reasons };
    }
}

/**
 * 技能升级管理器类
 */
export class SkillUpgradeManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.upgradeRegistry = new Map(); // skillId -> SkillUpgradePath[]
        this._initializeDefaultUpgrades();
    }
    
    /**
     * 初始化默认技能升级路径
     */
    _initializeDefaultUpgrades() {
        // 火焰操控技能升级路径示例
        this.registerUpgradePath('fire_control', new SkillUpgradePath({
            id: 'fire_control_explosion',
            name: '爆裂火焰',
            description: '火焰操控升级为爆裂火焰，伤害提升50%并附加范围溅射效果',
            unlockLevel: 3,
            requiredTalents: ['talent_element_master'],
            requiredItems: [
                { itemId: 'dark_crystal', quantity: 3 }
            ],
            modifications: [
                {
                    type: 'damage',
                    operation: 'multiply',
                    value: 1.5
                },
                {
                    type: 'effect',
                    operation: 'add',
                    value: 'area_splash'
                }
            ],
            upgradeCost: {
                gold: 500,
                materials: [
                    { itemId: 'dark_crystal', quantity: 3 }
                ],
                requiredSkillLevel: 3
            }
        }));
        
        this.registerUpgradePath('fire_control', new SkillUpgradePath({
            id: 'fire_control_burn',
            name: '持续灼烧',
            description: '火焰操控升级为持续灼烧，附加3回合DOT效果，每回合造成30%伤害',
            unlockLevel: 3,
            requiredTalents: ['talent_torture'],
            requiredItems: [
                { itemId: 'flame_core', quantity: 1 }
            ],
            modifications: [
                {
                    type: 'effect',
                    operation: 'add',
                    value: 'burn_dot_3turns'
                }
            ],
            upgradeCost: {
                gold: 300,
                materials: [
                    { itemId: 'flame_core', quantity: 1 }
                ],
                requiredSkillLevel: 3
            }
        }));
        
        // 灵性之墙技能升级路径示例
        this.registerUpgradePath('spirit_wall', new SkillUpgradePath({
            id: 'spirit_wall_reflect',
            name: '灵性反射',
            description: '灵性之墙升级为灵性反射，受到攻击时反射20%伤害',
            unlockLevel: 5,
            requiredTalents: ['talent_defense_master'],
            requiredItems: [
                { itemId: 'spirit_crystal', quantity: 2 }
            ],
            modifications: [
                {
                    type: 'effect',
                    operation: 'add',
                    value: 'damage_reflect_20'
                }
            ],
            upgradeCost: {
                gold: 800,
                materials: [
                    { itemId: 'spirit_crystal', quantity: 2 }
                ],
                requiredSkillLevel: 5
            }
        }));
    }
    
    /**
     * 注册技能升级路径
     * @param {string} skillId - 技能ID
     * @param {SkillUpgradePath} upgradePath - 升级路径对象
     */
    registerUpgradePath(skillId, upgradePath) {
        if (!this.upgradeRegistry.has(skillId)) {
            this.upgradeRegistry.set(skillId, []);
        }
        this.upgradeRegistry.get(skillId).push(upgradePath);
    }
    
    /**
     * 获取技能的所有升级路径
     * @param {string} skillId - 技能ID
     * @returns {SkillUpgradePath[]}
     */
    getUpgradePaths(skillId) {
        return this.upgradeRegistry.get(skillId) || [];
    }
    
    /**
     * 获取技能可用的升级分支
     * @param {Object} skill - 技能对象
     * @param {Object} character - 角色对象
     * @returns {SkillUpgradePath[]} 可用的升级路径数组
     */
    getAvailableUpgrades(skill, character) {
        const allPaths = this.getUpgradePaths(skill.id);
        
        return allPaths.filter(path => {
            const checkResult = path.checkUpgradeConditions(skill, character);
            return checkResult.canUpgrade;
        });
    }
    
    /**
     * 应用技能升级
     * @param {Object} skill - 技能对象
     * @param {string} upgradeId - 升级路径ID
     * @param {Object} character - 角色对象
     * @returns {Object} {success: boolean, updatedSkill: Object|null, reasons: string[]}
     */
    applyUpgrade(skill, upgradeId, character) {
        const allPaths = this.getUpgradePaths(skill.id);
        const upgradePath = allPaths.find(p => p.id === upgradeId);
        
        if (!upgradePath) {
            return {
                success: false,
                updatedSkill: null,
                reasons: [`升级路径 ${upgradeId} 不存在`]
            };
        }
        
        // 检查升级条件
        const conditionCheck = upgradePath.checkUpgradeConditions(skill, character);
        if (!conditionCheck.canUpgrade) {
            return {
                success: false,
                updatedSkill: null,
                reasons: conditionCheck.reasons
            };
        }
        
        // 消耗资源
        if (!this._consumeUpgradeResources(upgradePath, character)) {
            return {
                success: false,
                updatedSkill: null,
                reasons: ['资源消耗失败']
            };
        }
        
        // 应用修改
        const updatedSkill = this._applyModifications(skill, upgradePath.modifications);
        
        // 设置当前升级
        updatedSkill.currentUpgrade = upgradeId;
        
        return {
            success: true,
            updatedSkill: updatedSkill,
            reasons: []
        };
    }
    
    /**
     * 消耗升级所需资源
     * @param {SkillUpgradePath} upgradePath - 升级路径
     * @param {Object} character - 角色对象
     * @returns {boolean} 是否成功
     */
    _consumeUpgradeResources(upgradePath, character) {
        try {
            // 消耗金币
            if (character.gold < upgradePath.upgradeCost.gold) {
                return false;
            }
            character.gold -= upgradePath.upgradeCost.gold;
            
            // 消耗材料
            if (upgradePath.upgradeCost.materials) {
                for (const material of upgradePath.upgradeCost.materials) {
                    if (!character.inventory || 
                        !character.inventory.removeItem(material.itemId, material.quantity)) {
                        return false;
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('消耗升级资源失败:', error);
            return false;
        }
    }
    
    /**
     * 应用修改到技能
     * @param {Object} skill - 原始技能对象
     * @param {Array} modifications - 修改数组
     * @returns {Object} 更新后的技能对象
     */
    _applyModifications(skill, modifications) {
        // 创建技能副本
        const updatedSkill = JSON.parse(JSON.stringify(skill));
        
        modifications.forEach(mod => {
            switch (mod.type) {
                case 'damage':
                    if (mod.operation === 'multiply') {
                        updatedSkill.damageMultiplier *= mod.value;
                    } else if (mod.operation === 'add') {
                        updatedSkill.damageMultiplier += mod.value;
                    } else if (mod.operation === 'replace') {
                        updatedSkill.damageMultiplier = mod.value;
                    }
                    break;
                    
                case 'cooldown':
                    if (mod.operation === 'multiply') {
                        updatedSkill.cooldown *= mod.value;
                    } else if (mod.operation === 'add') {
                        updatedSkill.cooldown += mod.value;
                    } else if (mod.operation === 'replace') {
                        updatedSkill.cooldown = mod.value;
                    }
                    break;
                    
                case 'range':
                    if (mod.operation === 'multiply') {
                        updatedSkill.range *= mod.value;
                    } else if (mod.operation === 'add') {
                        updatedSkill.range += mod.value;
                    } else if (mod.operation === 'replace') {
                        updatedSkill.range = mod.value;
                    }
                    break;
                    
                case 'manaCost':
                    if (mod.operation === 'multiply') {
                        updatedSkill.manaCost *= mod.value;
                    } else if (mod.operation === 'add') {
                        updatedSkill.manaCost += mod.value;
                    } else if (mod.operation === 'replace') {
                        updatedSkill.manaCost = mod.value;
                    }
                    break;
                    
                case 'effect':
                    if (mod.operation === 'add') {
                        if (!updatedSkill.additionalEffects) {
                            updatedSkill.additionalEffects = [];
                        }
                        updatedSkill.additionalEffects.push(mod.value);
                    } else if (mod.operation === 'replace') {
                        updatedSkill.effect = mod.value;
                    }
                    break;
                    
                case 'targetCount':
                    if (mod.operation === 'add') {
                        updatedSkill.maxTargets += mod.value;
                    } else if (mod.operation === 'replace') {
                        updatedSkill.maxTargets = mod.value;
                    }
                    break;
            }
        });
        
        return updatedSkill;
    }
    
    /**
     * 加载技能升级配置
     * @param {Array} configData - 配置数据数组
     */
    loadConfig(configData) {
        configData.forEach(config => {
            const skillId = config.skillId;
            const upgradePath = SkillUpgradePath.fromDict(config);
            this.registerUpgradePath(skillId, upgradePath);
        });
    }
    
    /**
     * 获取技能升级后的效果描述
     * @param {Object} skill - 技能对象
     * @returns {string} 效果描述
     */
    getUpgradeEffectDescription(skill) {
        if (!skill.currentUpgrade) {
            return skill.description;
        }
        
        const allPaths = this.getUpgradePaths(skill.id);
        const currentPath = allPaths.find(p => p.id === skill.currentUpgrade);
        
        if (currentPath) {
            return currentPath.description;
        }
        
        return skill.description;
    }
    
    /**
     * 重置技能升级
     * @param {Object} skill - 技能对象
     * @returns {Object} 重置后的技能对象
     */
    resetUpgrade(skill) {
        const resetSkill = JSON.parse(JSON.stringify(skill));
        resetSkill.currentUpgrade = null;
        
        // 重置修改（简化处理，实际需要记录原始值）
        // 这里假设技能对象有原始属性备份
        if (skill.originalDamageMultiplier) {
            resetSkill.damageMultiplier = skill.originalDamageMultiplier;
        }
        if (skill.originalCooldown) {
            resetSkill.cooldown = skill.originalCooldown;
        }
        
        return resetSkill;
    }
    
    /**
     * 检查技能是否有可用升级
     * @param {Object} skill - 技能对象
     * @param {Object} character - 角色对象
     * @returns {boolean}
     */
    hasAvailableUpgrades(skill, character) {
        const available = this.getAvailableUpgrades(skill, character);
        return available.length > 0;
    }
    
    /**
     * 获取技能当前升级路径
     * @param {Object} skill - 技能对象
     * @returns {SkillUpgradePath|null}
     */
    getCurrentUpgradePath(skill) {
        if (!skill.currentUpgrade) {
            return null;
        }
        
        const allPaths = this.getUpgradePaths(skill.id);
        return allPaths.find(p => p.id === skill.currentUpgrade) || null;
    }
}