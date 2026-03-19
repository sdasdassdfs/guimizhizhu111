/**
 * 团队位置管理器
 * 处理战斗中的位置调整、位置效果计算和阵型管理
 */

import { Attribute } from '../models/Attribute.js';

/**
 * 位置行枚举
 */
export const PositionRow = Object.freeze({
    FRONT: 'front',
    MIDDLE: 'middle',
    BACK: 'back'
});

/**
 * 位置列枚举
 */
export const PositionColumn = Object.freeze({
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right'
});

/**
 * 位置效果类型
 */
export const PositionEffectType = Object.freeze({
    HIT_MODIFIER: 'hitModifier',      // 命中修正
    DAMAGE_MODIFIER: 'damageModifier', // 伤害修正
    RECEIVE_MODIFIER: 'receiveModifier', // 承受伤害修正
    SKILL_RANGE: 'skillRange'         // 技能范围影响
});

/**
 * 位置管理器类
 */
export class PositionManager {
    constructor() {
        // 3x3网格位置，每个位置可放置一个角色
        this.positions = {
            [PositionRow.FRONT]: { [PositionColumn.LEFT]: null, [PositionColumn.CENTER]: null, [PositionColumn.RIGHT]: null },
            [PositionRow.MIDDLE]: { [PositionColumn.LEFT]: null, [PositionColumn.CENTER]: null, [PositionColumn.RIGHT]: null },
            [PositionRow.BACK]: { [PositionColumn.LEFT]: null, [PositionColumn.CENTER]: null, [PositionColumn.RIGHT]: null }
        };
        
        // 位置调整次数限制
        this.positionAdjustments = {
            maxPerBattle: 3,
            used: 0
        };
        
        // 预计算的位置效果表
        this.positionEffects = this._calculatePositionEffects();
    }
    
    /**
     * 初始化队伍位置
     * @param {Array} team - 角色数组
     */
    initializeTeamPositions(team) {
        // 清空位置
        this.clearAllPositions();
        
        // 默认分配：前排中间开始
        const defaultPositions = [
            { row: PositionRow.FRONT, col: PositionColumn.CENTER },
            { row: PositionRow.MIDDLE, col: PositionColumn.LEFT },
            { row: PositionRow.MIDDLE, col: PositionColumn.RIGHT },
            { row: PositionRow.BACK, col: PositionColumn.CENTER }
        ];
        
        team.forEach((character, index) => {
            if (index < defaultPositions.length) {
                const pos = defaultPositions[index];
                this.placeCharacter(character, pos.row, pos.col);
            }
        });
        
        this.positionAdjustments.used = 0;
    }
    
    /**
     * 放置角色到指定位置
     * @param {Character} character - 角色实例
     * @param {string} row - 行（front/middle/back）
     * @param {string} col - 列（left/center/right）
     * @returns {boolean} 是否成功
     */
    placeCharacter(character, row, col) {
        if (!this.isValidPosition(row, col)) {
            console.error(`无效位置: ${row}, ${col}`);
            return false;
        }
        
        // 如果目标位置已有角色，先移除
        if (this.positions[row][col]) {
            this.removeCharacter(this.positions[row][col]);
        }
        
        // 如果角色已在其他位置，先移除
        this.removeCharacter(character);
        
        // 放置角色
        this.positions[row][col] = character;
        character.currentPosition = { row, col };
        
        return true;
    }
    
    /**
     * 移除角色
     * @param {Character} character - 角色实例
     */
    removeCharacter(character) {
        for (const row of Object.values(PositionRow)) {
            for (const col of Object.values(PositionColumn)) {
                if (this.positions[row][col] === character) {
                    this.positions[row][col] = null;
                    delete character.currentPosition;
                    return;
                }
            }
        }
    }
    
    /**
     * 调整角色位置
     * @param {Character} character - 角色实例
     * @param {string} newRow - 新行
     * @param {string} newCol - 新列
     * @returns {boolean} 是否成功
     */
    adjustPosition(character, newRow, newCol) {
        // 检查调整次数限制
        if (this.positionAdjustments.used >= this.positionAdjustments.maxPerBattle) {
            console.warn('已达到本场战斗位置调整次数上限');
            return false;
        }
        
        const oldPosition = character.currentPosition;
        
        if (this.placeCharacter(character, newRow, newCol)) {
            this.positionAdjustments.used++;
            
            // 触发位置调整事件
            this._onPositionAdjusted(character, oldPosition, { row: newRow, col: newCol });
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取角色位置
     * @param {Character} character - 角色实例
     * @returns {Object|null} 位置对象 {row, col} 或 null
     */
    getCharacterPosition(character) {
        return character.currentPosition || null;
    }
    
    /**
     * 获取指定位置的角色
     * @param {string} row - 行
     * @param {string} col - 列
     * @returns {Character|null}
     */
    getCharacterAt(row, col) {
        if (!this.isValidPosition(row, col)) {
            return null;
        }
        return this.positions[row][col];
    }
    
    /**
     * 获取所有位置的角色映射
     * @returns {Object} 位置映射
     */
    getAllPositions() {
        return JSON.parse(JSON.stringify(this.positions));
    }
    
    /**
     * 清空所有位置
     */
    clearAllPositions() {
        for (const row of Object.values(PositionRow)) {
            for (const col of Object.values(PositionColumn)) {
                if (this.positions[row][col]) {
                    delete this.positions[row][col].currentPosition;
                }
                this.positions[row][col] = null;
            }
        }
    }
    
    /**
     * 检查位置是否有效
     * @param {string} row - 行
     * @param {string} col - 列
     * @returns {boolean}
     */
    isValidPosition(row, col) {
        return Object.values(PositionRow).includes(row) && 
               Object.values(PositionColumn).includes(col);
    }
    
    /**
     * 计算攻击者对防御者的位置效果
     * @param {Character} attacker - 攻击者
     * @param {Character} defender - 防御者
     * @param {Object} skill - 技能数据
     * @returns {Object} 效果修正
     */
    calculatePositionEffect(attacker, defender, skill) {
        const attackerPos = attacker.currentPosition;
        const defenderPos = defender.currentPosition;
        
        if (!attackerPos || !defenderPos) {
            return { hitModifier: 1.0, damageModifier: 1.0, receiveModifier: 1.0 };
        }
        
        const effectKey = `${attackerPos.row}_${attackerPos.col}_to_${defenderPos.row}_${defenderPos.col}`;
        const baseEffect = this.positionEffects[effectKey] || { hitModifier: 1.0, damageModifier: 1.0 };
        
        // 技能范围修正
        let rangeModifier = 1.0;
        if (skill.range) {
            rangeModifier = this._calculateRangeModifier(attackerPos, defenderPos, skill.range);
        }
        
        // 角色特性修正（如天赋、装备）
        const characterModifier = this._calculateCharacterPositionModifier(attacker, defender);
        
        return {
            hitModifier: baseEffect.hitModifier * rangeModifier * characterModifier.hit,
            damageModifier: baseEffect.damageModifier * characterModifier.damage,
            receiveModifier: this._calculateReceiveModifier(defenderPos)
        };
    }
    
    /**
     * 计算承受伤害修正
     * @param {Object} position - 防御者位置
     * @returns {number} 修正系数
     */
    _calculateReceiveModifier(position) {
        const rowModifiers = {
            [PositionRow.FRONT]: 1.15,    // 前排承受伤害+15%
            [PositionRow.MIDDLE]: 1.0,    // 中排无修正
            [PositionRow.BACK]: 0.85      // 后排承受伤害-15%
        };
        
        return rowModifiers[position.row] || 1.0;
    }
    
    /**
     * 计算技能范围修正
     * @param {Object} attackerPos - 攻击者位置
     * @param {Object} defenderPos - 防御者位置
     * @param {string} rangeType - 技能范围类型
     * @returns {number} 修正系数
     */
    _calculateRangeModifier(attackerPos, defenderPos, rangeType) {
        const rowDistance = this._getRowDistance(attackerPos.row, defenderPos.row);
        
        switch (rangeType) {
            case 'front':
                // 前排技能只能命中敌方前排
                return defenderPos.row === PositionRow.FRONT ? 1.0 : 0.0;
                
            case 'back':
                // 后排技能优先命中敌方后排
                if (defenderPos.row === PositionRow.BACK) return 1.2; // 对后排伤害+20%
                if (defenderPos.row === PositionRow.FRONT) return 0.8; // 对前排伤害-20%
                return 1.0;
                
            case 'row':
                // 行技能命中同一行的所有敌人
                return attackerPos.row === defenderPos.row ? 1.0 : 0.0;
                
            case 'adjacent':
                // 相邻位置（包括斜角）
                return this._arePositionsAdjacent(attackerPos, defenderPos) ? 1.0 : 0.0;
                
            case 'all':
                // 全体技能
                return 1.0;
                
            default:
                return 1.0;
        }
    }
    
    /**
     * 计算角色特性对位置效果的影响
     * @param {Character} attacker - 攻击者
     * @param {Character} defender - 防御者
     * @returns {Object} 修正系数
     */
    _calculateCharacterPositionModifier(attacker, defender) {
        let hitMod = 1.0;
        let damageMod = 1.0;
        
        // 天赋影响
        if (attacker.unlockedTalents) {
            attacker.unlockedTalents.forEach(talentId => {
                // 假设天赋数据中有关位置效果的标记
                // 这里简化处理，实际应从天赋数据中读取
                if (talentId.includes('position_hit')) {
                    hitMod *= 1.1; // 命中+10%
                }
                if (talentId.includes('position_damage')) {
                    damageMod *= 1.15; // 伤害+15%
                }
            });
        }
        
        // 途径协同影响
        const pathwaySynergy = this._calculatePathwaySynergy(attacker, defender);
        hitMod *= pathwaySynergy.hit;
        damageMod *= pathwaySynergy.damage;
        
        return { hit: hitMod, damage: damageMod };
    }
    
    /**
     * 计算途径协同效果
     * @param {Character} attacker - 攻击者
     * @param {Character} defender - 防御者
     * @returns {Object} 协同效果
     */
    _calculatePathwaySynergy(attacker, defender) {
        // 简化实现，实际应从途径数据中读取协同规则
        const attackerPathway = attacker.currentPathwayId;
        const defenderPathway = defender.currentPathwayId;
        
        const synergyMap = {
            'fool_error': { hit: 1.1, damage: 1.2 },   // 愚者+错误
            'night_death': { hit: 1.0, damage: 1.15 }, // 黑夜+死神
            'storm_sun': { hit: 1.05, damage: 1.1 }    // 风暴+太阳
        };
        
        const key = `${attackerPathway}_${defenderPathway}`;
        return synergyMap[key] || { hit: 1.0, damage: 1.0 };
    }
    
    /**
     * 计算预定义的位置效果表
     * @returns {Object} 效果表
     */
    _calculatePositionEffects() {
        const effects = {};
        const rows = Object.values(PositionRow);
        const cols = Object.values(PositionColumn);
        
        // 基础规则：
        // 1. 同排命中率+5%
        // 2. 前后排距离越远，命中率越低
        // 3. 前排对后排伤害-10%，后排对前排伤害+10%
        
        rows.forEach(attackerRow => {
            cols.forEach(attackerCol => {
                rows.forEach(defenderRow => {
                    cols.forEach(defenderCol => {
                        const key = `${attackerRow}_${attackerCol}_to_${defenderRow}_${defenderCol}`;
                        
                        let hitModifier = 1.0;
                        let damageModifier = 1.0;
                        
                        // 同排加成
                        if (attackerRow === defenderRow) {
                            hitModifier *= 1.05;
                        }
                        
                        // 前后排关系
                        const rowOrder = [PositionRow.FRONT, PositionRow.MIDDLE, PositionRow.BACK];
                        const attackerRowIndex = rowOrder.indexOf(attackerRow);
                        const defenderRowIndex = rowOrder.indexOf(defenderRow);
                        const rowDiff = Math.abs(attackerRowIndex - defenderRowIndex);
                        
                        // 距离越远命中越低
                        hitModifier *= Math.pow(0.95, rowDiff);
                        
                        // 前后排伤害修正
                        if (attackerRow === PositionRow.FRONT && defenderRow === PositionRow.BACK) {
                            damageModifier *= 0.9; // 前排打后排伤害降低
                        } else if (attackerRow === PositionRow.BACK && defenderRow === PositionRow.FRONT) {
                            damageModifier *= 1.1; // 后排打前排伤害增加
                        }
                        
                        effects[key] = { hitModifier, damageModifier };
                    });
                });
            });
        });
        
        return effects;
    }
    
    /**
     * 获取行间距离
     * @param {string} row1 - 行1
     * @param {string} row2 - 行2
     * @returns {number} 距离
     */
    _getRowDistance(row1, row2) {
        const rowOrder = [PositionRow.FRONT, PositionRow.MIDDLE, PositionRow.BACK];
        const index1 = rowOrder.indexOf(row1);
        const index2 = rowOrder.indexOf(row2);
        return Math.abs(index1 - index2);
    }
    
    /**
     * 检查两个位置是否相邻
     * @param {Object} pos1 - 位置1
     * @param {Object} pos2 - 位置2
     * @returns {boolean}
     */
    _arePositionsAdjacent(pos1, pos2) {
        const rowOrder = [PositionRow.FRONT, PositionRow.MIDDLE, PositionRow.BACK];
        const colOrder = [PositionColumn.LEFT, PositionColumn.CENTER, PositionColumn.RIGHT];
        
        const rowDiff = Math.abs(rowOrder.indexOf(pos1.row) - rowOrder.indexOf(pos2.row));
        const colDiff = Math.abs(colOrder.indexOf(pos1.col) - colOrder.indexOf(pos2.col));
        
        // 相邻包括上下左右和斜角
        return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
    }
    
    /**
     * 位置调整事件处理
     * @param {Character} character - 角色
     * @param {Object} oldPos - 旧位置
     * @param {Object} newPos - 新位置
     */
    _onPositionAdjusted(character, oldPos, newPos) {
        // 触发天赋、技能等效果
        console.log(`位置调整: ${character.name} 从 ${oldPos?.row}-${oldPos?.col} 移动到 ${newPos.row}-${newPos.col}`);
        
        // 实际游戏中应触发事件总线
        if (typeof window !== 'undefined' && window.gameEvents) {
            window.gameEvents.emit('positionAdjusted', {
                character,
                oldPosition: oldPos,
                newPosition: newPos
            });
        }
    }
    
    /**
     * 获取剩余的调整次数
     * @returns {number}
     */
    getRemainingAdjustments() {
        return this.positionAdjustments.maxPerBattle - this.positionAdjustments.used;
    }
    
    /**
     * 重置调整次数
     */
    resetAdjustments() {
        this.positionAdjustments.used = 0;
    }
    
    /**
     * 导出位置数据
     * @returns {Object}
     */
    toDict() {
        const positionData = {};
        
        for (const row of Object.values(PositionRow)) {
            positionData[row] = {};
            for (const col of Object.values(PositionColumn)) {
                const character = this.positions[row][col];
                positionData[row][col] = character ? character.id : null;
            }
        }
        
        return {
            positions: positionData,
            adjustmentsUsed: this.positionAdjustments.used
        };
    }
    
    /**
     * 从字典导入位置数据
     * @param {Object} data - 位置数据
     * @param {Object} characterMap - 角色ID到实例的映射
     */
    fromDict(data, characterMap) {
        if (!data || !data.positions) return;
        
        this.clearAllPositions();
        
        for (const row of Object.values(PositionRow)) {
            if (data.positions[row]) {
                for (const col of Object.values(PositionColumn)) {
                    const characterId = data.positions[row][col];
                    if (characterId && characterMap[characterId]) {
                        this.placeCharacter(characterMap[characterId], row, col);
                    }
                }
            }
        }
        
        this.positionAdjustments.used = data.adjustmentsUsed || 0;
    }
}

export default PositionManager;