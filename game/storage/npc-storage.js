/**
 * NPC存储处理模块
 * 专门处理NPC相关的JSON文件读写和版本控制
 */
export class NPCStorage {
    constructor() {
        this.basePath = 'data/npcs/';
        this.version = '1.0.0';
        this.storageType = 'local'; // 'local', 'indexeddb', 'api'
    }
    
    /**
     * 设置存储类型
     * @param {string} type - 存储类型
     */
    setStorageType(type) {
        const validTypes = ['local', 'indexeddb', 'api'];
        if (validTypes.includes(type)) {
            this.storageType = type;
        } else {
            console.warn(`无效的存储类型: ${type}，使用默认local`);
        }
    }
    
    /**
     * 加载NPC模板
     * @param {string} templateId - 模板ID
     * @returns {Promise<Object>} 模板数据
     */
    async loadTemplate(templateId) {
        if (!templateId) {
            console.error('加载NPC模板失败：缺少templateId');
            return null;
        }
        
        // 确定稀有度
        const rarity = this._getRarityFromTemplateId(templateId);
        const path = `${this.basePath}templates/${rarity}/${templateId}.json`;
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`模板文件不存在: ${path}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`加载NPC模板失败: ${path}`, error);
            return null;
        }
    }
    
    /**
     * 加载所有NPC模板
     * @returns {Promise<Array>} 模板列表
     */
    async loadAllTemplates() {
        const rarities = ['common', 'rare', 'legendary'];
        const templates = [];
        
        for (const rarity of rarities) {
            try {
                // 首先加载索引文件
                const indexPath = `${this.basePath}templates/${rarity}/index.json`;
                const indexResponse = await fetch(indexPath);
                
                if (!indexResponse.ok) {
                    console.warn(`无法加载${rarity}模板索引: ${indexPath}`);
                    continue;
                }
                
                const indexData = await indexResponse.json();
                const templateIds = indexData.templates || [];
                
                // 并行加载所有模板
                const templatePromises = templateIds.map(async (templateId) => {
                    const template = await this.loadTemplate(templateId);
                    return template;
                });
                
                const loadedTemplates = (await Promise.allSettled(templatePromises))
                    .filter(result => result.status === 'fulfilled' && result.value)
                    .map(result => result.value);
                
                templates.push(...loadedTemplates);
                
            } catch (error) {
                console.error(`加载${rarity}模板失败:`, error);
            }
        }
        
        return templates;
    }
    
    /**
     * 保存玩家招募的NPC
     * @param {string} playerId - 玩家ID
     * @param {Array} npcs - NPC数据数组
     * @returns {Promise<boolean>} 是否成功
     */
    async saveRecruitedNpcs(playerId, npcs) {
        if (!playerId || !Array.isArray(npcs)) {
            console.error('保存NPC数据失败：参数无效');
            return false;
        }
        
        const data = {
            version: this.version,
            playerId: playerId,
            savedAt: new Date().toISOString(),
            npcs: npcs
        };
        
        try {
            switch (this.storageType) {
                case 'local':
                    return this._saveToLocalStorage(playerId, data);
                case 'indexeddb':
                    return await this._saveToIndexedDB(playerId, data);
                case 'api':
                    return await this._saveToAPI(playerId, data);
                default:
                    console.error(`未知存储类型: ${this.storageType}`);
                    return false;
            }
        } catch (error) {
            console.error('保存NPC数据失败:', error);
            return false;
        }
    }
    
    /**
     * 加载玩家招募的NPC
     * @param {string} playerId - 玩家ID
     * @returns {Promise<Array>} NPC数据数组
     */
    async loadRecruitedNpcs(playerId) {
        if (!playerId) {
            console.error('加载NPC数据失败：缺少playerId');
            return [];
        }
        
        try {
            switch (this.storageType) {
                case 'local':
                    return this._loadFromLocalStorage(playerId);
                case 'indexeddb':
                    return await this._loadFromIndexedDB(playerId);
                case 'api':
                    return await this._loadFromAPI(playerId);
                default:
                    console.error(`未知存储类型: ${this.storageType}`);
                    return [];
            }
        } catch (error) {
            console.error('加载NPC数据失败:', error);
            return [];
        }
    }
    
    /**
     * 更新图鉴数据
     * @param {string} templateId - 模板ID
     * @param {boolean} discovered - 是否已发现
     * @returns {Promise<boolean>} 是否成功
     */
    async updateCatalog(templateId, discovered) {
        if (!templateId) {
            console.error('更新图鉴失败：缺少templateId');
            return false;
        }
        
        try {
            // 加载现有图鉴
            const catalogPath = `${this.basePath}catalog/index.json`;
            const response = await fetch(catalogPath);
            
            let catalog = { entries: [] };
            if (response.ok) {
                catalog = await response.json();
            }
            
            // 查找或创建条目
            let entry = catalog.entries.find(e => e.templateId === templateId);
            if (!entry) {
                entry = {
                    templateId: templateId,
                    isDiscovered: discovered,
                    discoveredAt: discovered ? new Date().toISOString() : null,
                    firstDiscoveryPlayer: discovered ? this._getCurrentPlayerId() : null
                };
                catalog.entries.push(entry);
            } else {
                entry.isDiscovered = discovered;
                if (discovered && !entry.discoveredAt) {
                    entry.discoveredAt = new Date().toISOString();
                    entry.firstDiscoveryPlayer = this._getCurrentPlayerId();
                }
            }
            
            // 保存更新（使用localStorage作为临时方案）
            localStorage.setItem('npc_catalog_data', JSON.stringify(catalog));
            
            console.log(`图鉴更新: ${templateId} -> ${discovered ? '已发现' : '未发现'}`);
            return true;
        } catch (error) {
            console.error('更新图鉴失败:', error);
            return false;
        }
    }
    
    /**
     * 获取图鉴统计
     * @returns {Promise<Object>} 统计信息
     */
    async getCatalogStats() {
        try {
            // 首先尝试从localStorage加载
            const savedCatalog = localStorage.getItem('npc_catalog_data');
            let entries = [];
            
            if (savedCatalog) {
                const catalog = JSON.parse(savedCatalog);
                entries = catalog.entries || [];
            } else {
                // 回退到文件加载
                const catalogPath = `${this.basePath}catalog/index.json`;
                const response = await fetch(catalogPath);
                
                if (response.ok) {
                    const catalog = await response.json();
                    entries = catalog.entries || [];
                }
            }
            
            const discovered = entries.filter(e => e.isDiscovered).length;
            
            return {
                total: entries.length,
                discovered: discovered,
                discoveryRate: entries.length > 0 ? (discovered / entries.length) : 0,
                byRarity: this._groupByRarity(entries)
            };
        } catch (error) {
            console.error('获取图鉴统计失败:', error);
            return { total: 0, discovered: 0, discoveryRate: 0, byRarity: {} };
        }
    }
    
    /**
     * 保存NPC团队配置
     * @param {string} playerId - 玩家ID
     * @param {Object} config - 团队配置
     * @returns {Promise<boolean>} 是否成功
     */
    async saveTeamConfiguration(playerId, config) {
        try {
            const key = `npc_team_config_${playerId}`;
            localStorage.setItem(key, JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('保存团队配置失败:', error);
            return false;
        }
    }
    
    /**
     * 加载NPC团队配置
     * @param {string} playerId - 玩家ID
     * @returns {Promise<Object>} 团队配置
     */
    async loadTeamConfiguration(playerId) {
        try {
            const key = `npc_team_config_${playerId}`;
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : { npcIds: [], positions: {} };
        } catch (error) {
            console.error('加载团队配置失败:', error);
            return { npcIds: [], positions: {} };
        }
    }
    
    /**
     * 导出NPC数据（用于备份）
     * @param {string} playerId - 玩家ID
     * @returns {Promise<string>} JSON字符串
     */
    async exportNpcData(playerId) {
        try {
            const npcs = await this.loadRecruitedNpcs(playerId);
            const catalog = await this.getCatalogStats();
            const teamConfig = await this.loadTeamConfiguration(playerId);
            
            const exportData = {
                version: this.version,
                exportedAt: new Date().toISOString(),
                playerId: playerId,
                npcs: npcs,
                catalog: catalog,
                teamConfig: teamConfig
            };
            
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('导出NPC数据失败:', error);
            return '';
        }
    }
    
    /**
     * 导入NPC数据（用于恢复）
     * @param {string} playerId - 玩家ID
     * @param {string} jsonData - JSON数据
     * @returns {Promise<boolean>} 是否成功
     */
    async importNpcData(playerId, jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            // 验证版本
            if (importData.version !== this.version) {
                console.warn(`版本不匹配: 导入${importData.version}，当前${this.version}`);
                // 这里可以添加版本迁移逻辑
            }
            
            // 恢复数据
            if (importData.npcs && Array.isArray(importData.npcs)) {
                await this.saveRecruitedNpcs(playerId, importData.npcs);
            }
            
            if (importData.teamConfig) {
                await this.saveTeamConfiguration(playerId, importData.teamConfig);
            }
            
            console.log(`NPC数据导入成功: ${playerId}`);
            return true;
        } catch (error) {
            console.error('导入NPC数据失败:', error);
            return false;
        }
    }
    
    /**
     * 清理过期数据
     * @param {string} playerId - 玩家ID
     * @param {number} daysOld - 天数阈值
     * @returns {Promise<boolean>} 是否成功
     */
    async cleanupOldData(playerId, daysOld = 30) {
        try {
            // 获取当前时间
            const now = new Date();
            const threshold = new Date(now.getTime() - daysOld * 24 * 60 * 60 * 1000);
            
            // 加载现有数据
            const npcs = await this.loadRecruitedNpcs(playerId);
            
            // 过滤掉太久未活跃的NPC
            const activeNpcs = npcs.filter(npc => {
                // 这里可以根据最后战斗时间、最后登录时间等判断
                // 简化处理：保留所有数据
                return true;
            });
            
            // 保存过滤后的数据
            await this.saveRecruitedNpcs(playerId, activeNpcs);
            
            console.log(`数据清理完成: 保留${activeNpcs.length}/${npcs.length}个NPC`);
            return true;
        } catch (error) {
            console.error('清理数据失败:', error);
            return false;
        }
    }
    
    // ========== 私有方法 ==========
    
    /**
     * 保存到localStorage
     */
    _saveToLocalStorage(playerId, data) {
        try {
            const key = `npc_recruited_${playerId}`;
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存到localStorage失败:', error);
            return false;
        }
    }
    
    /**
     * 从localStorage加载
     */
    _loadFromLocalStorage(playerId) {
        try {
            const key = `npc_recruited_${playerId}`;
            const saved = localStorage.getItem(key);
            
            if (!saved) {
                return [];
            }
            
            const data = JSON.parse(saved);
            
            // 版本检查
            if (data.version !== this.version) {
                console.warn(`NPC数据版本不匹配: ${data.version} -> ${this.version}`);
                // 这里可以添加版本迁移逻辑
            }
            
            return data.npcs || [];
        } catch (error) {
            console.error('从localStorage加载失败:', error);
            return [];
        }
    }
    
    /**
     * 保存到IndexedDB
     */
    async _saveToIndexedDB(playerId, data) {
        // IndexedDB实现留待后续开发
        console.log('IndexedDB存储暂未实现，使用localStorage替代');
        return this._saveToLocalStorage(playerId, data);
    }
    
    /**
     * 从IndexedDB加载
     */
    async _loadFromIndexedDB(playerId) {
        // IndexedDB实现留待后续开发
        console.log('IndexedDB存储暂未实现，使用localStorage替代');
        return this._loadFromLocalStorage(playerId);
    }
    
    /**
     * 保存到API
     */
    async _saveToAPI(playerId, data) {
        // API实现留待后续开发
        console.log('API存储暂未实现，使用localStorage替代');
        return this._saveToLocalStorage(playerId, data);
    }
    
    /**
     * 从API加载
     */
    async _loadFromAPI(playerId) {
        // API实现留待后续开发
        console.log('API存储暂未实现，使用localStorage替代');
        return this._loadFromLocalStorage(playerId);
    }
    
    /**
     * 从模板ID提取稀有度
     */
    _getRarityFromTemplateId(templateId) {
        // 根据现有模板文件判断
        const templateMap = {
            'guardian_001': 'common',
            'mystic_001': 'common',
            'hunter_001': 'common',
            'witch_001': 'rare',
            'seer_001': 'rare',
            'angel_001': 'legendary',
            'ancient_one_001': 'legendary'
        };
        
        return templateMap[templateId] || 'common';
    }
    
    /**
     * 获取当前玩家ID
     */
    _getCurrentPlayerId() {
        return localStorage.getItem('player_id') || 'default_player';
    }
    
    /**
     * 按稀有度分组
     */
    _groupByRarity(entries) {
        const groups = {
            common: { total: 0, discovered: 0 },
            rare: { total: 0, discovered: 0 },
            legendary: { total: 0, discovered: 0 }
        };
        
        entries.forEach(entry => {
            const rarity = this._getRarityFromTemplateId(entry.templateId);
            if (groups[rarity]) {
                groups[rarity].total++;
                if (entry.isDiscovered) {
                    groups[rarity].discovered++;
                }
            }
        });
        
        // 计算发现率
        Object.keys(groups).forEach(rarity => {
            const group = groups[rarity];
            group.discoveryRate = group.total > 0 ? (group.discovered / group.total) : 0;
        });
        
        return groups;
    }
    
    /**
     * 获取存储统计信息
     * @returns {Object} 统计信息
     */
    getStorageStats() {
        const stats = {
            type: this.storageType,
            version: this.version,
            localStorage: {
                totalKeys: 0,
                npcKeys: 0,
                totalSize: 0
            }
        };
        
        try {
            // 计算localStorage使用情况
            let totalSize = 0;
            let npcKeys = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                
                if (value) {
                    totalSize += key.length + value.length;
                    
                    if (key.startsWith('npc_')) {
                        npcKeys++;
                    }
                }
            }
            
            stats.localStorage.totalKeys = localStorage.length;
            stats.localStorage.npcKeys = npcKeys;
            stats.localStorage.totalSize = totalSize;
            stats.localStorage.totalSizeMB = (totalSize / (1024 * 1024)).toFixed(4);
            
        } catch (error) {
            console.error('获取存储统计失败:', error);
        }
        
        return stats;
    }
}