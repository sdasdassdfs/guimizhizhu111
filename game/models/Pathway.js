/**
 * 途径与序列数据模型
 */

/**
 * 序列数据类
 */
export class Sequence {
    constructor({
        level = '',           // 序列等级，如"序列9"
        name = '',           // 序列名称，如"占卜家"
        coreAbility = '',    // 核心能力描述
        materials = '',      // 晋升材料需求
        ritual = '',         // 仪式要求
        notes = ''           // 备注
    } = {}) {
        this.level = level;
        this.name = name;
        this.coreAbility = coreAbility;
        this.materials = materials;
        this.ritual = ritual;
        this.notes = notes;
    }

    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            level: this.level,
            name: this.name,
            coreAbility: this.coreAbility,
            materials: this.materials,
            ritual: this.ritual,
            notes: this.notes
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {Sequence}
     */
    static fromDict(data) {
        return new Sequence({
            level: data.level || '',
            name: data.name || '',
            coreAbility: data.coreAbility || '',
            materials: data.materials || '',
            ritual: data.ritual || '',
            notes: data.notes || ''
        });
    }
}

/**
 * 途径数据类
 */
export class Pathway {
    constructor({
        id = '',           // 途径标识符，如"fool"
        nameZh = '',       // 中文名称，如"愚者途径"
        theme = '',        // 途径主题
        sequences = {}     // 序列字典，键为数字（如"9"）
    } = {}) {
        this.id = id;
        this.nameZh = nameZh;
        this.theme = theme;
        this.sequences = sequences;

        // 确保序列键为字符串
        this._normalizeSequenceKeys();
    }

    /**
     * 规范化序列键为字符串
     */
    _normalizeSequenceKeys() {
        const normalized = {};
        Object.entries(this.sequences).forEach(([key, value]) => {
            normalized[String(key)] = value;
        });
        this.sequences = normalized;
    }

    /**
     * 获取指定序列等级的数据
     * @param {string} level - 序列等级（如"9"）
     * @returns {Sequence|null}
     */
    getSequence(level) {
        return this.sequences[String(level)] || null;
    }

    /**
     * 添加序列
     * @param {Sequence} sequence - 序列对象
     */
    addSequence(sequence) {
        // 从level中提取数字，如"序列9" -> "9"
        const levelMatch = sequence.level.match(/序列\s*(\d+)/);
        const levelNum = levelMatch ? levelMatch[1] : sequence.level.replace('序列', '').trim();
        this.sequences[levelNum] = sequence;
    }

    /**
     * 转换为字典
     * @returns {Object}
     */
    toDict() {
        return {
            id: this.id,
            nameZh: this.nameZh,
            theme: this.theme,
            sequences: Object.fromEntries(
                Object.entries(this.sequences).map(([k, v]) => [k, v.toDict()])
            )
        };
    }

    /**
     * 从字典创建
     * @param {Object} data - 字典数据
     * @returns {Pathway}
     */
    static fromDict(data) {
        let sequences = {};
        if (data.sequences) {
            Object.entries(data.sequences).forEach(([key, value]) => {
                sequences[key] = Sequence.fromDict(value);
            });
        }

        return new Pathway({
            id: data.id || '',
            nameZh: data.nameZh || '',
            theme: data.theme || '',
            sequences: sequences
        });
    }

    /**
     * 从JSON文件加载途径列表
     * @param {string} filepath - JSON文件路径
     * @returns {Promise<Pathway[]>}
     */
    static async loadFromJson(filepath) {
        try {
            const response = await fetch(filepath);
            if (!response.ok) {
                throw new Error(`Failed to load ${filepath}: ${response.status}`);
            }
            const data = await response.json();
            
            const pathways = [];
            data.forEach(item => {
                pathways.push(Pathway.fromDict(item));
            });
            
            return pathways;
        } catch (error) {
            console.error('Error loading pathways:', error);
            return [];
        }
    }
}

/**
 * 途径组（相邻途径）
 */
export class PathwayGroup {
    constructor({
        groupId = 0,
        pathwayIds = [],
        description = ''
    } = {}) {
        this.groupId = groupId;
        this.pathwayIds = pathwayIds;
        this.description = description;
    }

    toDict() {
        return {
            groupId: this.groupId,
            pathwayIds: this.pathwayIds,
            description: this.description
        };
    }

    static fromDict(data) {
        return new PathwayGroup({
            groupId: data.groupId || 0,
            pathwayIds: data.pathwayIds || [],
            description: data.description || ''
        });
    }
}

/**
 * 加载预定义的途径组（基于策划文档）
 * @returns {PathwayGroup[]}
 */
export function loadPathwayGroups() {
    const groupsData = [
        {
            groupId: 1,
            pathwayIds: ['fool', 'door', 'error'],
            description: '愚者、门、错误途径组'
        },
        {
            groupId: 2,
            pathwayIds: ['judge', 'black_emperor'],
            description: '审判者、黑皇帝途径组'
        },
        {
            groupId: 3,
            pathwayIds: ['visionary', 'sun', 'tyrant', 'hanged_man', 'white_tower'],
            description: '空想家、太阳、暴君、倒吊人、白塔途径组'
        },
        {
            groupId: 4,
            pathwayIds: ['darkness', 'dusk_giant', 'death'],
            description: '黑暗、黄昏巨人、死神途径组'
        },
        {
            groupId: 5,
            pathwayIds: ['red_priest', 'witch'],
            description: '红祭司、魔女途径组'
        },
        {
            groupId: 6,
            pathwayIds: ['mother', 'moon'],
            description: '母亲、月亮途径组'
        },
        {
            groupId: 7,
            pathwayIds: ['abyss', 'bound'],
            description: '深渊、被缚者途径组'
        },
        {
            groupId: 8,
            pathwayIds: ['hermit', 'perfectionist'],
            description: '隐者、完美者途径组'
        },
        {
            groupId: 9,
            pathwayIds: ['wheel_of_fortune'],
            description: '命运之轮途径组'
        }
    ];

    return groupsData.map(g => PathwayGroup.fromDict(g));
}