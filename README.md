# 🎼 Practice Maestro - Musical Exercise Tracker

A simple, serverless web application for tracking musical practice exercises. Built with pure HTML, CSS, and JavaScript, perfect for deployment on GitHub Pages.

## ✨ Features

- **Daily Practice View**: See what needs to be practiced today
- **Smart Recurrence**: Items reappear after a specified number of days since completion
- **Categories**: Organize exercises by type (scales, chords, pieces, etc.)
- **Sub-items**: Break down complex pieces into smaller practice sections
- **Pause Functionality**: Temporarily disable items without deleting them
- **Mobile Friendly**: Works great on both desktop and mobile devices
- **Local Storage**: No server required - all data stored in your browser
- **Modern UI**: Clean, responsive design with smooth animations

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

## 💾 Data Storage

**Important**: This app uses your browser's localStorage to save data. This means:

- ✅ **Pros**: No server required, works offline, fast and responsive
- ❌ **Cons**: Data is tied to your browser/device, clearing browser data will delete your practice history

### Data Backup

While the app doesn't have built-in export/import yet, your data is stored in localStorage under these keys:
- `practice_items`
- `practice_categories` 
- `practice_completions`

You can backup this data using browser developer tools or by adding export functionality.

## 🛠️ Customization

The app is built with modular JavaScript, making it easy to customize:

- **`utils.js`**: Helper functions and utilities
- **`storage.js`**: All data management and localStorage operations
- **`app.js`**: Main application logic and UI management
- **`styles.css`**: All styling and responsive design
- **`index.html`**: HTML structure and layout

### Common Customizations

1. **Change default recurrence days**: Edit the default value in `index.html` (line with `value="7"`)
2. **Add new categories**: Modify the `defaultCategories` array in `utils.js`
3. **Customize styling**: Edit `styles.css` to change colors, fonts, or layouts
4. **Modify recurrence logic**: Update the `getTodaysItems()` method in `storage.js`

## 🎯 Tips for Effective Practice

1. **Start Small**: Begin with a few key exercises rather than overwhelming yourself
2. **Set Realistic Recurrence**: 
   - Daily practice items: 1 day
   - Technical exercises: 2-3 days
   - Review pieces: 7 days
   - Long-term goals: 14-30 days
3. **Use Sub-items**: Break complex pieces into manageable sections
4. **Regular Review**: Use the management view to adjust recurrence as you improve
5. **Pause When Needed**: Use the pause feature during busy periods instead of deleting items

## 🔧 Troubleshooting

### App Not Loading
- Ensure all files are in the same directory
- Check browser console for JavaScript errors
- Try opening in an incognito/private browser window

### Data Lost
- Data is stored locally in your browser
- Clearing browser data will delete your practice history
- Use the same browser and device for consistent access

### GitHub Pages Not Working
- Ensure repository is public
- Check that `index.html` is in the root directory
- Wait 5-10 minutes after enabling Pages for deployment
- Check the Pages settings and build status

## 📄 License

This project is open source and available under the MIT License. Feel free to modify and adapt it for your needs!

## 🤝 Contributing

This is a simple educational project, but suggestions and improvements are welcome! Feel free to:

- Report bugs by creating an issue
- Suggest new features
- Submit pull requests with improvements
- Share how you've customized the app

---

Happy practicing! 🎵 