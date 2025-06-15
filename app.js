// Main application logic for Practice Maestro

class PracticeMaestro {
    constructor() {
        this.localStorage = new PracticeStorage();
        this.firebaseStorage = new FirebaseStorage();
        this.storage = this.localStorage;
        this.currentView = 'today';
        
        this.ui = new UIManager();
        this.auth = new AuthManager(this);
        
        this.initializeApp();
    }

    initializeApp() {
        this.ui.initializeUI();
        initializeDefaultCategories();
        this.auth.setupAuth();
        this.bindEvents();
        this.switchView('today');
    }

    bindEvents() {
        // Navigation
        document.getElementById('todayBtn').addEventListener('click', () => this.switchView('today'));
        document.getElementById('manageBtn').addEventListener('click', () => this.switchView('manage'));

        // Auth UI
        document.getElementById('signInToggleBtn').addEventListener('click', () => this.ui.toggleAuthForms());
        document.getElementById('cancelAuthBtn').addEventListener('click', () => this.ui.hideAuthForms());
        document.addEventListener('click', (e) => {
            if (!document.getElementById('authFormsContainer').contains(e.target) && !document.getElementById('signInToggleBtn').contains(e.target)) {
                this.ui.hideAuthForms();
            }
        });
        window.addEventListener('resize', () => this.ui.hideAuthForms());
        document.getElementById('googleAuthTab').addEventListener('click', () => this.ui.switchAuthTab('google'));
        document.getElementById('emailAuthTab').addEventListener('click', () => this.ui.switchAuthTab('email'));
        document.getElementById('showSignInForm').addEventListener('click', () => this.ui.showEmailForm('signin'));
        document.getElementById('showSignUpForm').addEventListener('click', () => this.ui.showEmailForm('signup'));

        // Auth Actions
        document.getElementById('signInBtn').addEventListener('click', () => this.auth.signInWithGoogle());
        document.getElementById('signOutBtn').addEventListener('click', () => this.auth.signOut());
        document.getElementById('emailSignInForm').addEventListener('submit', (e) => this.auth.handleEmailSignIn(e));
        document.getElementById('emailSignUpForm').addEventListener('submit', (e) => this.auth.handleEmailSignUp(e));
        document.getElementById('forgotPasswordBtn').addEventListener('click', () => this.auth.handleForgotPassword());

        // App Actions
        document.getElementById('addItemBtn').addEventListener('click', () => this.ui.openItemModal(null, (id) => this.populateItemForm(id)));
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.addCategory());
        document.getElementById('newCategoryInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });
        document.getElementById('categoryFilter').addEventListener('change', () => this.loadManageView());
        document.getElementById('statusFilter').addEventListener('change', () => this.loadManageView());
        document.getElementById('closeModal').addEventListener('click', () => this.ui.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.ui.closeModal());
        document.getElementById('overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.ui.closeModal();
        });
        document.getElementById('itemForm').addEventListener('submit', (e) => this.handleItemFormSubmit(e));
    }

    onSignIn(user) {
        this.storage = this.firebaseStorage;
        this.firebaseStorage.setUser(user);
        this.ui.setSignedInState(user);
        this.ui.hideAuthForms();
        this.checkDataMigration();
        this.loadCurrentView();
        showToast(`Welcome back, ${user.displayName}! 🎵`, 'success');
    }

    onSignOut() {
        this.storage = this.localStorage;
        this.ui.setSignedOutState();
        this.loadCurrentView();
        showToast('Signed out. Using local storage.', 'info');
    }

    async checkDataMigration() {
        try {
            const hasLocalData = this.localStorage.hasData();
            if (!hasLocalData) return;
            
            const hasCloudData = await this.firebaseStorage.hasExistingData();
            
            if (hasCloudData) {
                await this.downloadCloudData();
                showToast('Synced with cloud data! 🔄', 'success');
            } else {
                await this.uploadLocalData();
                showToast('Local data uploaded to cloud! 📤', 'success');
            }
        } catch (error) {
            console.error('Error during auto sync:', error);
            showToast('Sync failed, using local data', 'warning');
        }
    }

    async uploadLocalData() {
        try {
            await this.firebaseStorage.uploadLocalData(this.localStorage.exportData());
        } catch (error) {
            console.error('Error uploading local data:', error);
            throw error;
        }
    }

    async downloadCloudData() {
        try {
            await this.localStorage.importData(await this.firebaseStorage.exportData());
        } catch (error) {
            console.error('Error downloading cloud data:', error);
            throw error;
        }
    }

    switchView(view) {
        this.currentView = view;
        this.ui.switchView(view);
        this.loadCurrentView();
    }

    loadCurrentView() {
        if (this.currentView === 'today') {
            this.loadTodayView();
        } else if (this.currentView === 'manage') {
            this.loadManageView();
        }
    }

    async loadTodayView() {
        try {
            const todaysItems = await this.storage.getTodaysItems();
            this.ui.renderTodaysList(todaysItems, (item) => this.renderPracticeItem(item));
            const stats = await this.storage.getCompletionStats();
            this.ui.updateCompletionStats(stats);
        } catch (error) {
            console.error("Error loading today's view:", error);
            showToast('Error loading practice items', 'error');
        }
    }

    async renderPracticeItem(item) {
        return this.ui.renderPracticeItem(item, (id) => this.renderSubItemsForToday(id));
    }

    async renderSubItemsForToday(parentId) {
        try {
            const subItems = await this.storage.getSubItems(parentId);
            const todaysSubItems = [];
            for (const subItem of subItems) {
                if (subItem.status === 'paused') continue;
                const lastCompletion = await this.storage.getLastCompletionDate(subItem.id);
                if (!lastCompletion || daysBetween(getTodayString(), lastCompletion) >= subItem.recurDays) {
                    todaysSubItems.push(subItem);
                }
            }
            if (todaysSubItems.length === 0) return '';
            const subItemsHtml = await Promise.all(todaysSubItems.map(async subItem => {
                const isCompleted = await this.storage.isItemCompleted(subItem.id);
                return `<div class="sub-item ${isCompleted ? 'completed' : ''}" data-item-id="${subItem.id}">...</div>`; // Simplified
            }));
            return `<div class="sub-items">${subItemsHtml.join('')}</div>`;
        } catch (error) {
            console.error('Error rendering sub-items:', error);
            return '';
        }
    }

    async toggleItemCompletion(itemId) {
        try {
            const isCompleted = await this.storage.isItemCompleted(itemId);
            if (isCompleted) {
                await this.storage.unmarkItemCompleted(itemId);
                showToast('Item unmarked as completed', 'info');
            } else {
                await this.storage.markItemCompleted(itemId);
                showToast('Item completed! 🎉', 'success');
            }
            this.loadTodayView();
        } catch (error) {
            console.error('Error toggling completion:', error);
            showToast('Error updating completion status', 'error');
        }
    }

    async loadManageView() {
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadItems(),
                this.loadFilterOptions()
            ]);
        } catch (error) {
            console.error('Error loading management view:', error);
            showToast('Error loading management view', 'error');
        }
    }

    async loadCategories() {
        const categories = await this.storage.getCategories();
        this.ui.renderCategories(categories);
    }

    async loadItems() {
        const filters = this.ui.getFilterValues();
        const items = await this.storage.getItems(filters.category, filters.status);
        this.ui.renderItemsList(items, (id) => this.storage.getSubItems(id), (subItems) => this.renderSubItemsList(subItems));
    }

    async renderSubItemsList(subItems) {
        return this.ui.renderSubItemsList(subItems);
    }
    
    async loadFilterOptions() {
        const categories = await this.storage.getCategories();
        this.ui.updateCategoryFilterOptions(categories);
        this.ui.updateItemCategoryOptions(categories);
        const topLevelItems = await this.storage.getTopLevelItems();
        this.ui.updateParentItemOptions(topLevelItems);
    }

    async addCategory() {
        const name = this.ui.getNewCategoryName();
        if (!name) return;
        try {
            await this.storage.addCategory({ name });
            showToast('Category added!', 'success');
            this.loadManageView();
        } catch (error) {
            console.error('Error adding category:', error);
            showToast('Error adding category.', 'error');
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category? This will not delete the items in it.')) return;
        try {
            await this.storage.deleteCategory(categoryId);
            showToast('Category deleted!', 'success');
            this.loadManageView();
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Error deleting category.', 'error');
        }
    }

    async handleItemFormSubmit(e) {
        e.preventDefault();
        const formData = this.ui.getItemFormData();
        if (!formData.name || !formData.category) {
            showToast('Item name and category are required.', 'error');
            return;
        }
        try {
            if (this.ui.editingItemId) {
                await this.storage.updateItem(this.ui.editingItemId, formData);
                showToast('Item updated!', 'success');
            } else {
                await this.storage.addItem(formData);
                showToast('Item added!', 'success');
            }
            this.ui.closeModal();
            this.loadManageView();
        } catch (error) {
            console.error('Error saving item:', error);
            showToast('Error saving item.', 'error');
        }
    }

    async populateItemForm(itemId) {
        const item = await this.storage.getItem(itemId);
        if (!item) return;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('recurDays').value = item.recurDays;
        document.getElementById('parentItem').value = item.parentId || '';
    }

    editItem(itemId) {
        this.ui.openItemModal(itemId, (id) => this.populateItemForm(id));
    }

    async toggleItemStatus(itemId) {
        try {
            const item = await this.storage.toggleItemStatus(itemId);
            showToast(`Item ${item.status === 'paused' ? 'paused' : 'resumed'}!`, 'success');
            this.loadManageView();
        } catch (error) {
            console.error('Error toggling item status:', error);
            showToast('Error updating item status.', 'error');
        }
    }

    async deleteItem(itemId) {
        const item = await this.storage.getItem(itemId);
        if (!item) return;
        const subItems = await this.storage.getSubItems(itemId);
        const message = subItems.length > 0 ? `Delete "${item.name}" and its ${subItems.length} sub-items?` : `Delete "${item.name}"?`;
        if (!confirm(message)) return;

        try {
            await this.storage.deleteItem(itemId);
            showToast('Item(s) deleted!', 'success');
            this.loadManageView();
        } catch (error) {
            console.error('Error deleting item:', error);
            showToast('Error deleting item.', 'error');
        }
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PracticeMaestro();
    window.app = app;
}); 