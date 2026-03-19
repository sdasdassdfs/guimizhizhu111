/**
 * 敌人数据单元测试
 */
import fs from 'fs';
import path from 'path';

describe('敌人数据配置', () => {
    const enemiesDir = path.join(process.cwd(), 'web-src/game/enemies');
    
    test('敌人配置文件目录存在', () => {
        expect(fs.existsSync(enemiesDir)).toBe(true);
    });
    
    describe('牧羊人敌人配置', () => {
        let shepherdData;
        
        beforeAll(() => {
            const filePath = path.join(enemiesDir, 'shepherd.json');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            shepherdData = JSON.parse(fileContent);
        });
        
        test('配置包含必需字段', () => {
            expect(shepherdData.id).toBeDefined();
            expect(shepherdData.name).toBeDefined();
            expect(shepherdData.sequence).toBeDefined();
            expect(shepherdData.health).toBeDefined();
            expect(shepherdData.maxHealth).toBeDefined();
            expect(shepherdData.attack).toBeDefined();
            expect(shepherdData.defense).toBeDefined();
            expect(shepherdData.skills).toBeDefined();
            expect(Array.isArray(shepherdData.skills)).toBe(true);
            expect(shepherdData.lootTable).toBeDefined();
            expect(Array.isArray(shepherdData.lootTable)).toBe(true);
        });
        
        test('序列等级正确', () => {
            expect(shepherdData.sequence).toBe('5');
        });
        
        test('生命值为正数', () => {
            expect(shepherdData.health).toBeGreaterThan(0);
            expect(shepherdData.maxHealth).toBeGreaterThan(0);
            expect(shepherdData.health).toBe(shepherdData.maxHealth);
        });
        
        test('技能列表非空', () => {
            expect(shepherdData.skills.length).toBeGreaterThan(0);
        });
        
        test('掉落表配置正确', () => {
            shepherdData.lootTable.forEach(item => {
                expect(item.itemId).toBeDefined();
                expect(item.name).toBeDefined();
                expect(item.chance).toBeGreaterThan(0);
                expect(item.chance).toBeLessThanOrEqual(1);
                expect(item.minCount).toBeGreaterThanOrEqual(1);
                expect(item.maxCount).toBeGreaterThanOrEqual(item.minCount);
            });
        });
    });
    
    describe('猎魔人敌人配置', () => {
        let demonHunterData;
        
        beforeAll(() => {
            const filePath = path.join(enemiesDir, 'demon_hunter.json');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            demonHunterData = JSON.parse(fileContent);
        });
        
        test('配置包含必需字段', () => {
            expect(demonHunterData.id).toBeDefined();
            expect(demonHunterData.name).toBeDefined();
            expect(demonHunterData.sequence).toBeDefined();
            expect(demonHunterData.health).toBeDefined();
            expect(demonHunterData.attack).toBeDefined();
            expect(demonHunterData.defense).toBeDefined();
        });
        
        test('序列等级正确', () => {
            expect(demonHunterData.sequence).toBe('4');
        });
        
        test('属性值为正数', () => {
            expect(demonHunterData.health).toBeGreaterThan(0);
            expect(demonHunterData.attack).toBeGreaterThan(0);
            expect(demonHunterData.defense).toBeGreaterThan(0);
        });
    });
    
    describe('恐惧主教敌人配置', () => {
        let fearBishopData;
        
        beforeAll(() => {
            const filePath = path.join(enemiesDir, 'fear_bishop.json');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            fearBishopData = JSON.parse(fileContent);
        });
        
        test('配置包含必需字段', () => {
            expect(fearBishopData.id).toBeDefined();
            expect(fearBishopData.name).toBeDefined();
            expect(fearBishopData.sequence).toBeDefined();
            expect(fearBishopData.health).toBeDefined();
            expect(fearBishopData.attack).toBeDefined();
            expect(fearBishopData.defense).toBeDefined();
        });
        
        test('序列等级正确', () => {
            expect(fearBishopData.sequence).toBe('3');
        });
        
        test('阶段配置存在', () => {
            expect(fearBishopData.phases).toBeDefined();
            expect(Array.isArray(fearBishopData.phases)).toBe(true);
            expect(fearBishopData.phases.length).toBeGreaterThan(0);
        });
        
        test('阶段阈值正确', () => {
            fearBishopData.phases.forEach(phase => {
                expect(phase.healthThreshold).toBeGreaterThan(0);
                expect(phase.healthThreshold).toBeLessThan(1);
                expect(phase.newSkills).toBeDefined();
                expect(phase.description).toBeDefined();
            });
        });
    });
});