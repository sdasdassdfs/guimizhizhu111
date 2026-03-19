/**
 * 成就管理器
 */

import { Achievement, AchievementData, AchievementType, RewardType } from '../models/Achievement.js';
import { CollectibleData } from '../models/Collectible.js';

export class AchievementManager {
    constructor(gameState = null) {
        this.gameState = gameState; // 引用游戏状态
        this.achievements = new Map();
        this._initializeAchievements();
    }

    /**
     * 初始化所有成就
     */
    _initializeAchievements() {
        for (const [id, achievement] of Object.entries(AchievementData)) {
            const newAchievement = new Achievement({
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
                type: achievement.type,
                icon: achievement.icon,
                requirements: achievement.requirements,
                rewards: achievement.rewards,
                hidden: achievement.hidden,
                flavorText: achievement.flavorText
            });
            this.achievements.set(id, newAchievement);
        }
    }

    /**
     * 检查并更新所有成就进度
     */
    updateAllProgress() {
        const context = this._buildContext();
        
        for (const achievement of this.achievements.values()) {
            if (!achievement.unlocked) {
                achievement.updateProgress(context);
                
                // 检查是否可以解锁
                if (achievement.checkRequirements(context)) {
                    this.unlockAchievement(achievement.id);
                }
            }
        }
    }

    /**
     * 构建成就检查上下文
     */
    _buildContext() {
        if (!this.gameState) {
            return {};
        }

        const context = {
            kills: {},
            totalKills: 0,
            collectibles: {},
            totalCollected: 0,
            skills: [],
            quests: {},
            completedQuests: 0
        };

        // 从游戏状态中提取击杀数据
        if (this.gameState.combatStats && this.gameState.combatStats.enemiesDefeated) {
            context.kills = { ...this.gameState.combatStats.enemiesDefeated };
            
            // 计算总击杀数
            context.totalKills = Object.values(context.kills).reduce((sum, count) => sum + count, 0);
        }

        // 从游戏状态中提取收集品数据
        if (this.gameState.collectibles) {
            context.collectibles = { ...this.gameState.collectibles };
            
            // 计算已获得收集品数量
            context.totalCollected = Object.values(context.collectibles).filter(item => item.obtained).length;
        }

        // 从游戏状态中提取技能数据
        if (this.gameState.character && this.gameState.character.skills) {
            context.skills = [...this.gameState.character.skills];
        }

        // 从游戏状态中提取任务数据
        if (this.gameState.quests) {
            context.quests = { ...this.gameState.quests };
            
            // 计算已完成任务数量
            context.completedQuests = Object.values(context.quests).filter(quest => quest.completed).length;
        }

        return context;
    }

    /**
     * 解锁指定成就
     */
    unlockAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) {
            return null;
        }

        if (achievement.unlock()) {
            this._grantRewards(achievement);
            this._notifyUnlock(achievement);
            return achievement;
        }

        return null;
    }

    /**
     * 发放成就奖励
     */
    _grantRewards(achievement) {
        if (!this.gameState) return;

        for (const reward of achievement.rewards) {
            switch (reward.type) {
                case RewardType.GOLD:
                    this.gameState.character.gold += reward.value;
                    break;
                    
                case RewardType.ITEM:
                    const itemId = reward.value;
                    const count = reward.count || 1;
                    
                    // 添加到收集品
                    if (CollectibleData[itemId]) {
                        if (!this.gameState.collectibles) {
                            this.gameState.collectibles = {};
                        }
                        
                        if (!this.gameState.collectibles[itemId]) {
                            this.gameState.collectibles[itemId] = CollectibleData[itemId];
                        }
                        
                        this.gameState.collectibles[itemId].obtain(count);
                    }
                    break;
                    
                case RewardType.TITLE:
                    if (!this.gameState.character.titles) {
                        this.gameState.character.titles = [];
                    }
                    
                    if (!this.gameState.character.titles.includes(reward.value)) {
                        this.gameState.character.titles.push(reward.value);
                    }
                    break;
                    
                case RewardType.UNLOCK:
                    // 解锁游戏功能（如收集品追踪）
                    // 这里可以根据value执行特定解锁逻辑
                    console.log(`解锁功能: ${reward.value}`);
                    break;
            }
        }
    }

    /**
     * 通知成就解锁（可重写为UI通知）
     */
    _notifyUnlock(achievement) {
        console.log(`🎉 成就解锁: ${achievement.name} - ${achievement.description}`);
        
        // 在实际游戏中，这里会触发UI显示成就解锁提示
        if (typeof window !== 'undefined' && window.showAchievementNotification) {
            window.showAchievementNotification(achievement);
        }
    }

    /**
     * 获取所有成就
     */
    getAllAchievements() {
        return Array.from(this.achievements.values());
    }

    /**
     * 获取已解锁成就
     */
    getUnlockedAchievements() {
        return this.getAllAchievements().filter(achievement => achievement.unlocked);
    }

    /**
     * 获取未解锁成就
     */
    getLockedAchievements() {
        return this.getAllAchievements().filter(achievement => !achievement.unlocked);
    }

    /**
     * 获取隐藏成就
     */
    getHiddenAchievements() {
        return this.getAllAchievements().filter(achievement => achievement.hidden);
    }

    /**
     * 获取成就进度
     */
    getAchievementProgress(achievementId) {
        const achievement = this.achievements.get(achievementId);
        return achievement ? achievement.progress : 0;
    }

    /**
     * 检查特定成就是否解锁
     */
    isAchievementUnlocked(achievementId) {
        const achievement = this.achievements.get(achievementId);
        return achievement ? achievement.unlocked : false;
    }

    /**
     * 处理事件（如敌人被击败、物品被收集等）
     */
    handleEvent(eventType, eventData) {
        // 根据事件类型更新游戏状态
        switch (eventType) {
            case 'enemy_defeated':
                this._handleEnemyDefeated(eventData);
                break;
                
            case 'item_collected':
                this._handleItemCollected(eventData);
                break;
                
            case 'skill_unlocked':
                this._handleSkillUnlocked(eventData);
                break;
                
            case 'quest_completed':
                this._handleQuestCompleted(eventData);
                break;
                
            default:
                break;
        }
        
        // 更新成就进度
        this.updateAllProgress();
    }

    /**
     * 处理敌人被击败事件
     */
    _handleEnemyDefeated(data) {
        if (!this.gameState) return;
        
        const { enemyId } = data;
        
        if (!this.gameState.combatStats) {
            this.gameState.combatStats = {
                enemiesDefeated: {},
                totalDamageDealt: 0,
                totalDamageTaken: 0
            };
        }
        
        if (!this.gameState.combatStats.enemiesDefeated) {
            this.gameState.combatStats.enemiesDefeated = {};
        }
        
        this.gameState.combatStats.enemiesDefeated[enemyId] = 
            (this.gameState.combatStats.enemiesDefeated[enemyId] || 0) + 1;
    }

    /**
     * 处理物品收集事件
     */
    _handleItemCollected(data) {
        if (!this.gameState) return;
        
        const { itemId, quantity = 1 } = data;
        
        if (!this.gameState.collectibles) {
            this.gameState.collectibles = {};
        }
        
        // 如果已有该收集品，增加数量
        if (this.gameState.collectibles[itemId]) {
            this.gameState.collectibles[itemId].obtain(quantity);
        } else if (CollectibleData[itemId]) {
            // 创建新的收集品记录
            const collectible = CollectibleData[itemId];
            this.gameState.collectibles[itemId] = collectible;
            this.gameState.collectibles[itemId].obtain(quantity);
        }
    }

    /**
     * 处理技能解锁事件
     */
    _handleSkillUnlocked(data) {
        if (!this.gameState) return;
        
        const { skillId } = data;
        
        if (!this.gameState.character) {
            this.gameState.character = {
                skills: []
            };
        }
        
        if (!this.gameState.character.skills.includes(skillId)) {
            this.gameState.character.skills.push(skillId);
        }
    }

    /**
     * 处理任务完成事件
     */
    _handleQuestCompleted(data) {
        if (!this.gameState) return;
        
        const { questId } = data;
        
        if (!this.gameState.quests) {
            this.gameState.quests = {};
        }
        
        if (!this.gameState.quests[questId]) {
            this.gameState.quests[questId] = { completed: true };
        } else {
            this.gameState.quests[questId].completed = true;
        }
    }

    /**
     * 转换为字典（用于序列化）
     */
    toDict() {
        const achievementsDict = {};
        
        for (const [id, achievement] of this.achievements.entries()) {
            achievementsDict[id] = achievement.toDict();
        }
        
        return achievementsDict;
    }

    /**
     * 从字典创建
     */
    static fromDict(data, gameState = null) {
        const manager = new AchievementManager(gameState);
        
        for (const [id, achievementData] of Object.entries(data)) {
            const achievement = Achievement.fromDict(achievementData);
            manager.achievements.set(id, achievement);
        }
        
        return manager;
    }

    /**
     * 与游戏状态同步（用于加载游戏时）
     */
    syncWithGameState(gameState) {
        this.gameState = gameState;
        this.updateAllProgress();
    }
}