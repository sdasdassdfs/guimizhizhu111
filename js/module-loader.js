/**
 * 《诡秘之主》网页游戏 - 模块加载器
 * 实现代码分割和按需加载，减少初始加载时间
 */

class ModuleLoader {
    constructor() {
        this.loadedModules = new Set();
        this.moduleCache = new Map();
        this.loadingPromises = new Map();
        
        // 预定义模块路径
        this.modulePaths = {
            'battle-system': '/ui/js/battle-system.js',
            'npc-manager': '/ui/js/npc-manager.js',
            'talent-tree': '/ui/js/talent-tree.js',
            'skill-upgrade': '/ui/js/skill-upgrade.js',
            'team-buff': '/ui/js/team-buff.js',
            'quest-system': '/ui/js/quest-system.js',
            'achievement-system': '/ui/js/achievement-system.js',
            'collection-system': '/ui/js/collection-system.js'
        };
        
        // 模块依赖关系
        this.moduleDependencies = {
            'battle-system': ['team-buff'],
            'talent-tree': ['npc-manager'],
            'skill-upgrade': ['npc-manager'],
            'team-buff': ['npc-manager']
        };
    }
    
    /**
     * 检查模块是否已加载
     * @param {string} moduleName - 模块名称
     * @returns {boolean}
     */
    isLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }
    
    /**
     * 加载单个模块
     * @param {string} moduleName - 模块名称
     * @returns {Promise}
     */
    async loadModule(moduleName) {
        // 如果已加载，直接返回
        if (this.isLoaded(moduleName)) {
            return Promise.resolve();
        }
        
        // 如果正在加载中，返回现有的Promise
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }
        
        // 检查模块路径是否存在
        if (!this.modulePaths[moduleName]) {
            console.error(`[ModuleLoader] 未知模块: ${moduleName}`);
            return Promise.reject(new Error(`未知模块: ${moduleName}`));
        }
        
        // 创建加载Promise
        const loadPromise = this._loadModuleWithDependencies(moduleName);
        this.loadingPromises.set(moduleName, loadPromise);
        
        // 加载完成后清理
        loadPromise.then(() => {
            this.loadingPromises.delete(moduleName);
        }).catch(error => {
            this.loadingPromises.delete(moduleName);
            throw error;
        });
        
        return loadPromise;
    }
    
    /**
     * 加载模块及其依赖
     * @param {string} moduleName - 模块名称
     * @returns {Promise}
     */
    async _loadModuleWithDependencies(moduleName) {
        // 先加载依赖
        const dependencies = this.moduleDependencies[moduleName] || [];
        
        for (const dep of dependencies) {
            if (!this.isLoaded(dep)) {
                await this.loadModule(dep);
            }
        }
        
        // 加载模块本身
        await this._loadScript(moduleName);
        
        // 标记为已加载
        this.loadedModules.add(moduleName);
        console.log(`[ModuleLoader] 模块加载完成: ${moduleName}`);
    }
    
    /**
     * 动态加载脚本
     * @param {string} moduleName - 模块名称
     * @returns {Promise}
     */
    _loadScript(moduleName) {
        return new Promise((resolve, reject) => {
            const scriptPath = this.modulePaths[moduleName];
            
            // 检查是否已在缓存中
            if (this.moduleCache.has(scriptPath)) {
                resolve();
                return;
            }
            
            // 创建script标签
            const script = document.createElement('script');
            script.src = scriptPath;
            script.async = true;
            
            // 加载成功
            script.onload = () => {
                this.moduleCache.set(scriptPath, true);
                resolve();
            };
            
            // 加载失败
            script.onerror = () => {
                reject(new Error(`加载失败: ${scriptPath}`));
            };
            
            // 添加到文档
            document.head.appendChild(script);
        });
    }
    
    /**
     * 批量加载模块
     * @param {string[]} moduleNames - 模块名称数组
     * @returns {Promise}
     */
    async loadModules(moduleNames) {
        const promises = moduleNames.map(name => this.loadModule(name));
        return Promise.all(promises);
    }
    
    /**
     * 预加载常用模块（不阻塞主线程）
     */
    preloadCommonModules() {
        // 预加载但不阻塞
        const commonModules = ['npc-manager', 'team-buff'];
        
        setTimeout(() => {
            commonModules.forEach(moduleName => {
                if (!this.isLoaded(moduleName)) {
                    this.loadModule(moduleName).catch(error => {
                        console.warn(`[ModuleLoader] 预加载失败 ${moduleName}:`, error);
                    });
                }
            });
        }, 3000); // 等待3秒后开始预加载
    }
    
    /**
     * 获取加载统计
     * @returns {object}
     */
    getStats() {
        return {
            loadedCount: this.loadedModules.size,
            cachedCount: this.moduleCache.size,
            pendingCount: this.loadingPromises.size,
            loadedModules: Array.from(this.loadedModules)
        };
    }
}

// 创建全局实例
window.ModuleLoader = new ModuleLoader();