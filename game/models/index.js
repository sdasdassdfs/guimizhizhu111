/**
 * 游戏数据模型导出入口
 */

// 属性与背景相关
export { Attribute, AttributeSet, Background } from './Attribute.js';

// 角色相关
export { Character, createCharacter } from './Character.js';

// 途径相关
export { Pathway, Sequence, PathwayGroup, loadPathwayGroups } from './Pathway.js';

// 任务相关
export {
    QuestType,
    QuestStatus,
    ObjectiveType,
    Objective,
    Reward,
    Quest,
    QuestLog
} from './Quest.js';

// 物品相关
export {
    ItemType,
    EquipmentSlot,
    Item,
    Inventory
} from './Item.js';

// 天赋系统相关
export { TalentNode, TalentEffect } from './TalentNode.js';
export { TalentTree } from './TalentTree.js';

// 游戏状态与存档
export {
    GameState,
    SaveSlot,
    SaveSystem,
    createDefaultSaveSystem,
    quickSave,
    quickLoad
} from './GameState.js';