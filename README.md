# Stremio Watch Together

A userscript that enables synchronized watching experience on Stremio Web Player. Watch movies and shows together with friends in real-time!

## 📺 YouTube Tutorial

**Watch the complete setup guide:** [https://youtu.be/6wSY6W3euu8](https://youtu.be/6wSY6W3euu8)

## 🚀 Features

- **Real-time synchronization** - All participants watch in perfect sync
- **Host/Guest system** - One person controls playback, others follow
- **Firebase integration** - Reliable real-time communication
- **Easy setup** - Simple userscript installation
- **Cross-platform** - Works on any device with Tampermonkey

## 📋 Prerequisites

- **Tampermonkey browser extension** (Chrome, Firefox, Edge, Safari)
- **Firebase project** (for real-time communication)
- **Stremio Web Player** access

## 🛠️ Installation & Setup

### Step 1: Install Tampermonkey

1. **For Chrome/Edge:**
   - Go to [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Click "Add to Chrome"
   - Confirm installation

2. **For Firefox:**
   - Go to [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - Click "Add to Firefox"
   - Confirm installation

3. **For Safari:**
   - Go to [App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089)
   - Install the app

### Step 2: Set up Firebase Project

1. **Go to Firebase Console:**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create a New Project:**
   - Click "Create a project"
   - Enter project name: `stremio-watch-together`
   - Enable Google Analytics (optional)
   - Click "Create project"

3. **Add Web App:**
   - Click the web icon (`</>`) to add a web app
   - Register app name: `stremio-watch-together-web`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

4. **Get Firebase Configuration:**
   - Copy the Firebase configuration object
   - It should look like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id",
     measurementId: "your-measurement-id"
   };
   ```

5. **Enable Realtime Database:**
   - In Firebase Console, go to "Realtime Database"
   - Click "Create Database"
   - Choose "Start in test mode" (for development)
   - Select a location close to you
   - Click "Done"
   - Get your realtime database url, 
   ```
   databaseURL: "https://your-project-default-rtdb.firebaseio.com/"
   ```

6. **Update Database Rules (Optional but Recommended):**
   - Go to "Realtime Database" → "Rules"
   - Replace the rules with:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

### Step 3: Install the Userscripts

#### For Host (Person who controls playback):

1. **Open Tampermonkey Dashboard:**
   - Click Tampermonkey icon in browser
   - Select "Dashboard"

2. **Create New Script:**
   - Click "Create a new script"
   - Delete all existing content

3. **Add Host Script:**
   - Copy the entire content from `host.user.js`
   - Paste it into the editor

4. **Update Firebase Configuration:**
   - Find the `DEFAULT_FIREBASE_CONFIG` section (around line 35)
   - Replace the placeholder values with your actual Firebase config:
   ```javascript
   const DEFAULT_FIREBASE_CONFIG = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-actual-app-id",
     measurementId: "your-measurement-id",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com/"
   };
   ```

5. **Save the Script:**
   - Press `Ctrl+S` (or `Cmd+S` on Mac)
   - Close the editor
   

6. **Or Just watch a video on stremio, it will ask for the configuration**
   



#### For Guests (People who join the session):

1. **Open Tampermonkey Dashboard:**
   - Click Tampermonkey icon in browser
   - Select "Dashboard"

2. **Create New Script:**
   - Click "Create a new script"
   - Delete all existing content

3. **Add Guest Script:**
   - Copy the entire content from `guest.user.js`
   - Paste it into the editor

4. **Update Firebase Configuration:**
   - Find the `DEFAULT_FIREBASE_CONFIG` section (around line 43)
   - Replace with the same Firebase config as the host

5. **Update Room ID (Important!):**
   - Find `ROOM_ID = 'room123'` (around line 39)
   - Change `'room123'` to match the host's room ID
   - Example: `ROOM_ID = 'myroom456'`

6. **Save the Script:**
   - Press `Ctrl+S` (or `Cmd+S` on Mac)
   - Close the editor

7. **Or Just watch a video on stremio, it will ask for the configuration**

### Step 4: Using the Script

1. **Host Instructions:**
   - Go to [Stremio Web Player](https://web.stremio.com/)
   - Start playing any movie/show
   - The script will automatically load and show a "Watch Together" button
   - Click the button to start a session
   - Share the room ID with your friends

2. **Guest Instructions:**
   - Go to [Stremio Web Player](https://web.stremio.com/)
   - Make sure your room ID matches the host's room ID
   - The script will automatically connect to the host's session
   - Your playback will sync with the host

## ⚙️ Configuration

### Changing Room ID

**Host:**
- In `host.user.js`, find line 31: `let ROOM_ID = 'room123';`
- Change `'room123'` to your desired room name

**Guests:**
- In `guest.user.js`, find line 39: `let ROOM_ID = 'room123';`
- Change `'room123'` to match the host's room ID

### Advanced Settings

Both scripts include settings panels accessible via the UI:
- **Room ID management**
- **Firebase configuration**
- **Connection status**
- **Debug information**

## 🔧 Troubleshooting

### Common Issues:

1. **Script not loading:**
   - Make sure Tampermonkey is enabled
   - Check that the script is active in Tampermonkey dashboard
   - Refresh the Stremio page

2. **Connection issues:**
   - Verify Firebase configuration is correct
   - Check that room IDs match between host and guests
   - Ensure Realtime Database is enabled in Firebase

3. **Sync problems:**
   - Check internet connection
   - Try refreshing the page
   - Restart the session

### Debug Mode:

- Open browser console (F12)
- Look for messages starting with "👑 HOST:" or "👤 GUEST:"
- Check for any error messages

## 📝 Notes

- **Room ID must be identical** between host and all guests
- **Firebase configuration must be identical** for all participants
- **Script only works on Stremio Web Player** (not desktop app)
- **All participants must be on the same video** for sync to work

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Sagar Chaulagain**

---

**Need help?** Check out the [YouTube tutorial](https://youtu.be/6wSY6W3euu8) for a complete walkthrough!
