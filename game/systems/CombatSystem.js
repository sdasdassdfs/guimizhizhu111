/**
 * 战斗系统模块
 * 实现简单的回合制战斗逻辑
 */
import { AttributeSet } from '../models/index.js';

class Combatant {
    constructor({
        name,
        health,
        maxHealth,
        attributes,
        level,
        pathwayId = null,
        sequence = null
    }) {
        this.name = name;
        this.health = health;
        this.maxHealth = maxHealth;
        this.attributes = attributes;
        this.level = level;
        this.pathwayId = pathwayId;
        this.sequence = sequence;
    }

    isAlive() {
        return this.health > 0;
    }

    takeDamage(damage) {
        const actualDamage = Math.max(0, damage);
        this.health = Math.max(0, this.health - actualDamage);
        return actualDamage;
    }

    heal(amount) {
        const actualHeal = Math.max(0, amount);
        const newHealth = this.health + actualHeal;
        if (newHealth > this.maxHealth) {
            const recoverable = this.maxHealth - this.health;
            this.health = this.maxHealth;
            return recoverable;
        } else {
            this.health = newHealth;
            return actualHeal;
        }
    }

    calculateAttackDamage() {
        const baseDamage = Math.floor(this.attributes.strength / 2) + this.level;
        // 随机波动
        const variance = Math.floor(Math.random() * 5) - 2; // -2 到 2
        return Math.max(1, baseDamage + variance);
    }

    calculateDefense() {
        return Math.floor(this.attributes.constitution / 3);
    }
}

class CombatResult {
    constructor({
        victory,
        playerHealth,
        enemyHealth,
        rounds,
        rewards,
        events
    }) {
        this.victory = victory;
        this.playerHealth = playerHealth;
        this.enemyHealth = enemyHealth;
        this.rounds = rounds;
        this.rewards = rewards;
        this.events = events;
    }
}

export class CombatSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.player = null;
        this.enemy = null;
        this.round = 0;
        this.events = [];
    }

    /**
     * 创建敌人
     * @param {string} difficulty - 难度等级：'easy', 'normal', 'hard'
     * @returns {Combatant}
     */
    createEnemy(difficulty = 'normal') {
        // 根据难度生成敌人
        const char = this.gameState.character;

        let level, health, attrs;

        if (difficulty === 'easy') {
            level = Math.max(1, char.level - 1);
            health = 30 + level * 5;
            attrs = new AttributeSet({
                strength: 5 + level,
                agility: 4 + level,
                constitution: 6 + level,
                intelligence: 3 + level,
                perception: 3 + level,
                charisma: 2 + level
            });
        } else if (difficulty === 'hard') {
            level = char.level + 1;
            health = 50 + level * 8;
            attrs = new AttributeSet({
                strength: 8 + level,
                agility: 7 + level,
                constitution: 9 + level,
                intelligence: 5 + level,
                perception: 5 + level,
                charisma: 4 + level
            });
        } else { // normal
            level = char.level;
            health = 40 + level * 6;
            attrs = new AttributeSet({
                strength: 6 + level,
                agility: 5 + level,
                constitution: 7 + level,
                intelligence: 4 + level,
                perception: 4 + level,
                charisma: 3 + level
            });
        }

        // 随机敌人类型
        const enemyTypes = [
            ['失控的非凡者', 'judge'],
            ['隐秘组织成员', 'darkness'],
            ['怪物', 'dusk_giant'],
            ['灵界生物', 'fool']
        ];
        const [name, pathway] = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

        return new Combatant({
            name: name,
            health: health,
            maxHealth: health,
            attributes: attrs,
            level: level,
            pathwayId: pathway,
            sequence: String(level + 1) // 近似序列
        });
    }

    /**
     * 开始战斗
     * @param {Combatant} enemy - 敌人对象，如果为null则创建新敌人
     * @returns {CombatResult}
     */
    startCombat(enemy = null) {
        // 初始化玩家
        const char = this.gameState.character;
        this.player = new Combatant({
            name: char.name,
            health: char.health,
            maxHealth: char.maxHealth,
            attributes: char.attributes,
            level: char.level,
            pathwayId: char.currentPathwayId,
            sequence: char.currentSequence
        });

        // 创建敌人（如果未提供）
        if (enemy === null) {
            this.enemy = this.createEnemy();
        } else {
            this.enemy = enemy;
        }

        this.round = 0;
        this.events = [];

        this.events.push(`战斗开始！${this.player.name} 对阵 ${this.enemy.name}`);

        // 战斗循环
        while (this.player.isAlive() && this.enemy.isAlive()) {
            this.round += 1;
            this._processRound();

            // 限制最大回合数
            if (this.round >= 50) {
                this.events.push('战斗超时，平局！');
                break;
            }
        }

        // 判断胜负
        const victory = this.player.isAlive() && !this.enemy.isAlive();

        // 计算奖励
        const rewards = this._calculateRewards(victory);

        // 更新角色状态
        this._updatePlayerAfterCombat(victory);

        return new CombatResult({
            victory: victory,
            playerHealth: this.player.health,
            enemyHealth: this.enemy.health,
            rounds: this.round,
            rewards: rewards,
            events: this.events.slice()
        });
    }

    /**
     * 处理一个回合
     */
    _processRound() {
        this.events.push(`--- 第 ${this.round} 回合 ---`);

        // 玩家行动
        const playerDamage = this.player.calculateAttackDamage();
        const enemyDefense = this.enemy.calculateDefense();
        const actualDamage = Math.max(1, playerDamage - enemyDefense);

        const enemyTaken = this.enemy.takeDamage(actualDamage);
        this.events.push(`${this.player.name} 对 ${this.enemy.name} 造成 ${enemyTaken} 点伤害`);

        // 如果敌人死亡，结束
        if (!this.enemy.isAlive()) {
            this.events.push(`${this.enemy.name} 被击败！`);
            return;
        }

        // 敌人行动
        const enemyDamage = this.enemy.calculateAttackDamage();
        const playerDefense = this.player.calculateDefense();
        const actualDamage2 = Math.max(1, enemyDamage - playerDefense);

        const playerTaken = this.player.takeDamage(actualDamage2);
        this.events.push(`${this.enemy.name} 对 ${this.player.name} 造成 ${playerTaken} 点伤害`);

        // 显示状态
        this.events.push(`状态: ${this.player.name} HP:${this.player.health}/${this.player.maxHealth}, ${this.enemy.name} HP:${this.enemy.health}/${this.enemy.maxHealth}`);
    }

    /**
     * 计算战斗奖励
     * @param {boolean} victory - 是否胜利
     * @returns {Object}
     */
    _calculateRewards(victory) {
        if (!victory) {
            return { experience: 0, gold: 0, items: [] };
        }

        // 基础奖励
        const exp = this.enemy.level * 10 + 20;
        const gold = Math.floor(Math.random() * (this.enemy.level * 6)) + this.enemy.level * 5;

        // 小概率获得物品（简化：不依赖GameManager）
        const items = [];
        if (Math.random() < 0.3) { // 30%概率
            // 创建简单的消耗品
            items.push({
                id: 'minor_potion',
                name: '次级治疗药水',
                type: '消耗品',
                description: '恢复少量生命值',
                quantity: 1,
                value: 50,
                usable: true,
                consumableEffects: {
                    health: 20
                }
            });
        }

        return {
            experience: exp,
            gold: gold,
            items: items
        };
    }

    /**
     * 战斗后更新玩家状态
     * @param {boolean} victory - 是否胜利
     */
    _updatePlayerAfterCombat(victory) {
        if (!victory) {
            // 战斗失败：恢复部分生命
            this.gameState.character.health = Math.max(1, this.player.health);
            return;
        }

        // 战斗胜利：应用奖励
        const char = this.gameState.character;

        // 更新生命值
        char.health = this.player.health;

        // 增加经验值
        const rewards = this._calculateRewards(true);
        char.gainExperience(rewards.experience);

        // 增加金币
        char.gold += rewards.gold;

        // 添加物品到背包（简化：仅记录，实际需要Item类和Inventory类）
        if (rewards.items.length > 0) {
            console.log(`获得物品: ${rewards.items.map(item => item.name).join(', ')}`);
            // 在实际游戏中，这里需要将物品添加到背包
        }

        // 记录战斗时间
        const now = new Date();
        this.gameState.flags[`combat_victory_${this.round}`] = now.toISOString();

        // 自动保存（简化：仅记录）
        if (this.gameState.character.level > char.level) { // 升级了
            console.log('角色升级，需要保存游戏');
        }
    }
}

/**
 * 快速开始一场战斗
 * @param {Object} gameState - 游戏状态
 * @param {string} enemyDifficulty - 敌人难度
 * @returns {CombatResult}
 */
export function quickCombat(gameState, enemyDifficulty = 'normal') {
    const system = new CombatSystem(gameState);
    return system.startCombat();
}