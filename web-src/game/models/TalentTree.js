/**
 * 天赋树数据模型
 */
import { TalentNode } from './TalentNode.js';

/**
 * 天赋树类
 */
export class TalentTree {
    constructor({
        id = '',
        name = '',
        pathwayId = null,
        rootNodeId = '',
        nodes = {},
        maxTalentPoints = 100,
        respecCostFormula = 'gold = level * 100',
        unlockLevel = 1,
        unlockSequence = null
    } = {}) {
        this.id = id;
        this.name = name;
        this.pathwayId = pathwayId;
        this.rootNodeId = rootNodeId;
        this.nodes = {};
        this.maxTalentPoints = maxTalentPoints;
        this.respecCostFormula = respecCostFormula;
        this.unlockLevel = unlockLevel;
        this.unlockSequence = unlockSequence;
        
        // 转换节点数据为TalentNode实例
        Object.entries(nodes).forEach(([nodeId, nodeData]) => {
            this.nodes[nodeId] = TalentNode.fromDict(nodeData);
        });
    }
    
    /**
     * 获取根节点
     * @returns {TalentNode|null}
     */
    getRootNode() {
        return this.nodes[this.rootNodeId] || null;
    }
    
    /**
     * 获取节点之间的连接关系
     * @returns {Array} 连接数组 [{from: nodeId, to: nodeId, type: 'required'}]
     */
    getConnections() {
        const connections = [];
        
        Object.values(this.nodes).forEach(node => {
            node.prerequisites.forEach(prereqId => {
                if (this.nodes[prereqId]) {
                    connections.push({
                        from: prereqId,
                        to: node.id,
                        type: 'required'
                    });
                }
            });
        });
        
        return connections;
    }
    
    /**
     * 获取可激活的天赋节点列表
     * @param {Set} unlockedNodes - 已解锁节点ID集合
     * @param {number} characterLevel - 角色等级
     * @param {string} characterSequence - 角色当前序列
     * @returns {TalentNode[]} 可激活的节点数组
     */
    getAvailableNodes(unlockedNodes, characterLevel, characterSequence) {
        const available = [];
        const unlockedSet = new Set(unlockedNodes);
        
        Object.values(this.nodes).forEach(node => {
            // 检查是否已激活
            if (unlockedSet.has(node.id)) {
                return;
            }
            
            // 检查是否满足基本要求
            if (!node.meetsBasicRequirements(characterLevel, characterSequence)) {
                return;
            }
            
            // 检查前置天赋
            const hasPrerequisites = node.prerequisites.every(prereqId => 
                unlockedSet.has(prereqId)
            );
            
            if (!hasPrerequisites) {
                return;
            }
            
            // 检查互斥天赋
            const hasExclusiveConflict = node.exclusiveWith.some(exclusiveId =>
                unlockedSet.has(exclusiveId)
            );
            
            if (hasExclusiveConflict) {
                return;
            }
            
            available.push(node);
        });
        
        return available;
    }
    
    /**
     * 激活天赋节点
     * @param {string} nodeId - 要激活的节点ID
     * @param {Set} unlockedNodes - 已解锁节点ID集合
     * @param {number} characterLevel - 角色等级
     * @param {string} characterSequence - 角色当前序列
     * @returns {Object} {success: boolean, node: TalentNode|null, reasons: string[]}
     */
    activateNode(nodeId, unlockedNodes, characterLevel, characterSequence) {
        const node = this.nodes[nodeId];
        if (!node) {
            return {
                success: false,
                node: null,
                reasons: [`天赋节点 ${nodeId} 不存在`]
            };
        }
        
        const unlockedSet = new Set(unlockedNodes);
        const checkResult = node.checkActivationConditions(
            unlockedSet, 
            characterLevel, 
            characterSequence
        );
        
        if (!checkResult.canActivate) {
            return {
                success: false,
                node: node,
                reasons: checkResult.reasons
            };
        }
        
        // 添加节点到已解锁集合
        unlockedSet.add(nodeId);
        
        // 返回新的集合（转换为数组）
        return {
            success: true,
            node: node,
            unlockedNodes: Array.from(unlockedSet),
            reasons: []
        };
    }
    
    /**
     * 重置天赋树
     * @param {Set} unlockedNodes - 已解锁节点ID集合
     * @returns {Set} 重置后的节点集合（只包含根节点）
     */
    respecTree(unlockedNodes) {
        const newSet = new Set();
        
        // 保留根节点（如果存在）
        if (this.rootNodeId) {
            newSet.add(this.rootNodeId);
        }
        
        return newSet;
    }
    
    /**
     * 计算洗点消耗
     * @param {number} characterLevel - 角色等级
     * @param {number} talentPointsSpent - 已花费的天赋点数
     * @returns {number} 金币消耗
     */
    calculateRespecCost(characterLevel, talentPointsSpent) {
        // 解析公式字符串
        if (this.respecCostFormula === 'gold = level * 100') {
            return characterLevel * 100;
        } else if (this.respecCostFormula === 'gold = points * 50') {
            return talentPointsSpent * 50;
        }
        
        // 默认公式
        return Math.max(characterLevel * 50, talentPointsSpent * 25);
    }
    
    /**
     * 获取天赋树中所有节点的总天赋点需求
     * @returns {number} 总天赋点数
     */
    getTotalTalentPointRequirement() {
        return Object.values(this.nodes).reduce((total, node) => {
            return total + node.cost;
        }, 0);
    }
    
    /**
     * 获取指定类型的天赋节点
     * @param {string} type - 天赋类型（combat/utility/pathway/team/skill_enhancement）
     * @returns {TalentNode[]} 节点数组
     */
    getNodesByType(type) {
        return Object.values(this.nodes).filter(node => node.type === type);
    }
    
    /**
     * 获取指定层级的天赋节点
     * @param {number} tier - 层级（1-5）
     * @returns {TalentNode[]} 节点数组
     */
    getNodesByTier(tier) {
        return Object.values(this.nodes).filter(node => node.tier === tier);
    }
    
    /**
     * 检查天赋树是否已解锁（基于角色等级和序列）
     * @param {number} characterLevel - 角色等级
     * @param {string} characterSequence - 角色当前序列
     * @returns {boolean}
     */
    isUnlocked(characterLevel, characterSequence) {
        if (characterLevel < this.unlockLevel) {
            return false;
        }
        
        if (this.unlockSequence) {
            const requiredNum = parseInt(this.unlockSequence.replace('序列', ''));
            const currentNum = parseInt(characterSequence.replace('序列', ''));
            if (currentNum > requiredNum) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        const nodesDict = {};
        Object.entries(this.nodes).forEach(([nodeId, node]) => {
            nodesDict[nodeId] = node.toDict();
        });
        
        return {
            id: this.id,
            name: this.name,
            pathwayId: this.pathwayId,
            rootNodeId: this.rootNodeId,
            nodes: nodesDict,
            maxTalentPoints: this.maxTalentPoints,
            respecCostFormula: this.respecCostFormula,
            unlockLevel: this.unlockLevel,
            unlockSequence: this.unlockSequence
        };
    }
    
    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {TalentTree}
     */
    static fromDict(data) {
        return new TalentTree(data);
    }
    
    /**
     * 创建途径专属天赋树
     * @param {string} pathwayId - 途径ID
     * @param {Object} pathwayData - 途径数据
     * @returns {TalentTree}
     */
    static createPathwayTalentTree(pathwayId, pathwayData) {
        // 为每条途径创建基础天赋树结构
        // 实际实现中会从配置文件加载
        
        const baseNodes = {
            // 根节点：序列9觉醒
            [`${pathwayId}_tier1_root`]: {
                id: `${pathwayId}_tier1_root`,
                name: `${pathwayData.nameZh}觉醒`,
                description: `初步觉醒${pathwayData.nameZh}的非凡特性`,
                type: 'pathway',
                tier: 1,
                column: 0,
                prerequisites: [],
                requiredSequence: '序列9',
                requiredLevel: 1,
                cost: 0, // 根节点免费
                effects: [
                    {
                        type: 'stat_boost',
                        stat: 'intelligence',
                        value: 2
                    },
                    {
                        type: 'unlock_feature',
                        value: `unlock_${pathwayId}_basic`
                    }
                ],
                icon: 'icons/talents/pathway_root.png',
                colorTheme: '#8B0000'
            }
        };
        
        return new TalentTree({
            id: `tree_${pathwayId}`,
            name: `${pathwayData.nameZh}天赋树`,
            pathwayId: pathwayId,
            rootNodeId: `${pathwayId}_tier1_root`,
            nodes: baseNodes,
            maxTalentPoints: 100,
            respecCostFormula: 'gold = level * 100',
            unlockLevel: 1,
            unlockSequence: '序列9'
        });
    }
    
    /**
     * 创建通用天赋树
     * @returns {TalentTree}
     */
    static createGeneralTalentTree() {
        const nodes = {
            'general_tier1_survival': {
                id: 'general_tier1_survival',
                name: '生存本能',
                description: '基础生存能力提升',
                type: 'utility',
                tier: 1,
                column: 0,
                prerequisites: [],
                requiredSequence: null,
                requiredLevel: 1,
                cost: 1,
                effects: [
                    {
                        type: 'stat_boost',
                        stat: 'constitution',
                        value: 3
                    },
                    {
                        type: 'stat_boost',
                        stat: 'maxHealth',
                        value: 20
                    }
                ],
                icon: 'icons/talents/survival.png',
                colorTheme: '#2E8B57'
            },
            'general_tier1_combat': {
                id: 'general_tier1_combat',
                name: '战斗技巧',
                description: '基础战斗能力提升',
                type: 'combat',
                tier: 1,
                column: 1,
                prerequisites: [],
                requiredSequence: null,
                requiredLevel: 1,
                cost: 1,
                effects: [
                    {
                        type: 'stat_boost',
                        stat: 'strength',
                        value: 2
                    },
                    {
                        type: 'stat_boost',
                        stat: 'agility',
                        value: 2
                    }
                ],
                icon: 'icons/talents/combat.png',
                colorTheme: '#8B4513'
            }
        };
        
        return new TalentTree({
            id: 'tree_general',
            name: '通用天赋树',
            pathwayId: null,
            rootNodeId: 'general_tier1_survival',
            nodes: nodes,
            maxTalentPoints: 50,
            respecCostFormula: 'gold = points * 50',
            unlockLevel: 1,
            unlockSequence: null
        });
    }
}