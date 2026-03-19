/**
 * 角色创建系统模块
 * 处理角色创建、初始途径选择、属性点分配
 */
import { Character, Background, AttributeSet, Attribute } from '../models/index.js';

class CreationStep {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.completed = false;
    }
}

export class CharacterCreationSystem {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.characterData = {};
        this.availablePoints = 10;  // 初始属性点
        this.usedPoints = 0;
        this.pathways = [];

        this._initializeSteps();
    }

    /**
     * 初始化创建步骤
     */
    _initializeSteps() {
        this.steps = [
            new CreationStep('name', '输入角色姓名'),
            new CreationStep('background', '选择出身背景'),
            new CreationStep('pathway', '选择初始途径'),
            new CreationStep('attributes', '分配属性点'),
            new CreationStep('confirm', '确认创建')
        ];
    }

    /**
     * 设置途径数据
     * @param {Array} pathwaysData - 途径数据数组
     */
    setPathwaysData(pathwaysData) {
        this.pathways = pathwaysData;
    }

    /**
     * 获取可用的初始途径
     * @returns {Array}
     */
    getAvailablePathways() {
        return this.pathways;
    }

    /**
     * 根据ID获取途径
     * @param {string} pathwayId - 途径ID
     * @returns {Object|null}
     */
    getPathwayById(pathwayId) {
        return this.pathways.find(pathway => pathway.id === pathwayId) || null;
    }

    /**
     * 设置角色姓名
     * @param {string} name - 角色姓名
     * @returns {Array} [是否成功, 消息]
     */
    setCharacterName(name) {
        if (!name || name.trim().length === 0) {
            return [false, '角色姓名不能为空'];
        }

        if (name.length > 20) {
            return [false, '角色姓名过长（最多20个字符）'];
        }

        this.characterData.name = name.trim();
        this.steps[0].completed = true;
        return [true, `角色姓名设置为: ${name}`];
    }

    /**
     * 设置出身背景
     * @param {string} background - 背景值
     * @returns {Array} [是否成功, 消息]
     */
    setBackground(background) {
        this.characterData.background = background;

        // 根据背景设置初始属性加成
        const baseAttrs = new AttributeSet();

        if (background === Background.NOBLE) {
            baseAttrs.modify(Attribute.CHARISMA, 2);
            baseAttrs.modify(Attribute.INTELLIGENCE, 1);
        } else if (background === Background.COMMONER) {
            baseAttrs.modify(Attribute.CONSTITUTION, 2);
            baseAttrs.modify(Attribute.STRENGTH, 1);
        } else if (background === Background.ORPHAN) {
            baseAttrs.modify(Attribute.PERCEPTION, 2);
            baseAttrs.modify(Attribute.AGILITY, 1);
        } else if (background === Background.MYSTIC) {
            baseAttrs.modify(Attribute.INTELLIGENCE, 2);
            baseAttrs.modify(Attribute.PERCEPTION, 1);
        }

        this.characterData.baseAttributes = baseAttrs;
        this.steps[1].completed = true;
        return [true, `出身背景设置为: ${background}`];
    }

    /**
     * 设置初始途径
     * @param {string} pathwayId - 途径ID
     * @returns {Array} [是否成功, 消息]
     */
    setInitialPathway(pathwayId) {
        const pathway = this.getPathwayById(pathwayId);
        if (!pathway) {
            return [false, '途径不存在'];
        }

        this.characterData.initialPathway = pathwayId;
        this.characterData.initialSequence = '9';
        this.characterData.pathwayAffinities = { [pathwayId]: 3.0 };

        this.steps[2].completed = true;
        return [true, `初始途径设置为: ${pathway.nameZh}`];
    }

    /**
     * 分配属性点
     * @param {string} attribute - 属性枚举值
     * @param {number} points - 分配点数
     * @returns {Array} [是否成功, 消息]
     */
    allocateAttributePoints(attribute, points) {
        if (points <= 0) {
            return [false, '分配点数必须为正数'];
        }

        // 检查可用点数
        if (this.usedPoints + points > this.availablePoints) {
            return [false, `可用点数不足，剩余点数: ${this.availablePoints - this.usedPoints}`];
        }

        // 更新属性点
        if (!this.characterData.allocatedPoints) {
            this.characterData.allocatedPoints = {};
        }

        const current = this.characterData.allocatedPoints[attribute] || 0;
        this.characterData.allocatedPoints[attribute] = current + points;
        this.usedPoints += points;

        return [true, `已将${points}点分配到${attribute}`];
    }

    /**
     * 重置属性点分配
     * @returns {Array} [是否成功, 消息]
     */
    resetAttributePoints() {
        this.characterData.allocatedPoints = {};
        this.usedPoints = 0;
        return [true, '属性点分配已重置'];
    }

    /**
     * 获取属性分配摘要
     * @returns {string}
     */
    getAttributeSummary() {
        if (!this.characterData.baseAttributes) {
            return '属性未初始化';
        }

        const base = this.characterData.baseAttributes;
        const allocated = this.characterData.allocatedPoints || {};

        const lines = [
            '属性分配:',
            `  剩余点数: ${this.availablePoints - this.usedPoints}/${this.availablePoints}`,
            ''
        ];

        Object.values(Attribute).forEach(attr => {
            const baseValue = base[attr.toLowerCase()] || 0;
            const added = allocated[attr] || 0;
            const total = baseValue + added;

            lines.push(`  ${attr}: ${baseValue} + ${added} = ${total}`);
        });

        return lines.join('\n');
    }

    /**
     * 验证创建数据是否完整
     * @returns {Array} [是否有效, 错误列表]
     */
    validateCreation() {
        const errors = [];

        // 检查姓名
        if (!this.characterData.name) {
            errors.push('角色姓名未设置');
        }

        // 检查背景
        if (!this.characterData.background) {
            errors.push('出身背景未选择');
        }

        // 检查途径
        if (!this.characterData.initialPathway) {
            errors.push('初始途径未选择');
        }

        // 检查属性点分配
        if (this.usedPoints < this.availablePoints) {
            errors.push(`还有${this.availablePoints - this.usedPoints}点属性点未分配`);
        } else if (this.usedPoints > this.availablePoints) {
            errors.push('属性点分配超出限制');
        }

        return [errors.length === 0, errors];
    }

    /**
     * 创建角色
     * @returns {Object|null} 游戏状态对象
     */
    createCharacter() {
        // 验证数据
        const [isValid, errors] = this.validateCreation();
        if (!isValid) {
            console.error('创建数据不完整:');
            errors.forEach(error => console.error(`  - ${error}`));
            return null;
        }

        try {
            // 创建角色
            const character = new Character({
                name: this.characterData.name,
                background: this.characterData.background
            });

            // 应用属性点分配
            const baseAttrs = this.characterData.baseAttributes;
            const allocated = this.characterData.allocatedPoints || {};

            Object.entries(allocated).forEach(([attr, points]) => {
                baseAttrs.modify(attr, points);
            });

            // 更新角色属性
            character.attributes = baseAttrs;

            // 更新健康值和灵性值
            character.maxHealth = baseAttrs.constitution * 10;
            character.health = character.maxHealth;

            character.maxSpirit = (baseAttrs.intelligence + baseAttrs.perception) * 5;
            character.spirit = character.maxSpirit;

            // 设置当前途径和序列
            character.currentPathwayId = this.characterData.initialPathway;
            character.currentSequence = this.characterData.initialSequence;

            // 设置途径倾向
            character.pathwayAffinities = this.characterData.pathwayAffinities;

            // 标记步骤完成
            this.steps[3].completed = true;
            this.steps[4].completed = true;

            return {
                character: character,
                currentChapter: '第一章',
                currentLocation: '贝克兰德',
                gameTime: 0,
                created: true
            };

        } catch (error) {
            console.error(`创建角色失败: ${error}`);
            return null;
        }
    }

    /**
     * 获取背景选项
     * @returns {Array}
     */
    getBackgroundOptions() {
        return [
            {
                value: Background.NOBLE,
                text: '贵族后裔',
                description: '初始魅力+2,智力+1，更适合社会途径',
                recommendedPathways: ['judge', 'white_tower', 'sun']
            },
            {
                value: Background.COMMONER,
                text: '平民觉醒',
                description: '初始体质+2,力量+1，更适合战斗途径',
                recommendedPathways: ['dusk_giant', 'tyrant', 'red_priest']
            },
            {
                value: Background.ORPHAN,
                text: '教会孤儿',
                description: '初始感知+2,敏捷+1，更适合隐秘途径',
                recommendedPathways: ['darkness', 'death', 'eterny']
            },
            {
                value: Background.MYSTIC,
                text: '神秘遗孤',
                description: '初始智力+2,感知+1，更适合神秘途径',
                recommendedPathways: ['fool', 'door', 'hanged_man']
            }
        ];
    }

    /**
     * 获取当前创建进度
     * @returns {Object} 进度信息
     */
    getCurrentProgress() {
        const completed = this.steps.filter(step => step.completed).length;
        const total = this.steps.length;

        let status;
        if (completed === 0) {
            status = '尚未开始';
        } else if (completed < total) {
            status = `进行中 (${completed}/${total})`;
        } else {
            status = '已完成';
        }

        return {
            completed,
            total,
            status,
            currentStep: this.currentStep
        };
    }
}

/**
 * 快速创建角色（简化版）
 * @param {string} name - 角色姓名
 * @param {string} background - 出身背景
 * @param {string} pathwayId - 途径ID
 * @returns {Object|null}
 */
export function quickCharacterCreation(name, background, pathwayId) {
    const system = new CharacterCreationSystem();

    // 设置姓名
    const [nameSuccess, nameMsg] = system.setCharacterName(name);
    if (!nameSuccess) {
        console.error(nameMsg);
        return null;
    }

    // 设置背景
    const [bgSuccess, bgMsg] = system.setBackground(background);
    if (!bgSuccess) {
        console.error(bgMsg);
        return null;
    }

    // 设置途径
    const [pathSuccess, pathMsg] = system.setInitialPathway(pathwayId);
    if (!pathSuccess) {
        console.error(pathMsg);
        return null;
    }

    // 自动分配剩余属性点（平均分配到所有属性）
    const remaining = system.availablePoints;
    const attrs = Object.values(Attribute);
    const pointsPerAttr = Math.floor(remaining / attrs.length);
    const extra = remaining % attrs.length;

    attrs.forEach((attr, i) => {
        const points = pointsPerAttr + (i < extra ? 1 : 0);
        if (points > 0) {
            system.allocateAttributePoints(attr, points);
        }
    });

    // 创建角色
    return system.createCharacter();
}