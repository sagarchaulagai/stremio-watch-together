// ==UserScript==
// @name         Stremio Watch Together - Host
// @namespace    https://stremio.com
// @version      1.0.1
// @description  Watch Together Host Script for Stremio Web Player
// @author       Sagar Chaulagain
// @updateURL    https://github.com/sagarchaulagai/stremio-watch-together/raw/refs/heads/master/host.user.js
// @downloadURL  https://github.com/sagarchaulagai/stremio-watch-together/raw/refs/heads/master/host.user.js
// @match        https://web.stremio.com/*
// @match        https://web.stremio.com/
// @match        https://web.stremio.com/#*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Check if we're on the player page - Logic moved to URL monitoring loop
    // if (!window.location.hash.includes('#/player/')) {
    //    console.log('HOST: Not on player page, skipping script');
    //    return;
    // }

    console.log('HOST: Watch Together Script Loading...');

    // Set flag to indicate userscript is loaded
    window.stremioWatchTogetherLoaded = true;

    // Firebase Configuration (moved to DEFAULT_FIREBASE_CONFIG below)

    // Configuration - CHANGE THIS
    let ROOM_ID = 'room123'; // Default room ID - can be changed via settings
    const USER_ID = 'host_' + Math.random().toString(36).substr(2, 6);
    let DISPLAY_NAME = '';

    // Default Firebase Configuration
    const DEFAULT_FIREBASE_CONFIG = {
        apiKey: "apiKey",
        authDomain: "authDomain",
        projectId: "projectId",
        storageBucket: "storageBucket",
        messagingSenderId: "messagingSenderId",
        appId: "appId",
        measurementId: "measurementId",
        databaseURL: "databaseURL"
    };

    let firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };

    // Configuration Management
    const CONFIG_STORAGE_KEY = 'stremio_watch_together_config';

    // Load configuration from localStorage
    function loadConfig() {
        try {
            const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                if (config.roomId) ROOM_ID = config.roomId;
                if (config.firebaseConfig) firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG, ...config.firebaseConfig };
                if (config.displayName) DISPLAY_NAME = config.displayName;
                console.log('HOST: Configuration loaded from localStorage');
            }
        } catch (error) {
            console.error('HOST ERROR: Failed to load configuration:', error);
        }
    }

    // Save configuration to localStorage
    function saveConfig() {
        try {
            const config = {
                roomId: ROOM_ID,
                firebaseConfig: firebaseConfig,
                displayName: DISPLAY_NAME,
                lastUpdated: Date.now()
            };
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
            console.log('HOST: Configuration saved to localStorage');
        } catch (error) {
            console.error('HOST ERROR: Failed to save configuration:', error);
        }
    }

    // Clear configuration
    function clearConfig() {
        try {
            localStorage.removeItem(CONFIG_STORAGE_KEY);
            ROOM_ID = 'room123';
            firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };
            DISPLAY_NAME = '';
            console.log('HOST: Configuration cleared');
        } catch (error) {
            console.error('HOST ERROR: Failed to clear configuration:', error);
        }
    }

    // Generate and save persistent display name
    function initializeDisplayName() {
        try {
            const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                if (config.displayName && config.displayName.trim() !== '') {
                    DISPLAY_NAME = config.displayName;
                    console.log('HOST: Loaded display name:', DISPLAY_NAME);
                    return;
                }
            }
            
            // Generate new username only if none exists
            if (!DISPLAY_NAME || DISPLAY_NAME.trim() === '') {
                DISPLAY_NAME = generateCoolUsername('host_');
                saveConfig();
                console.log('HOST: Generated new display name:', DISPLAY_NAME);
            }
        } catch (error) {
            console.error('HOST ERROR: Failed to initialize display name:', error);
            DISPLAY_NAME = generateCoolUsername('host_');
        }
    }

    // Generate a cool username
    function generateCoolUsername(baseName = "user") {
        const adjectives = [
            "Crimson", "Shadow", "Mystic", "Blaze", "Iron", "Quantum", "Solar", "Lunar",
            "Silent", "Frozen", "Wild", "Fierce", "Electric", "Golden", "Nebula", "Eternal",
            "Cobalt", "Obsidian", "Scarlet", "Rapid", "Stealthy", "Stormy", "Glacial", "Savage",
            "Vivid", "Radiant", "Grim", "Vengeful", "Cyber", "Infernal", "Royal", "Azure",
            "Burning", "Silent", "Venomous", "Titanic", "Crystalline", "Phantom", "Nocturnal",
            "Heroic", "Galactic", "Omega", "Prime", "Alpha", "Enchanted", "Magnetic", "Vast",
            "Twilight", "Echoing", "Wicked", "Stellar"
        ];

        const nouns = [
            "Phoenix", "Dragon", "Hunter", "Warrior", "Spirit", "Vortex", "Titan", "Specter",
            "Wolf", "Falcon", "Reaper", "Samurai", "Knight", "Golem", "Sniper", "Rogue",
            "Ninja", "Wizard", "Beast", "Ghost", "Lion", "Viper", "Assassin", "Juggernaut",
            "Guardian", "Sentinel", "Panther", "Serpent", "Rider", "Crusader", "Predator",
            "Gladiator", "Shadow", "Thunder", "Storm", "Warden", "Enigma", "Cyclone",
            "Tempest", "Marauder", "Saber", "Paladin", "Specter", "Hunter", "Nomad",
            "Titan", "Comet", "Raven", "Griffin", "Blizzard"
        ];

        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNumber = Math.floor(Math.random() * 1000);

        let username = `${randomAdjective}${randomNoun}${randomNumber}`;

        if (baseName !== "user") {
            username = `${baseName}${username}`;
        }

        return username.toLowerCase();
    }

    // Check if Firebase config is properly configured
    function isFirebaseConfigValid() {
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'databaseURL'];
        for (const field of requiredFields) {
            if (!firebaseConfig[field] ||
                firebaseConfig[field] === field ||
                firebaseConfig[field].includes('YOUR') ||
                firebaseConfig[field].includes('placeholder')) {
                return false;
            }
        }
        return true;
    }

    // Show Firebase configuration required message
    function showFirebaseConfigRequired() {
        // Create a prominent message overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
        `;

        overlay.innerHTML = `
            <div style="text-align: center; max-width: 500px; padding: 40px; background: rgba(255, 107, 53, 0.1); border: 2px solid #FF6B35; border-radius: 10px;">
                <h2 style="color: #FF6B35; margin: 0 0 20px 0;">Firebase Configuration Required</h2>
                <p style="font-size: 1.1em; margin: 0 0 20px 0; line-height: 1.5;">
                    To use Watch Together, you need to configure your Firebase settings first.
                </p>
                <p style="margin: 0 0 30px 0; opacity: 0.9;">
                    Click the settings button (gear icon) next to the Watch Together button to configure Firebase.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button id="openSettings" style="
                        background: #FF6B35;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 1em;
                        font-weight: bold;
                    ">Open Settings</button>
                    <button id="closeMessage" style="
                        background: #666;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 1em;
                    ">Close</button>
                </div>
                <div style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
                    <p>You'll need to create a Firebase project and get your configuration values.</p>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add event listeners
        document.getElementById('openSettings').addEventListener('click', () => {
            overlay.remove();
            showSettingsPopup();
        });

        document.getElementById('closeMessage').addEventListener('click', () => {
            overlay.remove();
        });

        console.log('HOST WARNING: Firebase configuration required message displayed');
    }

    // Global variables
    let app, database, roomRef;
    let watchTogetherEnabled = false;
    let isBuffering = false;
    let videoElement = null;
    let playPauseButton = null;
    let controlBar = null;
    let watchTogetherButton = null;
    let settingsButton = null;
    let settingsPopup = null;
    let bufferingObserver = null;
    let playPauseObserver = null;
    let syncInterval = null;
    let lastSentTime = 0;
    let guestStates = {};
    let isAnyGuestBuffering = false;
    let currentControllerId = null;
    let controlRequests = {};
    let controlPanel = null;
    let isScriptActive = false;
    let isInitializationRunning = false;

    // Initialize Firebase
    async function initializeFirebase() {
        // Check if Firebase config is valid
        if (!isFirebaseConfigValid()) {
            console.log('HOST WARNING: Firebase not configured. Please configure Firebase settings first.');
            showFirebaseConfigRequired();
            return false;
        }

        try {
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js');
            const { getDatabase, ref, set, onValue } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            // Disconnect existing app if it exists
            if (app) {
                try {
                    await app.delete();
                } catch (e) {
                    // Ignore errors when deleting app
                }
            }

            app = initializeApp(firebaseConfig);
            database = getDatabase(app);
            roomRef = ref(database, 'rooms/' + ROOM_ID);

            console.log('HOST: Firebase initialized for room:', ROOM_ID);

            // Get current video URL
            const videoURL = getCurrentVideoURL();

            // Initialize room data
            await set(roomRef, {
                roomId: ROOM_ID,
                videoURL: videoURL,
                host: {
                    userId: USER_ID,
                    displayName: DISPLAY_NAME,
                    currentTime: 0,
                    isPlaying: false,
                    isBuffering: false,
                    lastUpdated: Date.now()
                },
                guests: {},
                permissions: {
                    controllerId: USER_ID  // Host starts with control
                },
                status: 'waiting_for_guests'
            });

            // Initialize current controller
            currentControllerId = USER_ID;

            console.log('HOST: Room initialized');
            return true;
        } catch (error) {
            console.error('HOST ERROR: Firebase initialization failed:', error);
            return false;
        }
    }

    // Find DOM elements with multiple selectors
    function findDOMElements() {
        console.log('🔍 HOST: Searching for DOM elements...');

        // Try multiple selectors for video element
        videoElement = document.querySelector('video') ||
                      document.querySelector('video[class*="video"]') ||
                      document.querySelector('video[class*="player"]');

        // Try multiple selectors for control bar
        controlBar = document.querySelector('.control-bar-buttons-container-SWhkU') ||
                    document.querySelector('[class*="control-bar-buttons"]') ||
                    document.querySelector('[class*="control-bar"]') ||
                    document.querySelector('.control-bar');

        // Try multiple selectors for play/pause button
        playPauseButton = document.querySelector('div[title="Play"], div[title="Pause"]') ||
                         document.querySelector('[title="Play"], [title="Pause"]') ||
                         document.querySelector('button[title="Play"], button[title="Pause"]');

        console.log('🔍 HOST: Found elements:', {
            video: !!videoElement,
            controlBar: !!controlBar,
            playPauseButton: !!playPauseButton
        });

        if (videoElement && controlBar && playPauseButton) {
            console.log('HOST: All DOM elements found');
            return true;
        }

        console.log('HOST ERROR: Missing elements:', {
            video: !videoElement,
            controlBar: !controlBar,
            playPauseButton: !playPauseButton
        });

        return false;
    }

    // Create Watch Together button
    function createWatchTogetherButton() {
        if (watchTogetherButton) {
            watchTogetherButton.remove();
        }

        watchTogetherButton = document.createElement('div');
        watchTogetherButton.className = 'control-bar-button-FQUsj button-container-zVLH6';
        watchTogetherButton.title = 'Watch Together (HOST)';
        watchTogetherButton.style.cssText = `
            cursor: pointer;
            border: 2px solid #FF6B35;
            border-radius: 4px;
            background: rgba(255, 107, 53, 0.1);
        `;

        watchTogetherButton.innerHTML = `
            <svg class="icon-qy6I6" viewBox="0 0 24 24" style="width:24px;height:24px;">
                <path d="M12 2C6.48 2 2 6.03 2 10.5c0 2.85 1.83 5.35 4.61 6.85L5 22l5.25-2.72c.55.08 1.12.12 1.75.12 5.52 0 10-4.03 10-8.9C22 6.03 17.52 2 12 2zm0 15.5c-.56 0-1.12-.05-1.63-.15l-.6-.12-.53.28-.7.36.14-.77.1-.57-.48-.31C6.87 15.3 5.5 13.04 5.5 10.5 5.5 7.47 8.4 5 12 5s6.5 2.47 6.5 5.5-2.9 5.5-6.5 5.5z" fill="currentColor"/>
            </svg>
        `;

        controlBar.appendChild(watchTogetherButton);
        watchTogetherButton.addEventListener('click', toggleWatchTogether);

        console.log('HOST: Watch Together button created');
    }

    // Create Control Panel toggle button
    function createControlPanelButton() {
        const existingButton = document.querySelector('.control-panel-toggle-button');
        if (existingButton) {
            existingButton.remove();
        }

        const panelButton = document.createElement('div');
        panelButton.className = 'control-bar-button-FQUsj button-container-zVLH6 control-panel-toggle-button';
        panelButton.title = 'Control Panel';
        panelButton.style.cssText = `
            cursor: pointer;
            border: 2px solid #9C27B0;
            border-radius: 4px;
            background: rgba(156, 39, 176, 0.1);
            margin-left: 5px;
        `;

        panelButton.innerHTML = `
            <svg class="icon-qy6I6" viewBox="0 0 24 24" style="width:24px;height:24px;">
                <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" fill="currentColor"/>
            </svg>
        `;

        controlBar.appendChild(panelButton);
        panelButton.addEventListener('click', toggleControlPanel);

        console.log('HOST: Control panel button created');
    }

    // Create Settings button
    function createSettingsButton() {
        if (settingsButton) {
            settingsButton.remove();
        }

        settingsButton = document.createElement('div');
        settingsButton.className = 'control-bar-button-FQUsj button-container-zVLH6';
        settingsButton.title = 'Watch Together Settings';
        settingsButton.style.cssText = `
            cursor: pointer;
            border: 2px solid #2196F3;
            border-radius: 4px;
            background: rgba(33, 150, 243, 0.1);
            margin-left: 5px;
        `;

        settingsButton.innerHTML = `
            <svg class="icon-qy6I6" viewBox="0 0 24 24" style="width:24px;height:24px;">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="currentColor"/>
            </svg>
        `;

        controlBar.appendChild(settingsButton);
        settingsButton.addEventListener('click', showSettingsPopup);

        console.log('HOST: Settings button created');
    }

    // Parse easy Firebase configuration
    function parseEasyFirebaseConfig() {
        const configText = document.getElementById('easyFirebaseConfig').value.trim();

        if (!configText) {
            alert('Please paste your Firebase configuration object first.');
            return;
        }

        try {
            // Try to extract the configuration object from the text
            let configObj = null;

            // Robust cleanup that preserves URLs and only removes comments outside strings
            function removeCommentsOutsideStrings(text) {
                let result = '';
                let inSingle = false, inDouble = false, inTemplate = false, inBlock = false;
                for (let i = 0; i < text.length; ) {
                    const ch = text[i];
                    const next = text[i + 1];
                    if (!inSingle && !inDouble && !inTemplate && !inBlock && ch === '/' && next === '/') {
                        // line comment - skip to end of line
                        i += 2;
                        while (i < text.length && text[i] !== '\n') i++;
                        continue;
                    }
                    if (!inSingle && !inDouble && !inTemplate && !inBlock && ch === '/' && next === '*') {
                        // block comment
                        inBlock = true;
                        i += 2;
                        continue;
                    }
                    if (inBlock) {
                        if (ch === '*' && next === '/') {
                            inBlock = false;
                            i += 2;
                            continue;
                        }
                        i++;
                        continue;
                    }
                    if (!inDouble && !inTemplate && ch === '\'' && text[i - 1] !== '\\') {
                        inSingle = !inSingle;
                        result += ch;
                        i++;
                        continue;
                    }
                    if (!inSingle && !inTemplate && ch === '"' && text[i - 1] !== '\\') {
                        inDouble = !inDouble;
                        result += ch;
                        i++;
                        continue;
                    }
                    if (!inSingle && !inDouble && ch === '`' && text[i - 1] !== '\\') {
                        inTemplate = !inTemplate;
                        result += ch;
                        i++;
                        continue;
                    }
                    result += ch;
                    i++;
                }
                return result;
            }

            function collapseNewlinesInsideStrings(text) {
                let result = '';
                let inSingle = false, inDouble = false, inTemplate = false;
                for (let i = 0; i < text.length; ) {
                    const ch = text[i];
                    if (!inDouble && !inTemplate && ch === '\'' && text[i - 1] !== '\\') {
                        inSingle = !inSingle;
                        result += ch;
                        i++;
                        continue;
                    }
                    if (!inSingle && !inTemplate && ch === '"' && text[i - 1] !== '\\') {
                        inDouble = !inDouble;
                        result += ch;
                        i++;
                        continue;
                    }
                    if (!inSingle && !inDouble && ch === '`' && text[i - 1] !== '\\') {
                        inTemplate = !inTemplate;
                        result += ch;
                        i++;
                        continue;
                    }
                    if ((inSingle || inDouble) && ch === '\n') {
                        // remove newline and following indentation inside quotes
                        i++;
                        while (i < text.length && (text[i] === ' ' || text[i] === '\t' || text[i] === '\r')) i++;
                        continue;
                    }
                    result += ch;
                    i++;
                }
                return result;
            }

            let cleanText = removeCommentsOutsideStrings(configText);
            cleanText = collapseNewlinesInsideStrings(cleanText);
            // Remove trailing commas before closing braces/brackets
            cleanText = cleanText.replace(/,(\s*[}\]])/g, '$1');

            // Try to find the firebaseConfig object
            const configMatch = cleanText.match(/const\s+firebaseConfig\s*=\s*({[\s\S]*?});?/);
            if (configMatch) {
                console.log('HOST DEBUG: Found firebaseConfig object:', configMatch[1]);
                // Use eval to parse the object (safe in this context as it's user-provided config)
                configObj = eval('(' + configMatch[1] + ')');
            } else {
                console.log('HOST DEBUG: No firebaseConfig match found, trying direct parse:', cleanText);
                // Try to parse as direct object
                configObj = eval('(' + cleanText + ')');
            }

            if (!configObj || typeof configObj !== 'object') {
                throw new Error('Invalid configuration object');
            }

            // Extract values and populate manual fields
            const extractedConfig = {
                apiKey: configObj.apiKey || '',
                authDomain: configObj.authDomain || '',
                projectId: configObj.projectId || '',
                storageBucket: configObj.storageBucket || '',
                messagingSenderId: configObj.messagingSenderId || '',
                appId: configObj.appId || '',
                measurementId: configObj.measurementId || '',
                databaseURL: configObj.databaseURL || configObj.databaseUrl || ''
            };

            // Update manual configuration fields
            document.getElementById('apiKeyInput').value = extractedConfig.apiKey;
            document.getElementById('authDomainInput').value = extractedConfig.authDomain;
            document.getElementById('projectIdInput').value = extractedConfig.projectId;
            document.getElementById('storageBucketInput').value = extractedConfig.storageBucket;
            document.getElementById('messagingSenderIdInput').value = extractedConfig.messagingSenderId;
            document.getElementById('appIdInput').value = extractedConfig.appId;
            document.getElementById('measurementIdInput').value = extractedConfig.measurementId;
            document.getElementById('databaseUrlInput').value = extractedConfig.databaseURL;

            // Check if databaseURL is missing
            const databaseUrlSection = document.getElementById('databaseUrlSection');
            if (!extractedConfig.databaseURL) {
                databaseUrlSection.style.display = 'block';
                alert('WARNING: Database URL not found in your configuration!\n\nYou need to create a Realtime Database in Firebase Console and add the databaseURL to your configuration.\n\nThe databaseURL should look like:\nhttps://your-project-default-rtdb.firebaseio.com/');
            } else {
                databaseUrlSection.style.display = 'none';
                alert('SUCCESS: Firebase configuration parsed successfully!\n\nAll configuration values have been extracted and populated. You can now save the settings.');
            }

            console.log('HOST: Firebase configuration parsed:', extractedConfig);

        } catch (error) {
            console.error('HOST ERROR: Failed to parse Firebase configuration:', error);
            alert('ERROR: Failed to parse Firebase configuration!\n\nPlease make sure you pasted a valid Firebase configuration object.\n\nExample format:\nconst firebaseConfig = {\n  apiKey: "your-key",\n  authDomain: "your-domain",\n  // ... other fields\n};');
        }
    }

    // Clear easy Firebase configuration
    function clearEasyFirebaseConfig() {
        document.getElementById('easyFirebaseConfig').value = '';
        document.getElementById('databaseUrlSection').style.display = 'none';
        document.getElementById('easyDatabaseUrlInput').value = '';
    }

    // Switch between configuration tabs
    function switchConfigTab(tab) {
        const easyTab = document.getElementById('easyConfigTab');
        const manualTab = document.getElementById('manualConfigTab');
        const shareTab = document.getElementById('shareConfigTab');
        const easyContent = document.getElementById('easyConfigContent');
        const manualContent = document.getElementById('manualConfigContent');
        const shareContent = document.getElementById('shareConfigContent');

        // Reset all tabs
        easyTab.style.background = 'transparent';
        easyTab.style.color = '#aaa';
        manualTab.style.background = 'transparent';
        manualTab.style.color = '#aaa';
        shareTab.style.background = 'transparent';
        shareTab.style.color = '#aaa';

        // Hide all content
        easyContent.style.display = 'none';
        manualContent.style.display = 'none';
        shareContent.style.display = 'none';

        if (tab === 'easy') {
            easyTab.style.background = '#FF6B35';
            easyTab.style.color = 'white';
            easyContent.style.display = 'block';
        } else if (tab === 'manual') {
            manualTab.style.background = '#FF6B35';
            manualTab.style.color = 'white';
            manualContent.style.display = 'block';
        } else if (tab === 'share') {
            shareTab.style.background = '#4CAF50';
            shareTab.style.color = 'white';
            shareContent.style.display = 'block';
        }
    }

    // Generate shareable Firebase configuration
    function generateShareableConfig() {
        const configCode = `const firebaseConfig = {
    apiKey: "${firebaseConfig.apiKey}",
    authDomain: "${firebaseConfig.authDomain}",
    projectId: "${firebaseConfig.projectId}",
    storageBucket: "${firebaseConfig.storageBucket}",
    messagingSenderId: "${firebaseConfig.messagingSenderId}",
    appId: "${firebaseConfig.appId}",
    measurementId: "${firebaseConfig.measurementId}",
    databaseURL: "${firebaseConfig.databaseURL}"
};`;

        const shareableConfigTextarea = document.getElementById('shareableConfig');
        if (shareableConfigTextarea) {
            shareableConfigTextarea.value = configCode;
            console.log('HOST: Generated shareable configuration');
        }
    }

    // Copy configuration to clipboard
    function copyShareableConfig() {
        const shareableConfigTextarea = document.getElementById('shareableConfig');
        if (shareableConfigTextarea) {
            shareableConfigTextarea.select();
            shareableConfigTextarea.setSelectionRange(0, 99999);

            try {
                document.execCommand('copy');
                const copyButton = document.getElementById('copyConfig');
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                copyButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    copyButton.style.background = '#666';
                }, 2000);
                console.log('HOST: Configuration copied to clipboard');
            } catch (error) {
                console.error('HOST ERROR: Failed to copy configuration:', error);
                alert('Failed to copy configuration. Please copy manually.');
            }
        }
    }

    // Show settings popup
    function showSettingsPopup() {
        hideSettingsPopup(); // Remove existing popup

        settingsPopup = document.createElement('div');
        settingsPopup.className = 'watch-together-settings-popup';
        settingsPopup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border: 2px solid #FF6B35;
            border-radius: 12px;
            padding: 0;
            z-index: 10000;
            width: 700px;
            max-width: 95vw;
            max-height: 95vh;
            overflow: hidden;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        `;

        settingsPopup.innerHTML = `
            <div style="background: linear-gradient(135deg, #FF6B35 0%, #ff8c42 100%); padding: 20px; color: white;">
                <h3 style="margin: 0; font-size: 24px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Watch Together Settings</h3>
                <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Configure your room and Firebase settings</p>
            </div>

            <div style="padding: 25px; max-height: calc(95vh - 120px); overflow-y: auto;">
                <div style="margin-bottom: 30px;">
                    <h4 style="margin: 0 0 15px 0; color: #FF6B35; font-size: 18px; font-weight: 600; border-bottom: 2px solid #333; padding-bottom: 8px;">Room Configuration</h4>
                    <div style="margin-bottom: 20px;">
                        <label style=\"display: block; margin-bottom: 8px; font-weight: 600; color: #e0e0e0;\">Display Name:</label>
                        <input type=\"text\" id=\"displayNameInput\" value=\"${DISPLAY_NAME || ''}\"
                               style=\"width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;\"
                               onfocus=\"this.style.borderColor='#FF6B35'\" onblur=\"this.style.borderColor='#444'\">
                        <small style=\"color: #aaa; font-size: 12px; margin-top: 5px; display: block;\">This name is shown to guests. Leave empty to auto-generate.</small>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e0e0e0;">Room ID:</label>
                        <input type="text" id="roomIdInput" value="${ROOM_ID}"
                               style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                               onfocus="this.style.borderColor='#FF6B35'" onblur="this.style.borderColor='#444'">
                        <small style="color: #aaa; font-size: 12px; margin-top: 5px; display: block;">Share this Room ID with your guests</small>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e0e0e0;">Shareable Link:</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="shareableLink" value="https://web.stremio.com/watchtogether?room=${ROOM_ID}"
                                   readonly style="flex: 1; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #1a1a1a; color: #4CAF50; font-size: 12px; font-family: 'Courier New', monospace;">
                            <button id="copyLink" style="padding: 12px 16px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: transform 0.2s ease;"
                                    onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Copy</button>
                        </div>
                        <small style="color: #aaa; font-size: 12px; margin-top: 5px; display: block;">Guests can use this link to automatically join your room</small>
                    </div>
                </div>

                <div style="margin-bottom: 30px;">
                    <h4 style="margin: 0 0 20px 0; color: #FF6B35; font-size: 18px; font-weight: 600; border-bottom: 2px solid #333; padding-bottom: 8px;">Firebase Configuration</h4>

                    <!-- Tab Navigation -->
                    <div style="display: flex; border-bottom: 2px solid #333; margin-bottom: 25px; background: #2a2a2a; border-radius: 8px; padding: 4px;">
                        <button id="easyConfigTab" class="config-tab active" style="
                            flex: 1;
                            padding: 12px 20px;
                            background: #FF6B35;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            transition: all 0.3s ease;
                        ">Easy Setup</button>
                        <button id="manualConfigTab" class="config-tab" style="
                            flex: 1;
                            padding: 12px 20px;
                            background: transparent;
                            color: #aaa;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            transition: all 0.3s ease;
                        ">Manual Setup</button>
                        <button id="shareConfigTab" class="config-tab" style="
                            flex: 1;
                            padding: 12px 20px;
                            background: transparent;
                            color: #aaa;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            transition: all 0.3s ease;
                        ">Share Config</button>
                    </div>

                    <!-- Easy Configuration Tab -->
                    <div id="easyConfigContent" class="config-content" style="display: block;">
                        <div style="padding: 20px; background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 140, 66, 0.05) 100%); border: 2px solid #FF6B35; border-radius: 10px;">
                            <p style="margin: 0 0 15px 0; font-size: 14px; color: #e0e0e0; line-height: 1.5;">Paste your complete Firebase configuration object here:</p>
                            <textarea id="easyFirebaseConfig" placeholder="const firebaseConfig = {
    apiKey: &quot;yourApiKeyFromFirebase&quot;,
    authDomain: &quot;yourAuthDomainFromFirebase&quot;,
    projectId: &quot;yourProjectIdFromFirebase&quot;,
    storageBucket: &quot;yourStorageBucket.firebasestorage.app&quot;,
    messagingSenderId: &quot;yourMessagingSenderIdFromFirebase&quot;,
    appId: &quot;yourAppIdFromFirebase&quot;,
    measurementId: &quot;yourMeasurementIdFromFirebase&quot;,
    databaseURL: &quot;yourDatabaseUrlFromFirebase&quot;
};"
                                      style="width: 100%; height: 160px; padding: 15px; border: 2px solid #444; border-radius: 8px; background: #1a1a1a; color: #e0e0e0; font-size: 12px; font-family: 'Courier New', monospace; resize: vertical; line-height: 1.4;"></textarea>
                            <div style="display: flex; gap: 12px; margin-top: 15px;">
                                <button id="parseFirebaseConfig" style="padding: 12px 24px; background: linear-gradient(135deg, #FF6B35 0%, #ff8c42 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s ease;"
                                        onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Parse Configuration</button>
                                <button id="clearEasyConfig" style="padding: 12px 24px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; transition: transform 0.2s ease;"
                                        onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Clear</button>
                            </div>
                            <div id="databaseUrlSection" style="margin-top: 15px; display: none; padding: 15px; background: rgba(255, 152, 0, 0.1); border: 2px solid #ff9800; border-radius: 8px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #ff9800;">WARNING: Database URL Required:</label>
                                <input type="text" id="easyDatabaseUrlInput" placeholder="https://your-project-default-rtdb.firebaseio.com/"
                                       style="width: 100%; padding: 12px; border: 2px solid #ff9800; border-radius: 6px; background: #2a2a2a; color: white; font-size: 14px;">
                                <small style="color: #ff9800; font-size: 12px; margin-top: 5px; display: block;">You need to create a Realtime Database in Firebase Console and add the URL here</small>
                            </div>
                        </div>
                    </div>

                    <!-- Manual Configuration Tab -->
                    <div id="manualConfigContent" class="config-content" style="display: none;">
                        <div style="padding: 20px; background: linear-gradient(135deg, rgba(102, 102, 102, 0.1) 0%, rgba(102, 102, 102, 0.05) 100%); border: 2px solid #666; border-radius: 10px;">
                            <p style="margin: 0 0 20px 0; font-size: 14px; color: #e0e0e0; line-height: 1.5;">Manually enter each Firebase configuration value:</p>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">API Key:</label>
                                    <input type="text" id="apiKeyInput" value="${firebaseConfig.apiKey}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#FF6B35'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Auth Domain:</label>
                                    <input type="text" id="authDomainInput" value="${firebaseConfig.authDomain}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#FF6B35'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Project ID:</label>
                                    <input type="text" id="projectIdInput" value="${firebaseConfig.projectId}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#FF6B35'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Storage Bucket:</label>
                                    <input type="text" id="storageBucketInput" value="${firebaseConfig.storageBucket}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#FF6B35'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Messaging Sender ID:</label>
                                    <input type="text" id="messagingSenderIdInput" value="${firebaseConfig.messagingSenderId}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#FF6B35'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">App ID:</label>
                                    <input type="text" id="appIdInput" value="${firebaseConfig.appId}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#FF6B35'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Measurement ID:</label>
                                    <input type="text" id="measurementIdInput" value="${firebaseConfig.measurementId}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#FF6B35'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Database URL:</label>
                                    <input type="text" id="databaseUrlInput" value="${firebaseConfig.databaseURL}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#FF6B35'" onblur="this.style.borderColor='#444'">
                                </div>
                            </div>
                            <small style="color: #aaa; font-size: 12px; display: block; text-align: center; margin-top: 10px;">Get these values from your Firebase project settings</small>
                        </div>
                    </div>

                    <!-- Share Configuration Tab -->
                    <div id="shareConfigContent" class="config-content" style="display: none;">
                        <div style="padding: 20px; background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%); border: 2px solid #4CAF50; border-radius: 10px;">
                            <h5 style="margin: 0 0 15px 0; color: #4CAF50; font-size: 16px; font-weight: 600;">Share Your Firebase Configuration</h5>
                            <p style="margin: 0 0 20px 0; font-size: 14px; color: #e0e0e0; line-height: 1.5;">Generate a shareable configuration that guests can easily import:</p>

                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Configuration Code:</label>
                                <textarea id="shareableConfig" readonly
                                          style="width: 100%; height: 200px; padding: 15px; border: 2px solid #444; border-radius: 8px; background: #1a1a1a; color: #4CAF50; font-size: 12px; font-family: 'Courier New', monospace; resize: vertical; line-height: 1.4;"></textarea>
                                <div style="display: flex; gap: 12px; margin-top: 12px;">
                                    <button id="generateConfig" style="padding: 12px 24px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s ease;"
                                            onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Generate Config</button>
                                    <button id="copyConfig" style="padding: 12px 24px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; transition: transform 0.2s ease;"
                                            onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Copy Config</button>
                                </div>
                            </div>

                            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                                <h6 style="margin: 0 0 10px 0; color: #4CAF50; font-size: 14px; font-weight: 600;">Instructions for Guests:</h6>
                                <ol style="margin: 0; padding-left: 20px; color: #e0e0e0; font-size: 13px; line-height: 1.6;">
                                    <li>Copy the configuration code above</li>
                                    <li>Open Watch Together settings in their browser</li>
                                    <li>Go to "Easy Setup" tab</li>
                                    <li>Paste the configuration and click "Parse Configuration"</li>
                                    <li>Save the settings</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; justify-content: space-between; padding-top: 20px; border-top: 2px solid #333;">
                    <div>
                        <button id="clearConfig" style="padding: 12px 20px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s ease;"
                                onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Clear All</button>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button id="cancelSettings" style="padding: 12px 20px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s ease;"
                                onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Cancel</button>
                        <button id="saveSettings" style="padding: 12px 24px; background: linear-gradient(135deg, #FF6B35 0%, #ff8c42 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s ease;"
                                onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Save Settings</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(settingsPopup);

        // Add event listeners
        document.getElementById('cancelSettings').addEventListener('click', hideSettingsPopup);
        document.getElementById('saveSettings').addEventListener('click', saveSettings);
        document.getElementById('clearConfig').addEventListener('click', clearAllSettings);
        document.getElementById('copyLink').addEventListener('click', copyShareableLink);
        document.getElementById('roomIdInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveSettings();
        });
        document.getElementById('roomIdInput').addEventListener('input', updateShareableLink);

        // Easy configuration event listeners
        document.getElementById('parseFirebaseConfig').addEventListener('click', parseEasyFirebaseConfig);
        document.getElementById('clearEasyConfig').addEventListener('click', clearEasyFirebaseConfig);

        // Tab switching event listeners
        document.getElementById('easyConfigTab').addEventListener('click', () => switchConfigTab('easy'));
        document.getElementById('manualConfigTab').addEventListener('click', () => switchConfigTab('manual'));
        document.getElementById('shareConfigTab').addEventListener('click', () => switchConfigTab('share'));

        // Sharing functionality event listeners
        document.getElementById('generateConfig').addEventListener('click', generateShareableConfig);
        document.getElementById('copyConfig').addEventListener('click', copyShareableConfig);

        // Prevent backspace navigation in the popup
        settingsPopup.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });

        // Focus on input
        document.getElementById('roomIdInput').focus();
        document.getElementById('roomIdInput').select();

        console.log('HOST: Settings popup shown');
    }

    // Hide settings popup
    function hideSettingsPopup() {
        if (settingsPopup) {
            settingsPopup.remove();
            settingsPopup = null;
        }
    }

    // Copy shareable link to clipboard
    function copyShareableLink() {
        const linkInput = document.getElementById('shareableLink');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices

        try {
            document.execCommand('copy');
            const copyButton = document.getElementById('copyLink');
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            copyButton.style.background = '#4CAF50';
            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.background = '#4CAF50';
            }, 2000);
            console.log('HOST: Shareable link copied to clipboard');
        } catch (error) {
            console.error('HOST ERROR: Failed to copy link:', error);
            alert('Failed to copy link. Please copy manually.');
        }
    }

    // Update shareable link when room ID changes
    function updateShareableLink() {
        const roomId = document.getElementById('roomIdInput').value;
        const linkInput = document.getElementById('shareableLink');
        linkInput.value = `https://web.stremio.com/watchtogether?room=${roomId}`;
    }

    // Clear all settings
    function clearAllSettings() {
        if (confirm('Are you sure you want to clear all settings? This will reset to default values.')) {
            clearConfig();
            hideSettingsPopup();
            showGuestStatus('Settings cleared - reloading...');
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }

    // Save settings
    async function saveSettings() {
        const newRoomId = document.getElementById('roomIdInput').value.trim();
        const newDisplayName = (document.getElementById('displayNameInput') ? document.getElementById('displayNameInput').value.trim() : '').trim();

        if (!newRoomId) {
            alert('Room ID cannot be empty!');
            return;
        }

        // Get Firebase configuration
        const newFirebaseConfig = {
            apiKey: document.getElementById('apiKeyInput').value.trim(),
            authDomain: document.getElementById('authDomainInput').value.trim(),
            projectId: document.getElementById('projectIdInput').value.trim(),
            storageBucket: document.getElementById('storageBucketInput').value.trim(),
            messagingSenderId: document.getElementById('messagingSenderIdInput').value.trim(),
            appId: document.getElementById('appIdInput').value.trim(),
            measurementId: document.getElementById('measurementIdInput').value.trim(),
            databaseURL: document.getElementById('databaseUrlInput').value.trim() || document.getElementById('easyDatabaseUrlInput').value.trim()
        };

        // Validate Firebase config
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'databaseURL'];
        for (const field of requiredFields) {
            if (!newFirebaseConfig[field]) {
                alert(`${field} is required!`);
                return;
            }
        }

        const roomChanged = newRoomId !== ROOM_ID;
        const nameChanged = newDisplayName !== DISPLAY_NAME;
        const firebaseChanged = JSON.stringify(newFirebaseConfig) !== JSON.stringify(firebaseConfig);

        if (!roomChanged && !firebaseChanged && !nameChanged) {
            hideSettingsPopup();
            return;
        }

        console.log(`HOST: Updating configuration...`);

        // Stop current sync if running
        if (watchTogetherEnabled) {
            stopSync();
        }

        // Update configuration
        ROOM_ID = newRoomId;
        DISPLAY_NAME = newDisplayName;
        firebaseConfig = newFirebaseConfig;

        // Save to localStorage
        saveConfig();

        // Reinitialize Firebase with new config
        const firebaseReady = await initializeFirebase();
        if (firebaseReady) {
            console.log(`HOST: Successfully updated configuration`);
            hideSettingsPopup();

            // Show success message
            showGuestStatus(`Configuration updated - Room: ${ROOM_ID}${DISPLAY_NAME ? ' - Name: ' + DISPLAY_NAME : ''}`);
            setTimeout(() => {
                const existingStatus = document.querySelector('.guest-status-display');
                if (existingStatus) existingStatus.remove();
            }, 3000);
        } else {
            alert('Failed to connect with new configuration. Please check your Firebase settings.');
        }
    }

    // Toggle Watch Together functionality
    function toggleWatchTogether() {
        // Check if Firebase is configured
        if (!isFirebaseConfigValid()) {
            showFirebaseConfigRequired();
            return;
        }

        watchTogetherEnabled = !watchTogetherEnabled;

        if (watchTogetherEnabled) {
            watchTogetherButton.style.backgroundColor = '#FF6B35';
            watchTogetherButton.style.opacity = '1';
            console.log('HOST: Watch Together ENABLED - You are controlling playback');
            startSync();
        } else {
            watchTogetherButton.style.backgroundColor = '';
            watchTogetherButton.style.opacity = '0.7';
            console.log('HOST: Watch Together DISABLED');
            stopSync();
        }
    }

    // Get current time from timer
    function getCurrentTime() {
        const timerElement = document.querySelector('.label-QFbsS');
        if (!timerElement) return 0;

        const timeStr = timerElement.textContent;
        const parts = timeStr.split(':').map(Number);
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    // Get play/pause state
    function getPlayState() {
        if (!playPauseButton) return false;
        return playPauseButton.getAttribute('title') === 'Pause';
    }

    // Check if video is buffering
    function isVideoBuffering() {
        const bufferingLayer = document.querySelector('.buffering-layer-ZZCYp');
        return bufferingLayer && bufferingLayer.style.display !== 'none' && bufferingLayer.offsetParent !== null;
    }

    // Check if movie has loaded (timer shows actual time instead of --:--:--)
    function isMovieLoaded() {
        const timerElement = document.querySelector('.label-QFbsS');
        if (!timerElement) return false;

        const timeStr = timerElement.textContent;
        // Check if timer shows actual time (not --:--:--)
        return !timeStr.includes('--');
    }

    // Get current video URL
    function getCurrentVideoURL() {
        const currentURL = window.location.href;
        console.log('HOST: Current URL:', currentURL);
        return currentURL;
    }

    // Validate if URL is a valid Stremio video URL
    function isValidStremioVideoURL(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('stremio.com') &&
                   (urlObj.pathname.includes('/player/') || urlObj.hash.includes('#/player/'));
        } catch (error) {
            return false;
        }
    }

    // Get controller state from Firebase data
    function getControllerState(data) {
        if (!data || !data.permissions || !data.permissions.controllerId) {
            return null;
        }
        
        const controllerId = data.permissions.controllerId;
        
        // Check if host has control
        if (data.host && data.host.userId === controllerId) {
            return data.host;
        }
        
        // Check if a guest has control
        if (data.guests && data.guests[controllerId]) {
            return data.guests[controllerId];
        }
        
        return null;
    }

    // Apply controller state to host's video
    function applyControllerState(controllerState) {
        if (!watchTogetherEnabled || !videoElement || !controllerState) return;
        
        console.log('HOST: Applying controller state:', controllerState);
        
        const currentTime = getCurrentTime();
        const timeDiff = Math.abs(currentTime - (controllerState.currentTime || 0));
        const localIsPlaying = getPlayState();
        
        // Sync time if difference is more than 3 seconds
        if (timeDiff > 3 && controllerState.currentTime !== undefined) {
            console.log(`HOST: Syncing time to controller: ${controllerState.currentTime}s (was ${currentTime}s)`);
            videoElement.currentTime = controllerState.currentTime;
        }
        
        // Sync play/pause state
        if (controllerState.isPlaying !== undefined) {
            if (controllerState.isPlaying && !localIsPlaying) {
                console.log('HOST: Controller playing - resuming video');
                playPauseButton.click();
            } else if (!controllerState.isPlaying && localIsPlaying) {
                console.log('HOST: Controller paused - pausing video');
                playPauseButton.click();
            }
        }
    }

    // Send host state to Firebase
    async function sendHostState() {
        if (!watchTogetherEnabled || !roomRef) return;

        try {
            const { set, update } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            // Only send video control updates if we have the control token
            if (currentControllerId !== USER_ID) {
                console.log('HOST: Not sending state - control delegated to:', currentControllerId);
                return;
            }

            const currentTime = getCurrentTime();
            const isPlaying = getPlayState();
            const isCurrentlyBuffering = isVideoBuffering();

            const hostState = {
                userId: USER_ID,
                displayName: DISPLAY_NAME,
                currentTime: currentTime,
                isPlaying: isPlaying,
                isBuffering: isCurrentlyBuffering,
                lastUpdated: Date.now()
            };

            // Get current video URL
            const videoURL = getCurrentVideoURL();

            // Update only the host data and video URL
            await update(roomRef, {
                'host': hostState,
                'videoURL': videoURL,
                'status': 'active'
            });

            lastSentTime = currentTime;

        } catch (error) {
            console.error('HOST ERROR: Failed to send state:', error);
        }
    }

    // Listen for guest status updates
    async function startGuestListener() {
        try {
            const { onValue } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            onValue(roomRef, (snapshot) => {
                const data = snapshot.val();
                
                // Handle guests
                if (data && data.guests) {
                    const guestCount = Object.keys(data.guests).length;
                    console.log(`HOST: ${guestCount} guest(s) connected`);

                    // Update guest states
                    guestStates = data.guests;

                    // Check for guest buffering
                    checkGuestBuffering();

                    // Show guest status in UI
                    showGuestStatus(guestCount);

                    // Update control panel
                    updateControlPanel();
                }

                // Update permissions
                if (data && data.permissions) {
                    if (data.permissions.controllerId) {
                        currentControllerId = data.permissions.controllerId;
                    }
                    if (data.permissions.controlRequests) {
                        controlRequests = data.permissions.controlRequests;
                    } else {
                        controlRequests = {};
                    }

                    // Update control panel
                    updateControlPanel();
                }

                // Apply controller state if we don't have control
                if (currentControllerId !== USER_ID) {
                    const controllerState = getControllerState(data);
                    if (controllerState) {
                        console.log('HOST: Detected controller state change, applying:', controllerState);
                        applyControllerState(controllerState);
                    }
                }
            });

            console.log('HOST: Guest listener started');
        } catch (error) {
            console.error('HOST ERROR: Failed to start guest listener:', error);
        }
    }

    // Check if any guests are buffering
    function checkGuestBuffering() {
        console.log('🔍 HOST: Checking guest buffering states:', guestStates);

        // Filter out guests that are not connected or don't have buffering info
        const activeGuests = Object.values(guestStates).filter(guest =>
            guest && guest.connected !== false
        );

        const bufferingGuests = activeGuests.filter(guest =>
            guest.isBuffering === true
        );

        console.log('🔍 HOST: Active guests:', activeGuests.length, 'Buffering guests:', bufferingGuests.length);

        const wasAnyBuffering = isAnyGuestBuffering;
        isAnyGuestBuffering = bufferingGuests.length > 0;

        console.log('🔍 HOST: wasAnyBuffering:', wasAnyBuffering, 'isAnyGuestBuffering:', isAnyGuestBuffering);

        if (isAnyGuestBuffering && !wasAnyBuffering) {
            // At least one guest started buffering - pause host video
            console.log('HOST: Guest(s) buffering - pausing video');
            if (getPlayState() && playPauseButton) {
                playPauseButton.click();
            }
            showGuestBufferingStatus(bufferingGuests.length);
            showGuestBufferingIcon(bufferingGuests.length);
        } else if (!isAnyGuestBuffering && wasAnyBuffering) {
            // No guests are buffering anymore
            console.log('HOST: All guests finished buffering - hiding icon');
            hideGuestBufferingStatus();
            hideGuestBufferingIcon();
        } else if (!isAnyGuestBuffering && !wasAnyBuffering) {
            // Make sure icon is hidden when no guests are buffering
            hideGuestBufferingStatus();
            hideGuestBufferingIcon();
        }
    }

    // Show guest buffering status
    function showGuestBufferingStatus(bufferingCount) {
        hideGuestBufferingStatus(); // Remove existing message

        // Find control bar dynamically
        const currentControlBar = document.querySelector('.control-bar-buttons-container-SWhkU');
        if (!currentControlBar) return;

        const statusDiv = document.createElement('div');
        statusDiv.className = 'guest-buffering-status';
        statusDiv.style.cssText = `
            position: absolute;
            top: -60px;
            right: 10px;
            background: rgba(255, 107, 53, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            border: 2px solid #FF6B35;
        `;
        statusDiv.textContent = `${bufferingCount} guest(s) buffering - video paused`;

        const controlBarContainer = currentControlBar.closest('.control-bar');
        if (controlBarContainer) {
            controlBarContainer.style.position = 'relative';
            controlBarContainer.appendChild(statusDiv);
        }
    }

    // Show guest buffering loading icon
    function showGuestBufferingIcon(bufferingCount) {
        hideGuestBufferingIcon(); // Remove existing icon

        const loadingIcon = document.createElement('div');
        loadingIcon.className = 'guest-buffering-icon';
        loadingIcon.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 30px;
            height: 30px;
            z-index: 10000;
            pointer-events: none;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        loadingIcon.innerHTML = `
            <div style="
                width: 20px;
                height: 20px;
                border: 2px solid rgba(76, 175, 80, 0.3);
                border-top: 2px solid #4CAF50;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        // Add to body for better visibility
        document.body.appendChild(loadingIcon);
        console.log('HOST: Guest buffering icon displayed');
    }

    // Hide guest buffering loading icon
    function hideGuestBufferingIcon() {
        const existingIcon = document.querySelector('.guest-buffering-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
    }

    // Hide guest buffering status
    function hideGuestBufferingStatus() {
        const existingMessage = document.querySelector('.guest-buffering-status');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    // Show notification message
    function showNotification(message, color = '#FF6B35') {
        // Remove existing notification
        const existingNotification = document.querySelector('.control-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'control-notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10001;
            border: 2px solid ${color};
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            animation: slideDown 0.3s ease;
        `;
        notification.innerHTML = `
            <style>
                @keyframes slideDown {
                    from {
                        transform: translateX(-50%) translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
            </style>
            ${message}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Delegate control to a guest
    async function delegateControl(guestUserId, guestName) {
        if (!roomRef) return;

        try {
            const { update } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            await update(roomRef, {
                'permissions/controllerId': guestUserId
            });

            currentControllerId = guestUserId;
            showNotification(`Control delegated to ${guestName}`, '#4CAF50');
            updateControlPanel();

            console.log('HOST: Control delegated to', guestUserId);
        } catch (error) {
            console.error('HOST ERROR: Failed to delegate control:', error);
            showNotification('Failed to delegate control', '#f44336');
        }
    }

    // Take back control
    async function takeBackControl() {
        if (!roomRef) return;

        try {
            const { update } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            await update(roomRef, {
                'permissions/controllerId': USER_ID,
                'permissions/controlRequests': null
            });

            currentControllerId = USER_ID;
            controlRequests = {};
            showNotification('You now have control', '#FF6B35');
            updateControlPanel();

            console.log('HOST: Took back control');
        } catch (error) {
            console.error('HOST ERROR: Failed to take back control:', error);
            showNotification('Failed to take back control', '#f44336');
        }
    }

    // Approve control request from guest
    async function approveControlRequest(guestUserId, guestName) {
        if (!roomRef) return;

        try {
            const { update } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            await update(roomRef, {
                'permissions/controllerId': guestUserId,
                [`permissions/controlRequests/${guestUserId}`]: null
            });

            currentControllerId = guestUserId;
            delete controlRequests[guestUserId];
            showNotification(`Control granted to ${guestName}`, '#4CAF50');
            updateControlPanel();

            console.log('HOST: Approved control request from', guestUserId);
        } catch (error) {
            console.error('HOST ERROR: Failed to approve control request:', error);
            showNotification('Failed to approve request', '#f44336');
        }
    }

    // Deny control request from guest
    async function denyControlRequest(guestUserId) {
        if (!roomRef) return;

        try {
            const { update } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            await update(roomRef, {
                [`permissions/controlRequests/${guestUserId}`]: null
            });

            delete controlRequests[guestUserId];
            updateControlPanel();

            console.log('HOST: Denied control request from', guestUserId);
        } catch (error) {
            console.error('HOST ERROR: Failed to deny control request:', error);
        }
    }

    // Create control panel UI
    function createControlPanel() {
        if (controlPanel) {
            controlPanel.remove();
        }

        controlPanel = document.createElement('div');
        controlPanel.className = 'host-control-panel';
        controlPanel.style.cssText = `
            position: fixed;
            top: 150px;
            right: 20px;
            width: 320px;
            max-height: 500px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border: 2px solid #FF6B35;
            border-radius: 12px;
            padding: 0;
            z-index: 9999;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            display: none;
        `;

        updateControlPanel();

        document.body.appendChild(controlPanel);
        console.log('HOST: Control panel created');
    }

    // Update control panel content
    function updateControlPanel() {
        if (!controlPanel) return;

        const guestCount = Object.keys(guestStates).length;
        const requestCount = Object.keys(controlRequests).length;

        let controllerName = 'You';
        if (currentControllerId !== USER_ID) {
            const controller = guestStates[currentControllerId];
            controllerName = controller ? controller.displayName : 'Unknown';
        }

        let guestHTML = '';
        for (const [guestId, guest] of Object.entries(guestStates)) {
            if (!guest) continue;

            const isController = currentControllerId === guestId;
            const hasRequest = controlRequests[guestId];

            guestHTML += `
                <div style="padding: 12px; border-bottom: 1px solid #333; display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                        ${isController ? '<span style="font-size: 16px;">👑</span>' : ''}
                        <span style="font-weight: ${isController ? '600' : '400'}; color: ${isController ? '#4CAF50' : '#e0e0e0'};">
                            ${guest.displayName || guestId}
                        </span>
                    </div>
                    <div>
                        ${!isController && !hasRequest ? `
                            <button onclick="window.delegateControlToGuest('${guestId}', '${guest.displayName}')" 
                                    style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
                                Give Control
                            </button>
                        ` : ''}
                        ${isController && currentControllerId !== USER_ID ? `
                            <span style="color: #4CAF50; font-size: 11px; font-weight: 600;">CONTROLLING</span>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        let requestsHTML = '';
        for (const [requesterId, request] of Object.entries(controlRequests)) {
            if (!request) continue;

            requestsHTML += `
                <div style="padding: 12px; border-bottom: 1px solid #333; display: flex; align-items: center; justify-content: space-between; background: rgba(255, 152, 0, 0.1);">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #ff9800; font-size: 13px;">${request.displayName || requesterId}</div>
                        <div style="font-size: 11px; color: #aaa;">Requesting control</div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button onclick="window.approveControlRequestHandler('${requesterId}', '${request.displayName}')" 
                                style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">
                            ✓
                        </button>
                        <button onclick="window.denyControlRequestHandler('${requesterId}')" 
                                style="padding: 6px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">
                            ✗
                        </button>
                    </div>
                </div>
            `;
        }

        controlPanel.innerHTML = `
            <div style="background: linear-gradient(135deg, #FF6B35 0%, #ff8c42 100%); padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600; font-size: 16px;">Control Panel</div>
                    <div style="font-size: 12px; opacity: 0.9;">${guestCount} guest(s) connected</div>
                </div>
                <button onclick="window.toggleControlPanel()" style="background: transparent; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0; width: 24px; height: 24px;">×</button>
            </div>

            <div style="padding: 15px; border-bottom: 2px solid #333;">
                <div style="font-size: 13px; color: #aaa; margin-bottom: 8px;">Current Controller:</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <span style="font-size: 20px;">👑</span>
                    <span style="font-weight: 600; font-size: 15px; color: #4CAF50;">${controllerName}</span>
                </div>
                ${currentControllerId !== USER_ID ? `
                    <button onclick="window.takeBackControlHandler()" style="width: 100%; padding: 10px; background: #FF6B35; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                        Take Back Control
                    </button>
                ` : ''}
            </div>

            ${requestCount > 0 ? `
                <div style="background: rgba(255, 152, 0, 0.05);">
                    <div style="padding: 12px 15px; font-weight: 600; font-size: 13px; color: #ff9800; border-bottom: 1px solid #333;">
                        Control Requests (${requestCount})
                    </div>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${requestsHTML}
                    </div>
                </div>
            ` : ''}

            ${guestCount > 0 ? `
                <div>
                    <div style="padding: 12px 15px; font-weight: 600; font-size: 13px; color: #e0e0e0; border-bottom: 1px solid #333;">
                        Connected Guests
                    </div>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${guestHTML || '<div style="padding: 15px; text-align: center; color: #aaa; font-size: 13px;">No guests connected</div>'}
                    </div>
                </div>
            ` : `
                <div style="padding: 20px; text-align: center; color: #aaa; font-size: 13px;">
                    No guests connected yet
                </div>
            `}
        `;

        console.log('HOST: Control panel updated');
    }

    // Toggle control panel visibility
    function toggleControlPanel() {
        if (!controlPanel) return;

        if (controlPanel.style.display === 'none') {
            controlPanel.style.display = 'block';
        } else {
            controlPanel.style.display = 'none';
        }
    }

    // Show control panel
    function showControlPanel() {
        if (controlPanel) {
            controlPanel.style.display = 'block';
        }
    }

    // Hide control panel
    function hideControlPanel() {
        if (controlPanel) {
            controlPanel.style.display = 'none';
        }
    }

    // Global handlers for control panel buttons
    window.delegateControlToGuest = delegateControl;
    window.takeBackControlHandler = takeBackControl;
    window.approveControlRequestHandler = approveControlRequest;
    window.denyControlRequestHandler = denyControlRequest;
    window.toggleControlPanel = toggleControlPanel;

    // Show guest status in control bar
    function showGuestStatus(guestCount) {
        // Remove existing status
        const existingStatus = document.querySelector('.guest-status-display');
        if (existingStatus) {
            existingStatus.remove();
        }

        if (guestCount > 0) {
            // Find control bar dynamically
            const currentControlBar = document.querySelector('.control-bar-buttons-container-SWhkU');
            if (!currentControlBar) return;

            const status = document.createElement('div');
            status.className = 'guest-status-display';
            status.style.cssText = `
                position: absolute;
                top: -30px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
            `;
            status.textContent = `${guestCount} guest(s) connected`;

            const controlBarContainer = currentControlBar.closest('.control-bar');
            if (controlBarContainer) {
                controlBarContainer.style.position = 'relative';
                controlBarContainer.appendChild(status);
            }
        }
    }

    // Start sync
    function startSync() {
        syncInterval = setInterval(() => {
            if (watchTogetherEnabled) {
                sendHostState();
            }
        }, 2000); // Send updates every 2 seconds

        sendHostState();
        console.log('HOST: Sync started');
    }

    // Stop sync
    function stopSync() {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }

        const existingStatus = document.querySelector('.guest-status-display');
        if (existingStatus) {
            existingStatus.remove();
        }

        hideGuestBufferingStatus();
        hideGuestBufferingIcon();

        console.log('HOST: Sync stopped');
    }

    // Set up observers
    function setupObservers() {
        // Observe play/pause button changes
        if (playPauseButton) {
            playPauseObserver = new MutationObserver(() => {
                if (watchTogetherEnabled) {
                    sendHostState();
                }
            });

            playPauseObserver.observe(playPauseButton, {
                attributes: true,
                attributeFilter: ['title']
            });
        }

        // Observe buffering state changes
        const bufferingLayer = document.querySelector('.buffering-layer-ZZCYp');
        if (bufferingLayer) {
            bufferingObserver = new MutationObserver(() => {
                const currentlyBuffering = isVideoBuffering();
                if (currentlyBuffering !== isBuffering) {
                    isBuffering = currentlyBuffering;
                    if (watchTogetherEnabled) {
                        sendHostState();
                    }
                }
            });

            bufferingObserver.observe(bufferingLayer, {
                attributes: true,
                childList: true,
                subtree: true
            });
        }

        console.log('HOST: Observers set up');
    }

    // Cleanup function
    function cleanup() {
        if (syncInterval) clearInterval(syncInterval);
        if (playPauseObserver) playPauseObserver.disconnect();
        if (bufferingObserver) bufferingObserver.disconnect();
        if (watchTogetherButton) watchTogetherButton.remove();
        if (settingsButton) settingsButton.remove();
        if (controlPanel) controlPanel.remove();
        hideSettingsPopup();

        const existingStatus = document.querySelector('.guest-status-display');
        if (existingStatus) existingStatus.remove();

        const controlPanelButton = document.querySelector('.control-panel-toggle-button');
        if (controlPanelButton) controlPanelButton.remove();

        hideGuestBufferingStatus();
        hideGuestBufferingIcon();
        
        isScriptActive = false;
        console.log('HOST: Cleanup complete');
    }

    // Main initialization
    async function initialize() {
        // Load saved configuration first
        loadConfig();

        // Initialize display name (generate if needed, or load saved)
        initializeDisplayName();

        console.log(`HOST User ID: ${USER_ID}`);
        console.log(`Room ID: ${ROOM_ID}`);
        console.log('Share this Room ID with your guest: ' + ROOM_ID);

        const firebaseReady = await initializeFirebase();
        if (!firebaseReady) {
            console.log('HOST WARNING: Firebase not configured - user needs to set up Firebase first');
            // Don't return here, let the user configure Firebase through the settings
            // The buttons will be created but Firebase won't be initialized until configured
        }

        // Wait for DOM elements with longer timeout
        const maxAttempts = 60; // Increased from 30 to 60
        let attempts = 0;

        console.log('HOST: Waiting for DOM elements to load...');

        while (!findDOMElements() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;

            if (attempts % 10 === 0) {
                console.log(`HOST: Still waiting for DOM elements... (${attempts}/${maxAttempts})`);
            }
        }

        // Wait for movie to load (timer shows actual time instead of --:--:--)
        console.log('HOST: Waiting for movie to load...');
        let movieLoadAttempts = 0;
        const maxMovieLoadAttempts = 30; // 30 seconds to wait for movie load

        while (!isMovieLoaded() && movieLoadAttempts < maxMovieLoadAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            movieLoadAttempts++;

            if (movieLoadAttempts % 5 === 0) {
                console.log(`HOST: Waiting for movie to load... (${movieLoadAttempts}/${maxMovieLoadAttempts})`);
            }
        }

        if (movieLoadAttempts >= maxMovieLoadAttempts) {
            console.log('HOST WARNING: Movie load timeout - proceeding anyway');
        } else {
            console.log('HOST: Movie loaded successfully');
        }

        if (attempts >= maxAttempts) {
            console.error('HOST ERROR: Could not find required DOM elements after 60 seconds');
            console.error('HOST ERROR: This might be because:');
            console.error('   1. The video is still loading');
            console.error('   2. Stremio UI has changed');
            console.error('   3. The page structure is different');

            // Try to continue anyway with partial elements
            if (videoElement || controlBar || playPauseButton) {
                console.log('HOST WARNING: Attempting to continue with partial elements...');
            } else {
                return;
            }
        }

        createWatchTogetherButton();
        createControlPanelButton();
        createSettingsButton();
        createControlPanel();
        setupObservers();
        startGuestListener();

        console.log('HOST: Watch Together Script loaded successfully!');
        console.log('Click the orange chat icon to start controlling playback');
        console.log('Share Room ID with guest:', ROOM_ID);
        console.log('Test functions available:');
        console.log('   - testGuestBufferingIcon() - Test the guest buffering icon display');
    }

    // Handle page unload
    window.addEventListener('beforeunload', cleanup);

    // Test function for guest buffering icon
    window.testGuestBufferingIcon = function() {
        console.log('HOST: Testing guest buffering icon...');
        showGuestBufferingIcon(1);
        setTimeout(() => {
            console.log('HOST: Hiding guest buffering icon after 5 seconds...');
            hideGuestBufferingIcon();
        }, 5000);
    };

    // Test function to simulate guest buffering state
    window.testGuestBufferingState = function() {
        console.log('HOST: Simulating guest buffering state...');

        // Find the first guest and simulate them buffering
        const guestIds = Object.keys(guestStates);
        if (guestIds.length > 0) {
            const firstGuestId = guestIds[0];
            console.log('HOST: Simulating buffering for guest:', firstGuestId);

            // Simulate the guest buffering
            guestStates[firstGuestId] = {
                ...guestStates[firstGuestId],
                isBuffering: true
            };

            // Trigger the check
            checkGuestBuffering();

            // Reset after 5 seconds
            setTimeout(() => {
                console.log('HOST: Resetting guest buffering state...');
                guestStates[firstGuestId] = {
                    ...guestStates[firstGuestId],
                    isBuffering: false
                };
                checkGuestBuffering();
            }, 5000);
        } else {
            console.log('HOST ERROR: No guests found to simulate buffering');
        }
    };

    // Wait for page to be fully loaded before initializing
    function waitForPageLoad() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }

    // Start initialization
    async function startInitialization() {
        console.log('HOST: Starting initialization...');

        // Wait for page load
        await waitForPageLoad();
        console.log('HOST: Page loaded');

        // Wait a bit more for Stremio to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('HOST: Waiting period complete');

        // Start the main initialization
        await initialize();
    }

    // Start initialization
    // Start initialization
    // startInitialization().catch(error => {
    //     console.error('HOST ERROR: Initialization failed:', error);
    // });

    // URL Change Detection and Lifecycle Management
    let lastUrl = window.location.href;

    async function checkUrlAndManageState() {
        const currentUrl = window.location.href;
        const isPlayerPage = currentUrl.includes('#/player/');
        
        if (isPlayerPage) {
            if (!isScriptActive && !isInitializationRunning) {
                console.log('HOST: Player page detected, initializing Watch Together...');
                isInitializationRunning = true;
                
                try {
                    // Start initialization flow
                    await startInitialization(); // This calls initialize() which sets up everything
                    isScriptActive = true;
                } catch (error) {
                    console.error('HOST ERROR: Failed to initialize:', error);
                    // Reset flags so we can retry if needed
                    isScriptActive = false;
                } finally {
                    isInitializationRunning = false;
                }
            }
        } else {
            if (isScriptActive) {
                console.log('HOST: Left player page, cleaning up...');
                cleanup();
                // isScriptActive is set to false in cleanup(), but ensuring it here too
                isScriptActive = false;
            }
        }
        
        lastUrl = currentUrl;
    }

    // Interval to check for URL changes (robust for SPA)
    // Check every 1 second
    setInterval(checkUrlAndManageState, 1000);

    // Initial check
    checkUrlAndManageState();
    
    // Also listen for popstate just in case
    window.addEventListener('popstate', () => {
        setTimeout(checkUrlAndManageState, 100);
    });
})();
