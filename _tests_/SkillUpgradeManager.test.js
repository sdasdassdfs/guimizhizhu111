import { SkillUpgradeManager, SkillUpgradePath } from '../game/managers/SkillUpgradeManager.js';

describe('SkillUpgradePath', () => {
    test('应该正确创建技能升级路径', () => {
        const upgrade = new SkillUpgradePath({
            id: 'test_upgrade',
            name: '测试升级',
            description: '这是一个测试升级',
            unlockLevel: 3,
            requiredTalents: ['talent1', 'talent2'],
            requiredItems: [
                { itemId: 'crystal', quantity: 2 }
            ],
            modifications: [
                { type: 'damage', operation: 'multiply', value: 1.5 }
            ],
            upgradeCost: {
                gold: 500,
                materials: [
                    { itemId: 'crystal', quantity: 2 }
                ],
                requiredSkillLevel: 3
            }
        });
        
        expect(upgrade.id).toBe('test_upgrade');
        expect(upgrade.name).toBe('测试升级');
        expect(upgrade.unlockLevel).toBe(3);
        expect(upgrade.requiredTalents).toEqual(['talent1', 'talent2']);
        expect(upgrade.upgradeCost.gold).toBe(500);
    });
    
    test('应该正确检查升级条件', () => {
        const upgrade = new SkillUpgradePath({
            unlockLevel: 3,
            requiredTalents: ['talent1'],
            upgradeCost: {
                gold: 500,
                materials: [
                    { itemId: 'crystal', quantity: 2 }
                ]
            }
        });
        
        const skill = { id: 'fireball', level: 5 };
        const character = {
            unlockedTalents: ['talent1', 'talent2'],
            inventory: {
                hasItem: (itemId, quantity) => itemId === 'crystal' && quantity <= 2
            },
            gold: 1000
        };
        
        const result = upgrade.checkUpgradeConditions(skill, character);
        expect(result.canUpgrade).toBe(true);
        
        // 测试技能等级不足
        skill.level = 2;
        const result2 = upgrade.checkUpgradeConditions(skill, character);
        expect(result2.canUpgrade).toBe(false);
        expect(result2.reasons).toContain('需要技能等级 3');
        
        // 重置技能等级
        skill.level = 5;
        
        // 测试天赋不足
        character.unlockedTalents = [];
        const result3 = upgrade.checkUpgradeConditions(skill, character);
        expect(result3.canUpgrade).toBe(false);
        expect(result3.reasons).toContain('需要天赋: talent1');
        
        // 重置天赋
        character.unlockedTalents = ['talent1'];
        
        // 测试物品不足
        character.inventory.hasItem = () => false;
        const result4 = upgrade.checkUpgradeConditions(skill, character);
        expect(result4.canUpgrade).toBe(false);
        expect(result4.reasons).toContain('需要物品: crystal ×2');
        
        // 重置物品
        character.inventory.hasItem = (itemId, quantity) => itemId === 'crystal' && quantity <= 2;
        
        // 测试金币不足
        character.gold = 100;
        const result5 = upgrade.checkUpgradeConditions(skill, character);
        expect(result5.canUpgrade).toBe(false);
        expect(result5.reasons).toContain('需要金币: 500');
    });
    
    test('应该正确转换为字典', () => {
        const upgrade = new SkillUpgradePath({
            id: 'test_upgrade',
            name: '测试升级'
        });
        
        const dict = upgrade.toDict();
        expect(dict.id).toBe('test_upgrade');
        expect(dict.name).toBe('测试升级');
    });
    
    test('应该从字典正确创建', () => {
        const data = {
            id: 'test_upgrade',
            name: '测试升级'
        };
        
        const upgrade = SkillUpgradePath.fromDict(data);
        expect(upgrade).toBeInstanceOf(SkillUpgradePath);
        expect(upgrade.id).toBe('test_upgrade');
    });
});

describe('SkillUpgradeManager', () => {
    let manager;
    let mockGameState;
    
    beforeEach(() => {
        mockGameState = {};
        manager = new SkillUpgradeManager(mockGameState);
    });
    
    test('应该正确初始化默认升级路径', () => {
        const paths = manager.getUpgradePaths('fire_control');
        expect(paths).toHaveLength(2);
        expect(paths[0].name).toBe('爆裂火焰');
        expect(paths[1].name).toBe('持续灼烧');
    });
    
    test('应该正确注册升级路径', () => {
        const upgrade = new SkillUpgradePath({
            id: 'custom_upgrade',
            name: '自定义升级'
        });
        
        manager.registerUpgradePath('custom_skill', upgrade);
        const paths = manager.getUpgradePaths('custom_skill');
        expect(paths).toHaveLength(1);
        expect(paths[0].id).toBe('custom_upgrade');
    });
    
    test('应该正确获取可用升级', () => {
        const skill = { 
            id: 'fire_control',
            level: 5,
            damageMultiplier: 1.0
        };
        
        const character = {
            unlockedTalents: ['talent_element_master'],
            inventory: {
                hasItem: (itemId, quantity) => itemId === 'dark_crystal' && quantity <= 3
            },
            gold: 1000
        };
        
        const available = manager.getAvailableUpgrades(skill, character);
        expect(available).toHaveLength(1);
        expect(available[0].id).toBe('fire_control_explosion');
        
        // 测试天赋不满足
        character.unlockedTalents = [];
        const available2 = manager.getAvailableUpgrades(skill, character);
        expect(available2).toHaveLength(0);
    });
    
    test('应该正确应用升级', () => {
        const skill = { 
            id: 'fire_control',
            level: 5,
            damageMultiplier: 1.0,
            cooldown: 3,
            additionalEffects: []
        };
        
        const character = {
            unlockedTalents: ['talent_element_master'],
            inventory: {
                removeItem: (itemId, quantity) => itemId === 'dark_crystal' && quantity === 3
            },
            gold: 1000
        };
        
        const result = manager.applyUpgrade(skill, 'fire_control_explosion', character);
        
        expect(result.success).toBe(true);
        expect(result.updatedSkill.damageMultiplier).toBe(1.5); // 乘以1.5
        expect(result.updatedSkill.additionalEffects).toContain('area_splash');
        expect(result.updatedSkill.currentUpgrade).toBe('fire_control_explosion');
        
        // 测试金币减少
        // 注意：实际测试中需要跟踪character.gold的变化
        // 这里简化处理
    });
    
    test('应该正确处理升级失败', () => {
        const skill = { 
            id: 'fire_control',
            level: 2, // 等级不足
            damageMultiplier: 1.0
        };
        
        const character = {
            unlockedTalents: ['talent_element_master'],
            inventory: {
                hasItem: () => true
            },
            gold: 1000
        };
        
        const result = manager.applyUpgrade(skill, 'fire_control_explosion', character);
        expect(result.success).toBe(false);
        expect(result.reasons).toContain('需要技能等级 3');
    });
    
    test('应该正确加载配置', () => {
        const configData = [
            {
                skillId: 'lightning_bolt',
                id: 'lightning_upgrade',
                name: '闪电强化'
            }
        ];
        
        manager.loadConfig(configData);
        const paths = manager.getUpgradePaths('lightning_bolt');
        expect(paths).toHaveLength(1);
        expect(paths[0].name).toBe('闪电强化');
    });
    
    test('应该正确获取升级效果描述', () => {
        const skill = { 
            id: 'fire_control',
            level: 5,
            damageMultiplier: 1.0,
            description: '基础火焰操控',
            currentUpgrade: 'fire_control_explosion'
        };
        
        const description = manager.getUpgradeEffectDescription(skill);
        expect(description).toBe('火焰操控升级为爆裂火焰，伤害提升50%并附加范围溅射效果');
        
        // 测试无升级的情况
        skill.currentUpgrade = null;
        const description2 = manager.getUpgradeEffectDescription(skill);
        expect(description2).toBe('基础火焰操控');
    });
    
    test('应该正确重置升级', () => {
        const skill = { 
            id: 'fire_control',
            level: 5,
            damageMultiplier: 1.8,
            originalDamageMultiplier: 1.0,
            currentUpgrade: 'fire_control_explosion'
        };
        
        const resetSkill = manager.resetUpgrade(skill);
        expect(resetSkill.currentUpgrade).toBeNull();
        expect(resetSkill.damageMultiplier).toBe(1.0);
    });
    
    test('应该正确检查是否有可用升级', () => {
        const skill = { 
            id: 'fire_control',
            level: 5,
            damageMultiplier: 1.0
        };
        
        const character = {
            unlockedTalents: ['talent_element_master'],
            inventory: {
                hasItem: () => true
            },
            gold: 1000
        };
        
        const hasUpgrades = manager.hasAvailableUpgrades(skill, character);
        expect(hasUpgrades).toBe(true);
        
        // 测试无可用升级
        skill.level = 1;
        const hasUpgrades2 = manager.hasAvailableUpgrades(skill, character);
        expect(hasUpgrades2).toBe(false);
    });
    
    test('应该正确获取当前升级路径', () => {
        const skill = { 
            id: 'fire_control',
            level: 5,
            currentUpgrade: 'fire_control_explosion'
        };
        
        const upgradePath = manager.getCurrentUpgradePath(skill);
        expect(upgradePath).toBeInstanceOf(SkillUpgradePath);
        expect(upgradePath.id).toBe('fire_control_explosion');
        
        // 测试无当前升级
        skill.currentUpgrade = null;
        const upgradePath2 = manager.getCurrentUpgradePath(skill);
        expect(upgradePath2).toBeNull();
    });
    
    test('应该正确处理修改应用', () => {
        const skill = {
            id: 'test_skill',
            damageMultiplier: 2.0,
            cooldown: 5,
            range: 10,
            manaCost: 50,
            effect: 'basic',
            maxTargets: 1
        };
        
        const modifications = [
            { type: 'damage', operation: 'multiply', value: 1.5 },
            { type: 'cooldown', operation: 'add', value: -1 },
            { type: 'range', operation: 'replace', value: 15 },
            { type: 'targetCount', operation: 'add', value: 2 }
        ];
        
        const updatedSkill = manager._applyModifications(skill, modifications);
        
        expect(updatedSkill.damageMultiplier).toBe(3.0); // 2.0 * 1.5
        expect(updatedSkill.cooldown).toBe(4); // 5 + (-1)
        expect(updatedSkill.range).toBe(15); // 替换为15
        expect(updatedSkill.maxTargets).toBe(3); // 1 + 2
    });
});