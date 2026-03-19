/**
 * 技能数据单元测试
 */
import fs from 'fs';
import path from 'path';

describe('技能数据配置', () => {
    const skillsDir = path.join(process.cwd(), 'web-src/game/skills');
    
    test('技能配置文件目录存在', () => {
        expect(fs.existsSync(skillsDir)).toBe(true);
    });
    
    describe('占卜家途径技能', () => {
        let fatePredictionData;
        let timeReversalData;
        
        beforeAll(() => {
            const fatePath = path.join(skillsDir, 'diviner_fate_prediction.json');
            const timePath = path.join(skillsDir, 'diviner_time_reversal.json');
            
            fatePredictionData = JSON.parse(fs.readFileSync(fatePath, 'utf8'));
            timeReversalData = JSON.parse(fs.readFileSync(timePath, 'utf8'));
        });
        
        test('命运预知技能配置正确', () => {
            expect(fatePredictionData.id).toBe('skill_fate_prediction');
            expect(fatePredictionData.name).toBe('命运预知');
            expect(fatePredictionData.pathway).toBe('占卜家');
            expect(fatePredictionData.type).toBeDefined();
            expect(fatePredictionData.spiritCost).toBeGreaterThanOrEqual(0);
            expect(fatePredictionData.cooldownTurns).toBeGreaterThanOrEqual(0);
            expect(fatePredictionData.effects).toBeDefined();
            expect(Array.isArray(fatePredictionData.effects)).toBe(true);
        });
        
        test('时间逆转技能配置正确', () => {
            expect(timeReversalData.id).toBe('skill_time_reversal');
            expect(timeReversalData.name).toBe('时间逆转');
            expect(timeReversalData.pathway).toBe('占卜家');
            expect(timeReversalData.type).toBe('heal');
            expect(timeReversalData.spiritCost).toBe(80);
            expect(timeReversalData.cooldownTurns).toBe(6);
            expect(timeReversalData.effects).toHaveLength(2);
        });
        
        test('技能效果配置完整', () => {
            fatePredictionData.effects.forEach(effect => {
                expect(effect.type).toBeDefined();
                expect(effect.description).toBeDefined();
            });
            
            timeReversalData.effects.forEach(effect => {
                expect(effect.type).toBeDefined();
            });
        });
    });
    
    describe('战士途径技能', () => {
        let berserkRageData;
        let ironWillData;
        
        beforeAll(() => {
            const berserkPath = path.join(skillsDir, 'warrior_berserk_rage.json');
            const ironPath = path.join(skillsDir, 'warrior_iron_will.json');
            
            berserkRageData = JSON.parse(fs.readFileSync(berserkPath, 'utf8'));
            ironWillData = JSON.parse(fs.readFileSync(ironPath, 'utf8'));
        });
        
        test('狂暴之怒技能配置正确', () => {
            expect(berserkRageData.id).toBe('skill_berserk_rage');
            expect(berserkRageData.name).toBe('狂暴之怒');
            expect(berserkRageData.pathway).toBe('战士');
            expect(berserkRageData.type).toBe('buff');
            expect(berserkRageData.durationTurns).toBe(3);
            expect(berserkRageData.effects).toBeDefined();
        });
        
        test('钢铁意志技能配置正确', () => {
            expect(ironWillData.id).toBe('skill_iron_will');
            expect(ironWillData.name).toBe('钢铁意志');
            expect(ironWillData.pathway).toBe('战士');
            expect(ironWillData.spiritCost).toBe(50);
            expect(ironWillData.target).toBe('party');
            expect(ironWillData.isAOE).toBe(true);
        });
        
        test('战士技能包含攻击提升效果', () => {
            const attackBoost = berserkRageData.effects.find(e => e.type === 'attackBoost');
            expect(attackBoost).toBeDefined();
            expect(attackBoost.value).toBe(0.6);
        });
        
        test('战士技能包含防御提升效果', () => {
            const defenseBoost = ironWillData.effects.find(e => e.type === 'defenseBoost');
            expect(defenseBoost).toBeDefined();
            expect(defenseBoost.value).toBe(0.4);
        });
    });
    
    describe('水手途径技能', () => {
        let tidalWaveData;
        let deepWhisperData;
        
        beforeAll(() => {
            const tidalPath = path.join(skillsDir, 'sailor_tidal_wave.json');
            const whisperPath = path.join(skillsDir, 'sailor_deep_whisper.json');
            
            tidalWaveData = JSON.parse(fs.readFileSync(tidalPath, 'utf8'));
            deepWhisperData = JSON.parse(fs.readFileSync(whisperPath, 'utf8'));
        });
        
        test('潮汐冲击技能配置正确', () => {
            expect(tidalWaveData.id).toBe('skill_tidal_wave');
            expect(tidalWaveData.name).toBe('潮汐冲击');
            expect(tidalWaveData.pathway).toBe('水手');
            expect(tidalWaveData.type).toBe('attack');
            expect(tidalWaveData.element).toBe('water');
            expect(tidalWaveData.damageFormula).toBeDefined();
        });
        
        test('深海低语技能配置正确', () => {
            expect(deepWhisperData.id).toBe('skill_deep_whisper');
            expect(deepWhisperData.name).toBe('深海低语');
            expect(deepWhisperData.pathway).toBe('水手');
            expect(deepWhisperData.type).toBe('debuff');
            expect(deepWhisperData.durationTurns).toBe(2);
        });
        
        test('水手技能包含控制效果', () => {
            const confusionEffect = deepWhisperData.effects.find(e => e.type === 'confusion');
            expect(confusionEffect).toBeDefined();
            expect(confusionEffect.value).toBe(0.7);
        });
        
        test('潮汐冲击包含击退效果', () => {
            const knockbackEffect = tidalWaveData.effects.find(e => e.type === 'knockback');
            expect(knockbackEffect).toBeDefined();
            expect(knockbackEffect.value).toBe(0.3);
        });
    });
    
    describe('技能数据完整性', () => {
        let allSkillFiles = [];
        
        beforeAll(() => {
            if (fs.existsSync(skillsDir)) {
                allSkillFiles = fs.readdirSync(skillsDir).filter(file => file.endsWith('.json'));
            }
        });
        
        test('至少包含6个技能文件', () => {
            expect(allSkillFiles.length).toBeGreaterThanOrEqual(6);
        });
        
        test('所有技能文件可解析为有效JSON', () => {
            allSkillFiles.forEach(file => {
                const filePath = path.join(skillsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                expect(() => JSON.parse(content)).not.toThrow();
            });
        });
        
        test('技能ID唯一', () => {
            const skillIds = new Set();
            allSkillFiles.forEach(file => {
                const filePath = path.join(skillsDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                expect(skillIds.has(data.id)).toBe(false);
                skillIds.add(data.id);
            });
        });
    });
});