/**
 * 游戏数据加载器
 */

/**
 * 加载JSON数据
 * @param {string} url - JSON文件URL
 * @returns {Promise<Object|null>}
 */
export async function loadJsonData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON data:', error);
        return null;
    }
}

/**
 * 加载途径数据
 * @param {string} dataDir - 数据目录路径
 * @returns {Promise<Array>}
 */
export async function loadPathways(dataDir = 'data/game') {
    const data = await loadJsonData(`${dataDir}/pathways.json`);
    return data || [];
}

/**
 * 加载物品数据
 * @param {string} dataDir - 数据目录路径
 * @returns {Promise<Object>}
 */
export async function loadItems(dataDir = 'data/game') {
    const data = await loadJsonData(`${dataDir}/items.json`);
    return data || { items: [] };
}

/**
 * 加载任务数据
 * @param {string} dataDir - 数据目录路径
 * @returns {Promise<Object>}
 */
export async function loadQuests(dataDir = 'data/game') {
    const data = await loadJsonData(`${dataDir}/quests.json`);
    return data || { quests: [] };
}

/**
 * 加载故事数据
 * @param {string} dataDir - 数据目录路径
 * @returns {Promise<Object>}
 */
export async function loadStory(dataDir = 'data/game') {
    const data = await loadJsonData(`${dataDir}/story.json`);
    return data || {};
}

/**
 * 初始化所有游戏数据
 * @param {string} dataDir - 数据目录路径
 * @returns {Promise<Object>}
 */
export async function initGameData(dataDir = 'data/game') {
    try {
        const [pathwaysData, itemsData, questsData, storyData] = await Promise.all([
            loadPathways(dataDir),
            loadItems(dataDir),
            loadQuests(dataDir),
            loadStory(dataDir)
        ]);

        return {
            pathways: pathwaysData,
            items: itemsData.items || [],
            quests: questsData.quests || [],
            story: storyData,
            loaded: true
        };
    } catch (error) {
        console.error('Failed to initialize game data:', error);
        return {
            pathways: [],
            items: [],
            quests: [],
            story: {},
            loaded: false
        };
    }
}

export default {
    loadJsonData,
    loadPathways,
    loadItems,
    loadQuests,
    loadStory,
    initGameData
};