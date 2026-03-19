// 导入命令
import './commands';

// 全局 before each
beforeEach(() => {
  // 清空 localStorage
  cy.clearLocalStorage();
  
  // 访问首页
  cy.visit('/');
});

// 失败时截图
Cypress.on('fail', (error, runnable) => {
  // 自定义错误处理
  throw error;
});