// 自定义命令
Cypress.Commands.add('typeCommand', (command) => {
  cy.get('#command-input').type(command);
});

Cypress.Commands.add('submitCommand', () => {
  cy.get('#submit-command').click();
});

Cypress.Commands.add('executeCommand', (command) => {
  cy.typeCommand(command);
  cy.submitCommand();
});

Cypress.Commands.add('shouldSeeOutput', (text) => {
  cy.get('#output-panel').should('contain', text);
});

Cypress.Commands.add('clickQuickAction', (actionText) => {
  cy.get('.quick-btn').contains(actionText).click();
});