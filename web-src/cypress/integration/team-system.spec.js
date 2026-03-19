/**
 * 团队养成系统端到端测试
 * 使用Cypress进行UI集成测试
 */

describe('团队养成系统端到端测试', () => {
  beforeEach(() => {
    // 访问游戏主页
    cy.visit('/');
    
    // 等待游戏加载
    cy.get('#game-container', { timeout: 10000 }).should('be.visible');
  });

  /**
   * 测试1: NPC图鉴系统
   */
  describe('NPC图鉴系统测试', () => {
    it('应能打开NPC图鉴界面', () => {
      // 假设有一个按钮可以打开图鉴
      cy.get('#open-cyclopedia-btn').click();
      
      // 验证图鉴模态框显示
      cy.get('#cyclopedia-modal').should('be.visible');
      
      // 验证标题正确
      cy.get('#cyclopedia-modal h2').should('contain', 'NPC 图鉴系统');
    });

    it('应显示NPC统计数据', () => {
      cy.get('#open-cyclopedia-btn').click();
      
      // 验证统计面板显示
      cy.get('.stats-panel').should('be.visible');
      
      // 验证各个统计项存在
      cy.get('.stat-card.total .stat-value').should('not.be.empty');
      cy.get('.stat-card.recruited .stat-value').should('not.be.empty');
      cy.get('.stat-card.available .stat-value').should('not.be.empty');
      cy.get('.stat-card.legendary .stat-value').should('not.be.empty');
    });

    it('应能过滤和搜索NPC', () => {
      cy.get('#open-cyclopedia-btn').click();
      
      // 选择稀有度过滤
      cy.get('#filter-rarity').select('rare');
      
      // 验证筛选结果
      cy.get('.npc-entry.rare').should('exist');
      
      // 搜索特定NPC
      cy.get('#search-input').type('阿尔杰');
      
      // 验证搜索结果
      cy.get('.npc-entry').should('contain', '阿尔杰');
    });

    it('应显示图鉴完成度', () => {
      cy.get('#open-cyclopedia-btn').click();
      
      // 验证完成度面板存在
      cy.get('.completion-panel').should('be.visible');
      
      // 验证进度条存在
      cy.get('.completion-fill').should('exist');
      
      // 验证百分比显示
      cy.get('#completion-percentage').should('not.be.empty');
    });
  });

  /**
   * 测试2: 团队管理系统
   */
  describe('团队管理系统测试', () => {
    it('应能打开团队管理界面', () => {
      // 假设有团队管理按钮
      cy.get('#open-team-manager-btn').click();
      
      // 验证团队管理界面显示
      cy.get('#team-modal').should('be.visible');
      
      cy.get('#team-modal h2').should('contain', '团队管理系统');
    });

    it('应显示团队成员和阵型', () => {
      cy.get('#open-team-manager-btn').click();
      
      // 验证团队成员区域存在
      cy.get('.team-members-section').should('be.visible');
      
      // 验证阵型网格存在
      cy.get('.position-grid-lg').should('be.visible');
      
      // 验证至少有一个团队成员
      cy.get('.member-card').should('have.length.at.least', 1);
    });

    it('应能调整团队阵型', () => {
      cy.get('#open-team-manager-btn').click();
      
      // 选择第一个团队成员
      cy.get('.member-card').first().click();
      
      // 点击移动按钮
      cy.get('.member-card').first()
        .find('[data-action="select-for-move"]').click();
      
      // 尝试拖放到一个空位置
      cy.get('.formation-cell').first()
        .trigger('dragover')
        .trigger('drop');
      
      // 验证调整次数减少（如果有显示）
      cy.get('#remaining-adjustments-lg').then($el => {
        const text = $el.text();
        if (text) {
          expect(parseInt(text)).to.be.lessThan(3);
        }
      });
    });

    it('应显示团队加成效果', () => {
      cy.get('#open-team-manager-btn').click();
      
      // 验证加成面板存在
      cy.get('.team-bonuses-section').should('be.visible');
      
      // 验证加成卡片存在
      cy.get('.bonus-card').should('exist');
      
      // 验证加成效果描述存在
      cy.get('.bonus-description').should('not.be.empty');
    });
  });

  /**
   * 测试3: 天赋树系统
   */
  describe('天赋树系统测试', () => {
    it('应能打开天赋树界面', () => {
      // 假设有天赋树按钮
      cy.get('#open-talent-tree-btn').click();
      
      // 验证天赋树界面显示
      cy.get('#talent-modal').should('be.visible');
      
      cy.get('#talent-modal h2').should('contain', '天赋树系统');
    });

    it('应显示天赋节点和连接线', () => {
      cy.get('#open-talent-tree-btn').click();
      
      // 验证天赋节点存在
      cy.get('.talent-node').should('have.length.at.least', 1);
      
      // 验证连接线存在（如果有）
      cy.get('.talent-connection').should('exist');
    });

    it('应能选择和激活天赋', () => {
      cy.get('#open-talent-tree-btn').click();
      
      // 点击一个可用的天赋节点
      cy.get('.talent-node.available').first().click();
      
      // 验证激活提示或状态变化
      cy.get('.talent-node.active').should('exist');
    });
  });

  /**
   * 测试4: 技能强化系统
   */
  describe('技能强化系统测试', () => {
    it('应能打开技能强化界面', () => {
      // 假设有技能强化按钮
      cy.get('#open-skill-upgrade-btn').click();
      
      // 验证技能强化界面显示
      cy.get('#skill-upgrade-modal').should('be.visible');
      
      cy.get('#skill-upgrade-modal h2').should('contain', '技能强化系统');
    });

    it('应显示技能列表和强化分支', () => {
      cy.get('#open-skill-upgrade-btn').click();
      
      // 验证技能卡片存在
      cy.get('.skill-card').should('have.length.at.least', 1);
      
      // 验证强化分支存在
      cy.get('.upgrade-branch').should('exist');
    });

    it('应能选择强化分支并消耗资源', () => {
      cy.get('#open-skill-upgrade-btn').click();
      
      // 点击一个可用的强化分支
      cy.get('.upgrade-branch .branch-select-btn:not(:disabled)').first().click();
      
      // 验证确认对话框或结果提示
      cy.on('window:confirm', (text) => {
        expect(text).to.contain('确定要选择');
        return true;
      });
    });
  });

  /**
   * 测试5: 战斗系统集成测试
   */
  describe('战斗系统集成测试', () => {
    it('应能进入战斗并应用团队BUFF', () => {
      // 进入一个战斗场景
      cy.get('#enter-combat-btn').click();
      
      // 验证战斗界面显示
      cy.get('#combat-container').should('be.visible');
      
      // 验证团队BUFF效果显示
      cy.get('.team-buff-indicator').should('exist');
    });

    it('应能使用合击技能', () => {
      cy.get('#enter-combat-btn').click();
      
      // 等待战斗界面加载
      cy.get('#combat-container', { timeout: 5000 }).should('be.visible');
      
      // 点击合击技能按钮（如果可用）
      cy.get('.combo-skill-btn:not(:disabled)').first().click();
      
      // 验证合击技能效果显示
      cy.get('.combo-effect-animation').should('exist');
    });

    it('应正确计算位置效果', () => {
      cy.get('#enter-combat-btn').click();
      
      // 进行攻击
      cy.get('.attack-btn').first().click();
      
      // 验证伤害数字显示
      cy.get('.damage-number').should('exist');
    });
  });

  /**
   * 测试6: 端到端用户旅程
   */
  describe('完整用户旅程测试', () => {
    it('从NPC招募到团队战斗完整流程', () => {
      // 1. 打开NPC图鉴
      cy.get('#open-cyclopedia-btn').click();
      cy.get('#cyclopedia-modal').should('be.visible');
      
      // 2. 查看可招募NPC
      cy.get('#filter-status').select('available');
      cy.get('.npc-entry').should('exist');
      
      // 3. 查看NPC详情
      cy.get('.npc-entry').first().click();
      
      // 4. 返回并打开团队管理
      cy.get('#cyclopedia-close').click();
      cy.get('#open-team-manager-btn').click();
      
      // 5. 调整阵型
      cy.get('.member-card').first().click();
      cy.get('.formation-cell').first().trigger('dragover').trigger('drop');
      
      // 6. 保存阵型
      cy.get('#save-formation-btn').click();
      
      // 7. 进入战斗测试
      cy.get('#team-close').click();
      cy.get('#enter-combat-btn').click();
      
      // 8. 验证战斗界面和团队效果
      cy.get('#combat-container').should('be.visible');
      cy.get('.team-buff-indicator').should('exist');
      
      // 9. 进行战斗
      cy.get('.attack-btn').first().click();
      cy.get('.damage-number').should('exist');
    });

    it('天赋和技能强化集成流程', () => {
      // 1. 打开天赋树
      cy.get('#open-talent-tree-btn').click();
      
      // 2. 选择天赋
      cy.get('.talent-node.available').first().click();
      
      // 3. 关闭天赋树
      cy.get('#talent-close').click();
      
      // 4. 打开技能强化
      cy.get('#open-skill-upgrade-btn').click();
      
      // 5. 选择强化分支
      cy.get('.skill-card').first().click();
      cy.get('.upgrade-branch .branch-select-btn:not(:disabled)').first().click();
      
      // 确认选择
      cy.on('window:confirm', () => true);
      
      // 6. 验证强化结果
      cy.get('.upgrade-success-message').should('exist');
    });
  });

  /**
   * 测试7: 错误和边界情况
   */
  describe('错误处理和边界情况', () => {
    it('应处理无团队成员的情况', () => {
      // 模拟空团队状态
      cy.window().then((win) => {
        if (win.gameManager) {
          win.gameManager.teamMembers = [];
        }
      });
      
      cy.get('#open-team-manager-btn').click();
      
      // 验证界面正确处理空状态
      cy.get('.no-members-message').should('exist');
    });

    it('应处理资源不足的情况', () => {
      cy.get('#open-skill-upgrade-btn').click();
      
      // 模拟资源不足
      cy.window().then((win) => {
        if (win.gameManager) {
          win.gameManager.playerResources = { gold: 0 };
        }
      });
      
      // 尝试选择强化分支
      cy.get('.skill-card').first().click();
      
      // 验证按钮被禁用或显示不足信息
      cy.get('.branch-select-btn[disabled]').should('exist');
    });

    it('应处理不合法的阵型调整', () => {
      cy.get('#open-team-manager-btn').click();
      
      // 尝试超出调整次数限制
      for (let i = 0; i < 5; i++) {
        cy.get('.member-card').first().click();
        cy.get('.formation-cell').first().trigger('dragover').trigger('drop');
      }
      
      // 验证系统正确处理
      cy.get('.adjustment-limit-message').should('exist');
    });
  });

  /**
   * 测试8: 性能和兼容性
   */
  describe('性能和兼容性测试', () => {
    it('界面应响应迅速', () => {
      // 测试打开各个界面的速度
      const startTime = Date.now();
      
      cy.get('#open-cyclopedia-btn').click();
      cy.get('#cyclopedia-modal').should('be.visible');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // 验证加载时间在可接受范围内（例如2秒内）
      expect(loadTime).to.be.lessThan(2000);
    });

    it('应支持移动设备响应式布局', () => {
      // 切换到移动设备尺寸
      cy.viewport('iphone-6');
      
      // 验证界面适应移动设备
      cy.get('#game-container').should('be.visible');
      
      // 打开团队管理验证响应式
      cy.get('#open-team-manager-btn').click();
      cy.get('#team-modal').should('be.visible');
    });

    it('大量NPC数据应能流畅显示', () => {
      cy.get('#open-cyclopedia-btn').click();
      
      // 模拟大量NPC数据
      cy.window().then((win) => {
        if (win.npcyclopediaManager) {
          // 创建大量模拟NPC
          const largeNPCDataset = [];
          for (let i = 0; i < 100; i++) {
            largeNPCDataset.push({
              id: `test_npc_${i}`,
              name: `测试NPC ${i}`,
              pathway: '测试途径',
              rarity: 'common',
              currentStatus: 'available'
            });
          }
          win.npcyclopediaManager.npcs = largeNPCDataset;
          win.npcyclopediaManager.applyFilters();
        }
      });
      
      // 验证界面不卡顿
      cy.get('.npcs-grid').should('be.visible');
    });
  });

  after(() => {
    // 测试完成后清理
    cy.clearLocalStorage();
    cy.clearCookies();
  });
});

// 测试配置信息
console.log('Cypress团队养成系统端到端测试配置完成');