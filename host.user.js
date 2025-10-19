// ==UserScript==
// @name         Stremio Watch Together - Host
// @namespace    https://stremio.com
// @version      1.0
// @description  Watch Together Host Script for Stremio Web Player
// @author       Your Name
// @match        https://web.stremio.com/*
// @match        https://web.stremio.com/
// @match        https://web.stremio.com/#*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    
    // Check if we're on the player page
    if (!window.location.hash.includes('#/player/')) {
        console.log('👑 HOST: Not on player page, skipping script');
        return;
    }
    
    console.log('👑 HOST: Watch Together Script Loading...');
    
    // Set flag to indicate userscript is loaded
    window.stremioWatchTogetherLoaded = true;
    
    // Firebase Configuration (moved to DEFAULT_FIREBASE_CONFIG below)

    // Configuration - CHANGE THIS
    let ROOM_ID = 'room123'; // Default room ID - can be changed via settings
    const USER_ID = 'host_' + Math.random().toString(36).substr(2, 6);
    
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
                console.log('✅ HOST: Configuration loaded from localStorage');
            }
        } catch (error) {
            console.error('❌ HOST: Failed to load configuration:', error);
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
            console.log('✅ HOST: Configuration saved to localStorage');
        } catch (error) {
            console.error('❌ HOST: Failed to save configuration:', error);
        }
    }
    
    // Clear configuration
    function clearConfig() {
        try {
            localStorage.removeItem(CONFIG_STORAGE_KEY);
            ROOM_ID = 'room123';
            firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };
            console.log('✅ HOST: Configuration cleared');
        } catch (error) {
            console.error('❌ HOST: Failed to clear configuration:', error);
        }
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

    // Initialize Firebase
    async function initializeFirebase() {
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
            
            console.log('✅ HOST: Firebase initialized for room:', ROOM_ID);
            
            // Get current video URL
            const videoURL = getCurrentVideoURL();
            
            // Initialize room data
            await set(roomRef, {
                roomId: ROOM_ID,
                videoURL: videoURL,
                host: {
                    userId: USER_ID,
                    currentTime: 0,
                    isPlaying: false,
                    isBuffering: false,
                    lastUpdated: Date.now()
                },
                guests: {},
                status: 'waiting_for_guests'
            });
            
            console.log('✅ HOST: Room initialized');
            return true;
        } catch (error) {
            console.error('❌ HOST: Firebase initialization failed:', error);
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
            console.log('✅ HOST: All DOM elements found');
            return true;
        }
        
        console.log('❌ HOST: Missing elements:', {
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
        
        console.log('✅ HOST: Watch Together button created');
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
        
        console.log('✅ HOST: Settings button created');
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
            border: 2px solid #FF6B35;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            min-width: 300px;
            color: white;
            font-family: Arial, sans-serif;
        `;

        settingsPopup.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #FF6B35;">Watch Together Settings</h3>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #FF6B35; font-size: 16px;">Room Configuration</h4>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Room ID:</label>
                    <input type="text" id="roomIdInput" value="${ROOM_ID}" 
                           style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #333; color: white; font-size: 14px;">
                    <small style="color: #aaa; font-size: 12px;">Share this Room ID with your guests</small>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Shareable Link:</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="text" id="shareableLink" value="https://web.stremio.com/watchtogether?room=${ROOM_ID}" 
                               readonly style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #222; color: #4CAF50; font-size: 12px; font-family: monospace;">
                        <button id="copyLink" style="padding: 8px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Copy</button>
                    </div>
                    <small style="color: #aaa; font-size: 11px;">Guests can use this link to automatically join your room</small>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #FF6B35; font-size: 16px;">Firebase Configuration</h4>
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
                    <button id="saveSettings" style="padding: 8px 16px; background: #FF6B35; color: white; border: none; border-radius: 4px; cursor: pointer;">Save</button>
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

        // Focus on input
        document.getElementById('roomIdInput').focus();
        document.getElementById('roomIdInput').select();

        console.log('✅ HOST: Settings popup shown');
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
            console.log('✅ HOST: Shareable link copied to clipboard');
        } catch (error) {
            console.error('❌ HOST: Failed to copy link:', error);
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

        console.log(`🔄 HOST: Updating configuration...`);

        // Stop current sync if running
        if (watchTogetherEnabled) {
            stopSync();
        }

        // Update configuration
        ROOM_ID = newRoomId;
        firebaseConfig = newFirebaseConfig;
        
        // Save to localStorage
        saveConfig();
        
        // Reinitialize Firebase with new config
        const firebaseReady = await initializeFirebase();
        if (firebaseReady) {
            console.log(`✅ HOST: Successfully updated configuration`);
            hideSettingsPopup();
            
            // Show success message
            showGuestStatus(`Configuration updated - Room: ${ROOM_ID}`);
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
        watchTogetherEnabled = !watchTogetherEnabled;
        
        if (watchTogetherEnabled) {
            watchTogetherButton.style.backgroundColor = '#FF6B35';
            watchTogetherButton.style.opacity = '1';
            console.log('👑 HOST: Watch Together ENABLED - You are controlling playback');
            startSync();
        } else {
            watchTogetherButton.style.backgroundColor = '';
            watchTogetherButton.style.opacity = '0.7';
            console.log('⏸️ HOST: Watch Together DISABLED');
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
        console.log('🔗 HOST: Current URL:', currentURL);
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

    // Send host state to Firebase
    async function sendHostState() {
        if (!watchTogetherEnabled || !roomRef) return;

        try {
            const { set, update } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');
            
            const currentTime = getCurrentTime();
            const isPlaying = getPlayState();
            const isCurrentlyBuffering = isVideoBuffering();

            const hostState = {
                userId: USER_ID,
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
            console.error('❌ HOST: Failed to send state:', error);
        }
    }

    // Listen for guest status updates
    async function startGuestListener() {
        try {
            const { onValue } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js');
            
            onValue(roomRef, (snapshot) => {
                const data = snapshot.val();
                if (data && data.guests) {
                    const guestCount = Object.keys(data.guests).length;
                    console.log(`👥 HOST: ${guestCount} guest(s) connected`);
                    
                    // Update guest states
                    guestStates = data.guests;
                    
                    // Check for guest buffering
                    checkGuestBuffering();
                    
                    // Show guest status in UI
                    showGuestStatus(guestCount);
                }
            });
            
            console.log('👂 HOST: Guest listener started');
        } catch (error) {
            console.error('❌ HOST: Failed to start guest listener:', error);
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
            console.log('⏳ HOST: Guest(s) buffering - pausing video');
            if (getPlayState() && playPauseButton) {
                playPauseButton.click();
            }
            showGuestBufferingStatus(bufferingGuests.length);
            showGuestBufferingIcon(bufferingGuests.length);
        } else if (!isAnyGuestBuffering && wasAnyBuffering) {
            // No guests are buffering anymore
            console.log('✅ HOST: All guests finished buffering - hiding icon');
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
        console.log('🔄 HOST: Guest buffering icon displayed');
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
        console.log('🔄 HOST: Sync started');
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
        
        console.log('⏹️ HOST: Sync stopped');
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

        console.log('👁️ HOST: Observers set up');
    }

    // Cleanup function
    function cleanup() {
        if (syncInterval) clearInterval(syncInterval);
        if (playPauseObserver) playPauseObserver.disconnect();
        if (bufferingObserver) bufferingObserver.disconnect();
        if (watchTogetherButton) watchTogetherButton.remove();
        if (settingsButton) settingsButton.remove();
        hideSettingsPopup();
        
        const existingStatus = document.querySelector('.guest-status-display');
        if (existingStatus) existingStatus.remove();
        
        hideGuestBufferingStatus();
        hideGuestBufferingIcon();
    }

    // Main initialization
    async function initialize() {
        // Load saved configuration first
        loadConfig();
        
        console.log(`👑 HOST User ID: ${USER_ID}`);
        console.log(`🏠 Room ID: ${ROOM_ID}`);
        console.log('💡 Share this Room ID with your guest: ' + ROOM_ID);
        
        const firebaseReady = await initializeFirebase();
        if (!firebaseReady) {
            console.error('❌ Cannot proceed without Firebase');
            return;
        }

        // Wait for DOM elements with longer timeout
        const maxAttempts = 60; // Increased from 30 to 60
        let attempts = 0;
        
        console.log('⏳ HOST: Waiting for DOM elements to load...');
        
        while (!findDOMElements() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
            
            if (attempts % 10 === 0) {
                console.log(`⏳ HOST: Still waiting for DOM elements... (${attempts}/${maxAttempts})`);
            }
        }

        // Wait for movie to load (timer shows actual time instead of --:--:--)
        console.log('⏳ HOST: Waiting for movie to load...');
        let movieLoadAttempts = 0;
        const maxMovieLoadAttempts = 30; // 30 seconds to wait for movie load
        
        while (!isMovieLoaded() && movieLoadAttempts < maxMovieLoadAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            movieLoadAttempts++;
            
            if (movieLoadAttempts % 5 === 0) {
                console.log(`⏳ HOST: Waiting for movie to load... (${movieLoadAttempts}/${maxMovieLoadAttempts})`);
            }
        }
        
        if (movieLoadAttempts >= maxMovieLoadAttempts) {
            console.log('⚠️ HOST: Movie load timeout - proceeding anyway');
        } else {
            console.log('✅ HOST: Movie loaded successfully');
        }
        
        if (attempts >= maxAttempts) {
            console.error('❌ HOST: Could not find required DOM elements after 60 seconds');
            console.error('❌ HOST: This might be because:');
            console.error('   1. The video is still loading');
            console.error('   2. Stremio UI has changed');
            console.error('   3. The page structure is different');
            
            // Try to continue anyway with partial elements
            if (videoElement || controlBar || playPauseButton) {
                console.log('⚠️ HOST: Attempting to continue with partial elements...');
            } else {
                return;
            }
        }

        createWatchTogetherButton();
        createSettingsButton();
        setupObservers();
        startGuestListener();

        console.log('🎉 HOST: Watch Together Script loaded successfully!');
        console.log('💡 Click the orange chat icon to start controlling playback');
        console.log('💡 Share Room ID with guest:', ROOM_ID);
        console.log('🧪 Test functions available:');
        console.log('   - testGuestBufferingIcon() - Test the guest buffering icon display');
    }

    // Handle page unload
    window.addEventListener('beforeunload', cleanup);

    // Test function for guest buffering icon
    window.testGuestBufferingIcon = function() {
        console.log('🧪 HOST: Testing guest buffering icon...');
        showGuestBufferingIcon(1);
        setTimeout(() => {
            console.log('🧪 HOST: Hiding guest buffering icon after 5 seconds...');
            hideGuestBufferingIcon();
        }, 5000);
    };

    // Test function to simulate guest buffering state
    window.testGuestBufferingState = function() {
        console.log('🧪 HOST: Simulating guest buffering state...');
        
        // Find the first guest and simulate them buffering
        const guestIds = Object.keys(guestStates);
        if (guestIds.length > 0) {
            const firstGuestId = guestIds[0];
            console.log('🧪 HOST: Simulating buffering for guest:', firstGuestId);
            
            // Simulate the guest buffering
            guestStates[firstGuestId] = {
                ...guestStates[firstGuestId],
                isBuffering: true
            };
            
            // Trigger the check
            checkGuestBuffering();
            
            // Reset after 5 seconds
            setTimeout(() => {
                console.log('🧪 HOST: Resetting guest buffering state...');
                guestStates[firstGuestId] = {
                    ...guestStates[firstGuestId],
                    isBuffering: false
                };
                checkGuestBuffering();
            }, 5000);
        } else {
            console.log('❌ HOST: No guests found to simulate buffering');
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
        console.log('🚀 HOST: Starting initialization...');
        
        // Wait for page load
        await waitForPageLoad();
        console.log('✅ HOST: Page loaded');
        
        // Wait a bit more for Stremio to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ HOST: Waiting period complete');
        
        // Start the main initialization
        await initialize();
    }

    // Start initialization
    startInitialization().catch(error => {
        console.error('❌ HOST: Initialization failed:', error);
    });
})();
