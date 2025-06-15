// ui.js

class UIManager {
    constructor() {
        this.modalOpen = false;
        this.editingItemId = null;
    }

    initializeUI() {
        // Set current date
        document.getElementById('currentDate').textContent = formatDate(new Date());

        // Set initial auth UI state to be explicitly signed-out
        this.setSignedOutState();
    }

    setSignedInState(user) {
        const signedInState = document.getElementById('signedInState');
        const signedOutState = document.getElementById('signedOutState');
        
        signedInState.classList.remove('hidden');
        signedOutState.classList.add('hidden');
        
        const displayName = user.displayName || user.email.split('@')[0];
        document.getElementById('userName').textContent = `Signed in as ${displayName}`;
    }

    setSignedOutState() {
        const signedInState = document.getElementById('signedInState');
        const signedOutState = document.getElementById('signedOutState');

        signedInState.classList.add('hidden');
        signedOutState.classList.remove('hidden');
    }

    toggleAuthForms() {
        const container = document.getElementById('authFormsContainer');
        const toggleBtn = document.getElementById('signInToggleBtn');
        const isHidden = container.classList.contains('hidden');
        
        if (isHidden) {
            const btnRect = toggleBtn.getBoundingClientRect();
            container.style.top = (btnRect.bottom + 5) + 'px';
            container.style.right = (window.innerWidth - btnRect.right) + 'px';
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }

    hideAuthForms() {
        document.getElementById('authFormsContainer').classList.add('hidden');
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tab}AuthTab`).classList.add('active');
        document.getElementById('googleAuthForm').classList.toggle('hidden', tab !== 'google');
        document.getElementById('emailAuthForm').classList.toggle('hidden', tab !== 'email');
    }

    showEmailForm(form) {
        document.querySelectorAll('.auth-toggle-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`show${form === 'signin' ? 'SignIn' : 'SignUp'}Form`).classList.add('active');
        document.getElementById('emailSignInForm').classList.toggle('hidden', form !== 'signin');
        document.getElementById('emailSignUpForm').classList.toggle('hidden', form !== 'signup');
        document.getElementById('emailSignInForm').reset();
        document.getElementById('emailSignUpForm').reset();
    }

    switchView(view) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${view}Btn`).classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(`${view}View`).classList.remove('hidden');
    }

    async renderTodaysList(items, renderPracticeItem) {
        const container = document.getElementById('todayList');
        
        if (items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <h3>🎉 No practice items for today!</h3>
                    <p>Either you've completed everything or no items are due today.</p>
                </div>`;
            return;
        }

        const itemsHtml = await Promise.all(items.map(item => renderPracticeItem(item)));
        container.innerHTML = itemsHtml.join('');
    }

    async renderPracticeItem(item, renderSubItemsForToday) {
        const subItemsHtml = await renderSubItemsForToday(item.id);
        
        return `
            <div class="practice-item ${item.isCompleted ? 'completed' : ''}" data-item-id="${item.id}">
                <div class="practice-item-header">
                    <div class="practice-item-info">
                        <div class="practice-item-title">${escapeHtml(item.name)}</div>
                        <div class="practice-item-category">${escapeHtml(item.category)}</div>
                        ${item.description ? `<div class="practice-item-description">${escapeHtml(item.description)}</div>` : ''}
                        <div class="practice-item-meta">
                            Reappears every ${item.recurDays} days
                            ${item.daysSinceLastCompletion !== null ? ` • Last completed ${item.daysSinceLastCompletion} days ago` : ' • Never completed'}
                        </div>
                    </div>
                    <div class="practice-item-actions">
                        <button class="complete-btn ${item.isCompleted ? 'completed' : ''}" onclick="app.toggleItemCompletion('${item.id}')">
                            ${item.isCompleted ? '✓ Completed' : 'Mark Complete'}
                        </button>
                    </div>
                </div>
                ${subItemsHtml}
            </div>`;
    }

    updateCompletionStats(stats) {
        document.getElementById('completedCount').textContent = stats.completed;
        document.getElementById('totalCount').textContent = stats.total;
    }

    renderCategories(categories) {
        const container = document.getElementById('categoriesList');
        if (categories.length === 0) {
            container.innerHTML = '<p style="color: #718096;">No categories yet. Add some below!</p>';
            return;
        }
        container.innerHTML = categories.map(category => `
            <div class="category-tag">
                ${escapeHtml(category.name)}
                <button class="delete-category" onclick="app.deleteCategory('${category.id}')" title="Delete category">×</button>
            </div>`).join('');
    }

    async renderItemsList(items, getSubItems, renderSubItemsList) {
        const container = document.getElementById('itemsList');
        if (items.length === 0) {
            container.innerHTML = '<p style="color: #718096;">No practice items yet. Add one to get started!</p>';
            return;
        }

        const itemsHtml = await Promise.all(items.map(async item => {
            const subItems = await getSubItems(item.id);
            const subItemsHtml = await renderSubItemsList(subItems);
            const statusClass = item.status === 'paused' ? 'paused' : '';
            const statusText = item.status === 'paused' ? 'Paused' : 'Active';

            return `
                <div class="item-card ${statusClass}" data-item-id="${item.id}">
                    <div class="item-card-header">
                        <div class="item-card-info">
                            <div class="item-card-title">${escapeHtml(item.name)}</div>
                            <div class="item-card-category">${escapeHtml(item.category)}</div>
                        </div>
                        <div class="item-card-actions">
                            <div class="status-indicator ${statusClass}">${statusText}</div>
                            <button class="btn btn-small" onclick="app.toggleItemStatus('${item.id}')">
                                ${item.status === 'paused' ? '▶️ Resume' : '⏸️ Pause'}
                            </button>
                            <button class="btn btn-small btn-secondary" onclick="app.editItem('${item.id}')">✏️ Edit</button>
                            <button class="btn btn-small btn-danger" onclick="app.deleteItem('${item.id}')">🗑️ Delete</button>
                        </div>
                    </div>
                    ${subItemsHtml}
                </div>`;
        }));
        container.innerHTML = itemsHtml.join('');
    }

    renderSubItemsList(subItems) {
        if (subItems.length === 0) return '';
        const itemsHtml = subItems.map(subItem => {
             const statusClass = subItem.status === 'paused' ? 'paused' : '';
             const statusText = subItem.status === 'paused' ? 'Paused' : 'Active';
             return `
                 <div class="sub-item-card ${statusClass}">
                    <div class="item-card-info">
                        <span class="sub-item-indicator">↳</span>
                        <div class="item-card-title">${escapeHtml(subItem.name)}</div>
                    </div>
                     <div class="item-card-actions">
                        <div class="status-indicator ${statusClass}">${statusText}</div>
                        <button class="btn btn-small" onclick="app.toggleItemStatus('${subItem.id}')">
                            ${subItem.status === 'paused' ? '▶️ Resume' : '⏸️ Pause'}
                        </button>
                         <button class="btn btn-small btn-secondary" onclick="app.editItem('${subItem.id}')">✏️ Edit</button>
                         <button class="btn btn-small btn-danger" onclick="app.deleteItem('${subItem.id}')">🗑️ Delete</button>
                     </div>
                 </div>`;
         }).join('');
 
         return `<div class="sub-items-list">${itemsHtml}</div>`;
     }
 
    openItemModal(itemId = null, populateForm) {
        this.editingItemId = itemId;
        const modal = document.getElementById('itemModal');
        const overlay = document.getElementById('overlay');
        const form = document.getElementById('itemForm');
        const title = document.getElementById('modalTitle');

        if (itemId) {
            title.textContent = 'Edit Item';
            populateForm(itemId);
        } else {
            title.textContent = 'Add New Item';
            form.reset();
            document.getElementById('recurDays').value = 7;
        }

        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
        document.getElementById('itemName').focus();
    }

    closeModal() {
        document.getElementById('itemModal').classList.add('hidden');
        document.getElementById('overlay').classList.add('hidden');
        this.editingItemId = null;
    }

    updateCategoryFilterOptions(categories) {
        this.updateSelectWithOptions('categoryFilter', categories);
    }
    
    updateItemCategoryOptions(categories) {
        this.updateSelectWithOptions('itemCategory', categories);
    }

    updateParentItemOptions(items) {
        const options = items.map(item => ({ name: item.name, value: item.id }));
        this.updateSelectWithOptions('parentItem', options, true, 'None (Top-level item)');
    }

    updateSelectWithOptions(selectId, options, hasNoneOption = false, noneOptionText = 'Select Category') {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        while (select.children.length > (hasNoneOption ? 1 : 0)) {
            select.removeChild(select.lastChild);
        }

        if(hasNoneOption && select.children.length === 0) {
            const noneOption = document.createElement('option');
            noneOption.value = '';
            noneOption.textContent = noneOptionText;
            select.appendChild(noneOption);
        }

        options.forEach(optionData => {
            const option = document.createElement('option');
            option.value = typeof optionData === 'object' ? optionData.value : optionData.name;
            option.textContent = optionData.name;
            select.appendChild(option);
        });
        select.value = currentValue;
    }

    getNewCategoryName() {
        const input = document.getElementById('newCategoryInput');
        const name = input.value.trim();
        input.value = '';
        return name;
    }

    getFilterValues() {
        return {
            category: document.getElementById('categoryFilter').value,
            status: document.getElementById('statusFilter').value
        };
    }

    getItemFormData() {
        return {
            name: document.getElementById('itemName').value.trim(),
            category: document.getElementById('itemCategory').value,
            description: document.getElementById('itemDescription').value.trim(),
            recurDays: parseInt(document.getElementById('recurDays').value),
            parentId: document.getElementById('parentItem').value || null
        };
    }
} 