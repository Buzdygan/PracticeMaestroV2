// Main application logic for Practice Maestro

class PracticeMaestro {
    constructor() {
        this.storage = new PracticeStorage();
        this.currentView = 'today';
        this.editingItemId = null;
        
        this.initializeApp();
        this.bindEvents();
        this.loadTodayView();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        // Initialize default categories if needed
        initializeDefaultCategories();
        
        // Set current date
        document.getElementById('currentDate').textContent = formatDate(new Date());
        
        // Load initial view
        this.switchView('today');
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Navigation
        document.getElementById('todayBtn').addEventListener('click', () => this.switchView('today'));
        document.getElementById('manageBtn').addEventListener('click', () => this.switchView('manage'));

        // Today's practice
        document.getElementById('todayList').addEventListener('click', (e) => this.handleTodayListClick(e));

        // Management view
        document.getElementById('addItemBtn').addEventListener('click', () => this.openItemModal());
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.addCategory());
        document.getElementById('newCategoryInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });

        // Filters
        document.getElementById('categoryFilter').addEventListener('change', () => this.loadManageView());
        document.getElementById('statusFilter').addEventListener('change', () => this.loadManageView());

        // Items list
        document.getElementById('itemsList').addEventListener('click', (e) => this.handleItemsListClick(e));
        document.getElementById('categoriesList').addEventListener('click', (e) => this.handleCategoriesListClick(e));

        // Modal
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('overlay').addEventListener('click', () => this.closeModal());
        document.getElementById('itemForm').addEventListener('submit', (e) => this.handleItemFormSubmit(e));
    }

    /**
     * Switch between views
     */
    switchView(view) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(view + 'Btn').classList.add('active');

        // Show/hide views
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(view + 'View').classList.remove('hidden');

        this.currentView = view;

        // Load view content
        if (view === 'today') {
            this.loadTodayView();
        } else if (view === 'manage') {
            this.loadManageView();
        }
    }

    // ============ TODAY'S PRACTICE VIEW ============

    /**
     * Load today's practice view
     */
    loadTodayView() {
        const todaysItems = this.storage.getTodaysItems();
        const stats = this.storage.getCompletionStats();
        
        // Update stats
        document.getElementById('completedCount').textContent = stats.completed;
        document.getElementById('totalCount').textContent = stats.total;

        // Render items
        this.renderTodaysList(todaysItems);
    }

    /**
     * Render today's practice list
     */
    renderTodaysList(items) {
        const container = document.getElementById('todayList');
        
        if (items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <h3>🎉 No practice items for today!</h3>
                    <p>Either you've completed everything or no items are due today.</p>
                    <p><a href="#" onclick="app.switchView('manage')" style="color: #667eea;">Add some practice items</a> to get started.</p>
                </div>
            `;
            return;
        }

        const itemsHtml = items.map(item => {
            const subItems = this.storage.getSubItems(item.id);
            const hasSubItems = subItems.length > 0;
            
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
                            <button class="complete-btn ${item.isCompleted ? 'completed' : ''}" 
                                    onclick="app.toggleItemCompletion('${item.id}')">
                                ${item.isCompleted ? '✓ Completed' : 'Mark Complete'}
                            </button>
                        </div>
                    </div>
                    ${hasSubItems ? this.renderSubItemsForToday(item.id, subItems) : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = itemsHtml;
    }

    /**
     * Render sub-items for today's practice
     */
    renderSubItemsForToday(parentId, subItems) {
        const todaysSubItems = subItems.filter(subItem => {
            if (subItem.status === 'paused') return false;
            
            const lastCompletion = this.storage.getLastCompletionDate(subItem.id);
            if (!lastCompletion) return true;
            
            const daysSince = daysBetween(getTodayString(), lastCompletion);
            return daysSince >= subItem.recurDays;
        });

        if (todaysSubItems.length === 0) return '';

        const subItemsHtml = todaysSubItems.map(subItem => {
            const isCompleted = this.storage.isItemCompleted(subItem.id);
            return `
                <div class="sub-item ${isCompleted ? 'completed' : ''}" data-item-id="${subItem.id}">
                    <div class="practice-item-header">
                        <div class="practice-item-info">
                            <div class="practice-item-title">${escapeHtml(subItem.name)}</div>
                            ${subItem.description ? `<div class="practice-item-description">${escapeHtml(subItem.description)}</div>` : ''}
                        </div>
                        <div class="practice-item-actions">
                            <button class="complete-btn ${isCompleted ? 'completed' : ''}" 
                                    onclick="app.toggleItemCompletion('${subItem.id}')">
                                ${isCompleted ? '✓' : '○'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="sub-items">${subItemsHtml}</div>`;
    }

    /**
     * Handle clicks in today's list
     */
    handleTodayListClick(e) {
        // Handle completion button clicks (handled by onclick)
    }

    /**
     * Toggle item completion
     */
    toggleItemCompletion(itemId) {
        const isCompleted = this.storage.isItemCompleted(itemId);
        
        if (isCompleted) {
            this.storage.unmarkItemCompleted(itemId);
            showToast('Item unmarked as completed', 'info');
        } else {
            this.storage.markItemCompleted(itemId);
            showToast('Item completed! 🎉', 'success');
        }
        
        this.loadTodayView();
    }

    // ============ MANAGEMENT VIEW ============

    /**
     * Load management view
     */
    loadManageView() {
        this.loadCategories();
        this.loadCategoryFilterOptions();
        this.loadItems();
    }

    /**
     * Load categories section
     */
    loadCategories() {
        const categories = this.storage.getCategories();
        const container = document.getElementById('categoriesList');
        
        if (categories.length === 0) {
            container.innerHTML = '<p style="color: #718096;">No categories yet. Add some below!</p>';
            return;
        }

        const categoriesHtml = categories.map(category => `
            <div class="category-tag">
                ${escapeHtml(category.name)}
                <button class="delete-category" onclick="app.deleteCategory('${category.id}')" title="Delete category">×</button>
            </div>
        `).join('');

        container.innerHTML = categoriesHtml;
    }

    /**
     * Load category filter options
     */
    loadCategoryFilterOptions() {
        const categories = this.storage.getCategories();
        const selects = [
            document.getElementById('categoryFilter'),
            document.getElementById('itemCategory')
        ];

        selects.forEach(select => {
            const currentValue = select.value;
            const isItemCategory = select.id === 'itemCategory';
            
            // Clear existing options (except first one)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                select.appendChild(option);
            });

            // Restore selection
            select.value = currentValue;
        });

        // Also update parent item options
        this.loadParentItemOptions();
    }

    /**
     * Load parent item options
     */
    loadParentItemOptions() {
        const items = this.storage.getTopLevelItems();
        const select = document.getElementById('parentItem');
        const currentValue = select.value;

        // Clear existing options (except first one)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.category})`;
            select.appendChild(option);
        });

        select.value = currentValue;
    }

    /**
     * Add new category
     */
    addCategory() {
        const input = document.getElementById('newCategoryInput');
        const name = input.value.trim();
        
        if (!name) {
            showToast('Please enter a category name', 'error');
            return;
        }

        const category = this.storage.addCategory(name);
        if (category) {
            input.value = '';
            this.loadCategories();
            this.loadCategoryFilterOptions();
            showToast('Category added successfully', 'success');
        } else {
            showToast('Category already exists', 'error');
        }
    }

    /**
     * Delete category
     */
    async deleteCategory(categoryId) {
        const categories = this.storage.getCategories();
        const category = categories.find(cat => cat.id === categoryId);
        
        if (!category) return;

        const confirmed = await confirmDialog(`Delete category "${category.name}"? This will only work if no items use this category.`);
        if (!confirmed) return;

        const success = this.storage.deleteCategory(categoryId);
        if (success) {
            this.loadCategories();
            this.loadCategoryFilterOptions();
            showToast('Category deleted successfully', 'success');
        } else {
            showToast('Cannot delete category - it\'s being used by items', 'error');
        }
    }

    /**
     * Load items list
     */
    loadItems() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        let items = this.storage.getTopLevelItems(); // Only show top-level items

        // Apply filters
        if (categoryFilter) {
            items = items.filter(item => item.category === categoryFilter);
        }
        if (statusFilter) {
            items = items.filter(item => item.status === statusFilter);
        }

        this.renderItemsList(items);
    }

    /**
     * Render items list
     */
    renderItemsList(items) {
        const container = document.getElementById('itemsList');
        
        if (items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <p>No items found with current filters.</p>
                    <button class="btn btn-primary" onclick="app.openItemModal()">Add Your First Item</button>
                </div>
            `;
            return;
        }

        const itemsHtml = items.map(item => {
            const subItems = this.storage.getSubItems(item.id);
            const lastCompletion = this.storage.getLastCompletionDate(item.id);
            
            return `
                <div class="item-card ${item.status === 'paused' ? 'paused' : ''}" data-item-id="${item.id}">
                    <div class="item-card-header">
                        <div class="practice-item-info">
                            <div class="practice-item-title">${escapeHtml(item.name)}
                                ${item.status === 'paused' ? '<span class="status-paused">PAUSED</span>' : ''}
                            </div>
                            <div class="practice-item-category">${escapeHtml(item.category)}</div>
                            ${item.description ? `<div class="practice-item-description">${escapeHtml(item.description)}</div>` : ''}
                            <div class="practice-item-meta">
                                Reappears every ${item.recurDays} days
                                ${lastCompletion ? ` • Last completed: ${new Date(lastCompletion).toLocaleDateString()}` : ' • Never completed'}
                                ${subItems.length > 0 ? ` • ${subItems.length} sub-items` : ''}
                            </div>
                        </div>
                        <div class="item-card-actions">
                            <button class="btn btn-small" onclick="app.editItem('${item.id}')">Edit</button>
                            <button class="btn btn-small ${item.status === 'paused' ? 'btn-secondary' : 'btn-danger'}" 
                                    onclick="app.toggleItemStatus('${item.id}')">
                                ${item.status === 'paused' ? 'Resume' : 'Pause'}
                            </button>
                            <button class="btn btn-small btn-danger" onclick="app.deleteItem('${item.id}')">Delete</button>
                        </div>
                    </div>
                    ${subItems.length > 0 ? this.renderSubItemsList(subItems) : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = itemsHtml;
    }

    /**
     * Render sub-items list
     */
    renderSubItemsList(subItems) {
        const subItemsHtml = subItems.map(subItem => {
            const lastCompletion = this.storage.getLastCompletionDate(subItem.id);
            return `
                <div class="sub-item ${subItem.status === 'paused' ? 'paused' : ''}" data-item-id="${subItem.id}">
                    <div class="practice-item-header">
                        <div class="practice-item-info">
                            <div class="practice-item-title">${escapeHtml(subItem.name)}
                                ${subItem.status === 'paused' ? '<span class="status-paused">PAUSED</span>' : ''}
                            </div>
                            ${subItem.description ? `<div class="practice-item-description">${escapeHtml(subItem.description)}</div>` : ''}
                            <div class="practice-item-meta">
                                Every ${subItem.recurDays} days
                                ${lastCompletion ? ` • Last: ${new Date(lastCompletion).toLocaleDateString()}` : ' • Never completed'}
                            </div>
                        </div>
                        <div class="practice-item-actions">
                            <button class="btn btn-small" onclick="app.editItem('${subItem.id}')">Edit</button>
                            <button class="btn btn-small ${subItem.status === 'paused' ? 'btn-secondary' : 'btn-danger'}" 
                                    onclick="app.toggleItemStatus('${subItem.id}')">
                                ${subItem.status === 'paused' ? 'Resume' : 'Pause'}
                            </button>
                            <button class="btn btn-small btn-danger" onclick="app.deleteItem('${subItem.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="sub-items">${subItemsHtml}</div>`;
    }

    /**
     * Handle clicks in items list
     */
    handleItemsListClick(e) {
        // Button clicks are handled by onclick attributes
    }

    /**
     * Handle clicks in categories list
     */
    handleCategoriesListClick(e) {
        // Button clicks are handled by onclick attributes
    }

    // ============ ITEM MANAGEMENT ============

    /**
     * Open item modal for adding/editing
     */
    openItemModal(itemId = null) {
        this.editingItemId = itemId;
        const modal = document.getElementById('itemModal');
        const overlay = document.getElementById('overlay');
        const form = document.getElementById('itemForm');
        const title = document.getElementById('modalTitle');

        // Update modal title and form
        if (itemId) {
            title.textContent = 'Edit Item';
            this.populateItemForm(itemId);
        } else {
            title.textContent = 'Add New Item';
            form.reset();
            document.getElementById('recurDays').value = 7;
        }

        // Show modal
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
        
        // Focus first input
        document.getElementById('itemName').focus();
    }

    /**
     * Populate form with item data
     */
    populateItemForm(itemId) {
        const item = this.storage.getItem(itemId);
        if (!item) return;

        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('recurDays').value = item.recurDays;
        document.getElementById('parentItem').value = item.parentId || '';
    }

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('itemModal').classList.add('hidden');
        document.getElementById('overlay').classList.add('hidden');
        this.editingItemId = null;
    }

    /**
     * Handle item form submit
     */
    handleItemFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('itemName').value.trim(),
            category: document.getElementById('itemCategory').value,
            description: document.getElementById('itemDescription').value.trim(),
            recurDays: parseInt(document.getElementById('recurDays').value),
            parentId: document.getElementById('parentItem').value || null
        };

        // Validation
        if (!formData.name) {
            showToast('Item name is required', 'error');
            return;
        }
        if (!formData.category) {
            showToast('Category is required', 'error');
            return;
        }
        if (formData.recurDays < 1) {
            showToast('Recurrence days must be at least 1', 'error');
            return;
        }

        try {
            if (this.editingItemId) {
                // Update existing item
                this.storage.updateItem(this.editingItemId, formData);
                showToast('Item updated successfully', 'success');
            } else {
                // Create new item
                this.storage.addItem(formData);
                showToast('Item added successfully', 'success');
            }

            this.closeModal();
            this.loadManageView();
            
            // Refresh today view if it's currently active
            if (this.currentView === 'today') {
                this.loadTodayView();
            }
        } catch (error) {
            showToast('Error saving item: ' + error.message, 'error');
        }
    }

    /**
     * Edit item
     */
    editItem(itemId) {
        this.openItemModal(itemId);
    }

    /**
     * Toggle item status (active/paused)
     */
    toggleItemStatus(itemId) {
        const item = this.storage.toggleItemStatus(itemId);
        if (item) {
            const status = item.status === 'paused' ? 'paused' : 'resumed';
            showToast(`Item ${status} successfully`, 'success');
            this.loadManageView();
            
            if (this.currentView === 'today') {
                this.loadTodayView();
            }
        }
    }

    /**
     * Delete item
     */
    async deleteItem(itemId) {
        const item = this.storage.getItem(itemId);
        if (!item) return;

        const subItems = this.storage.getSubItems(itemId);
        const message = subItems.length > 0 
            ? `Delete "${item.name}" and its ${subItems.length} sub-items? This cannot be undone.`
            : `Delete "${item.name}"? This cannot be undone.`;

        const confirmed = await confirmDialog(message);
        if (!confirmed) return;

        const deletedCount = this.storage.deleteItem(itemId);
        showToast(`Deleted ${deletedCount} item(s) successfully`, 'success');
        
        this.loadManageView();
        if (this.currentView === 'today') {
            this.loadTodayView();
        }
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PracticeMaestro();
});

// Make app globally available for onclick handlers
window.app = app; 