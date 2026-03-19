import { NPC } from '../models/NPC.js';

/**
 * NPC管理器类
 */
export class NPCManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.recruitedNpcs = new Map(); // npcId -> NPC实例
        this.npcCatalog = new Map();    // templateId -> 图鉴信息
        this.teamPositions = new Map(); // 战斗位置分配
        
        this.maxTeamSize = 6;
        this.maxBattleSize = 4;
        this.npcTemplates = new Map();  // templateId -> 模板数据
        
        // 默认团队配置
        this.defaultTeamConfig = {
            npcIds: [],
            positions: {}
        };
    }
    
    /**
     * 初始化NPC管理器
     */
    async initialize() {
        await this._loadNpcTemplates();
        await this._loadRecruitedNpcs();
        await this._loadCatalog();
        
        console.log(`NPC管理器初始化完成，已加载${this.npcTemplates.size}个模板，${this.recruitedNpcs.size}个已招募NPC`);
    }
    
    /**
     * 加载NPC模板
     */
    async _loadNpcTemplates() {
        try {
            // 加载所有稀有度目录的模板
            const rarities = ['common', 'rare', 'legendary'];
            
            for (const rarity of rarities) {
                const indexPath = `data/npcs/templates/${rarity}/index.json`;
                const response = await fetch(indexPath);
                
                if (!response.ok) {
                    console.warn(`无法加载${rarity}模板索引: ${indexPath}`);
                    continue;
                }
                
                const indexData = await response.json();
                const templateIds = indexData.templates || [];
                
                for (const templateId of templateIds) {
                    const templatePath = `data/npcs/templates/${rarity}/${templateId}.json`;
                    const templateResponse = await fetch(templatePath);
                    
                    if (templateResponse.ok) {
                        const templateData = await templateResponse.json();
                        this.npcTemplates.set(templateId, templateData);
                    } else {
                        console.warn(`无法加载NPC模板: ${templatePath}`);
                    }
                }
            }
        } catch (error) {
            console.error('加载NPC模板失败:', error);
        }
    }
    
    /**
     * 加载已招募NPC
     */
    async _loadRecruitedNpcs() {
        try {
            const playerId = this.gameState.playerId || 'default_player';
            const response = await fetch(`data/npcs/recruited/${playerId}/index.json`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.npcs && Array.isArray(data.npcs)) {
                    data.npcs.forEach(npcData => {
                        try {
                            const npc = NPC.fromDict(npcData);
                            this.recruitedNpcs.set(npc.npcId, npc);
                        } catch (error) {
                            console.error(`解析NPC数据失败:`, npcData, error);
                        }
                    });
                }
            } else {
                console.log(`未找到玩家${playerId}的NPC数据，将使用空数据`);
            }
        } catch (error) {
            console.error('加载已招募NPC失败:', error);
        }
    }
    
    /**
     * 加载图鉴数据
     */
    async _loadCatalog() {
        try {
            const response = await fetch('data/npcs/catalog/index.json');
            if (response.ok) {
                const data = await response.json();
                if (data.entries && Array.isArray(data.entries)) {
                    data.entries.forEach(entry => {
                        this.npcCatalog.set(entry.templateId, entry);
                    });
                }
            }
        } catch (error) {
            console.error('加载NPC图鉴失败:', error);
        }
    }
    
    /**
     * 获取NPC模板
     * @param {string} templateId - 模板ID
     * @returns {Object|null} 模板数据
     */
    getTemplate(templateId) {
        return this.npcTemplates.get(templateId) || null;
    }
    
    /**
     * 获取所有NPC模板
     * @returns {Array} 模板数组
     */
    getAllTemplates() {
        return Array.from(this.npcTemplates.values());
    }
    
    /**
     * 根据稀有度获取模板
     * @param {string} rarity - 稀有度
     * @returns {Array} 模板数组
     */
    getTemplatesByRarity(rarity) {
        return this.getAllTemplates().filter(template => template.rarity === rarity);
    }
    
    /**
     * 检查野外击杀招募条件
     * @param {Object} enemy - 敌人数据
     * @returns {Object|null} 可招募NPC信息，或null
     */
    checkWildKillRecruitment(enemy) {
        if (!enemy || !enemy.type) {
            return null;
        }
        
        // 查找所有可野外击杀招募的NPC
        const possibleNpcs = this.getAllTemplates().filter(template => {
            const conditions = template.recruitmentConditions;
            return conditions && conditions.type === 'wild_kill';
        });
        
        for (const template of possibleNpcs) {
            const conditions = template.recruitmentConditions;
            
            // 检查概率
            const roll = Math.random();
            if (roll > (conditions.triggerChance || 0)) {
                continue;
            }
            
            // 检查前置NPC条件
            if (conditions.prerequisiteNpcs && conditions.prerequisiteNpcs.length > 0) {
                const hasPrerequisites = conditions.prerequisiteNpcs.every(
                    prereqId => this._hasRecruitedNpcByTemplate(prereqId)
                );
                if (!hasPrerequisites) {
                    continue;
                }
            }
            
            return {
                template: template,
                requiredItems: conditions.requiredItems || [],
                requiredGold: conditions.requiredGold || 0,
                description: `击败${enemy.name || '敌人'}后，你发现了可招募的${template.name}`,
                recruitmentType: 'wild_kill'
            };
        }
        
        return null;
    }
    
    /**
     * 检查剧情触发招募条件
     * @param {string} questId - 任务ID
     * @returns {Array} 可招募NPC列表
     */
    checkStoryRecruitment(questId) {
        const recruitments = [];
        
        this.getAllTemplates().forEach(template => {
            const conditions = template.recruitmentConditions;
            
            if (conditions && conditions.type === 'story_trigger' && 
                conditions.requiredQuestId === questId) {
                
                // 检查前置条件
                let canRecruit = true;
                if (conditions.prerequisiteNpcs && conditions.prerequisiteNpcs.length > 0) {
                    canRecruit = conditions.prerequisiteNpcs.every(
                        prereqId => this._hasRecruitedNpcByTemplate(prereqId)
                    );
                }
                
                if (canRecruit) {
                    recruitments.push({
                        template: template,
                        requiredItems: conditions.requiredItems || [],
                        requiredGold: conditions.requiredGold || 0,
                        description: `完成剧情任务后，${template.name}表示愿意加入你的队伍`,
                        recruitmentType: 'story_trigger'
                    });
                }
            }
        });
        
        return recruitments;
    }
    
    /**
     * 执行NPC招募
     * @param {Object} template - NPC模板
     * @param {string} instanceId - 实例ID
     * @returns {boolean} 是否成功
     */
    async recruitNpc(template, instanceId) {
        if (!template || !instanceId) {
            console.error('招募NPC失败：缺少模板或实例ID');
            return false;
        }
        
        // 检查资源是否足够
        const canAfford = this._checkRecruitmentCost(template);
        if (!canAfford) {
            console.error(`招募${template.name}失败：资源不足`);
            return false;
        }
        
        // 扣除资源
        this._deductRecruitmentCost(template);
        
        // 创建NPC实例
        const npc = NPC.fromTemplate(template, instanceId);
        
        // 保存到已招募列表
        this.recruitedNpcs.set(npc.npcId, npc);
        
        // 更新图鉴
        this._updateCatalogForTemplate(template.templateId, true);
        
        // 保存数据
        await this._saveRecruitedNpcs();
        
        // 触发游戏事件
        this._triggerRecruitmentEvent(npc);
        
        console.log(`成功招募NPC: ${npc.name} (${npc.npcId})`);
        return true;
    }
    
    /**
     * 检查招募所需资源
     */
    _checkRecruitmentCost(template) {
        const conditions = template.recruitmentConditions;
        const playerGold = this.gameState.playerGold || 0;
        
        // 检查金币
        if (playerGold < (conditions.requiredGold || 0)) {
            return false;
        }
        
        // 检查物品
        if (conditions.requiredItems) {
            for (const itemReq of conditions.requiredItems) {
                const playerItemCount = this.gameState.inventory 
                    ? this.gameState.inventory.getItemCount(itemReq.itemId) 
                    : 0;
                if (playerItemCount < itemReq.quantity) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * 扣除招募资源
     */
    _deductRecruitmentCost(template) {
        const conditions = template.recruitmentConditions;
        
        // 扣除金币
        if (this.gameState.playerGold !== undefined) {
            this.gameState.playerGold -= (conditions.requiredGold || 0);
            this.gameState.playerGold = Math.max(0, this.gameState.playerGold);
        }
        
        // 扣除物品
        if (conditions.requiredItems && this.gameState.inventory) {
            conditions.requiredItems.forEach(itemReq => {
                this.gameState.inventory.removeItem(itemReq.itemId, itemReq.quantity);
            });
        }
    }
    
    /**
     * 更新图鉴
     */
    _updateCatalogForTemplate(templateId, discovered) {
        const entry = this.npcCatalog.get(templateId);
        if (entry) {
            entry.isDiscovered = discovered;
            entry.discoveredAt = discovered ? new Date().toISOString() : null;
            if (discovered && !entry.firstDiscoveryPlayer) {
                entry.firstDiscoveryPlayer = this.gameState.playerId || 'default_player';
            }
        }
    }
    
    /**
     * 触发招募事件
     */
    _triggerRecruitmentEvent(npc) {
        // 触发游戏内事件
        if (this.gameState.triggerEvent) {
            this.gameState.triggerEvent('npc_recruited', {
                npcId: npc.npcId,
                npcName: npc.name,
                rarity: npc.rarity,
                type: npc.type,
                level: npc.level
            });
        }
    }
    
    /**
     * 检查是否已招募特定模板的NPC
     */
    _hasRecruitedNpcByTemplate(templateId) {
        return Array.from(this.recruitedNpcs.values()).some(npc => npc.templateId === templateId);
    }
    
    /**
     * 获取已招募NPC列表
     * @returns {Array} NPC实例数组
     */
    getRecruitedNpcs() {
        return Array.from(this.recruitedNpcs.values());
    }
    
    /**
     * 根据ID获取NPC
     * @param {string} npcId - NPC ID
     * @returns {NPC|null} NPC实例
     */
    getNpcById(npcId) {
        return this.recruitedNpcs.get(npcId) || null;
    }
    
    /**
     * 根据模板ID获取已招募NPC
     * @param {string} templateId - 模板ID
     * @returns {Array} NPC实例数组
     */
    getNpcsByTemplate(templateId) {
        return this.getRecruitedNpcs().filter(npc => npc.templateId === templateId);
    }
    
    /**
     * 配置战斗团队
     * @param {Array} npcIds - NPC ID列表
     * @param {Object} positions - 位置分配 {npcId: position}
     * @returns {boolean} 是否成功
     */
    configureBattleTeam(npcIds, positions) {
        // 验证数量
        if (npcIds.length > this.maxBattleSize) {
            console.error(`战斗团队最多${this.maxBattleSize}人，当前${npcIds.length}人`);
            return false;
        }
        
        // 验证NPC存在且已招募
        for (const npcId of npcIds) {
            if (!this.recruitedNpcs.has(npcId)) {
                console.error(`NPC ${npcId} 未招募，无法加入战斗团队`);
                return false;
            }
        }
        
        // 更新位置
        Object.entries(positions).forEach(([npcId, position]) => {
            const npc = this.recruitedNpcs.get(npcId);
            if (npc && ['front', 'middle', 'back'].includes(position)) {
                npc.teamPosition = position;
            }
        });
        
        // 保存配置
        this._saveTeamConfiguration(npcIds, positions);
        
        console.log(`战斗团队配置完成: ${npcIds.length}名NPC`);
        return true;
    }
    
    /**
     * 获取当前战斗团队
     * @returns {Array} NPC实例数组
     */
    getBattleTeam() {
        const config = this._loadTeamConfiguration();
        return config.npcIds
            .map(id => this.recruitedNpcs.get(id))
            .filter(npc => npc !== undefined);
    }
    
    /**
     * 获取图鉴信息
     * @returns {Array} 图鉴条目数组
     */
    getCatalogEntries() {
        return Array.from(this.npcCatalog.values());
    }
    
    /**
     * 获取已发现的图鉴比例
     * @returns {number} 发现比例 (0-1)
     */
    getDiscoveryRate() {
        const entries = this.getCatalogEntries();
        if (entries.length === 0) return 0;
        
        const discovered = entries.filter(entry => entry.isDiscovered).length;
        return discovered / entries.length;
    }
    
    /**
     * 保存已招募NPC数据
     */
    async _saveRecruitedNpcs() {
        try {
            const playerId = this.gameState.playerId || 'default_player';
            const npcsArray = this.getRecruitedNpcs().map(npc => npc.toDict());
            
            const data = {
                version: '1.0.0',
                playerId: playerId,
                savedAt: new Date().toISOString(),
                npcs: npcsArray
            };
            
            // 在实际实现中，这里会调用存储模块保存数据
            console.log('保存NPC数据:', data);
            
            // 保存到localStorage作为临时方案
            localStorage.setItem(`npc_data_${playerId}`, JSON.stringify(data));
        } catch (error) {
            console.error('保存NPC数据失败:', error);
        }
    }
    
    /**
     * 加载团队配置
     */
    _loadTeamConfiguration() {
        try {
            const saved = localStorage.getItem('npc_team_config');
            return saved ? JSON.parse(saved) : this.defaultTeamConfig;
        } catch (error) {
            console.error('加载团队配置失败:', error);
            return this.defaultTeamConfig;
        }
    }
    
    /**
     * 保存团队配置
     */
    _saveTeamConfiguration(npcIds, positions) {
        try {
            const config = { npcIds, positions };
            localStorage.setItem('npc_team_config', JSON.stringify(config));
        } catch (error) {
            console.error('保存团队配置失败:', error);
        }
    }
    
    /**
     * 生成NPC实例ID
     * @param {string} templateId - 模板ID
     * @returns {string} 实例ID
     */
    generateInstanceId(templateId) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `npc_${templateId}_${timestamp}_${randomStr}`;
    }
    
    /**
     * 获取推荐团队组合
     * @returns {Array} 推荐组合数组
     */
    getRecommendedTeamCompositions() {
        const compositions = [];
        const recruited = this.getRecruitedNpcs();
        
        if (recruited.length === 0) {
            return compositions;
        }
        
        // 基础平衡组合：1前排+1中排+1后排
        const frontliners = recruited.filter(npc => npc.teamPosition === 'front');
        const midline = recruited.filter(npc => npc.teamPosition === 'middle');
        const backline = recruited.filter(npc => npc.teamPosition === 'back');
        
        if (frontliners.length > 0 && midline.length > 0 && backline.length > 0) {
            compositions.push({
                name: '平衡型团队',
                description: '标准的1前排+1中排+1后排组合，攻防平衡',
                npcIds: [frontliners[0].npcId, midline[0].npcId, backline[0].npcId],
                strategy: '前排承受伤害，中排输出，后排支援'
            });
        }
        
        // 防御型组合：2前排+1后排
        if (frontliners.length >= 2 && backline.length > 0) {
            compositions.push({
                name: '防御型团队',
                description: '2前排提供坚实防线，1后排提供支援',
                npcIds: [frontliners[0].npcId, frontliners[1].npcId, backline[0].npcId],
                strategy: '双前排交替承受伤害，后排专注治疗和增益'
            });
        }
        
        // 进攻型组合：1前排+2中排
        if (frontliners.length > 0 && midline.length >= 2) {
            compositions.push({
                name: '进攻型团队',
                description: '1前排保护，2中排全力输出',
                npcIds: [frontliners[0].npcId, midline[0].npcId, midline[1].npcId],
                strategy: '前排吸引火力，双中排快速消灭敌人'
            });
        }
        
        return compositions;
    }
}