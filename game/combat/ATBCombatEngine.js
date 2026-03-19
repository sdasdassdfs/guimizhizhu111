/**
 * ATB战斗引擎
 * 基于行动条（ATB）的实时战斗系统，支持团队位置调整和合击技能
 */

import { PositionManager, PositionRow, PositionColumn } from './PositionManager.js';
import { ComboManager, ComboSkillType } from './ComboManager.js';

/**
 * 战斗状态枚举
 */
export const BattleState = Object.freeze({
    INITIALIZING: 'initializing',
    PLAYER_TURN: 'player_turn',
    ENEMY_TURN: 'enemy_turn',
    ACTION_EXECUTING: 'action_executing',
    VICTORY: 'victory',
    DEFEAT: 'defeat',
    ESCAPED: 'escaped',
    PAUSED: 'paused'
});

/**
 * 行动类型枚举
 */
export const ActionType = Object.freeze({
    ATTACK: 'attack',
    SKILL: 'skill',
    ITEM: 'item',
    DEFEND: 'defend',
    ESCAPE: 'escape',
    COMBO: 'combo',
    POSITION_ADJUST: 'position_adjust'
});

/**
 * 团队能量管理器
 */
class TeamEnergyManager {
    constructor() {
        this.maxEnergy = 100;
        this.currentEnergy = 0;
        this.energyGainRate = 5; // 每回合获得能量
        this.energyPerAction = 10; // 每次行动获得能量
    }
    
    /**
     * 增加能量
     * @param {number} amount - 增加量
     */
    addEnergy(amount) {
        this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + (amount || this.energyGainRate));
    }
    
    /**
     * 消耗能量
     * @param {number} amount - 消耗量
     * @returns {boolean} 是否成功消耗
     */
    consumeEnergy(amount) {
        if (this.currentEnergy < amount) {
            return false;
        }
        this.currentEnergy -= amount;
        return true;
    }
    
    /**
     * 重置能量
     */
    reset() {
        this.currentEnergy = 0;
    }
}

/**
 * ATB战斗引擎主类
 */
export class ATBCombatEngine {
    /**
     * 构造函数
     * @param {Object} options - 配置选项
     */
    constructor(options = {}) {
        // 战斗队伍
        this.playerTeam = options.playerTeam || [];
        this.enemyTeam = options.enemyTeam || [];
        
        // 战斗状态
        this.state = BattleState.INITIALIZING;
        this.turnCount = 0;
        this.currentActor = null;
        this.currentAction = null;
        this.actionQueue = [];
        
        // ATB相关
        this.timeScale = options.timeScale || 1.0;
        this.frameRate = 60; // 假设60FPS
        this.lastUpdateTime = 0;
        this.isPaused = false;
        
        // 行动点积累速率系数
        this.actionPointRate = options.actionPointRate || 0.333; // 每帧基础积累量（敏捷10对应）
        
        // 管理组件
        this.positionManager = new PositionManager();
        this.comboManager = new ComboManager();
        this.teamEnergyManager = new TeamEnergyManager();
        
        // 设置依赖关系
        this.comboManager.setTeamEnergyManager(this.teamEnergyManager);
        
        // 事件回调
        this.onStateChange = options.onStateChange || null;
        this.onActionQueued = options.onActionQueued || null;
        this.onActionExecuted = options.onActionExecuted || null;
        this.onComboAvailable = options.onComboAvailable || null;
        this.onBattleEnd = options.onBattleEnd || null;
        
        // 战斗日志
        this.battleLog = [];
        
        // 初始化
        this._initializeBattle();
    }
    
    /**
     * 初始化战斗
     */
    _initializeBattle() {
        // 初始化角色行动点
        this._initializeActionPoints();
        
        // 初始化队伍位置
        this.positionManager.initializeTeamPositions(this.playerTeam);
        
        // 设置战斗状态
        this.state = BattleState.PLAYER_TURN;
        this.turnCount = 0;
        
        // 记录日志
        this._logBattleEvent('战斗开始');
        
        // 触发状态变化事件
        this._triggerStateChange();
    }
    
    /**
     * 初始化角色行动点
     */
    _initializeActionPoints() {
        const allCombatants = [...this.playerTeam, ...this.enemyTeam];
        
        allCombatants.forEach(character => {
            // 计算基础行动点积累速率
            const agility = character.attributes?.get?.('agility') || 10;
            const baseRate = (agility / 10) * this.actionPointRate;
            
            // 存储到角色对象
            character.actionPoints = 0;
            character.actionPointRate = baseRate;
            character.actionThreshold = 100; // 行动阈值
            
            // 初始化速度相关状态
            character.speedModifier = 1.0;
            character.isActionReady = false;
        });
    }
    
    /**
     * 更新战斗
     * @param {number} currentTime - 当前时间戳（毫秒）
     */
    update(currentTime) {
        // 检查战斗是否结束
        if (this._checkBattleEnd()) {
            return;
        }
        
        // 处理暂停
        if (this.isPaused || this.state === BattleState.PAUSED) {
            return;
        }
        
        // 计算时间增量
        let deltaTime = 0;
        if (this.lastUpdateTime > 0) {
            deltaTime = (currentTime - this.lastUpdateTime) * this.timeScale / 1000; // 转换为秒
        }
        this.lastUpdateTime = currentTime;
        
        if (deltaTime <= 0) {
            return;
        }
        
        // 更新行动点
        this._updateActionPoints(deltaTime);
        
        // 检查可行动角色
        this._checkReadyActions();
        
        // 处理行动队列
        this._processActionQueue(deltaTime);
        
        // 更新团队能量
        this._updateTeamEnergy(deltaTime);
    }
    
    /**
     * 更新行动点
     * @param {number} deltaTime - 时间增量（秒）
     */
    _updateActionPoints(deltaTime) {
        const allCombatants = [...this.playerTeam, ...this.enemyTeam];
        const frames = deltaTime * this.frameRate; // 计算帧数
        
        allCombatants.forEach(character => {
            if (character.isDefeated || character.isActionReady) {
                return;
            }
            
            // 计算行动点增量
            const increment = character.actionPointRate * frames * character.speedModifier;
            character.actionPoints = Math.min(200, character.actionPoints + increment);
            
            // 检查是否达到行动阈值
            if (character.actionPoints >= character.actionThreshold) {
                character.isActionReady = true;
                this._queueReadyAction(character);
            }
        });
    }
    
    /**
     * 检查可行动角色并加入队列
     */
    _checkReadyActions() {
        const allCombatants = [...this.playerTeam, ...this.enemyTeam];
        
        allCombatants.forEach(character => {
            if (character.isActionReady && !this.actionQueue.includes(character)) {
                this._queueReadyAction(character);
            }
        });
    }
    
    /**
     * 将可行动角色加入队列
     * @param {Character} character - 可行动角色
     */
    _queueReadyAction(character) {
        if (!character.isActionReady) {
            return;
        }
        
        // 确定角色阵营
        const isPlayer = this.playerTeam.includes(character);
        
        // 设置当前行动者
        this.currentActor = character;
        
        // 根据阵营设置战斗状态
        if (isPlayer) {
            this.state = BattleState.PLAYER_TURN;
        } else {
            this.state = BattleState.ENEMY_TURN;
            // 为敌方选择行动（简化AI）
            this._selectEnemyAction(character);
        }
        
        // 触发行动就绪事件
        if (this.onActionQueued) {
            this.onActionQueued({
                actor: character,
                isPlayer: isPlayer,
                availableCombos: this._getAvailableCombosForActor(character)
            });
        }
        
        // 记录日志
        this._logBattleEvent(`${character.name} 准备行动`);
        
        this._triggerStateChange();
    }
    
    /**
     * 为敌方角色选择行动
     * @param {Character} enemy - 敌方角色
     */
    _selectEnemyAction(enemy) {
        // 简化AI：随机选择行动
        const actionTypes = [ActionType.ATTACK, ActionType.SKILL, ActionType.DEFEND];
        const randomAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        
        this.currentAction = {
            type: randomAction,
            actor: enemy,
            target: this._selectRandomTarget(this.playerTeam),
            skill: randomAction === ActionType.SKILL ? this._getRandomSkill(enemy) : null
        };
        
        // 自动执行敌方行动
        this.executeCurrentAction();
    }
    
    /**
     * 处理行动队列
     * @param {number} deltaTime - 时间增量
     */
    _processActionQueue(deltaTime) {
        // 当前实现中，行动队列是隐式的（通过currentActor和currentAction）
        // 更复杂的实现可能需要真正的队列来处理多个同时准备行动的角色
    }
    
    /**
     * 执行当前行动
     */
    executeCurrentAction() {
        if (!this.currentActor || !this.currentAction) {
            return;
        }
        
        this.state = BattleState.ACTION_EXECUTING;
        this._triggerStateChange();
        
        // 根据行动类型执行
        const result = this._executeAction(this.currentAction);
        
        // 消耗行动点
        this._consumeActionPoints(this.currentActor);
        
        // 增加团队能量
        this.teamEnergyManager.addEnergy(this.teamEnergyManager.energyPerAction);
        
        // 记录日志
        this._logBattleEvent(`${this.currentActor.name} 执行了 ${this.currentAction.type}`, result);
        
        // 触发行动执行事件
        if (this.onActionExecuted) {
            this.onActionExecuted({
                action: this.currentAction,
                result: result
            });
        }
        
        // 清理当前行动
        this.currentActor = null;
        this.currentAction = null;
        
        // 检查战斗是否继续
        if (!this._checkBattleEnd()) {
            this.state = BattleState.PLAYER_TURN;
            this._triggerStateChange();
        }
    }
    
    /**
     * 执行具体行动
     * @param {Object} action - 行动数据
     * @returns {Object} 行动结果
     */
    _executeAction(action) {
        switch (action.type) {
            case ActionType.ATTACK:
                return this._executeAttack(action);
                
            case ActionType.SKILL:
                return this._executeSkill(action);
                
            case ActionType.COMBO:
                return this._executeCombo(action);
                
            case ActionType.DEFEND:
                return this._executeDefend(action);
                
            case ActionType.POSITION_ADJUST:
                return this._executePositionAdjust(action);
                
            case ActionType.ITEM:
                return this._executeItem(action);
                
            case ActionType.ESCAPE:
                return this._executeEscape(action);
                
            default:
                console.warn(`未知的行动类型: ${action.type}`);
                return { success: false };
        }
    }
    
    /**
     * 执行普通攻击
     * @param {Object} action - 攻击行动
     * @returns {Object} 攻击结果
     */
    _executeAttack(action) {
        const { actor, target } = action;
        
        if (!target || target.isDefeated) {
            return { success: false, reason: '目标无效' };
        }
        
        // 计算位置修正
        const positionEffect = this.positionManager.calculatePositionEffect(actor, target, { type: 'attack' });
        
        // 计算命中率
        const baseHitChance = 85; // 基础命中率85%
        const finalHitChance = baseHitChance * positionEffect.hitModifier;
        
        // 判断是否命中
        const isHit = Math.random() * 100 <= finalHitChance;
        
        if (!isHit) {
            return {
                success: true,
                type: 'attack',
                hit: false,
                damage: 0,
                positionEffect
            };
        }
        
        // 计算伤害
        const baseDamage = this._calculateAttackDamage(actor);
        const finalDamage = baseDamage * positionEffect.damageModifier * positionEffect.receiveModifier;
        
        // 应用伤害
        const actualDamage = target.takeDamage?.(finalDamage, 'attack') || finalDamage;
        
        return {
            success: true,
            type: 'attack',
            hit: true,
            damage: actualDamage,
            positionEffect,
            targetHealth: target.health
        };
    }
    
    /**
     * 执行技能
     * @param {Object} action - 技能行动
     * @returns {Object} 技能结果
     */
    _executeSkill(action) {
        const { actor, target, skill } = action;
        
        if (!skill) {
            return { success: false, reason: '技能无效' };
        }
        
        // 计算位置修正
        const positionEffect = this.positionManager.calculatePositionEffect(actor, target, skill);
        
        // 执行技能效果
        const result = skill.execute?.(actor, target, positionEffect) || {};
        
        return {
            success: true,
            type: 'skill',
            skill: skill.id,
            result,
            positionEffect
        };
    }
    
    /**
     * 执行合击技能
     * @param {Object} action - 合击行动
     * @returns {Object} 合击结果
     */
    _executeCombo(action) {
        const { actor, target, comboData } = action;
        
        if (!comboData) {
            return { success: false, reason: '合击数据无效' };
        }
        
        // 通过合击管理器执行
        const comboResult = this.comboManager.executeCombo(
            comboData,
            Array.isArray(target) ? target : [target],
            {
                currentActor: actor,
                team: this.playerTeam,
                positionManager: this.positionManager
            }
        );
        
        return {
            success: comboResult.success,
            type: 'combo',
            combo: comboResult.definition,
            result: comboResult.results,
            reason: comboResult.reason
        };
    }
    
    /**
     * 执行防御
     * @param {Object} action - 防御行动
     * @returns {Object} 防御结果
     */
    _executeDefend(action) {
        const { actor } = action;
        
        // 应用防御增益
        actor.applyBuff?.({
            id: `defend_${Date.now()}`,
            stat: 'defense',
            value: 50, // 防御力+50%
            duration: 1,
            source: 'defend'
        });
        
        return {
            success: true,
            type: 'defend',
            actor: actor.id,
            defenseBoost: 50
        };
    }
    
    /**
     * 执行位置调整
     * @param {Object} action - 位置调整行动
     * @returns {Object} 调整结果
     */
    _executePositionAdjust(action) {
        const { actor, targetPosition } = action;
        
        if (!targetPosition) {
            return { success: false, reason: '目标位置无效' };
        }
        
        const success = this.positionManager.adjustPosition(
            actor,
            targetPosition.row,
            targetPosition.col
        );
        
        return {
            success,
            type: 'position_adjust',
            actor: actor.id,
            newPosition: targetPosition,
            remainingAdjustments: this.positionManager.getRemainingAdjustments()
        };
    }
    
    /**
     * 执行道具使用
     * @param {Object} action - 道具行动
     * @returns {Object} 道具结果
     */
    _executeItem(action) {
        // 简化实现
        return {
            success: true,
            type: 'item',
            item: action.item?.id
        };
    }
    
    /**
     * 执行逃跑
     * @param {Object} action - 逃跑行动
     * @returns {Object} 逃跑结果
     */
    _executeEscape(action) {
        const successRate = 70; // 70%逃跑成功率
        const success = Math.random() * 100 <= successRate;
        
        if (success) {
            this.state = BattleState.ESCAPED;
            this._triggerStateChange();
        }
        
        return {
            success,
            type: 'escape',
            successRate
        };
    }
    
    /**
     * 消耗行动点
     * @param {Character} character - 角色
     */
    _consumeActionPoints(character) {
        const actionCost = 100; // 标准行动消耗
        character.actionPoints = Math.max(0, character.actionPoints - actionCost);
        character.isActionReady = false;
        
        // 如果还有剩余行动点，可能可以再次行动
        if (character.actionPoints >= character.actionThreshold) {
            character.isActionReady = true;
        }
    }
    
    /**
     * 更新团队能量
     * @param {number} deltaTime - 时间增量
     */
    _updateTeamEnergy(deltaTime) {
        // 每回合自动增加能量
        this.teamEnergyManager.addEnergy();
    }
    
    /**
     * 获取指定角色的可用合击
     * @param {Character} actor - 角色
     * @returns {Array} 合击列表
     */
    _getAvailableCombosForActor(actor) {
        return this.comboManager.getAvailableCombos(
            actor,
            this.playerTeam,
            this.positionManager
        );
    }
    
    /**
     * 计算攻击伤害
     * @param {Character} actor - 攻击者
     * @returns {number} 伤害值
     */
    _calculateAttackDamage(actor) {
        const strength = actor.attributes?.get?.('strength') || 10;
        const level = actor.level || 1;
        
        return strength * 2 + level * 1.5;
    }
    
    /**
     * 随机选择目标
     * @param {Array} targets - 目标数组
     * @returns {Character|null} 随机目标
     */
    _selectRandomTarget(targets) {
        const validTargets = targets.filter(t => !t.isDefeated);
        if (validTargets.length === 0) return null;
        
        return validTargets[Math.floor(Math.random() * validTargets.length)];
    }
    
    /**
     * 获取随机技能
     * @param {Character} character - 角色
     * @returns {Object|null} 技能数据
     */
    _getRandomSkill(character) {
        if (!character.skills || character.skills.length === 0) {
            return null;
        }
        
        const availableSkills = character.skills.filter(s => !s.onCooldown);
        if (availableSkills.length === 0) {
            return character.skills[0]; // 返回冷却中的技能
        }
        
        return availableSkills[Math.floor(Math.random() * availableSkills.length)];
    }
    
    /**
     * 检查战斗是否结束
     * @returns {boolean} 是否结束
     */
    _checkBattleEnd() {
        // 检查玩家队伍是否全灭
        const playerDefeated = this.playerTeam.every(c => c.isDefeated);
        if (playerDefeated) {
            this.state = BattleState.DEFEAT;
            this._onBattleEnd('defeat');
            return true;
        }
        
        // 检查敌方队伍是否全灭
        const enemyDefeated = this.enemyTeam.every(c => c.isDefeated);
        if (enemyDefeated) {
            this.state = BattleState.VICTORY;
            this._onBattleEnd('victory');
            return true;
        }
        
        return false;
    }
    
    /**
     * 战斗结束处理
     * @param {string} result - 战斗结果
     */
    _onBattleEnd(result) {
        this._logBattleEvent(`战斗结束: ${result}`);
        this._triggerStateChange();
        
        if (this.onBattleEnd) {
            this.onBattleEnd({
                result: result,
                turnCount: this.turnCount,
                playerTeam: this.playerTeam,
                enemyTeam: this.enemyTeam,
                battleLog: this.battleLog
            });
        }
    }
    
    /**
     * 记录战斗事件
     * @param {string} message - 事件消息
     * @param {Object} data - 附加数据
     */
    _logBattleEvent(message, data = null) {
        const logEntry = {
            turn: this.turnCount,
            time: Date.now(),
            message,
            data
        };
        
        this.battleLog.push(logEntry);
        console.log(`[战斗日志] ${message}`, data || '');
    }
    
    /**
     * 触发状态变化事件
     */
    _triggerStateChange() {
        if (this.onStateChange) {
            this.onStateChange({
                state: this.state,
                turnCount: this.turnCount,
                currentActor: this.currentActor,
                currentAction: this.currentAction,
                playerTeam: this.playerTeam,
                enemyTeam: this.enemyTeam,
                positions: this.positionManager.getAllPositions(),
                teamEnergy: this.teamEnergyManager.currentEnergy
            });
        }
    }
    
    /**
     * 玩家选择行动
     * @param {Object} action - 玩家行动
     */
    playerSelectAction(action) {
        if (this.state !== BattleState.PLAYER_TURN) {
            console.warn('不是玩家回合，无法选择行动');
            return false;
        }
        
        if (!this.currentActor) {
            console.warn('没有可行动的角色');
            return false;
        }
        
        // 验证行动
        if (!this._validatePlayerAction(action)) {
            return false;
        }
        
        // 设置当前行动
        this.currentAction = {
            ...action,
            actor: this.currentActor
        };
        
        // 执行行动
        this.executeCurrentAction();
        
        return true;
    }
    
    /**
     * 验证玩家行动
     * @param {Object} action - 玩家行动
     * @returns {boolean} 是否有效
     */
    _validatePlayerAction(action) {
        if (!action.type) {
            console.warn('行动缺少类型');
            return false;
        }
        
        switch (action.type) {
            case ActionType.ATTACK:
            case ActionType.SKILL:
                if (!action.target) {
                    console.warn('攻击/技能行动缺少目标');
                    return false;
                }
                break;
                
            case ActionType.COMBO:
                if (!action.comboData) {
                    console.warn('合击行动缺少合击数据');
                    return false;
                }
                break;
                
            case ActionType.POSITION_ADJUST:
                if (!action.targetPosition) {
                    console.warn('位置调整缺少目标位置');
                    return false;
                }
                break;
                
            case ActionType.ITEM:
                if (!action.item) {
                    console.warn('道具使用缺少道具数据');
                    return false;
                }
                break;
                
            case ActionType.DEFEND:
            case ActionType.ESCAPE:
                // 无需额外验证
                break;
                
            default:
                console.warn(`未知的行动类型: ${action.type}`);
                return false;
        }
        
        return true;
    }
    
    /**
     * 暂停战斗
     */
    pause() {
        this.isPaused = true;
        this.state = BattleState.PAUSED;
        this._triggerStateChange();
        this._logBattleEvent('战斗暂停');
    }
    
    /**
     * 恢复战斗
     */
    resume() {
        this.isPaused = false;
        this.state = BattleState.PLAYER_TURN;
        this._triggerStateChange();
        this._logBattleEvent('战斗恢复');
    }
    
    /**
     * 获取战斗状态摘要
     * @returns {Object} 状态摘要
     */
    getBattleSummary() {
        return {
            state: this.state,
            turnCount: this.turnCount,
            playerTeam: this.playerTeam.map(c => ({
                id: c.id,
                name: c.name,
                health: c.health,
                maxHealth: c.maxHealth,
                actionPoints: c.actionPoints,
                isActionReady: c.isActionReady,
                position: c.currentPosition
            })),
            enemyTeam: this.enemyTeam.map(c => ({
                id: c.id,
                name: c.name,
                health: c.health,
                maxHealth: c.maxHealth,
                actionPoints: c.actionPoints,
                isActionReady: c.isActionReady
            })),
            positions: this.positionManager.getAllPositions(),
            teamEnergy: this.teamEnergyManager.currentEnergy,
            availableCombos: this.currentActor ? this._getAvailableCombosForActor(this.currentActor) : []
        };
    }
    
    /**
     * 导出战斗数据
     * @returns {Object} 战斗数据
     */
    toDict() {
        return {
            playerTeam: this.playerTeam.map(c => c.id),
            enemyTeam: this.enemyTeam.map(c => c.id),
            state: this.state,
            turnCount: this.turnCount,
            positions: this.positionManager.toDict(),
            teamEnergy: this.teamEnergyManager.currentEnergy,
            battleLog: this.battleLog
        };
    }
    
    /**
     * 从字典导入战斗数据
     * @param {Object} data - 战斗数据
     * @param {Object} characterMap - 角色ID到实例的映射
     */
    fromDict(data, characterMap) {
        if (!data) return;
        
        this.playerTeam = (data.playerTeam || []).map(id => characterMap[id]).filter(Boolean);
        this.enemyTeam = (data.enemyTeam || []).map(id => characterMap[id]).filter(Boolean);
        
        this.state = data.state || BattleState.INITIALIZING;
        this.turnCount = data.turnCount || 0;
        
        if (data.positions) {
            this.positionManager.fromDict(data.positions, characterMap);
        }
        
        if (data.teamEnergy !== undefined) {
            this.teamEnergyManager.currentEnergy = data.teamEnergy;
        }
        
        this.battleLog = data.battleLog || [];
        
        // 重新初始化ATB相关数据
        this._initializeActionPoints();
    }
}

export default ATBCombatEngine;