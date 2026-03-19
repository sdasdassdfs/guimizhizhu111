/**
 * Character 单元测试
 */
import { Character, createCharacter } from '../game/models/Character.js';
import { Background } from '../game/models/Attribute.js';
import { AttributeSet } from '../game/models/Attribute.js';

describe('Character 类', () => {
  test('构造函数正确初始化基本属性', () => {
    const char = new Character({
      name: '克莱恩',
      background: Background.NOBLE
    });
    
    expect(char.name).toBe('克莱恩');
    expect(char.background).toBe(Background.NOBLE);
    expect(char.level).toBe(1);
    expect(char.experience).toBe(0);
    expect(char.health).toBeGreaterThan(0);
    expect(char.maxHealth).toBeGreaterThan(0);
    expect(char.spirit).toBeGreaterThan(0);
    expect(char.maxSpirit).toBeGreaterThan(0);
    expect(char.sanity).toBe(100);
    expect(char.gold).toBe(100);
    expect(char.inventorySlots).toBe(20);
    expect(char.currentPathwayId).toBeNull();
    expect(char.currentSequence).toBe('9');
  });

  test('gainExperience 方法正确升级', () => {
    const char = new Character({
      name: '测试角色',
      background: Background.COMMONER
    });
    const initialLevel = char.level;
    const initialIntelligence = char.attributes.intelligence;
    
    // 获得足够升级的经验（需要100点）
    char.gainExperience(150);
    
    expect(char.level).toBe(initialLevel + 1);
    expect(char.experience).toBe(50); // 150 - 100
    // 升级应该增加2点智力
    expect(char.attributes.intelligence).toBe(initialIntelligence + 2);
  });

  test('toDict 和 fromDict 序列化一致性', () => {
    const original = new Character({
      name: '序列化测试',
      background: Background.ORPHAN,
      attributes: new AttributeSet({
        strength: 12,
        intelligence: 15
      }),
      level: 5,
      experience: 250,
      health: 80,
      maxHealth: 120,
      spirit: 90,
      maxSpirit: 150,
      sanity: 85,
      gold: 500,
      inventorySlots: 30,
      currentPathwayId: 'fool',
      currentSequence: '8'
    });
    
    const dict = original.toDict();
    const restored = Character.fromDict(dict);
    
    expect(restored.name).toBe(original.name);
    expect(restored.background).toBe(original.background);
    expect(restored.attributes.strength).toBe(original.attributes.strength);
    expect(restored.attributes.intelligence).toBe(original.attributes.intelligence);
    expect(restored.level).toBe(original.level);
    expect(restored.experience).toBe(original.experience);
    expect(restored.health).toBe(original.health);
    expect(restored.maxHealth).toBe(original.maxHealth);
    expect(restored.spirit).toBe(original.spirit);
    expect(restored.maxSpirit).toBe(original.maxSpirit);
    expect(restored.sanity).toBe(original.sanity);
    expect(restored.gold).toBe(original.gold);
    expect(restored.inventorySlots).toBe(original.inventorySlots);
    expect(restored.currentPathwayId).toBe(original.currentPathwayId);
    expect(restored.currentSequence).toBe(original.currentSequence);
  });

  test('createCharacter 工厂函数', () => {
    const char = createCharacter('工厂创建', Background.MYSTIC);
    expect(char.name).toBe('工厂创建');
    expect(char.background).toBe(Background.MYSTIC);
    expect(char).toBeInstanceOf(Character);
  });
});