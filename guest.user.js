// ==UserScript==
// @name         Stremio Watch Together - Guest
// @namespace    https://stremio.com
// @version      1.0
// @description  Watch Together Guest Script for Stremio Web Player
// @author       Your Name
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
        console.log('👤 GUEST: Not on player page or watch together page, skipping script');
        return;
    }
    
    if (isOnWatchTogetherPageCheck) {
        console.log('👤 GUEST: On watch together redirect page');
    }
    
    console.log('👤 GUEST: Watch Together Script Loading...');
    
    // Set flag to indicate userscript is loaded
    window.stremioWatchTogetherLoaded = true;
    
    // Firebase Configuration (moved to DEFAULT_FIREBASE_CONFIG below)

    // Configuration - CHANGE THIS TO MATCH HOST'S ROOM ID
    let ROOM_ID = 'room123'; // Default room ID - can be changed via settings
    const USER_ID = 'guest_' + Math.random().toString(36).substr(2, 6);
    
    // Default Firebase Configuration
    const DEFAULT_FIREBASE_CONFIG = {
        apiKey: "apiKey-0",
        authDomain: "authDomain-0",
        projectId: "projectId-0",
        storageBucket: "storageBucket-0",
        messagingSenderId: "messagingSenderId-0",
        appId: "appId-0",
        measurementId: "measurementId-0",
        databaseURL: "databaseURL-0"
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
                console.log('✅ GUEST: Configuration loaded from localStorage');
            }
        } catch (error) {
            console.error('❌ GUEST: Failed to load configuration:', error);
        }
    }
    
    // Save configuration to localStorage
    function saveConfig() {
        try {
            const config = {
                roomId: ROOM_ID,
                firebaseConfig: firebaseConfig,
                lastUpdated: Date.now()
            };
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
            console.log('✅ GUEST: Configuration saved to localStorage');
        } catch (error) {
            console.error('❌ GUEST: Failed to save configuration:', error);
        }
    }
    
    // Clear configuration
    function clearConfig() {
        try {
            localStorage.removeItem(CONFIG_STORAGE_KEY);
            ROOM_ID = 'room123';
            firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };
            console.log('✅ GUEST: Configuration cleared');
        } catch (error) {
            console.error('❌ GUEST: Failed to clear configuration:', error);
        }
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

    // Initialize Firebase
    async function initializeFirebase() {
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
            
            console.log('✅ GUEST: Firebase initialized for room:', ROOM_ID);
            
            // Register as guest in the room
            await update(roomRef, {
                ['guests/' + USER_ID]: {
                    userId: USER_ID,
                    connected: true,
                    lastSeen: Date.now()
                }
            });
            
            console.log('✅ GUEST: Registered in room');
            return true;
        } catch (error) {
            console.error('❌ GUEST: Firebase initialization failed:', error);
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
            console.log('✅ GUEST: All DOM elements found');
            return true;
        }
        
        console.log('❌ GUEST: Missing elements:', {
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
        
        console.log('✅ GUEST: Watch Together button created');
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
        
        console.log('✅ GUEST: Settings button created');
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
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            min-width: 300px;
            color: white;
            font-family: Arial, sans-serif;
        `;

        settingsPopup.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #4CAF50;">Watch Together Settings</h3>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #4CAF50; font-size: 16px;">Room Configuration</h4>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Room ID:</label>
                    <input type="text" id="roomIdInput" value="${ROOM_ID}" 
                           style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #333; color: white; font-size: 14px;">
                    <small style="color: #aaa; font-size: 12px;">Enter the same Room ID as the host</small>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #4CAF50; font-size: 16px;">Firebase Configuration</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">API Key:</label>
                        <input type="text" id="apiKeyInput" value="${firebaseConfig.apiKey}" 
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: #333; color: white; font-size: 12px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">Auth Domain:</label>
                        <input type="text" id="authDomainInput" value="${firebaseConfig.authDomain}" 
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: #333; color: white; font-size: 12px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">Project ID:</label>
                        <input type="text" id="projectIdInput" value="${firebaseConfig.projectId}" 
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: #333; color: white; font-size: 12px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">Storage Bucket:</label>
                        <input type="text" id="storageBucketInput" value="${firebaseConfig.storageBucket}" 
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: #333; color: white; font-size: 12px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">Messaging Sender ID:</label>
                        <input type="text" id="messagingSenderIdInput" value="${firebaseConfig.messagingSenderId}" 
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: #333; color: white; font-size: 12px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">App ID:</label>
                        <input type="text" id="appIdInput" value="${firebaseConfig.appId}" 
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: #333; color: white; font-size: 12px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">Measurement ID:</label>
                        <input type="text" id="measurementIdInput" value="${firebaseConfig.measurementId}" 
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: #333; color: white; font-size: 12px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">Database URL:</label>
                        <input type="text" id="databaseUrlInput" value="${firebaseConfig.databaseURL}" 
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: #333; color: white; font-size: 12px;">
                    </div>
                </div>
                <small style="color: #aaa; font-size: 11px;">Get these values from your Firebase project settings</small>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: space-between;">
                <div>
                    <button id="clearConfig" style="padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Clear All</button>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="cancelSettings" style="padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button id="saveSettings" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Save</button>
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

        // Focus on input
        document.getElementById('roomIdInput').focus();
        document.getElementById('roomIdInput').select();

        console.log('✅ GUEST: Settings popup shown');
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
            databaseURL: document.getElementById('databaseUrlInput').value.trim()
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
        const firebaseChanged = JSON.stringify(newFirebaseConfig) !== JSON.stringify(firebaseConfig);

        if (!roomChanged && !firebaseChanged) {
            hideSettingsPopup();
            return;
        }

        console.log(`🔄 GUEST: Updating configuration...`);

        // Stop current following if running
        if (isFollowingHost) {
            stopFollowingHost();
        }

        // Update configuration
        ROOM_ID = newRoomId;
        firebaseConfig = newFirebaseConfig;
        
        // Save to localStorage
        saveConfig();
        
        // Reinitialize Firebase with new config
        const firebaseReady = await initializeFirebase();
        if (firebaseReady) {
            console.log(`✅ GUEST: Successfully updated configuration`);
            hideSettingsPopup();
            
            // Show success message
            showHostStatus(`Configuration updated - Room: ${ROOM_ID}`);
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
        watchTogetherEnabled = !watchTogetherEnabled;
        
        if (watchTogetherEnabled) {
            watchTogetherButton.style.backgroundColor = '#4CAF50';
            watchTogetherButton.style.opacity = '1';
            console.log('👤 GUEST: Watch Together ENABLED - Following host');
            startFollowingHost();
        } else {
            watchTogetherButton.style.backgroundColor = '';
            watchTogetherButton.style.opacity = '0.7';
            console.log('⏸️ GUEST: Watch Together DISABLED');
            stopFollowingHost();
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
            console.log('🔄 GUEST: Redirecting to host video:', hostVideoURL);
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
                    🎬 Watch Together
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
                statusDiv.innerHTML = '⚠️ Stremio Watch Together userscript not detected!<br>Please install the userscript and refresh the page.';
                statusDiv.style.color = '#ffcc00';
            } else {
                statusDiv.innerHTML = '✅ Userscript loaded successfully!';
                statusDiv.style.color = '#4CAF50';
            }
        }, 2000);
        
        console.log('✅ GUEST: Watch Together redirect page displayed');
    }

    // Apply host's state to guest's video
    function applyHostState(hostState) {
        if (!watchTogetherEnabled || !videoElement || !hostState) return;
        
        console.log('🔄 GUEST: Applying host state:', hostState);
        
        const timeDiff = Math.abs(getCurrentTime() - hostState.currentTime);
        const localIsPlaying = getPlayState();
        
        // Sync time if difference is more than 3 seconds
        if (timeDiff > 3) {
            console.log(`🔄 GUEST: Syncing time: local=${getCurrentTime()}s, host=${hostState.currentTime}s`);
            videoElement.currentTime = hostState.currentTime;
        }
        
        // Sync play/pause state
        if (hostState.isBuffering) {
            // Host is buffering - pause guest video
            if (localIsPlaying) {
                playPauseButton.click();
            }
            showHostStatus('Host is buffering...');
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
        console.log('🔄 GUEST: Host buffering icon displayed');
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

    // Listen for host state changes
    async function startHostListener() {
        try {
            const { onValue } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');
            
            onValue(roomRef, (snapshot) => {
                const data = snapshot.val();
                if (data && data.host && data.status === 'active') {
                    console.log('👑 GUEST: Received host state update');
                    
                    // Check if we need to redirect to host's video
                    if (isOnWatchTogetherPageCheck && data.videoURL && isValidStremioVideoURL(data.videoURL)) {
                        redirectToHostVideo(data.videoURL);
                        return;
                    }
                    
                    applyHostState(data.host);
                } else if (data && data.status === 'waiting_for_guests') {
                    console.log('⏳ GUEST: Waiting for host to start...');
                    showHostStatus('Waiting for host to start...');
                }
            });
            
            console.log('👂 GUEST: Host listener started');
        } catch (error) {
            console.error('❌ GUEST: Failed to start host listener:', error);
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

            const guestState = {
                userId: USER_ID,
                currentTime: currentTime,
                isPlaying: isPlaying,
                isBuffering: isCurrentlyBuffering,
                lastUpdated: Date.now(),
                connected: true
            };

            await update(roomRef, {
                ['guests/' + USER_ID]: guestState
            });

            lastGuestStateSent = currentTime;
            
        } catch (error) {
            console.error('❌ GUEST: Failed to send state:', error);
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
                    connected: true,
                    lastSeen: Date.now()
                }
            });
        } catch (error) {
            console.error('❌ GUEST: Failed to send heartbeat:', error);
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
        
        console.log('🔄 GUEST: Started following host');
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
                            console.log('⏳ GUEST: Buffering detected - notifying host');
                        } else {
                            console.log('✅ GUEST: Buffering ended');
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
        
        console.log('⏹️ GUEST: Stopped following host');
    }

    // Cleanup function
    function cleanup() {
        if (watchTogetherButton) watchTogetherButton.remove();
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
            console.log('🔗 GUEST: Room ID from URL:', roomFromURL);
            return roomFromURL;
        }
        return null;
    }

    // Main initialization
    async function initialize() {
        // Load saved configuration first
        loadConfig();
        
        // Check if room ID is provided in URL
        const roomFromURL = getRoomIdFromURL();
        if (roomFromURL) {
            ROOM_ID = roomFromURL;
            console.log('🔗 GUEST: Using room ID from URL:', ROOM_ID);
        }
        
        console.log(`👤 GUEST User ID: ${USER_ID}`);
        console.log(`🏠 Room ID: ${ROOM_ID}`);
        
        const firebaseReady = await initializeFirebase();
        if (!firebaseReady) {
            console.error('❌ Cannot proceed without Firebase');
            return;
        }

        // If on watch together redirect page, show redirect page and start listening for host
        if (isOnWatchTogetherPageCheck) {
            console.log('🔄 GUEST: On redirect page - showing redirect interface');
            showWatchTogetherRedirectPage();
            startHostListener();
            return;
        }

        // Wait for DOM elements with longer timeout
        const maxAttempts = 60; // Increased from 30 to 60
        let attempts = 0;
        
        console.log('⏳ GUEST: Waiting for DOM elements to load...');
        
        while (!findDOMElements() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
            
            if (attempts % 10 === 0) {
                console.log(`⏳ GUEST: Still waiting for DOM elements... (${attempts}/${maxAttempts})`);
            }
        }

        // Wait for movie to load (timer shows actual time instead of --:--:--)
        console.log('⏳ GUEST: Waiting for movie to load...');
        let movieLoadAttempts = 0;
        const maxMovieLoadAttempts = 30; // 30 seconds to wait for movie load
        
        while (!isMovieLoaded() && movieLoadAttempts < maxMovieLoadAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            movieLoadAttempts++;
            
            if (movieLoadAttempts % 5 === 0) {
                console.log(`⏳ GUEST: Waiting for movie to load... (${movieLoadAttempts}/${maxMovieLoadAttempts})`);
            }
        }
        
        if (movieLoadAttempts >= maxMovieLoadAttempts) {
            console.log('⚠️ GUEST: Movie load timeout - proceeding anyway');
        } else {
            console.log('✅ GUEST: Movie loaded successfully');
        }
        
        if (attempts >= maxAttempts) {
            console.error('❌ GUEST: Could not find required DOM elements after 60 seconds');
            console.error('❌ GUEST: This might be because:');
            console.error('   1. The video is still loading');
            console.error('   2. Stremio UI has changed');
            console.error('   3. The page structure is different');
            
            // Try to continue anyway with partial elements
            if (videoElement || controlBar || playPauseButton) {
                console.log('⚠️ GUEST: Attempting to continue with partial elements...');
            } else {
                return;
            }
        }

        createWatchTogetherButton();
        createSettingsButton();
        startHostListener();

        console.log('🎉 GUEST: Watch Together Script loaded successfully!');
        console.log('💡 Click the green chat icon to start following the host');
        console.log('💡 Make sure you\'re using the same Room ID as the host:', ROOM_ID);
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
        console.log('🚀 GUEST: Starting initialization...');
        
        // Wait for page load
        await waitForPageLoad();
        console.log('✅ GUEST: Page loaded');
        
        // Wait a bit more for Stremio to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ GUEST: Waiting period complete');
        
        // Start the main initialization
        await initialize();
    }

    // Start initialization
    startInitialization().catch(error => {
        console.error('❌ GUEST: Initialization failed:', error);
    });
})();
