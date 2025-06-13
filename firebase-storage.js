// Firebase storage implementation for Practice Maestro

class FirebaseStorage {
    constructor() {
        this.user = null;
        this.db = null;
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        this.syncCallbacks = [];
        
        // Initialize Firebase
        this.initializeFirebase();
        
        // Monitor online status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifySyncStatus('synced');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifySyncStatus('offline');
        });
    }

    /**
     * Initialize Firebase with config
     */
    initializeFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyBNcWKtSN1xAWmSmzyGkIMvSXjderv_ClM",
            authDomain: "practicemaestro.firebaseapp.com",
            projectId: "practicemaestro",
            storageBucket: "practicemaestro.firebasestorage.app",
            messagingSenderId: "722119150337",
            appId: "1:722119150337:web:f43ad638f29e18bb9f6900",
            measurementId: "G-Q4XHGQ5NKQ"
        };

        try {
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            
            // Enable offline persistence
            this.db.enablePersistence()
                .catch((err) => {
                    console.warn('Firestore persistence failed:', err);
                });
            
            this.isInitialized = true;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization failed:', error);
        }
    }

    /**
     * Set current user
     */
    setUser(user) {
        this.user = user;
    }

    /**
     * Get user's document path
     */
    getUserDocPath() {
        if (!this.user) {
            throw new Error('User not authenticated');
        }
        return `users/${this.user.uid}`;
    }

    /**
     * Add sync status callback
     */
    onSyncStatusChange(callback) {
        this.syncCallbacks.push(callback);
    }

    /**
     * Notify sync status change
     */
    notifySyncStatus(status) {
        this.syncCallbacks.forEach(callback => callback(status));
    }

    /**
     * Execute Firestore operation with error handling
     */
    async executeOperation(operation, operationName = 'Operation') {
        if (!this.isInitialized || !this.user) {
            throw new Error('Firebase not initialized or user not authenticated');
        }

        try {
            this.notifySyncStatus('syncing');
            const result = await operation();
            this.notifySyncStatus('synced');
            return result;
        } catch (error) {
            console.error(`${operationName} failed:`, error);
            this.notifySyncStatus('offline');
            throw error;
        }
    }

    // ============ ITEMS MANAGEMENT ============

    /**
     * Get all practice items
     */
    async getItems() {
        return this.executeOperation(async () => {
            const doc = await this.db.doc(this.getUserDocPath()).get();
            const data = doc.data();
            return data?.items || [];
        }, 'Get items');
    }

    /**
     * Add a new practice item
     */
    async addItem(item) {
        return this.executeOperation(async () => {
            const newItem = {
                id: generateId(),
                name: item.name,
                category: item.category,
                description: item.description || '',
                recurDays: item.recurDays || 7,
                parentId: item.parentId || null,
                status: 'active',
                createdAt: getTodayString(),
                ...item
            };

            const items = await this.getItems();
            items.push(newItem);
            
            await this.db.doc(this.getUserDocPath()).set({
                items: items
            }, { merge: true });

            return newItem;
        }, 'Add item');
    }

    /**
     * Update a practice item
     */
    async updateItem(itemId, updates) {
        return this.executeOperation(async () => {
            const items = await this.getItems();
            const index = items.findIndex(item => item.id === itemId);
            
            if (index !== -1) {
                items[index] = { ...items[index], ...updates };
                
                await this.db.doc(this.getUserDocPath()).set({
                    items: items
                }, { merge: true });
                
                return items[index];
            }
            return null;
        }, 'Update item');
    }

    /**
     * Delete a practice item and its sub-items
     */
    async deleteItem(itemId) {
        return this.executeOperation(async () => {
            const items = await this.getItems();
            const itemsToDelete = [itemId];
            
            // Find all sub-items recursively
            const findSubItems = (parentId) => {
                const subItems = items.filter(item => item.parentId === parentId);
                subItems.forEach(subItem => {
                    itemsToDelete.push(subItem.id);
                    findSubItems(subItem.id);
                });
            };
            
            findSubItems(itemId);
            
            // Remove all items
            const filteredItems = items.filter(item => !itemsToDelete.includes(item.id));
            
            // Also remove completions for deleted items
            const completions = await this.getCompletions();
            itemsToDelete.forEach(id => {
                delete completions[id];
            });
            
            await this.db.doc(this.getUserDocPath()).set({
                items: filteredItems,
                completions: completions
            }, { merge: true });
            
            return itemsToDelete.length;
        }, 'Delete item');
    }

    /**
     * Get item by ID
     */
    async getItem(itemId) {
        const items = await this.getItems();
        return items.find(item => item.id === itemId);
    }

    /**
     * Get top-level items (no parent)
     */
    async getTopLevelItems() {
        const items = await this.getItems();
        return items.filter(item => !item.parentId);
    }

    /**
     * Get sub-items of a parent item
     */
    async getSubItems(parentId) {
        const items = await this.getItems();
        return items.filter(item => item.parentId === parentId);
    }

    /**
     * Toggle item status (active/paused)
     */
    async toggleItemStatus(itemId) {
        const item = await this.getItem(itemId);
        if (item) {
            const newStatus = item.status === 'active' ? 'paused' : 'active';
            return await this.updateItem(itemId, { status: newStatus });
        }
        return null;
    }

    // ============ CATEGORIES MANAGEMENT ============

    /**
     * Get all categories
     */
    async getCategories() {
        return this.executeOperation(async () => {
            const doc = await this.db.doc(this.getUserDocPath()).get();
            const data = doc.data();
            return data?.categories || [];
        }, 'Get categories');
    }

    /**
     * Add a new category
     */
    async addCategory(name) {
        return this.executeOperation(async () => {
            const categories = await this.getCategories();
            
            // Check if category already exists
            if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
                return null; // Category already exists
            }
            
            const newCategory = {
                id: generateId(),
                name: name.trim(),
                createdAt: getTodayString()
            };
            
            categories.push(newCategory);
            
            await this.db.doc(this.getUserDocPath()).set({
                categories: categories
            }, { merge: true });
            
            return newCategory;
        }, 'Add category');
    }

    /**
     * Delete a category
     */
    async deleteCategory(categoryId) {
        return this.executeOperation(async () => {
            const categories = await this.getCategories();
            const category = categories.find(cat => cat.id === categoryId);
            
            if (!category) return false;
            
            // Check if category is in use
            const items = await this.getItems();
            const isInUse = items.some(item => item.category === category.name);
            
            if (isInUse) {
                return false; // Cannot delete category in use
            }
            
            const filteredCategories = categories.filter(cat => cat.id !== categoryId);
            
            await this.db.doc(this.getUserDocPath()).set({
                categories: filteredCategories
            }, { merge: true });
            
            return true;
        }, 'Delete category');
    }

    // ============ COMPLETIONS MANAGEMENT ============

    /**
     * Get all completions
     */
    async getCompletions() {
        return this.executeOperation(async () => {
            const doc = await this.db.doc(this.getUserDocPath()).get();
            const data = doc.data();
            return data?.completions || {};
        }, 'Get completions');
    }

    /**
     * Mark item as completed for a specific date
     */
    async markItemCompleted(itemId, date = getTodayString()) {
        return this.executeOperation(async () => {
            const completions = await this.getCompletions();
            
            if (!completions[itemId]) {
                completions[itemId] = [];
            }
            
            // Check if already completed today
            if (!completions[itemId].includes(date)) {
                completions[itemId].push(date);
                
                await this.db.doc(this.getUserDocPath()).set({
                    completions: completions
                }, { merge: true });
                
                return true;
            }
            return false; // Already completed
        }, 'Mark item completed');
    }

    /**
     * Unmark item completion for a specific date
     */
    async unmarkItemCompleted(itemId, date = getTodayString()) {
        return this.executeOperation(async () => {
            const completions = await this.getCompletions();
            
            if (completions[itemId]) {
                completions[itemId] = completions[itemId].filter(d => d !== date);
                if (completions[itemId].length === 0) {
                    delete completions[itemId];
                }
                
                await this.db.doc(this.getUserDocPath()).set({
                    completions: completions
                }, { merge: true });
                
                return true;
            }
            return false;
        }, 'Unmark item completed');
    }

    /**
     * Check if item is completed on a specific date
     */
    async isItemCompleted(itemId, date = getTodayString()) {
        const completions = await this.getCompletions();
        return completions[itemId] && completions[itemId].includes(date);
    }

    /**
     * Get last completion date for an item
     */
    async getLastCompletionDate(itemId) {
        const completions = await this.getCompletions();
        if (completions[itemId] && completions[itemId].length > 0) {
            return completions[itemId].sort().pop(); // Get most recent date
        }
        return null;
    }

    /**
     * Get items that should appear today based on their recurrence
     */
    async getTodaysItems() {
        const items = await this.getItems();
        const completions = await this.getCompletions();
        const today = getTodayString();
        const todaysItems = [];

        items.forEach(item => {
            // Skip paused items
            if (item.status === 'paused') return;

            const itemCompletions = completions[item.id] || [];
            const lastCompletion = itemCompletions.length > 0 ? 
                itemCompletions.sort().pop() : null;
            
            if (!lastCompletion) {
                // Never completed, should appear today
                todaysItems.push({
                    ...item,
                    isCompleted: itemCompletions.includes(today),
                    daysSinceLastCompletion: null
                });
            } else {
                const daysSince = daysBetween(today, lastCompletion);
                const shouldAppear = daysSince >= item.recurDays;
                
                if (shouldAppear) {
                    todaysItems.push({
                        ...item,
                        isCompleted: itemCompletions.includes(today),
                        daysSinceLastCompletion: daysSince
                    });
                }
            }
        });

        return todaysItems;
    }

    /**
     * Get completion statistics
     */
    async getCompletionStats(date = getTodayString()) {
        const todaysItems = await this.getTodaysItems();
        const completedCount = todaysItems.filter(item => item.isCompleted).length;
        
        return {
            total: todaysItems.length,
            completed: completedCount,
            remaining: todaysItems.length - completedCount,
            percentage: todaysItems.length > 0 ? Math.round((completedCount / todaysItems.length) * 100) : 0
        };
    }

    // ============ DATA MANAGEMENT ============

    /**
     * Export all data
     */
    async exportData() {
        return this.executeOperation(async () => {
            const [items, categories, completions] = await Promise.all([
                this.getItems(),
                this.getCategories(),
                this.getCompletions()
            ]);
            
            return {
                items,
                categories,
                completions,
                exportDate: new Date().toISOString()
            };
        }, 'Export data');
    }

    /**
     * Import data (replaces existing data)
     */
    async importData(data) {
        return this.executeOperation(async () => {
            const importData = {};
            
            if (data.items) {
                importData.items = data.items;
            }
            if (data.categories) {
                importData.categories = data.categories;
            }
            if (data.completions) {
                importData.completions = data.completions;
            }
            
            await this.db.doc(this.getUserDocPath()).set(importData, { merge: true });
            return true;
        }, 'Import data');
    }

    /**
     * Clear all data
     */
    async clearAllData() {
        return this.executeOperation(async () => {
            await this.db.doc(this.getUserDocPath()).delete();
            return true;
        }, 'Clear all data');
    }

    /**
     * Upload local data to Firebase
     */
    async uploadLocalData(localData) {
        return this.executeOperation(async () => {
            await this.db.doc(this.getUserDocPath()).set({
                items: localData.items || [],
                categories: localData.categories || [],
                completions: localData.completions || {}
            });
            return true;
        }, 'Upload local data');
    }

    /**
     * Check if user has existing data in Firebase
     */
    async hasExistingData() {
        try {
            const doc = await this.db.doc(this.getUserDocPath()).get();
            const data = doc.data();
            return doc.exists && (
                (data.items && data.items.length > 0) ||
                (data.categories && data.categories.length > 0) ||
                (data.completions && Object.keys(data.completions).length > 0)
            );
        } catch (error) {
            console.error('Error checking existing data:', error);
            return false;
        }
    }
} 