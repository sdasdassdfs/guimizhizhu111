/**
 * ATB战斗引擎单元测试
 */

import { ATBCombatEngine, BattleState, ActionType } from '../game/combat/ATBCombatEngine.js';
import { PositionManager } from '../game/combat/PositionManager.js';
import { ComboManager } from '../game/combat/ComboManager.js';

// 模拟角色类
class MockCharacter {
    constructor(id, name, agility = 10, health = 100, maxHealth = 100) {
        this.id = id;
        this.name = name;
        this.attributes = {
            get: (attr) => {
                if (attr === 'agility') return agility;
                if (attr === 'strength') return 10;
                return 10;
            }
        };
        this.health = health;
        this.maxHealth = maxHealth;
        this.actionPoints = 0;
        this.actionPointRate = (agility / 10) * 0.333;
        this.actionThreshold = 100;
        this.speedModifier = 1.0;
        this.isActionReady = false;
        this.isDefeated = false;
        this.currentPosition = null;
        this.unlockedTalents = [];
        this.currentPathwayId = null;
    }
    
    takeDamage(damage, source) {
        this.health = Math.max(0, this.health - damage);
        if (this.health <= 0) {
            this.isDefeated = true;
        }
        return damage;
    }
    
    applyBuff(buff) {
        // 模拟应用buff
        this[`${buff.stat}Buff`] = buff.value;
        return true;
    }
}

describe('ATBCombatEngine', () => {
    let engine;
    let playerTeam;
    let enemyTeam;
    
    beforeEach(() => {
        playerTeam = [
            new MockCharacter('p1', '玩家1', 15),
            new MockCharacter('p2', '玩家2', 12)
        ];
        
        enemyTeam = [
            new MockCharacter('e1', '敌人1', 10),
            new MockCharacter('e2', '敌人2', 8)
        ];
        
        engine = new ATBCombatEngine({
            playerTeam,
            enemyTeam
        });
    });
    
    test('引擎初始化正确', () => {
        expect(engine.state).toBe(BattleState.INITIALIZING);
        expect(engine.playerTeam).toHaveLength(2);
        expect(engine.enemyTeam).toHaveLength(2);
        expect(engine.positionManager).toBeInstanceOf(PositionManager);
        expect(engine.comboManager).toBeInstanceOf(ComboManager);
    });
    
    test('行动点积累', () => {
        const character = playerTeam[0];
        const initialPoints = character.actionPoints;
        
        // 模拟更新（deltaTime = 1秒）
        engine.update(Date.now());
        
        expect(character.actionPoints).toBeGreaterThan(initialPoints);
    });
    
    test('行动就绪检测', () => {
        const character = playerTeam[0];
        
        // 设置足够的行动点
        character.actionPoints = 150;
        character.isActionReady = false;
        
        engine._checkReadyActions();
        
        expect(character.isActionReady).toBe(true);
        expect(engine.currentActor).toBe(character);
    });
    
    test('玩家行动选择', () => {
        // 设置当前行动者
        engine.currentActor = playerTeam[0];
        engine.state = BattleState.PLAYER_TURN;
        
        const action = {
            type: ActionType.ATTACK,
            target: enemyTeam[0]
        };
        
        const result = engine.playerSelectAction(action);
        
        expect(result).toBe(true);
        expect(engine.currentAction).toBeDefined();
    });
    
    test('战斗状态转换', () => {
        engine.state = BattleState.PLAYER_TURN;
        engine._triggerStateChange = jest.fn();
        
        engine.pause();
        
        expect(engine.isPaused).toBe(true);
        expect(engine.state).toBe(BattleState.PAUSED);
        
        engine.resume();
        
        expect(engine.isPaused).toBe(false);
        expect(engine.state).toBe(BattleState.PLAYER_TURN);
    });
    
    test('位置管理器集成', () => {
        engine.positionManager.initializeTeamPositions(playerTeam);
        
        const positions = engine.positionManager.getAllPositions();
        
        expect(positions.front.center).toBe(playerTeam[0]);
        expect(positions.middle.left).toBe(playerTeam[1]);
    });
    
    test('合击管理器集成', () => {
        // 模拟合击条件
        const comboData = {
            definition: {
                id: 'test_combo',
                name: '测试合击',
                conditions: []
            },
            partner: playerTeam[1]
        };
        
        engine.comboManager.executeCombo = jest.fn().mockReturnValue({
            success: true
        });
        
        const action = {
            type: ActionType.COMBO,
            comboData,
            target: enemyTeam[0]
        };
        
        const result = engine._executeAction(action);
        
        expect(result.success).toBe(true);
    });
    
    test('战斗结束检测 - 胜利', () => {
        // 将所有敌人设为击败状态
        enemyTeam.forEach(e => {
            e.isDefeated = true;
        });
        
        const isEnded = engine._checkBattleEnd();
        
        expect(isEnded).toBe(true);
        expect(engine.state).toBe(BattleState.VICTORY);
    });
    
    test('战斗结束检测 - 失败', () => {
        // 将所有玩家设为击败状态
        playerTeam.forEach(p => {
            p.isDefeated = true;
        });
        
        const isEnded = engine._checkBattleEnd();
        
        expect(isEnded).toBe(true);
        expect(engine.state).toBe(BattleState.DEFEAT);
    });
    
    test('序列化与反序列化', () => {
        // 设置一些状态
        engine.state = BattleState.PLAYER_TURN;
        engine.turnCount = 5;
        
        const data = engine.toDict();
        
        // 创建新引擎并导入数据
        const newEngine = new ATBCombatEngine();
        const characterMap = {};
        [...playerTeam, ...enemyTeam].forEach(c => {
            characterMap[c.id] = c;
        });
        
        newEngine.fromDict(data, characterMap);
        
        expect(newEngine.state).toBe(BattleState.PLAYER_TURN);
        expect(newEngine.turnCount).toBe(5);
    });
});

describe('PositionManager', () => {
    let manager;
    
    beforeEach(() => {
        manager = new PositionManager();
    });
    
    test('位置初始化', () => {
        const mockTeam = [
            new MockCharacter('c1', '角色1'),
            new MockCharacter('c2', '角色2')
        ];
        
        manager.initializeTeamPositions(mockTeam);
        
        expect(manager.getCharacterAt('front', 'center')).toBe(mockTeam[0]);
        expect(manager.getCharacterAt('middle', 'left')).toBe(mockTeam[1]);
    });
    
    test('位置调整', () => {
        const character = new MockCharacter('c1', '角色1');
        
        manager.placeCharacter(character, 'front', 'left');
        
        expect(character.currentPosition).toEqual({ row: 'front', col: 'left' });
        
        const success = manager.adjustPosition(character, 'back', 'right');
        
        expect(success).toBe(true);
        expect(character.currentPosition).toEqual({ row: 'back', col: 'right' });
        expect(manager.getRemainingAdjustments()).toBe(2);
    });
    
    test('位置效果计算', () => {
        const attacker = new MockCharacter('a1', '攻击者');
        const defender = new MockCharacter('d1', '防御者');
        
        manager.placeCharacter(attacker, 'front', 'center');
        manager.placeCharacter(defender, 'back', 'center');
        
        const effect = manager.calculatePositionEffect(attacker, defender, { type: 'attack' });
        
        expect(effect.hitModifier).toBeLessThan(1.0);
        expect(effect.damageModifier).toBe(0.9); // 前排打后排伤害降低
    });
});

describe('ComboManager', () => {
    let manager;
    
    beforeEach(() => {
        manager = new ComboManager();
    });
    
    test('合击定义加载', () => {
        const definitions = manager.getComboDefinitions();
        
        expect(definitions).toHaveProperty('guardian_mystic');
        expect(definitions.guardian_mystic.name).toBe('神圣守护阵');
    });
    
    test('合击条件检查', () => {
        const actor1 = new MockCharacter('c1', '角色1');
        const actor2 = new MockCharacter('c2', '角色2');
        
        actor1.npcType = 'guardian';
        actor2.npcType = 'mystic';
        
        // 设置友好度
        actor1.getFriendshipLevel = () => 70;
        actor2.getFriendshipLevel = () => 70;
        
        const combos = manager.getAvailableCombos(actor1, [actor1, actor2], {});
        
        expect(combos).toBeInstanceOf(Array);
    });
    
    test('合击执行', () => {
        const comboData = {
            definition: {
                id: 'test_combo',
                conditions: []
            },
            partner: new MockCharacter('p1', '伙伴')
        };
        
        const result = manager.executeCombo(comboData, [], {});
        
        expect(result).toHaveProperty('success');
    });
});