/**
 * Pathway 单元测试
 */
import { Pathway, Sequence, PathwayGroup, loadPathwayGroups } from '../game/models/Pathway.js';

describe('Sequence 类', () => {
  test('构造函数正确初始化序列', () => {
    const seq = new Sequence({
      level: '序列9',
      name: '占卜家',
      coreAbility: '占卜、灵视',
      materials: '黑曜石粉末',
      ritual: '在月夜下进行',
      notes: '入门途径'
    });
    
    expect(seq.level).toBe('序列9');
    expect(seq.name).toBe('占卜家');
    expect(seq.coreAbility).toBe('占卜、灵视');
    expect(seq.materials).toBe('黑曜石粉末');
    expect(seq.ritual).toBe('在月夜下进行');
    expect(seq.notes).toBe('入门途径');
  });

  test('toDict 和 fromDict 序列化', () => {
    const original = new Sequence({
      level: '序列8',
      name: '小丑',
      coreAbility: '敏捷、伪装'
    });
    
    const dict = original.toDict();
    const restored = Sequence.fromDict(dict);
    
    expect(restored.level).toBe(original.level);
    expect(restored.name).toBe(original.name);
    expect(restored.coreAbility).toBe(original.coreAbility);
  });
});

describe('Pathway 类', () => {
  test('构造函数正确初始化途径', () => {
    const pathway = new Pathway({
      id: 'fool',
      nameZh: '愚者途径',
      theme: '诡秘、命运'
    });
    
    expect(pathway.id).toBe('fool');
    expect(pathway.nameZh).toBe('愚者途径');
    expect(pathway.theme).toBe('诡秘、命运');
    expect(pathway.sequences).toEqual({});
  });

  test('添加和获取序列', () => {
    const pathway = new Pathway({ id: 'fool' });
    const seq = new Sequence({
      level: '序列9',
      name: '占卜家'
    });
    
    pathway.addSequence(seq);
    
    const retrieved = pathway.getSequence('9');
    expect(retrieved).not.toBeNull();
    expect(retrieved.name).toBe('占卜家');
    expect(retrieved.level).toBe('序列9');
  });

  test('toDict 和 fromDict 序列化', () => {
    const original = new Pathway({
      id: 'door',
      nameZh: '门途径',
      theme: '空间、传送'
    });
    
    const seq1 = new Sequence({ level: '序列9', name: '学徒' });
    const seq2 = new Sequence({ level: '序列8', name: '戏法大师' });
    original.addSequence(seq1);
    original.addSequence(seq2);
    
    const dict = original.toDict();
    const restored = Pathway.fromDict(dict);
    
    expect(restored.id).toBe(original.id);
    expect(restored.nameZh).toBe(original.nameZh);
    expect(restored.theme).toBe(original.theme);
    
    const restoredSeq9 = restored.getSequence('9');
    expect(restoredSeq9.name).toBe('学徒');
    
    const restoredSeq8 = restored.getSequence('8');
    expect(restoredSeq8.name).toBe('戏法大师');
  });
});

describe('PathwayGroup 和工具函数', () => {
  test('PathwayGroup 序列化', () => {
    const group = new PathwayGroup({
      groupId: 1,
      pathwayIds: ['fool', 'door', 'error'],
      description: '测试组'
    });
    
    const dict = group.toDict();
    expect(dict.groupId).toBe(1);
    expect(dict.pathwayIds).toEqual(['fool', 'door', 'error']);
    expect(dict.description).toBe('测试组');
    
    const restored = PathwayGroup.fromDict(dict);
    expect(restored.groupId).toBe(1);
  });

  test('loadPathwayGroups 返回预定义组', () => {
    const groups = loadPathwayGroups();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]).toBeInstanceOf(PathwayGroup);
    expect(groups[0].pathwayIds).toBeDefined();
  });
});