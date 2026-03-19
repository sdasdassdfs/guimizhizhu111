/**
 * 《诡秘之主》网页游戏 - UI管理器
 * 负责管理游戏界面切换、组件加载和交互
 */

class UIManager {
    constructor() {
        this.components = {};
        this.activeModal = null;
        this.gameManager = null;
        
        // 组件容器
        this.componentContainer = document.createElement('div');
        this.componentContainer.id = 'ui-component-container';
        this.componentContainer.style.display = 'none';
        document.body.appendChild(this.componentContainer);
        
        // 初始化
        this.loadComponents();
        this.setupGlobalListeners();
    }
    
    /**
     * 设置游戏管理器引用
     */
    setGameManager(gameManager) {
        this.gameManager = gameManager;
    }
    
    /**
     * 加载所有UI组件
     */
    async loadComponents() {
        try {
            // 加载途径选择组件
            const pathwayResponse = await fetch('ui/components/pathway-selection.html');
            if (pathwayResponse.ok) {
                const html = await pathwayResponse.text();
                this.components.pathway = html;
            }
            
            // 加载任务界面组件
            const questResponse = await fetch('ui/components/quest-interface.html');
            if (questResponse.ok) {
                const html = await questResponse.text();
                this.components.quest = html;
            }
            
            // 加载战斗界面组件
            const combatResponse = await fetch('ui/components/combat-interface.html');
            if (combatResponse.ok) {
                const html = await combatResponse.text();
                this.components.combat = html;
            }
            
            // 加载剧情对话组件
            const storyDialogueResponse = await fetch('ui/components/story-dialogue.html');
            if (storyDialogueResponse.ok) {
                const html = await storyDialogueResponse.text();
                this.components['story-dialogue'] = html;
            }
            
            // 加载收集品图鉴组件
            const collectiblesResponse = await fetch('ui/components/collectibles-interface.html');
            if (collectiblesResponse.ok) {
                const html = await collectiblesResponse.text();
                this.components['collectibles'] = html;
            }
            
            // 加载成就界面组件
            const achievementsResponse = await fetch('ui/components/achievements-interface.html');
            if (achievementsResponse.ok) {
                const html = await achievementsResponse.text();
                this.components['achievements'] = html;
            }
            
            // 加载天赋树组件
            const talentTreeResponse = await fetch('ui/components/talent-tree.html');
            if (talentTreeResponse.ok) {
                const html = await talentTreeResponse.text();
                this.components['talent-tree'] = html;
            }
            
            // 加载NPC招募组件
            const recruitmentResponse = await fetch('ui/components/npc-recruitment.html');
            if (recruitmentResponse.ok) {
                const html = await recruitmentResponse.text();
                this.components['recruitment'] = html;
            }
            
            // 加载团队管理组件
            const teamManagementResponse = await fetch('ui/components/team-management.html');
            if (teamManagementResponse.ok) {
                const html = await teamManagementResponse.text();
                this.components['team-management'] = html;
            }
            
            // 加载技能强化组件
            const skillUpgradeResponse = await fetch('ui/components/skill-upgrade.html');
            if (skillUpgradeResponse.ok) {
                const html = await skillUpgradeResponse.text();
                this.components['skill-upgrade'] = html;
            }
            
            console.log('UI组件加载完成');
        } catch (error) {
            console.error('加载UI组件失败:', error);
        }
    }
    
    /**
     * 设置全局监听器
     */
    setupGlobalListeners() {
        // 点击背景关闭模态框
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target.classList.contains('ui-modal')) {
                this.hideModal();
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.hideModal();
            }
        });
    }
    
    /**
     * 显示指定界面
     * @param {string} componentName - 组件名称
     * @param {object} data - 传递给组件的数据
     */
    showComponent(componentName, data = {}) {
        if (!this.components[componentName]) {
            console.error(`组件 ${componentName} 未找到`);
            return;
        }
        
        // 清理容器
        this.componentContainer.innerHTML = this.components[componentName];
        this.componentContainer.style.display = 'block';
        
        // 设置组件数据
        this.setComponentData(componentName, data);
        
        // 显示模态框
        const modal = this.componentContainer.querySelector('.ui-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.activeModal = modal;
            
            // 添加活动类
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        }
        
        // 设置组件特定监听器
        this.setupComponentListeners(componentName);
    }
    
    /**
     * 设置组件数据
     */
    setComponentData(componentName, data) {
        switch (componentName) {
            case 'pathway':
                this.setPathwayData(data);
                break;
            case 'quest':
                this.setQuestData(data);
                break;
            case 'combat':
                this.setCombatData(data);
                break;
            case 'story-dialogue':
                this.setStoryDialogueData(data);
                break;
            case 'collectibles':
                this.setCollectiblesData(data);
                break;
            case 'achievements':
                this.setAchievementsData(data);
                break;
        }
    }
    
    /**
     * 设置途径选择数据
     */
    setPathwayData(data) {
        // 如果游戏管理器存在，获取实际途径数据
        if (this.gameManager && this.gameManager.getPathways) {
            const pathways = this.gameManager.getPathways();
            const grid = document.getElementById('pathway-grid');
            if (grid && pathways) {
                // 动态生成途径卡片
                grid.innerHTML = '';
                pathways.forEach(pathway => {
                    const card = this.createPathwayCard(pathway);
                    grid.appendChild(card);
                });
            }
        }
        
        // 设置选择事件
        const cards = document.querySelectorAll('.pathway-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // 显示详细信息
                this.showPathwayDetails(card.dataset.pathway);
            });
        });
        
        // 关闭按钮
        const closeBtn = document.getElementById('pathway-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }
        
        // 确认选择按钮
        const confirmBtn = document.getElementById('confirm-pathway');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const selectedCard = document.querySelector('.pathway-card.selected');
                if (selectedCard) {
                    this.selectPathway(selectedCard.dataset.pathway);
                }
            });
        }
    }
    
    /**
     * 创建途径卡片
     */
    createPathwayCard(pathway) {
        const div = document.createElement('div');
        div.className = 'pathway-card';
        div.dataset.pathway = pathway.id;
        
        // 根据途径类型设置图标
        const icon = this.getPathwayIcon(pathway.type);
        
        div.innerHTML = `
            <div class="pathway-icon">${icon}</div>
            <div class="pathway-name">${pathway.name}</div>
            <div class="pathway-sequence">${pathway.sequence}</div>
            <div class="pathway-desc">${pathway.description}</div>
        `;
        
        return div;
    }
    
    /**
     * 获取途径图标
     */
    getPathwayIcon(type) {
        const icons = {
            'fool': '🃏',
            'door': '🚪',
            'error': '🌀',
            'darkness': '🌌',
            'death': '💀',
            'tyrant': '⚡',
            'red_priest': '🔥',
            'sun': '☀️',
            'moon': '🌙',
            'mother': '🌿',
            'hanged_man': '☠️',
            'wheel': '♾️',
            'demon': '😈',
            'abyss': '🕳️',
            'black_emperor': '👑',
            'chained': '🔗',
            'justiciar': '⚖️',
            'hermit': '🧙',
            'paragon': '🏆',
            'twilight': '🌆',
            'temperance': '🍷',
            'fate': '🎭'
        };
        
        return icons[type] || '✨';
    }
    
    /**
     * 显示途径详细信息
     */
    showPathwayDetails(pathwayId) {
        const detailsPanel = document.getElementById('pathway-details');
        if (detailsPanel) {
            detailsPanel.style.display = 'block';
            
            // 滚动到详细信息
            detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    /**
     * 选择途径
     */
    selectPathway(pathwayId) {
        if (this.gameManager && this.gameManager.selectPathway) {
            const success = this.gameManager.selectPathway(pathwayId);
            if (success) {
                this.hideModal();
                // 可以在这里触发游戏事件
                console.log(`途径已选择: ${pathwayId}`);
            }
        }
    }
    
    /**
     * 设置任务界面数据
     */
    setQuestData(data) {
        // 设置标签页切换
        const tabs = document.querySelectorAll('.quest-tab');
        const contents = document.querySelectorAll('.quest-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // 更新活动标签
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 显示对应内容
                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabName}-quests`) {
                        content.classList.add('active');
                    }
                });
            });
        });
        
        // 任务接受按钮
        const acceptBtns = document.querySelectorAll('.btn-accept');
        acceptBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const questId = btn.dataset.questId;
                this.acceptQuest(questId);
            });
        });
        
        // 关闭按钮
        const closeBtn = document.getElementById('quest-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }
    }
    
    /**
     * 接受任务
     */
    acceptQuest(questId) {
        if (this.gameManager && this.gameManager.acceptQuest) {
            const success = this.gameManager.acceptQuest(questId);
            if (success) {
                console.log(`任务已接受: ${questId}`);
                // 可以刷新任务列表
            }
        }
    }
    
    /**
     * 设置战斗界面数据
     */
    setCombatData(data) {
        // 设置技能按钮
        const skillBtns = document.querySelectorAll('.skill-btn');
        skillBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!btn.classList.contains('disabled')) {
                    const skillId = btn.dataset.skillId;
                    this.useCombatSkill(skillId);
                }
            });
        });
        
        // 战斗控制按钮
        const executeBtn = document.getElementById('execute-turn');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.executeCombatTurn());
        }
        
        const fleeBtn = document.getElementById('flee-combat');
        if (fleeBtn) {
            fleeBtn.addEventListener('click', () => this.fleeCombat());
        }
        
        const helpBtn = document.getElementById('combat-help');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showCombatHelp());
        }
        
        const closeHelpBtn = document.getElementById('close-tutorial');
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', () => {
                document.getElementById('combat-tutorial').style.display = 'none';
            });
        }
        
        // ATB系统初始化
        this.initATBSystem(data);
        
        // 位置网格初始化
        this.initPositionGrid(data);
        
        // 合击系统初始化
        this.initComboSystem(data);
        
        // 关闭按钮
        const closeBtn = document.getElementById('combat-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }
    }
    
    /**
     * 初始化ATB系统
     */
    initATBSystem(data) {
        const atbContainer = document.getElementById('atb-container');
        if (atbContainer) {
            atbContainer.style.display = 'block';
            
            // 更新玩家行动条
            this.updateATBBars(data?.playerTeam || [], 'atb-player-list');
            
            // 更新敌人行动条
            this.updateATBBars(data?.enemyTeam || [], 'atb-enemy-list');
        }
    }
    
    /**
     * 更新行动条显示
     */
    updateATBBars(characters, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        characters.forEach(char => {
            const atbBar = document.createElement('div');
            atbBar.className = 'atb-bar';
            atbBar.innerHTML = `
                <div class="atb-character-info">
                    <span class="atb-name">${char.name}</span>
                    <span class="atb-hp">${char.health}/${char.maxHealth}</span>
                </div>
                <div class="atb-progress-container">
                    <div class="atb-progress-fill" style="width: ${char.actionPoints || 0}%"></div>
                </div>
                <div class="atb-status">${char.isActionReady ? '准备行动' : '等待'}</div>
            `;
            container.appendChild(atbBar);
        });
    }
    
    /**
     * 初始化位置网格
     */
    initPositionGrid(data) {
        const positionContainer = document.getElementById('position-grid-container');
        if (positionContainer) {
            positionContainer.style.display = 'block';
            
            // 填充位置网格
            this.fillPositionGrid(data?.playerTeam || [], data?.positions || {});
            
            // 设置拖拽事件
            this.setupPositionDragAndDrop();
        }
    }
    
    /**
     * 填充位置网格
     */
    fillPositionGrid(playerTeam, positions) {
        // 清空所有位置
        const cells = document.querySelectorAll('.position-cell');
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('occupied');
        });
        
        // 填充角色
        playerTeam.forEach(char => {
            if (char.currentPosition) {
                const { row, col } = char.currentPosition;
                const cell = document.querySelector(`.position-cell[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.innerHTML = `
                        <div class="position-character" data-character-id="${char.id}">
                            <i class="fas fa-user"></i>
                            <span>${char.name}</span>
                        </div>
                    `;
                    cell.classList.add('occupied');
                }
            }
        });
    }
    
    /**
     * 设置位置拖拽
     */
    setupPositionDragAndDrop() {
        const characters = document.querySelectorAll('.position-character');
        const cells = document.querySelectorAll('.position-cell');
        
        characters.forEach(char => {
            char.setAttribute('draggable', 'true');
            
            char.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('characterId', char.dataset.characterId);
                char.classList.add('dragging');
            });
            
            char.addEventListener('dragend', () => {
                char.classList.remove('dragging');
            });
        });
        
        cells.forEach(cell => {
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('drag-over');
            });
            
            cell.addEventListener('dragleave', () => {
                cell.classList.remove('drag-over');
            });
            
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('drag-over');
                
                const characterId = e.dataTransfer.getData('characterId');
                const row = cell.dataset.row;
                const col = cell.dataset.col;
                
                // 通知游戏管理器调整位置
                if (this.gameManager && this.gameManager.adjustCharacterPosition) {
                    this.gameManager.adjustCharacterPosition(characterId, row, col);
                }
            });
        });
    }
    
    /**
     * 初始化合击系统
     */
    initComboSystem(data) {
        const comboContainer = document.getElementById('combo-container');
        if (comboContainer) {
            comboContainer.style.display = 'block';
            
            // 更新合击技能列表
            this.updateComboSkills(data?.availableCombos || []);
            
            // 更新团队能量显示
            this.updateTeamEnergy(data?.teamEnergy || 0);
        }
    }
    
    /**
     * 更新合击技能列表
     */
    updateComboSkills(combos) {
        const container = document.getElementById('combo-skills');
        if (!container) return;
        
        container.innerHTML = '';
        
        combos.forEach(combo => {
            const comboBtn = document.createElement('button');
            comboBtn.className = 'combo-btn';
            comboBtn.innerHTML = `
                <span class="combo-name">${combo.definition?.name || '合击'}</span>
                <span class="combo-partners">${combo.partner?.name || ''}</span>
                <span class="combo-desc">${combo.definition?.description || ''}</span>
                <span class="combo-cost">消耗: ${combo.definition?.conditions?.find(c => c.type === 'energyCost')?.value || 0}能量</span>
            `;
            
            comboBtn.addEventListener('click', () => {
                this.executeCombo(combo);
            });
            
            container.appendChild(comboBtn);
        });
    }
    
    /**
     * 更新团队能量显示
     */
    updateTeamEnergy(energy) {
        const fill = document.getElementById('energy-fill');
        const text = document.getElementById('energy-text');
        
        if (fill) {
            fill.style.width = `${energy}%`;
        }
        if (text) {
            text.textContent = `${energy}/100`;
        }
    }
    
    /**
     * 执行合击技能
     */
    executeCombo(comboData) {
        if (this.gameManager && this.gameManager.executeCombo) {
            this.gameManager.executeCombo(comboData);
        }
    }
    
    /**
     * 使用战斗技能
     */
    useCombatSkill(skillId) {
        if (this.gameManager && this.gameManager.useCombatSkill) {
            this.gameManager.useCombatSkill(skillId);
        }
    }
    
    /**
     * 执行战斗回合
     */
    executeCombatTurn() {
        if (this.gameManager && this.gameManager.executeCombatTurn) {
            this.gameManager.executeCombatTurn();
        }
    }
    
    /**
     * 逃离战斗
     */
    fleeCombat() {
        if (this.gameManager && this.gameManager.fleeCombat) {
            const success = this.gameManager.fleeCombat();
            if (success) {
                this.hideModal();
            }
        }
    }
    
    /**
     * 显示战斗帮助
     */
    showCombatHelp() {
        const tutorial = document.getElementById('combat-tutorial');
        if (tutorial) {
            tutorial.style.display = 'block';
        }
    }
    
    /**
     * 设置组件监听器
     */
    setupComponentListeners(componentName) {
        // 组件特定的监听器设置
        const closeBtns = this.componentContainer.querySelectorAll('.ui-modal-close');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });
    }
    
    /**
     * 隐藏当前模态框
     */
    hideModal() {
        if (this.activeModal) {
            this.activeModal.classList.remove('active');
            
            setTimeout(() => {
                this.activeModal.style.display = 'none';
                this.componentContainer.style.display = 'none';
                this.activeModal = null;
            }, 300);
        }
    }
    
    /**
     * 显示途径选择界面
     */
    showPathwaySelection() {
        this.showComponent('pathway');
    }
    
    /**
     * 显示任务界面
     */
    showQuestInterface() {
        this.showComponent('quest');
    }
    
    /**
     * 显示战斗界面
     */
    showCombatInterface() {
        this.showComponent('combat');
    }
    
    /**
     * 显示剧情对话界面
     */
    showStoryDialogue() {
        this.showComponent('story-dialogue');
    }
    
    /**
     * 设置剧情对话数据
     */
    setStoryDialogueData(data) {
        // 如果有NPC数据和对话树，传递给StoryDialogue管理器
        if (data.npcData && data.dialogueTree) {
            // 确保StoryDialogue类已加载
            if (window.StoryDialogue) {
                window.StoryDialogue.start(data.npcData, data.dialogueTree, data.onComplete);
            } else {
                console.error('StoryDialogue类未加载');
            }
        }
        
        // 设置关闭按钮监听器
        const closeBtn = document.querySelector('.story-dialogue-modal .close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }
    }
    
    /**
     * 显示天赋树界面
     */
    showTalentTree() {
        this.showComponent('talent-tree');
    }
    
    /**
     * 显示NPC招募界面
     */
    showNPCRecruitment() {
        this.showComponent('recruitment');
    }
    
    /**
     * 显示团队管理界面
     */
    showTeamManagement() {
        this.showComponent('team-management');
    }
    
    /**
     * 显示技能强化界面
     */
    showSkillUpgrade() {
        this.showComponent('skill-upgrade');
    }
    
    /**
     * 更新战斗界面数据
     */
    updateCombatData(playerData, enemyData) {
        if (!this.activeModal || !this.activeModal.querySelector('#player-combatant')) {
            return;
        }
        
        // 更新玩家数据
        document.getElementById('player-name').textContent = playerData.name;
        document.getElementById('player-health').style.width = `${playerData.healthPercent}%`;
        document.getElementById('player-hp-text').textContent = `${playerData.currentHealth}/${playerData.maxHealth}`;
        document.getElementById('player-spirit').style.width = `${playerData.spiritPercent}%`;
        document.getElementById('player-spirit-text').textContent = `${playerData.currentSpirit}/${playerData.maxSpirit}`;
        document.getElementById('player-sanity').style.width = `${playerData.sanityPercent}%`;
        document.getElementById('player-sanity-text').textContent = `${playerData.currentSanity}/${playerData.maxSanity}`;
        
        // 更新敌人数据
        document.getElementById('enemy-name').textContent = enemyData.name;
        document.getElementById('enemy-health').style.width = `${enemyData.healthPercent}%`;
        document.getElementById('enemy-hp-text').textContent = `${enemyData.currentHealth}/${enemyData.maxHealth}`;
        document.getElementById('enemy-spirit').style.width = `${enemyData.spiritPercent}%`;
        document.getElementById('enemy-spirit-text').textContent = `${enemyData.currentSpirit}/${enemyData.maxSpirit}`;
        document.getElementById('enemy-sanity').style.width = `${enemyData.sanityPercent}%`;
        document.getElementById('enemy-sanity-text').textContent = `${enemyData.currentSanity}/${enemyData.maxSanity}`;
    }
}

// 创建全局UI管理器实例
window.UIManager = new UIManager();