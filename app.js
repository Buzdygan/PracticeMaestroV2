// Main application logic for Practice Maestro with Firebase integration

class PracticeMaestro {
    constructor() {
        this.localStorage = new PracticeStorage();
        this.firebaseStorage = new FirebaseStorage();
        this.storage = this.localStorage; // Default to localStorage
        this.currentView = 'today';
        this.editingItemId = null;
        this.user = null;
        this.isSignedIn = false;
        
        this.initializeApp();
        this.bindEvents();
        this.setupAuth();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        // Initialize default categories if needed
        initializeDefaultCategories();
        
        // Set current date
        document.getElementById('currentDate').textContent = formatDate(new Date());
        
        // Setup sync status callbacks
        this.firebaseStorage.onSyncStatusChange((status) => this.updateSyncStatus(status));
        
        // Load initial view
        this.switchView('today');
    }

    /**
     * Setup Firebase authentication
     */
    setupAuth() {
        // Wait for Firebase to be ready
        if (typeof firebase === 'undefined') {
            setTimeout(() => this.setupAuth(), 100);
            return;
        }

        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.handleSignIn(user);
            } else {
                this.handleSignOut();
            }
        });
    }

    /**
     * Handle user sign in
     */
    async handleSignIn(user) {
        this.user = user;
        this.isSignedIn = true;
        this.firebaseStorage.setUser(user);
        this.storage = this.firebaseStorage;
        
        // Update UI
        this.updateAuthUI();
        
        // Check for data migration
        await this.checkDataMigration();
        
        // Reload current view with Firebase data
        this.loadCurrentView();
        
        showToast(`Welcome back, ${user.displayName}! 🎵`, 'success');
    }

    /**
     * Handle user sign out
     */
    handleSignOut() {
        this.user = null;
        this.isSignedIn = false;
        this.storage = this.localStorage;
        
        // Update UI
        this.updateAuthUI();
        this.updateSyncStatus('offline');
        
        // Reload current view with localStorage data
        this.loadCurrentView();
        
        showToast('Signed out. Using local storage.', 'info');
    }

    /**
     * Update authentication UI
     */
    updateAuthUI() {
        const signedInState = document.getElementById('signedInState');
        const signedOutState = document.getElementById('signedOutState');
        const syncStatus = document.getElementById('syncStatus');
        
        if (this.isSignedIn && this.user) {
            // Show signed in state
            signedInState.classList.remove('hidden');
            signedOutState.classList.add('hidden');
            syncStatus.classList.remove('hidden');
            
            // Update user info
            document.getElementById('userName').textContent = this.user.displayName || this.user.email;
            document.getElementById('userPhoto').src = this.user.photoURL || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(this.user.displayName || this.user.email)}&background=667eea&color=fff`;
        } else {
            // Show signed out state
            signedInState.classList.add('hidden');
            signedOutState.classList.remove('hidden');
            syncStatus.classList.add('hidden');
        }
    }

    /**
     * Update sync status indicator
     */
    updateSyncStatus(status) {
        const indicator = document.getElementById('syncIndicator');
        if (!indicator) return;
        
        // Remove all status classes
        indicator.classList.remove('syncing', 'synced', 'offline');
        
        switch (status) {
            case 'syncing':
                indicator.textContent = '📡 Syncing...';
                indicator.classList.add('syncing');
                break;
            case 'synced':
                indicator.textContent = '✅ Synced';
                indicator.classList.add('synced');
                break;
            case 'offline':
                indicator.textContent = '📴 Offline';
                indicator.classList.add('offline');
                break;
        }
    }

    /**
     * Check if data migration is needed
     */
    async checkDataMigration() {
        try {
            // Check if user has local data
            const localItems = this.localStorage.getItems();
            const localCategories = this.localStorage.getCategories();
            const localCompletions = this.localStorage.getCompletions();
            
            const hasLocalData = localItems.length > 0 || 
                               localCategories.length > 0 || 
                               Object.keys(localCompletions).length > 0;
            
            if (!hasLocalData) return; // No local data to migrate
            
            // Check if user has cloud data
            const hasCloudData = await this.firebaseStorage.hasExistingData();
            
            if (hasCloudData) {
                // Show migration options
                this.showMigrationModal();
            } else {
                // Automatically upload local data
                await this.uploadLocalData();
            }
        } catch (error) {
            console.error('Error checking data migration:', error);
        }
    }

    /**
     * Show migration modal
     */
    showMigrationModal() {
        const modal = document.getElementById('migrationModal');
        const overlay = document.getElementById('overlay');
        
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
    }

    /**
     * Hide migration modal
     */
    hideMigrationModal() {
        const modal = document.getElementById('migrationModal');
        const overlay = document.getElementById('overlay');
        
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
    }

    /**
     * Upload local data to cloud
     */
    async uploadLocalData() {
        try {
            const localData = {
                items: this.localStorage.getItems(),
                categories: this.localStorage.getCategories(),
                completions: this.localStorage.getCompletions()
            };
            
            await this.firebaseStorage.uploadLocalData(localData);
            showToast('Local data uploaded to cloud! 📤', 'success');
        } catch (error) {
            console.error('Error uploading local data:', error);
            showToast('Failed to upload local data', 'error');
        }
    }

    /**
     * Download cloud data and replace local
     */
    async downloadCloudData() {
        try {
            const cloudData = await this.firebaseStorage.exportData();
            await this.localStorage.importData(cloudData);
            showToast('Cloud data downloaded! 📥', 'success');
        } catch (error) {
            console.error('Error downloading cloud data:', error);
            showToast('Failed to download cloud data', 'error');
        }
    }

    /**
     * Load current view
     */
    loadCurrentView() {
        if (this.currentView === 'today') {
            this.loadTodayView();
        } else if (this.currentView === 'manage') {
            this.loadManageView();
        }
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Navigation
        document.getElementById('todayBtn').addEventListener('click', () => this.switchView('today'));
        document.getElementById('manageBtn').addEventListener('click', () => this.switchView('manage'));

        // Authentication
        document.getElementById('signInBtn').addEventListener('click', () => this.signIn());
        document.getElementById('signOutBtn').addEventListener('click', () => this.signOut());

        // Migration modal
        document.getElementById('uploadDataBtn').addEventListener('click', () => this.handleUploadData());
        document.getElementById('downloadDataBtn').addEventListener('click', () => this.handleDownloadData());
        document.getElementById('skipMigrationBtn').addEventListener('click', () => this.handleSkipMigration());

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
        document.getElementById('overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
        document.getElementById('itemForm').addEventListener('submit', (e) => this.handleItemFormSubmit(e));
    }

    // ============ AUTHENTICATION METHODS ============

    /**
     * Sign in with Google
     */
    async signIn() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await firebase.auth().signInWithPopup(provider);
        } catch (error) {
            console.error('Sign in failed:', error);
            showToast('Sign in failed: ' + error.message, 'error');
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        try {
            await firebase.auth().signOut();
        } catch (error) {
            console.error('Sign out failed:', error);
            showToast('Sign out failed: ' + error.message, 'error');
        }
    }

    // ============ MIGRATION HANDLERS ============

    async handleUploadData() {
        this.hideMigrationModal();
        await this.uploadLocalData();
        this.loadCurrentView();
    }

    async handleDownloadData() {
        this.hideMigrationModal();
        await this.downloadCloudData();
        this.loadCurrentView();
    }

    handleSkipMigration() {
        this.hideMigrationModal();
        showToast('Starting fresh with cloud storage', 'info');
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
        this.loadCurrentView();
    }

    // ============ TODAY'S PRACTICE VIEW ============

    /**
     * Load today's practice view
     */
    async loadTodayView() {
        try {
            const todaysItems = await this.storage.getTodaysItems();
            const stats = await this.storage.getCompletionStats();
            
            // Update stats
            document.getElementById('completedCount').textContent = stats.completed;
            document.getElementById('totalCount').textContent = stats.total;

            // Render items
            this.renderTodaysList(todaysItems);
        } catch (error) {
            console.error('Error loading today\'s view:', error);
            showToast('Error loading practice items', 'error');
        }
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
            return this.renderPracticeItem(item);
        }).join('');

        container.innerHTML = itemsHtml;
    }

    /**
     * Render a single practice item
     */
    renderPracticeItem(item) {
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
                ${this.renderSubItemsForToday(item.id)}
            </div>
        `;
    }

    /**
     * Render sub-items for today's practice
     */
    async renderSubItemsForToday(parentId) {
        try {
            const subItems = await this.storage.getSubItems(parentId);
            const todaysSubItems = [];
            
            for (const subItem of subItems) {
                if (subItem.status === 'paused') continue;
                
                const lastCompletion = await this.storage.getLastCompletionDate(subItem.id);
                if (!lastCompletion) {
                    todaysSubItems.push(subItem);
                } else {
                    const daysSince = daysBetween(getTodayString(), lastCompletion);
                    if (daysSince >= subItem.recurDays) {
                        todaysSubItems.push(subItem);
                    }
                }
            }

            if (todaysSubItems.length === 0) return '';

            const subItemsHtml = await Promise.all(todaysSubItems.map(async subItem => {
                const isCompleted = await this.storage.isItemCompleted(subItem.id);
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
            }));

            return `<div class="sub-items">${subItemsHtml.join('')}</div>`;
        } catch (error) {
            console.error('Error rendering sub-items:', error);
            return '';
        }
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

    // ============ MANAGEMENT VIEW ============

    /**
     * Load management view
     */
    async loadManageView() {
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadCategoryFilterOptions(),
                this.loadItems()
            ]);
        } catch (error) {
            console.error('Error loading management view:', error);
            showToast('Error loading management view', 'error');
        }
    }

    /**
     * Load categories section
     */
    async loadCategories() {
        try {
            const categories = await this.storage.getCategories();
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
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    /**
     * Load category filter options
     */
    async loadCategoryFilterOptions() {
        try {
            const categories = await this.storage.getCategories();
            const selects = [
                document.getElementById('categoryFilter'),
                document.getElementById('itemCategory')
            ];

            selects.forEach(select => {
                const currentValue = select.value;
                
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
            await this.loadParentItemOptions();
        } catch (error) {
            console.error('Error loading category options:', error);
        }
    }

    /**
     * Load parent item options
     */
    async loadParentItemOptions() {
        try {
            const items = await this.storage.getTopLevelItems();
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
        } catch (error) {
            console.error('Error loading parent item options:', error);
        }
    }

    /**
     * Add new category
     */
    async addCategory() {
        const input = document.getElementById('newCategoryInput');
        const name = input.value.trim();
        
        if (!name) {
            showToast('Please enter a category name', 'error');
            return;
        }

        try {
            const category = await this.storage.addCategory(name);
            if (category) {
                input.value = '';
                await this.loadCategories();
                await this.loadCategoryFilterOptions();
                showToast('Category added successfully', 'success');
            } else {
                showToast('Category already exists', 'error');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            showToast('Error adding category', 'error');
        }
    }

    /**
     * Delete category
     */
    async deleteCategory(categoryId) {
        try {
            const categories = await this.storage.getCategories();
            const category = categories.find(cat => cat.id === categoryId);
            
            if (!category) return;

            const confirmed = await confirmDialog(`Delete category "${category.name}"? This will only work if no items use this category.`);
            if (!confirmed) return;

            const success = await this.storage.deleteCategory(categoryId);
            if (success) {
                await this.loadCategories();
                await this.loadCategoryFilterOptions();
                showToast('Category deleted successfully', 'success');
            } else {
                showToast('Cannot delete category - it\'s being used by items', 'error');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Error deleting category', 'error');
        }
    }

    /**
     * Load items list
     */
    async loadItems() {
        try {
            const categoryFilter = document.getElementById('categoryFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;
            
            let items = await this.storage.getTopLevelItems();

            // Apply filters
            if (categoryFilter) {
                items = items.filter(item => item.category === categoryFilter);
            }
            if (statusFilter) {
                items = items.filter(item => item.status === statusFilter);
            }

            this.renderItemsList(items);
        } catch (error) {
            console.error('Error loading items:', error);
            showToast('Error loading items', 'error');
        }
    }

    /**
     * Render items list
     */
    async renderItemsList(items) {
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

        try {
            const itemsHtml = await Promise.all(items.map(async item => {
                const subItems = await this.storage.getSubItems(item.id);
                const lastCompletion = await this.storage.getLastCompletionDate(item.id);
                
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
                        ${subItems.length > 0 ? await this.renderSubItemsList(subItems) : ''}
                    </div>
                `;
            }));

            container.innerHTML = itemsHtml.join('');
        } catch (error) {
            console.error('Error rendering items list:', error);
            container.innerHTML = '<p style="color: #f56565;">Error loading items</p>';
        }
    }

    /**
     * Render sub-items list
     */
    async renderSubItemsList(subItems) {
        try {
            const subItemsHtml = await Promise.all(subItems.map(async subItem => {
                const lastCompletion = await this.storage.getLastCompletionDate(subItem.id);
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
            }));

            return `<div class="sub-items">${subItemsHtml.join('')}</div>`;
        } catch (error) {
            console.error('Error rendering sub-items:', error);
            return '';
        }
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
    async openItemModal(itemId = null) {
        this.editingItemId = itemId;
        const modal = document.getElementById('itemModal');
        const overlay = document.getElementById('overlay');
        const form = document.getElementById('itemForm');
        const title = document.getElementById('modalTitle');

        // Update modal title and form
        if (itemId) {
            title.textContent = 'Edit Item';
            await this.populateItemForm(itemId);
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
    async populateItemForm(itemId) {
        try {
            const item = await this.storage.getItem(itemId);
            if (!item) return;

            document.getElementById('itemName').value = item.name;
            document.getElementById('itemCategory').value = item.category;
            document.getElementById('itemDescription').value = item.description || '';
            document.getElementById('recurDays').value = item.recurDays;
            document.getElementById('parentItem').value = item.parentId || '';
        } catch (error) {
            console.error('Error populating form:', error);
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('itemModal').classList.add('hidden');
        document.getElementById('migrationModal').classList.add('hidden');
        document.getElementById('overlay').classList.add('hidden');
        this.editingItemId = null;
    }

    /**
     * Handle item form submit
     */
    async handleItemFormSubmit(e) {
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
                await this.storage.updateItem(this.editingItemId, formData);
                showToast('Item updated successfully', 'success');
            } else {
                // Create new item
                await this.storage.addItem(formData);
                showToast('Item added successfully', 'success');
            }

            this.closeModal();
            await this.loadManageView();
            
            // Refresh today view if it's currently active
            if (this.currentView === 'today') {
                this.loadTodayView();
            }
        } catch (error) {
            console.error('Error saving item:', error);
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
    async toggleItemStatus(itemId) {
        try {
            const item = await this.storage.toggleItemStatus(itemId);
            if (item) {
                const status = item.status === 'paused' ? 'paused' : 'resumed';
                showToast(`Item ${status} successfully`, 'success');
                await this.loadManageView();
                
                if (this.currentView === 'today') {
                    this.loadTodayView();
                }
            }
        } catch (error) {
            console.error('Error toggling item status:', error);
            showToast('Error updating item status', 'error');
        }
    }

    /**
     * Delete item
     */
    async deleteItem(itemId) {
        try {
            const item = await this.storage.getItem(itemId);
            if (!item) return;

            const subItems = await this.storage.getSubItems(itemId);
            const message = subItems.length > 0 
                ? `Delete "${item.name}" and its ${subItems.length} sub-items? This cannot be undone.`
                : `Delete "${item.name}"? This cannot be undone.`;

            const confirmed = await confirmDialog(message);
            if (!confirmed) return;

            const deletedCount = await this.storage.deleteItem(itemId);
            showToast(`Deleted ${deletedCount} item(s) successfully`, 'success');
            
            await this.loadManageView();
            if (this.currentView === 'today') {
                this.loadTodayView();
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showToast('Error deleting item', 'error');
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