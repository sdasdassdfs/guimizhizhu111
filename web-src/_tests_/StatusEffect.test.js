/**
 * 状态效果单元测试
 */
import { 
    StatusEffect, 
    StatusEffectType, 
    StatusTrigger,
    INSANITY,
    CORRUPTION,
    DIVINE_EROSION,
    StatusEffectManager
} from '../game/models/StatusEffect.js';

describe('状态效果基础类', () => {
    test('创建状态效果实例', () => {
        const effect = new StatusEffect({
            id: 'test_effect',
            name: '测试效果',
            description: '这是一个测试效果',
            type: StatusEffectType.BUFF,
            icon: '✨',
            durationTurns: 3
        });
        
        expect(effect.id).toBe('test_effect');
        expect(effect.name).toBe('测试效果');
        expect(effect.type).toBe(StatusEffectType.BUFF);
        expect(effect.icon).toBe('✨');
        expect(effect.durationTurns).toBe(3);
        expect(effect.remainingTurns).toBe(3);
        expect(effect.stacks).toBe(1);
    });
    
    test('状态效果每回合递减', () => {
        const effect = new StatusEffect({
            id: 'test',
            name: '测试',
            durationTurns: 3
        });
        
        expect(effect.remainingTurns).toBe(3);
        expect(effect.decreaseTurn()).toBe(2);
        expect(effect.remainingTurns).toBe(2);
        expect(effect.decreaseTurn()).toBe(1);
        expect(effect.remainingTurns).toBe(1);
        expect(effect.decreaseTurn()).toBe(0);
        expect(effect.remainingTurns).toBe(0);
        expect(effect.isExpired()).toBe(true);
    });
    
    test('状态效果堆叠', () => {
        const effect = new StatusEffect({
            id: 'test',
            name: '测试',
            maxStacks: 3,
            durationTurns: 2
        });
        
        expect(effect.stacks).toBe(1);
        effect.addStack();
        expect(effect.stacks).toBe(2);
        effect.addStack(2);
        expect(effect.stacks).toBe(3); // 不能超过最大堆叠数
        expect(effect.remainingTurns).toBe(2); // 持续时间应刷新
    });
    
    test('转换为字典并还原', () => {
        const original = new StatusEffect({
            id: 'test_effect',
            name: '测试效果',
            type: StatusEffectType.DEBUFF,
            icon: '💀',
            maxStacks: 2,
            durationTurns: 4,
            data: { damage: 10 }
        });
        original.remainingTurns = 2;
        original.stacks = 2;
        
        const dict = original.toDict();
        expect(dict.id).toBe('test_effect');
        expect(dict.type).toBe(StatusEffectType.DEBUFF);
        expect(dict.maxStacks).toBe(2);
        expect(dict.durationTurns).toBe(4);
        expect(dict.remainingTurns).toBe(2);
        expect(dict.stacks).toBe(2);
        expect(dict.data.damage).toBe(10);
        
        const restored = StatusEffect.fromDict(dict);
        expect(restored.id).toBe('test_effect');
        expect(restored.name).toBe('测试效果');
        expect(restored.type).toBe(StatusEffectType.DEBUFF);
        expect(restored.maxStacks).toBe(2);
        expect(restored.durationTurns).toBe(4);
        expect(restored.remainingTurns).toBe(2);
        expect(restored.stacks).toBe(2);
        expect(restored.data.damage).toBe(10);
    });
});

describe('预定义状态效果', () => {
    test('疯狂状态配置正确', () => {
        expect(INSANITY.id).toBe('status_insanity');
        expect(INSANITY.name).toBe('疯狂');
        expect(INSANITY.type).toBe(StatusEffectType.DEBUFF);
        expect(INSANITY.icon).toBe('🤪');
        expect(INSANITY.durationTurns).toBe(3);
        expect(INSANITY.triggers).toContain(StatusTrigger.TURN_START);
        expect(INSANITY.data.sanityDamagePerTurn).toBe(15);
        expect(INSANITY.data.actionFailChance).toBe(0.4);
        expect(INSANITY.data.randomTargetChance).toBe(0.6);
    });
    
    test('污染状态配置正确', () => {
        expect(CORRUPTION.id).toBe('status_corruption');
        expect(CORRUPTION.name).toBe('污染');
        expect(CORRUPTION.type).toBe(StatusEffectType.DEBUFF);
        expect(CORRUPTION.icon).toBe('☣️');
        expect(CORRUPTION.durationTurns).toBe(5);
        expect(CORRUPTION.triggers).toContain(StatusTrigger.TURN_END);
        expect(CORRUPTION.triggers).toContain(StatusTrigger.ON_HEAL);
        expect(CORRUPTION.data.shadowDamagePerTurn).toBe(25);
        expect(CORRUPTION.data.healReduction).toBe(0.5);
        expect(CORRUPTION.data.spreadChance).toBe(0.2);
    });
    
    test('神性侵蚀状态配置正确', () => {
        expect(DIVINE_EROSION.id).toBe('status_divine_erosion');
        expect(DIVINE_EROSION.name).toBe('神性侵蚀');
        expect(DIVINE_EROSION.type).toBe(StatusEffectType.DEBUFF);
        expect(DIVINE_EROSION.icon).toBe('👁️');
        expect(DIVINE_EROSION.durationTurns).toBe(4);
        expect(DIVINE_EROSION.triggers).toContain(StatusTrigger.TURN_START);
        expect(DIVINE_EROSION.triggers).toContain(StatusTrigger.ON_HEAL);
        expect(DIVINE_EROSION.data.maxHealthReductionPerTurn).toBe(0.1);
        expect(DIVINE_EROSION.data.defenseReduction).toBe(0.3);
        expect(DIVINE_EROSION.data.cannotBeHealed).toBe(true);
    });
    
    test('状态效果实例独立', () => {
        const insanity1 = new StatusEffect({ ...INSANITY });
        const insanity2 = new StatusEffect({ ...INSANITY });
        
        insanity1.remainingTurns = 1;
        expect(insanity2.remainingTurns).toBe(3); // 不应影响其他实例
    });
});

describe('状态效果管理器', () => {
    let manager;
    
    beforeEach(() => {
        manager = new StatusEffectManager();
    });
    
    test('管理器初始化', () => {
        expect(manager.effects).toBeDefined();
        expect(manager.effects instanceof Map).toBe(true);
    });
    
    test('添加状态效果', () => {
        manager.addEffect(INSANITY, 'player1');
        expect(manager.effects.has('player1')).toBe(true);
        expect(manager.effects.get('player1')).toHaveLength(1);
        expect(manager.effects.get('player1')[0].id).toBe('status_insanity');
    });
    
    test('状态效果堆叠', () => {
        manager.addEffect(INSANITY, 'player1');
        manager.addEffect(INSANITY, 'player1');
        
        const effects = manager.effects.get('player1');
        expect(effects).toHaveLength(1); // 相同效果应堆叠，而不是新增
        expect(effects[0].stacks).toBe(2);
    });
    
    test('移除状态效果', () => {
        manager.addEffect(INSANITY, 'player1');
        manager.addEffect(CORRUPTION, 'player1');
        
        expect(manager.effects.get('player1')).toHaveLength(2);
        
        manager.removeEffect('status_insanity', 'player1');
        expect(manager.effects.get('player1')).toHaveLength(1);
        expect(manager.effects.get('player1')[0].id).toBe('status_corruption');
    });
    
    test('触发状态效果', () => {
        // 创建一个自定义效果，带有onTrigger函数
        const customEffect = new StatusEffect({
            id: 'custom',
            name: '自定义',
            triggers: [StatusTrigger.TURN_START],
            onTrigger: (context) => ({ triggered: true, context })
        });
        
        manager.addEffect(customEffect, 'target1');
        
        const results = manager.triggerEffects(StatusTrigger.TURN_START, 'target1', { turn: 1 });
        expect(results).toHaveLength(1);
        expect(results[0].triggered).toBe(true);
        expect(results[0].context.turn).toBe(1);
    });
    
    test('更新回合递减', () => {
        manager.addEffect(INSANITY, 'player1');
        manager.addEffect(CORRUPTION, 'player2');
        
        // 设置不同的剩余回合
        manager.effects.get('player1')[0].remainingTurns = 1;
        manager.effects.get('player2')[0].remainingTurns = 3;
        
        manager.updateTurn();
        
        const effect1 = manager.effects.get('player1')[0];
        const effect2 = manager.effects.get('player2')[0];
        
        expect(effect1.remainingTurns).toBe(0);
        expect(effect1.isExpired()).toBe(true);
        expect(effect2.remainingTurns).toBe(2);
        expect(effect2.isExpired()).toBe(false);
        
        // 再次更新回合，过期的效果应被移除
        manager.updateTurn();
        expect(manager.effects.get('player1')).toHaveLength(0); // 已过期，被移除
        expect(manager.effects.get('player2')[0].remainingTurns).toBe(1);
    });
    
    test('多个目标的状态效果', () => {
        manager.addEffect(INSANITY, 'player1');
        manager.addEffect(CORRUPTION, 'player2');
        manager.addEffect(DIVINE_EROSION, 'player3');
        
        expect(manager.effects.has('player1')).toBe(true);
        expect(manager.effects.has('player2')).toBe(true);
        expect(manager.effects.has('player3')).toBe(true);
        
        expect(manager.effects.get('player1')).toHaveLength(1);
        expect(manager.effects.get('player2')).toHaveLength(1);
        expect(manager.effects.get('player3')).toHaveLength(1);
    });
});

describe('状态效果集成', () => {
    test('三种新状态效果都已定义', () => {
        expect(INSANITY).toBeDefined();
        expect(CORRUPTION).toBeDefined();
        expect(DIVINE_EROSION).toBeDefined();
    });
    
    test('状态效果类型枚举正确', () => {
        expect(StatusEffectType.BUFF).toBe('buff');
        expect(StatusEffectType.DEBUFF).toBe('debuff');
        expect(StatusEffectType.DOT).toBe('dot');
        expect(StatusEffectType.HOT).toBe('hot');
        expect(StatusEffectType.CONTROL).toBe('control');
        expect(StatusEffectType.SPECIAL).toBe('special');
    });
    
    test('状态效果触发器枚举正确', () => {
        expect(StatusTrigger.TURN_START).toBe('turn_start');
        expect(StatusTrigger.TURN_END).toBe('turn_end');
        expect(StatusTrigger.BEFORE_ACTION).toBe('before_action');
        expect(StatusTrigger.AFTER_ACTION).toBe('after_action');
        expect(StatusTrigger.ON_DAMAGE).toBe('on_damage');
        expect(StatusTrigger.ON_HEAL).toBe('on_heal');
        expect(StatusTrigger.ON_DEATH).toBe('on_death');
    });
});