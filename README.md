# 🎼 Practice Maestro - Musical Exercise Tracker

A simple, serverless web application for tracking musical practice exercises. Built with pure HTML, CSS, and JavaScript, with **cross-device sync** powered by Firebase. Perfect for deployment on GitHub Pages.

## ✨ Features

- **Daily Practice View**: See what needs to be practiced today
- **Smart Recurrence**: Items reappear after a specified number of days since completion
- **Categories**: Organize exercises by type (scales, chords, pieces, etc.)
- **Sub-items**: Break down complex pieces into smaller practice sections
- **Pause Functionality**: Temporarily disable items without deleting them
- **🔥 Cross-Device Sync**: Sign in with Google to sync across all your devices
- **📱 Mobile Friendly**: Works great on both desktop and mobile devices
- **💾 Dual Storage**: Uses Firebase when signed in, localStorage when offline
- **🛡️ Secure**: Your data is private and synced securely with Firebase
- **Modern UI**: Clean, responsive design with smooth animations

## 🔐 Authentication & Sync

### Sign In Options
- **Guest Mode**: Use without signing in (localStorage only)
- **Google Sign-In**: Full cross-device sync with Firebase

### Data Storage
- **Signed Out**: Data stored locally in your browser
- **Signed In**: Data synced to the cloud and available on all devices
- **Offline Support**: Works offline, syncs when back online

### Data Migration
When you first sign in, the app will help you migrate existing local data:
- **Upload Local Data**: Move your browser data to the cloud
- **Download Cloud Data**: Replace local data with cloud data
- **Skip**: Start fresh with cloud storage

## 🚀 Getting Started

### Option 1: Download and Use Locally

1. Download all files from this repository
2. Open `index.html` in your web browser
3. Start adding your practice items!

### Option 2: Deploy to GitHub Pages

#### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `practice-maestro` or `my-practice-tracker`
3. Make sure it's set to **Public** (required for free GitHub Pages)
4. Check "Add a README file"

#### Step 2: Upload Files

1. Click "uploading an existing file" or use git to push files
2. Upload all the files from this project:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `storage.js`
   - `firebase-storage.js`
   - `utils.js`
   - `README.md` (optional)

#### Step 3: Enable GitHub Pages

1. Go to your repository's **Settings** tab
2. Scroll down to **Pages** section in the left sidebar
3. Under **Source**, select "Deploy from a branch"
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**

#### Step 4: Access Your App

1. GitHub will provide a URL like: `https://yourusername.github.io/your-repo-name`
2. It may take a few minutes to deploy
3. Visit the URL to access your practice tracker!

## 📱 How to Use

### Getting Started

1. **Open the app** in your browser
2. **Optional**: Click "Sign In for Sync" to enable cross-device features
3. **Add categories** for your practice areas
4. **Create practice items** with appropriate recurrence intervals
5. **Start practicing** and mark items complete!

### Daily Practice

1. Open the app to see today's practice items
2. Complete items by clicking "Mark Complete"
3. Track your progress with the completion counter
4. Completed items will reappear based on their recurrence settings

### Managing Items

1. Click "Manage Items" to add, edit, or delete practice items
2. Create categories to organize your exercises
3. Set how often each item should reappear (in days)
4. Create sub-items for complex pieces (e.g., different movements)
5. Pause items temporarily without losing your progress

### Categories

Default categories include:
- Scales
- Chords  
- Pieces
- Technique
- Theory
- Sight Reading

You can add, edit, or delete categories as needed.

## 💾 Data Storage & Privacy

### Local Storage (Guest Mode)
- ✅ **Pros**: No account required, works offline, fast and responsive
- ❌ **Cons**: Data tied to browser/device, clearing browser data will delete history

### Firebase Cloud Storage (Signed In)
- ✅ **Pros**: Cross-device sync, secure, backed up, accessible anywhere
- ✅ **Pros**: Real-time sync, offline support, Google account integration
- ❌ **Cons**: Requires Google account

### Privacy & Security
- Your practice data is **private** and only accessible to you
- Data is stored securely in Google Firebase with industry-standard encryption
- No personal information is collected beyond what's needed for authentication
- You can delete your account and data at any time

### Data Migration
- Seamless migration between local and cloud storage
- Import/export functionality for data backup
- No data loss when switching between modes

## 🛠️ Technical Details

The app is built with modular JavaScript for easy customization:

- **`index.html`**: HTML structure and layout
- **`styles.css`**: All styling and responsive design
- **`app.js`**: Main application logic and UI management
- **`storage.js`**: Local storage management (localStorage)
- **`firebase-storage.js`**: Cloud storage management (Firestore)
- **`utils.js`**: Helper functions and utilities

### Firebase Integration
- **Authentication**: Google OAuth 2.0
- **Database**: Firestore for real-time data sync
- **Offline Support**: Automatic caching and sync when online
- **Security**: User-based data isolation with Firestore rules

### Common Customizations

1. **Change default recurrence days**: Edit the default value in `index.html` (line with `value="7"`)
2. **Add new categories**: Modify the `defaultCategories` array in `utils.js`
3. **Customize styling**: Edit `styles.css` to change colors, fonts, or layouts
4. **Modify recurrence logic**: Update the `getTodaysItems()` method in `storage.js` or `firebase-storage.js`

## 🎯 Tips for Effective Practice

1. **Start Small**: Begin with a few key exercises rather than overwhelming yourself
2. **Set Realistic Recurrence**: 
   - Daily warm-ups: 1 day
   - Technical exercises: 2-3 days
   - Review pieces: 7 days
   - Long-term goals: 14-30 days
3. **Use Sub-items**: Break complex pieces into manageable sections
4. **Regular Review**: Use the management view to adjust recurrence as you improve
5. **Pause When Needed**: Use the pause feature during busy periods instead of deleting items
6. **Cross-Device Practice**: Sign in to access your practice list from phone, tablet, or computer

## 🔧 Troubleshooting

### App Not Loading
- Ensure all files are in the same directory
- Check browser console for JavaScript errors
- Try opening in an incognito/private browser window

### Authentication Issues
- Make sure you're using a supported browser (Chrome, Firefox, Safari, Edge)
- Check that cookies and JavaScript are enabled
- Try signing in with an incognito/private window

### Sync Issues
- Check your internet connection
- The sync indicator shows current status (syncing/synced/offline)
- Data syncs automatically when you go back online

### Data Issues
- **Local data lost**: Data stored locally can be cleared by browser settings
- **Cloud data issues**: Contact support or check the Firebase console if you have access
- **Migration problems**: Use the migration options when first signing in

### GitHub Pages Not Working
- Ensure repository is public
- Check that `index.html` is in the root directory
- Wait 5-10 minutes after enabling Pages for deployment
- Check the Pages settings and build status

## 🔒 Privacy Policy

This app respects your privacy:
- Only your Google account info needed for authentication is collected
- Practice data is stored securely and privately in Firebase
- No analytics or tracking beyond basic Firebase usage
- No data is shared with third parties
- You can delete your data at any time

## 📄 License

This project is open source and available under the MIT License. Feel free to modify and adapt it for your needs!

## 🤝 Contributing

This project welcomes contributions! You can:

- Report bugs by creating an issue
- Suggest new features
- Submit pull requests with improvements
- Share how you've customized the app

## 🆕 What's New

### Version 2.0 - Cross-Device Sync
- ✨ Firebase integration for cloud storage
- 🔐 Google authentication
- 📱 Real-time sync across all devices
- 📤 Data migration tools
- 🛡️ Enhanced security and privacy
- 📡 Offline support with sync indicators

---

**Ready to level up your practice routine?** 🎵

Try Practice Maestro today and never lose track of your musical progress again! 