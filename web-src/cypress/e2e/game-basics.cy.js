/**
 * 游戏基础功能端到端测试
 */
describe('《诡秘之主》网页游戏 - 基础测试', () => {
  it('页面加载成功', () => {
    cy.visit('/');
    cy.contains('诡秘之主').should('be.visible');
    cy.contains('序列之路').should('be.visible');
    cy.get('#command-input').should('be.visible');
    cy.get('#submit-command').should('be.visible');
  });
  
  it('帮助命令可用', () => {
    cy.executeCommand('帮助');
    cy.shouldSeeOutput('可用命令');
    cy.shouldSeeOutput('开始游戏');
    cy.shouldSeeOutput('保存进度');
  });
  
  it('快速动作按钮工作', () => {
    cy.clickQuickAction('开始游戏');
    cy.shouldSeeOutput('新游戏开始');
    
    cy.clickQuickAction('保存进度');
    cy.shouldSeeOutput('游戏进度已保存');
  });
  
  it('关于命令显示信息', () => {
    cy.executeCommand('关于');
    cy.shouldSeeOutput('《诡秘之主》网页交互式文字游戏');
    cy.shouldSeeOutput('爱潜水的乌贼');
  });
  
  it('清屏命令工作', () => {
    cy.executeCommand('帮助');
    cy.shouldSeeOutput('可用命令');
    
    cy.executeCommand('清屏');
    cy.get('#output-panel').then(($panel) => {
      // 清屏后应该只有"输出已清空"的消息
      const text = $panel.text();
      expect(text).to.include('输出已清空');
    });
  });
});

describe('游戏状态管理', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });
  
  it('开始游戏后状态更新', () => {
    cy.executeCommand('开始游戏');
    cy.shouldSeeOutput('新游戏开始');
    
    // 检查角色状态显示更新
    cy.get('#char-name').should('contain', '未创建'); // 名称未设置
    // 注意：开始游戏命令不会自动设置名称，后续会添加名称设置流程
  });
  
  it('保存和加载进度', () => {
    cy.executeCommand('开始游戏');
    cy.shouldSeeOutput('新游戏开始');
    
    cy.executeCommand('保存进度');
    cy.shouldSeeOutput('游戏进度已保存');
    
    // 重新加载页面
    cy.reload();
    
    cy.executeCommand('继续游戏');
    cy.shouldSeeOutput('游戏进度已加载');
  });
  
  it('未保存进度时继续游戏提示', () => {
    cy.clearLocalStorage();
    cy.executeCommand('继续游戏');
    cy.shouldSeeOutput('没有找到保存的游戏进度');
  });
});