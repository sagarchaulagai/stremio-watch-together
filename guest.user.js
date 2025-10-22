// ==UserScript==
// @name         Stremio Watch Together - Guest
// @namespace    https://stremio.com
// @version      1.0
// @description  Watch Together Guest Script for Stremio Web Player
// @author       Sagar Chaulagain
// @updateURL    https://github.com/sagarchaulagai/stremio-watch-together/raw/refs/heads/master/guest.user.js
// @downloadURL  https://github.com/sagarchaulagai/stremio-watch-together/raw/refs/heads/master/guest.user.js
// @match        https://web.stremio.com/*
// @match        https://web.stremio.com/
// @match        https://web.stremio.com/#*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Check if we're on the player page or watch together redirect page
    const isOnPlayerPage = window.location.hash.includes('#/player/');
    const isOnWatchTogetherPageCheck = window.location.pathname.includes('/watchtogether') ||
                                       window.location.hash.includes('#/watchtogether');

    if (!isOnPlayerPage && !isOnWatchTogetherPageCheck) {
        console.log('GUEST: Not on player page or watch together page, skipping script');
        return;
    }

    if (isOnWatchTogetherPageCheck) {
        console.log('GUEST: On watch together redirect page');
    }

    console.log('GUEST: Watch Together Script Loading...');

    // Set flag to indicate userscript is loaded
    window.stremioWatchTogetherLoaded = true;

    // Firebase Configuration (moved to DEFAULT_FIREBASE_CONFIG below)

    // Configuration - CHANGE THIS TO MATCH HOST'S ROOM ID
    let ROOM_ID = 'room123'; // Default room ID - can be changed via settings
    const USER_ID = 'guest_' + Math.random().toString(36).substr(2, 6);
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
                console.log('GUEST: Configuration loaded from localStorage');
            }
        } catch (error) {
            console.error('GUEST ERROR: Failed to load configuration:', error);
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
            console.log('GUEST: Configuration saved to localStorage');
        } catch (error) {
            console.error('GUEST ERROR: Failed to save configuration:', error);
        }
    }

    // Clear configuration
    function clearConfig() {
        try {
            localStorage.removeItem(CONFIG_STORAGE_KEY);
            ROOM_ID = 'room123';
            firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };
            DISPLAY_NAME = '';
            console.log('GUEST: Configuration cleared');
        } catch (error) {
            console.error('GUEST ERROR: Failed to clear configuration:', error);
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
                    console.log('GUEST: Loaded display name:', DISPLAY_NAME);
                    return;
                }
            }
            
            // Generate new username only if none exists
            if (!DISPLAY_NAME || DISPLAY_NAME.trim() === '') {
                DISPLAY_NAME = generateCoolUsername('guest_');
                saveConfig();
                console.log('GUEST: Generated new display name:', DISPLAY_NAME);
            }
        } catch (error) {
            console.error('GUEST ERROR: Failed to initialize display name:', error);
            DISPLAY_NAME = generateCoolUsername('guest_');
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
            <div style="text-align: center; max-width: 500px; padding: 40px; background: rgba(76, 175, 80, 0.1); border: 2px solid #4CAF50; border-radius: 10px;">
                <h2 style="color: #4CAF50; margin: 0 0 20px 0;">Firebase Configuration Required</h2>
                <p style="font-size: 1.1em; margin: 0 0 20px 0; line-height: 1.5;">
                    To use Watch Together, you need to configure your Firebase settings first.
                </p>
                <p style="margin: 0 0 30px 0; opacity: 0.9;">
                    Click the settings button (gear icon) next to the Watch Together button to configure Firebase.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button id="openSettings" style="
                        background: #4CAF50;
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

        console.log('GUEST WARNING: Firebase configuration required message displayed');
    }

    // Global variables
    let app, database, roomRef;
    let watchTogetherEnabled = false;
    let videoElement = null;
    let playPauseButton = null;
    let controlBar = null;
    let watchTogetherButton = null;
    let settingsButton = null;
    let settingsPopup = null;
    let lastKnownHostState = null;
    let isFollowingHost = false;
    let bufferingObserver = null;
    let isGuestBuffering = false;
    let lastGuestStateSent = 0;
    let currentControllerId = null;
    let requestControlButton = null;

    // Initialize Firebase
    async function initializeFirebase() {
        // Check if Firebase config is valid
        if (!isFirebaseConfigValid()) {
            console.log('GUEST WARNING: Firebase not configured. Please configure Firebase settings first.');
            showFirebaseConfigRequired();
            return false;
        }

        try {
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js');
            const { getDatabase, ref, update, onValue } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

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

            console.log('GUEST: Firebase initialized for room:', ROOM_ID);

            // Register as guest in the room
            await update(roomRef, {
                ['guests/' + USER_ID]: {
                    userId: USER_ID,
                    displayName: DISPLAY_NAME,
                    connected: true,
                    lastSeen: Date.now()
                }
            });

            console.log('GUEST: Registered in room');
            return true;
        } catch (error) {
            console.error('GUEST ERROR: Firebase initialization failed:', error);
            return false;
        }
    }

    // Find DOM elements with multiple selectors
    function findDOMElements() {
        console.log('🔍 GUEST: Searching for DOM elements...');

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

        console.log('🔍 GUEST: Found elements:', {
            video: !!videoElement,
            controlBar: !!controlBar,
            playPauseButton: !!playPauseButton
        });

        if (videoElement && controlBar && playPauseButton) {
            console.log('GUEST: All DOM elements found');
            return true;
        }

        console.log('GUEST ERROR: Missing elements:', {
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
        watchTogetherButton.title = 'Watch Together (GUEST)';
        watchTogetherButton.style.cssText = `
            cursor: pointer;
            border: 2px solid #4CAF50;
            border-radius: 4px;
            background: rgba(76, 175, 80, 0.1);
        `;

        watchTogetherButton.innerHTML = `
            <svg class="icon-qy6I6" viewBox="0 0 24 24" style="width:24px;height:24px;">
                <path d="M12 2C6.48 2 2 6.03 2 10.5c0 2.85 1.83 5.35 4.61 6.85L5 22l5.25-2.72c.55.08 1.12.12 1.75.12 5.52 0 10-4.03 10-8.9C22 6.03 17.52 2 12 2zm0 15.5c-.56 0-1.12-.05-1.63-.15l-.6-.12-.53.28-.7.36.14-.77.1-.57-.48-.31C6.87 15.3 5.5 13.04 5.5 10.5 5.5 7.47 8.4 5 12 5s6.5 2.47 6.5 5.5-2.9 5.5-6.5 5.5z" fill="currentColor"/>
            </svg>
        `;

        controlBar.appendChild(watchTogetherButton);
        watchTogetherButton.addEventListener('click', toggleWatchTogether);

        console.log('GUEST: Watch Together button created');
    }

    // Create Request Control button
    function createRequestControlButton() {
        if (requestControlButton) {
            requestControlButton.remove();
        }

        requestControlButton = document.createElement('div');
        requestControlButton.className = 'control-bar-button-FQUsj button-container-zVLH6 request-control-button';
        requestControlButton.title = 'Request Control';
        requestControlButton.style.cssText = `
            cursor: pointer;
            border: 2px solid #9C27B0;
            border-radius: 8px;
            background: linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.25) 100%);
            margin-left: 5px;
            display: flex;
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(156, 39, 176, 0.2);
            backdrop-filter: blur(10px);
            justify-content: center;
            align-items: center;
        `;

        // Add hover and active states
        const style = document.createElement('style');
        style.textContent = `
            .request-control-button:hover {
                border-color: #E91E63 !important;
                background: linear-gradient(135deg, rgba(233, 30, 99, 0.2) 0%, rgba(233, 30, 99, 0.35) 100%) !important;
                box-shadow: 0 4px 16px rgba(233, 30, 99, 0.4) !important;
                transform: translateY(-1px) !important;
            }
            .request-control-button:active {
                transform: translateY(0px) scale(0.98) !important;
                box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3) !important;
            }
            .request-control-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                transition: left 0.6s;
            }
            .request-control-button:hover::before {
                left: 100%;
            }
        `;
        document.head.appendChild(style);

        requestControlButton.innerHTML = `
            <svg viewBox="0 0 24 24" style="width:24px;height:24px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="white"/>
            </svg>
        `;


        controlBar.appendChild(requestControlButton);
        requestControlButton.addEventListener('click', requestControl);

        console.log('GUEST: Request Control button created');
    }

    // Update Request Control button state
    function updateRequestControlButton() {
        if (!requestControlButton) return;

        if (currentControllerId === USER_ID) {
            // We have control - hide the button
            requestControlButton.style.display = 'none';
            requestControlButton.title = 'You have control';
        } else if (watchTogetherEnabled) {
            // Show button when not controlling
            requestControlButton.style.display = 'flex';
            requestControlButton.title = 'Request Control';
        } else {
            requestControlButton.style.display = 'none';
        }
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

        console.log('GUEST: Settings button created');
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
                console.log('GUEST DEBUG: Found firebaseConfig object:', configMatch[1]);
                // Use eval to parse the object (safe in this context as it's user-provided config)
                configObj = eval('(' + configMatch[1] + ')');
            } else {
                console.log('GUEST DEBUG: No firebaseConfig match found, trying direct parse:', cleanText);
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

            console.log('GUEST: Firebase configuration parsed:', extractedConfig);

        } catch (error) {
            console.error('GUEST ERROR: Failed to parse Firebase configuration:', error);
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
            easyTab.style.background = '#4CAF50';
            easyTab.style.color = 'white';
            easyContent.style.display = 'block';
        } else if (tab === 'manual') {
            manualTab.style.background = '#4CAF50';
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
            console.log('GUEST: Generated shareable configuration');
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
                console.log('GUEST: Configuration copied to clipboard');
            } catch (error) {
                console.error('GUEST ERROR: Failed to copy configuration:', error);
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
            border: 2px solid #4CAF50;
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
            <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 20px; color: white;">
                <h3 style="margin: 0; font-size: 24px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Watch Together Settings</h3>
                <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Configure your room and Firebase settings</p>
            </div>

            <div style="padding: 25px; max-height: calc(95vh - 120px); overflow-y: auto;">
                <div style="margin-bottom: 30px;">
                    <h4 style="margin: 0 0 15px 0; color: #4CAF50; font-size: 18px; font-weight: 600; border-bottom: 2px solid #333; padding-bottom: 8px;">Room Configuration</h4>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e0e0e0;">Display Name:</label>
                        <input type="text" id="displayNameInput" value="${DISPLAY_NAME || ''}"
                               style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                               onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#444'">
                        <small style="color: #aaa; font-size: 12px; margin-top: 5px; display: block;">This name is shown to the host. Leave empty to auto-generate.</small>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e0e0e0;">Room ID:</label>
                        <input type="text" id="roomIdInput" value="${ROOM_ID}"
                               style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                               onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#444'">
                        <small style="color: #aaa; font-size: 12px; margin-top: 5px; display: block;">Enter the same Room ID as the host</small>
                    </div>
                </div>

                <div style="margin-bottom: 30px;">
                    <h4 style="margin: 0 0 20px 0; color: #4CAF50; font-size: 18px; font-weight: 600; border-bottom: 2px solid #333; padding-bottom: 8px;">Firebase Configuration</h4>

                    <!-- Tab Navigation -->
                    <div style="display: flex; border-bottom: 2px solid #333; margin-bottom: 25px; background: #2a2a2a; border-radius: 8px; padding: 4px;">
                        <button id="easyConfigTab" class="config-tab active" style="
                            flex: 1;
                            padding: 12px 20px;
                            background: #4CAF50;
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
                        <div style="padding: 20px; background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%); border: 2px solid #4CAF50; border-radius: 10px;">
                            <p style="margin: 0 0 15px 0; font-size: 14px; color: #e0e0e0; line-height: 1.5;">Paste your complete Firebase configuration object here:</p>
                            <textarea id="easyFirebaseConfig" placeholder="const firebaseConfig = {
    apiKey: &quot;yourApiKeyFromFirebase&quot;,
    authDomain: &quot;yourAuthDomainFromFirebase&quot;,
    projectId: &quot;yourProjectIdFromFirebase&quot;,
    storageBucket: &quot;yourStorageBucket.firebasestorage.app&quot;,
    messagingSenderId: &quot;918854225070&quot;,
    appId: &quot;yourAppIdFromFirebase&quot;,
    measurementId: &quot;yourMeasurementIdFromFirebase&quot;,
    databaseURL: &quot;yourDatabaseUrlFromFirebase&quot;
};"
                                      style="width: 100%; height: 160px; padding: 15px; border: 2px solid #444; border-radius: 8px; background: #1a1a1a; color: #e0e0e0; font-size: 12px; font-family: 'Courier New', monospace; resize: vertical; line-height: 1.4;"></textarea>
                            <div style="display: flex; gap: 12px; margin-top: 15px;">
                                <button id="parseFirebaseConfig" style="padding: 12px 24px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s ease;"
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
                                           onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Auth Domain:</label>
                                    <input type="text" id="authDomainInput" value="${firebaseConfig.authDomain}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Project ID:</label>
                                    <input type="text" id="projectIdInput" value="${firebaseConfig.projectId}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Storage Bucket:</label>
                                    <input type="text" id="storageBucketInput" value="${firebaseConfig.storageBucket}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Messaging Sender ID:</label>
                                    <input type="text" id="messagingSenderIdInput" value="${firebaseConfig.messagingSenderId}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">App ID:</label>
                                    <input type="text" id="appIdInput" value="${firebaseConfig.appId}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Measurement ID:</label>
                                    <input type="text" id="measurementIdInput" value="${firebaseConfig.measurementId}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#444'">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #e0e0e0;">Database URL:</label>
                                    <input type="text" id="databaseUrlInput" value="${firebaseConfig.databaseURL}"
                                           style="width: 100%; padding: 12px; border: 2px solid #444; border-radius: 8px; background: #2a2a2a; color: white; font-size: 14px; transition: border-color 0.3s ease;"
                                           onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#444'">
                                </div>
                            </div>
                            <small style="color: #aaa; font-size: 12px; display: block; text-align: center; margin-top: 10px;">Get these values from your Firebase project settings</small>
                        </div>
                    </div>

                    <!-- Share Configuration Tab -->
                    <div id="shareConfigContent" class="config-content" style="display: none;">
                        <div style="padding: 20px; background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%); border: 2px solid #4CAF50; border-radius: 10px;">
                            <h5 style="margin: 0 0 15px 0; color: #4CAF50; font-size: 16px; font-weight: 600;">Share Your Firebase Configuration</h5>
                            <p style="margin: 0 0 20px 0; font-size: 14px; color: #e0e0e0; line-height: 1.5;">Generate a shareable configuration that other guests can easily import:</p>

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
                                <h6 style="margin: 0 0 10px 0; color: #4CAF50; font-size: 14px; font-weight: 600;">Instructions for Other Guests:</h6>
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
                        <button id="saveSettings" style="padding: 12px 24px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s ease;"
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
        document.getElementById('roomIdInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveSettings();
        });

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

        console.log('GUEST: Settings popup shown');
    }

    // Hide settings popup
    function hideSettingsPopup() {
        if (settingsPopup) {
            settingsPopup.remove();
            settingsPopup = null;
        }
    }

    // Clear all settings
    function clearAllSettings() {
        if (confirm('Are you sure you want to clear all settings? This will reset to default values.')) {
            clearConfig();
            hideSettingsPopup();
            showHostStatus('Settings cleared - reloading...');
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

        console.log(`GUEST: Updating configuration...`);

        // Stop current following if running
        if (isFollowingHost) {
            stopFollowingHost();
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
            console.log(`GUEST: Successfully updated configuration`);
            hideSettingsPopup();

            // Show success message
            showHostStatus(`Configuration updated - Room: ${ROOM_ID}${DISPLAY_NAME ? ' - Name: ' + DISPLAY_NAME : ''}`);
            setTimeout(() => {
                const existingStatus = document.querySelector('.host-status-message');
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
            watchTogetherButton.style.backgroundColor = '#4CAF50';
            watchTogetherButton.style.opacity = '1';
            console.log('GUEST: Watch Together ENABLED - Following host');
            startFollowingHost();
            updateRequestControlButton();
        } else {
            watchTogetherButton.style.backgroundColor = '';
            watchTogetherButton.style.opacity = '0.7';
            console.log('GUEST: Watch Together DISABLED');
            stopFollowingHost();
            updateRequestControlButton();
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

    // Check if guest video is buffering
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

    // Check if we're on the watch together redirect page
    function isOnWatchTogetherPage() {
        return window.location.pathname.includes('/watchtogether') ||
               window.location.hash.includes('#/watchtogether');
    }

    // Redirect to host's video URL
    function redirectToHostVideo(hostVideoURL) {
        if (hostVideoURL && hostVideoURL !== window.location.href) {
            console.log('GUEST: Redirecting to host video:', hostVideoURL);
            showHostStatus('Redirecting to host video...');
            setTimeout(() => {
                window.location.href = hostVideoURL;
            }, 2000);
        }
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

    // Show watch together redirect page
    function showWatchTogetherRedirectPage() {
        // Clear the page content
        document.body.innerHTML = '';

        // Create redirect page with embedded HTML content
        const redirectPage = document.createElement('div');
        redirectPage.style.cssText = `
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            color: white;
        `;

        redirectPage.innerHTML = `
            <div style="text-align: center; max-width: 600px; padding: 40px;">
                <h1 style="font-size: 3em; margin: 0 0 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                    Watch Together
                </h1>
                <p style="font-size: 1.2em; margin: 0 0 30px 0; opacity: 0.9;">
                    Loading Stremio Watch Together...
                </p>
                <div style="margin: 30px 0;">
                    <div style="
                        width: 50px;
                        height: 50px;
                        border: 4px solid rgba(255,255,255,0.3);
                        border-top: 4px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto;
                    "></div>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <div style="font-size: 1.2em; font-weight: bold; margin: 10px 0;">
                        Room ID: <strong>${ROOM_ID}</strong>
                    </div>
                    <p style="font-size: 1em; margin: 10px 0; opacity: 0.9;">
                        Make sure you have the Stremio Watch Together userscript installed!
                    </p>
                </div>
                <p style="font-size: 0.9em; margin: 10px 0; opacity: 0.7;">
                    Waiting for host to start the video...
                </p>
                <div style="margin-top: 30px;">
                    <button id="manualConnect" style="
                        background: rgba(255,255,255,0.2);
                        border: 2px solid white;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 1em;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                       onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        Manual Connect
                    </button>
                </div>
                <div id="userscriptStatus" style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
                    Checking for userscript...
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.appendChild(redirectPage);

        // Add manual connect functionality
        document.getElementById('manualConnect').addEventListener('click', () => {
            const newRoomId = prompt('Enter Room ID:', ROOM_ID);
            if (newRoomId && newRoomId !== ROOM_ID) {
                ROOM_ID = newRoomId;
                location.reload();
            }
        });

        // Check if userscript is loaded
        setTimeout(() => {
            const statusDiv = document.getElementById('userscriptStatus');
            if (typeof window.stremioWatchTogetherLoaded === 'undefined') {
                statusDiv.innerHTML = 'WARNING: Stremio Watch Together userscript not detected!<br>Please install the userscript and refresh the page.';
                statusDiv.style.color = '#ffcc00';
            } else {
                statusDiv.innerHTML = 'SUCCESS: Userscript loaded successfully!';
                statusDiv.style.color = '#4CAF50';
            }
        }, 2000);

        console.log('GUEST: Watch Together redirect page displayed');
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

    // Apply host's state to guest's video
    function applyHostState(hostState) {
        if (!watchTogetherEnabled || !videoElement || !hostState) return;

        // If we have control, don't apply host state
        if (currentControllerId === USER_ID) {
            console.log('GUEST: Ignoring controller state - we have control');
            return;
        }

        console.log('GUEST: Applying controller state:', hostState);

        const timeDiff = Math.abs(getCurrentTime() - hostState.currentTime);
        const localIsPlaying = getPlayState();

        // Sync time if difference is more than 3 seconds
        if (timeDiff > 3 && hostState.currentTime !== undefined) {
            console.log(`GUEST: Syncing time: local=${getCurrentTime()}s, host=${hostState.currentTime}s`);
            videoElement.currentTime = hostState.currentTime;
        }

        // Sync play/pause state
        if (hostState.isBuffering) {
            // Host is buffering - pause guest video
            if (localIsPlaying) {
                playPauseButton.click();
            }
            showHostStatus('Controller is buffering...');
            showHostBufferingIcon();
        } else if (hostState.isPlaying && !localIsPlaying) {
            // Host is playing - resume guest video
            playPauseButton.click();
            hideHostStatus();
            hideHostBufferingIcon();
        } else if (!hostState.isPlaying && localIsPlaying) {
            // Host is paused - pause guest video
            playPauseButton.click();
            hideHostStatus();
            hideHostBufferingIcon();
        }

        lastKnownHostState = hostState;
    }

    // Show host status message
    function showHostStatus(message) {
        hideHostStatus(); // Remove existing message

        // Find control bar dynamically
        const currentControlBar = document.querySelector('.control-bar-buttons-container-SWhkU');
        if (!currentControlBar) return;

        const statusDiv = document.createElement('div');
        statusDiv.className = 'host-status-message';
        statusDiv.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            pointer-events: none;
        `;
        statusDiv.textContent = message;

        const controlBarContainer = currentControlBar.closest('.control-bar');
        if (controlBarContainer) {
            controlBarContainer.style.position = 'relative';
            controlBarContainer.appendChild(statusDiv);
        }
    }

    // Show host buffering loading icon
    function showHostBufferingIcon() {
        hideHostBufferingIcon(); // Remove existing icon

        const loadingIcon = document.createElement('div');
        loadingIcon.className = 'host-buffering-icon';
        loadingIcon.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
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
                border: 2px solid rgba(255, 107, 53, 0.3);
                border-top: 2px solid #FF6B35;
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
        console.log('GUEST: Host buffering icon displayed');
    }

    // Hide host buffering loading icon
    function hideHostBufferingIcon() {
        const existingIcon = document.querySelector('.host-buffering-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
    }

    // Hide host status message
    function hideHostStatus() {
        const existingMessage = document.querySelector('.host-status-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    // Show notification message
    function showNotification(message, color = '#4CAF50') {
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

    // Request control from host
    async function requestControl() {
        if (!roomRef) return;

        try {
            const { update } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            await update(roomRef, {
                [`permissions/controlRequests/${USER_ID}`]: {
                    userId: USER_ID,
                    displayName: DISPLAY_NAME,
                    requestedAt: Date.now()
                }
            });

            showNotification('Control requested - waiting for host approval', '#ff9800');
            console.log('GUEST: Control requested from host');

            // Update button state
            updateRequestControlButton();
        } catch (error) {
            console.error('GUEST ERROR: Failed to request control:', error);
            showNotification('Failed to request control', '#f44336');
        }
    }

    // Listen for host state changes
    async function startHostListener() {
        try {
            const { onValue } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            onValue(roomRef, (snapshot) => {
                const data = snapshot.val();
                
                // Update permissions
                if (data && data.permissions) {
                    const previousControllerId = currentControllerId;
                    currentControllerId = data.permissions.controllerId;

                    // Notify if control changed
                    if (previousControllerId !== currentControllerId && previousControllerId !== null) {
                        if (currentControllerId === USER_ID) {
                            showNotification('You now have control!', '#4CAF50');
                        } else {
                            showNotification('Control returned to host', '#FF6B35');
                        }
                    }

                    // Update UI
                    updateRequestControlButton();
                }

                if (data && data.host && data.status === 'active') {
                    console.log('GUEST: Received room state update');

                    // Check if we need to redirect to host's video
                    if (isOnWatchTogetherPageCheck && data.videoURL && isValidStremioVideoURL(data.videoURL)) {
                        redirectToHostVideo(data.videoURL);
                        return;
                    }

                    // Apply state from whoever has the control token
                    const controllerState = getControllerState(data);
                    if (controllerState) {
                        console.log('GUEST: Applying state from controller:', data.permissions.controllerId);
                        applyHostState(controllerState);
                    } else {
                        console.log('GUEST: No controller state found');
                    }
                } else if (data && data.status === 'waiting_for_guests') {
                    console.log('GUEST: Waiting for host to start...');
                    showHostStatus('Waiting for host to start...');
                }
            });

            console.log('GUEST: Host listener started');
        } catch (error) {
            console.error('GUEST ERROR: Failed to start host listener:', error);
        }
    }

    // Send guest state to Firebase
    async function sendGuestState() {
        if (!watchTogetherEnabled || !roomRef) return;

        try {
            const { update } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            const currentTime = getCurrentTime();
            const isPlaying = getPlayState();
            const isCurrentlyBuffering = isVideoBuffering();

            // If we have control, send full state including video control
            // If not, only send status info
            const guestState = {
                userId: USER_ID,
                displayName: DISPLAY_NAME,
                isBuffering: isCurrentlyBuffering,
                lastUpdated: Date.now(),
                connected: true
            };

            // Only send video control commands if we have the control token
            if (currentControllerId === USER_ID) {
                guestState.currentTime = currentTime;
                guestState.isPlaying = isPlaying;
                console.log('GUEST: Sending control state:', {currentTime, isPlaying, isBuffering: isCurrentlyBuffering});
            } else {
                console.log('GUEST: Sending status only (no control):', {isBuffering: isCurrentlyBuffering});
            }

            await update(roomRef, {
                ['guests/' + USER_ID]: guestState
            });

            lastGuestStateSent = currentTime;

        } catch (error) {
            console.error('GUEST ERROR: Failed to send state:', error);
        }
    }

    // Send heartbeat to host
    async function sendHeartbeat() {
        if (!watchTogetherEnabled || !roomRef) return;

        try {
            const { update } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');

            await update(roomRef, {
                ['guests/' + USER_ID]: {
                    userId: USER_ID,
                    displayName: DISPLAY_NAME,
                    connected: true,
                    lastSeen: Date.now()
                }
            });
        } catch (error) {
            console.error('GUEST ERROR: Failed to send heartbeat:', error);
        }
    }

    // Start following host
    function startFollowingHost() {
        isFollowingHost = true;

        // Send state updates every 2 seconds
        const stateInterval = setInterval(() => {
            if (isFollowingHost) {
                sendGuestState();
            } else {
                clearInterval(stateInterval);
            }
        }, 2000);

        // Send heartbeat every 10 seconds
        const heartbeatInterval = setInterval(() => {
            if (isFollowingHost) {
                sendHeartbeat();
            } else {
                clearInterval(heartbeatInterval);
            }
        }, 10000);

        // Set up buffering observer
        setupBufferingObserver();

        console.log('GUEST: Started following host');
    }

    // Set up buffering observer
    function setupBufferingObserver() {
        const bufferingLayer = document.querySelector('.buffering-layer-ZZCYp');
        if (bufferingLayer) {
            bufferingObserver = new MutationObserver(() => {
                const currentlyBuffering = isVideoBuffering();
                if (currentlyBuffering !== isGuestBuffering) {
                    isGuestBuffering = currentlyBuffering;
                    if (watchTogetherEnabled) {
                        sendGuestState();
                        if (currentlyBuffering) {
                            console.log('GUEST: Buffering detected - notifying host');
                        } else {
                            console.log('GUEST: Buffering ended');
                        }
                    }
                }
            });

            bufferingObserver.observe(bufferingLayer, {
                attributes: true,
                childList: true,
                subtree: true
            });
        }
    }

    // Stop following host
    function stopFollowingHost() {
        isFollowingHost = false;
        hideHostStatus();
        hideHostBufferingIcon();

        if (bufferingObserver) {
            bufferingObserver.disconnect();
            bufferingObserver = null;
        }

        console.log('GUEST: Stopped following host');
    }

    // Cleanup function
    function cleanup() {
        if (watchTogetherButton) watchTogetherButton.remove();
        if (requestControlButton) requestControlButton.remove();
        if (settingsButton) settingsButton.remove();
        hideSettingsPopup();
        hideHostStatus();
        hideHostBufferingIcon();

        if (bufferingObserver) {
            bufferingObserver.disconnect();
            bufferingObserver = null;
        }

        // Unregister from room
        if (roomRef) {
            import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js').then(({ update }) => {
                update(roomRef, {
                    ['guests/' + USER_ID]: null
                }).catch(() => {
                    // Ignore cleanup errors
                });
            });
        }
    }

    // Get room ID from URL parameters
    function getRoomIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomFromURL = urlParams.get('room');
        if (roomFromURL) {
            console.log('GUEST: Room ID from URL:', roomFromURL);
            return roomFromURL;
        }
        return null;
    }

    // Main initialization
    async function initialize() {
        // Load saved configuration first
        loadConfig();

        // Initialize display name (generate if needed, or load saved)
        initializeDisplayName();

        // Check if room ID is provided in URL
        const roomFromURL = getRoomIdFromURL();
        if (roomFromURL) {
            ROOM_ID = roomFromURL;
            console.log('GUEST: Using room ID from URL:', ROOM_ID);
        }

        console.log(`GUEST User ID: ${USER_ID}`);
        console.log(`Room ID: ${ROOM_ID}`);

        const firebaseReady = await initializeFirebase();
        if (!firebaseReady) {
            console.log('GUEST WARNING: Firebase not configured - user needs to set up Firebase first');
            // Don't return here, let the user configure Firebase through the settings
            // The buttons will be created but Firebase won't be initialized until configured
        }

        // If on watch together redirect page, show redirect page and start listening for host
        if (isOnWatchTogetherPageCheck) {
            console.log('GUEST: On redirect page - showing redirect interface');
            showWatchTogetherRedirectPage();
            startHostListener();
            return;
        }

        // Wait for DOM elements with longer timeout
        const maxAttempts = 60; // Increased from 30 to 60
        let attempts = 0;

        console.log('GUEST: Waiting for DOM elements to load...');

        while (!findDOMElements() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;

            if (attempts % 10 === 0) {
                console.log(`GUEST: Still waiting for DOM elements... (${attempts}/${maxAttempts})`);
            }
        }

        // Wait for movie to load (timer shows actual time instead of --:--:--)
        console.log('GUEST: Waiting for movie to load...');
        let movieLoadAttempts = 0;
        const maxMovieLoadAttempts = 30; // 30 seconds to wait for movie load

        while (!isMovieLoaded() && movieLoadAttempts < maxMovieLoadAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            movieLoadAttempts++;

            if (movieLoadAttempts % 5 === 0) {
                console.log(`GUEST: Waiting for movie to load... (${movieLoadAttempts}/${maxMovieLoadAttempts})`);
            }
        }

        if (movieLoadAttempts >= maxMovieLoadAttempts) {
            console.log('GUEST WARNING: Movie load timeout - proceeding anyway');
        } else {
            console.log('GUEST: Movie loaded successfully');
        }

        if (attempts >= maxAttempts) {
            console.error('GUEST ERROR: Could not find required DOM elements after 60 seconds');
            console.error('GUEST ERROR: This might be because:');
            console.error('   1. The video is still loading');
            console.error('   2. Stremio UI has changed');
            console.error('   3. The page structure is different');

            // Try to continue anyway with partial elements
            if (videoElement || controlBar || playPauseButton) {
                console.log('GUEST WARNING: Attempting to continue with partial elements...');
            } else {
                return;
            }
        }

        createWatchTogetherButton();
        createRequestControlButton();
        createSettingsButton();
        startHostListener();

        console.log('GUEST: Watch Together Script loaded successfully!');
        console.log('Click the green chat icon to start following the host');
        console.log('Make sure you\'re using the same Room ID as the host:', ROOM_ID);
    }

    // Handle page unload
    window.addEventListener('beforeunload', cleanup);

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
        console.log('GUEST: Starting initialization...');

        // Wait for page load
        await waitForPageLoad();
        console.log('GUEST: Page loaded');

        // Wait a bit more for Stremio to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('GUEST: Waiting period complete');

        // Start the main initialization
        await initialize();
    }

    // Start initialization
    startInitialization().catch(error => {
        console.error('GUEST ERROR: Initialization failed:', error);
    });
})();
