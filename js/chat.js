/*
 * File: video.js - Fixed version with better error handling
 */

class VideoManager {
    constructor() {
        this.jitsiApi = null;
        this.currentRoom = null;
        this.isInitializing = false;
    }

    joinRoom(roomId, displayName) {
        console.log('🎥 Joining video room:', roomId);
        console.log('👤 Display name:', displayName);

        if (!roomId) {
            alert('❌ Error: No room ID provided. Please book an appointment first.');
            return;
        }

        this.currentRoom = roomId;

        // Check if Jitsi API is already loaded
        if (typeof window.JitsiMeetExternalAPI !== 'undefined') {
            console.log('✅ Jitsi API already loaded');
            this.initializeJitsi(roomId, displayName);
        } else {
            console.log('⏳ Loading Jitsi API...');
            this.loadJitsiApi(() => {
                this.initializeJitsi(roomId, displayName);
            });
        }
    }

    loadJitsiApi(callback) {
        // Check if script already exists
        const existingScript = document.querySelector('script[src="https://meet.jit.si/external_api.js"]');
        if (existingScript) {
            console.log('✅ Jitsi script already in DOM');
            if (typeof window.JitsiMeetExternalAPI !== 'undefined') {
                callback();
                return;
            }
            // Wait for it to load
            existingScript.addEventListener('load', callback);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
            console.log('✅ Jitsi API loaded successfully');
            callback();
        };
        script.onerror = () => {
            console.error('❌ Failed to load Jitsi API');
            alert('❌ Failed to load video service. Please check your internet connection and try again.');
            this.handleClose();
        };
        document.head.appendChild(script);
        
        // Timeout fallback
        setTimeout(() => {
            if (typeof window.JitsiMeetExternalAPI === 'undefined') {
                console.warn('⚠️ Jitsi API load timeout, retrying...');
                // Try loading again
                const script2 = document.createElement('script');
                script2.src = 'https://meet.jit.si/external_api.js';
                script2.async = true;
                script2.onload = callback;
                document.head.appendChild(script2);
            }
        }, 10000);
    }

    initializeJitsi(roomId, displayName) {
        console.log('🚀 Initializing Jitsi for room:', roomId);
        
        if (this.isInitializing) {
            console.log('⏳ Already initializing, skipping...');
            return;
        }
        this.isInitializing = true;

        const app = document.getElementById('app');
        if (!app) {
            console.error('❌ App element not found');
            this.isInitializing = false;
            return;
        }

        const profile = authManager?.getUserProfile() || { full_name: displayName || 'User' };
        const userName = displayName || profile.full_name || 'User';

        // Create video UI
        app.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
                <div class="container">
                    <a class="navbar-brand" href="#">🎥 Video Consultation</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link text-danger" href="#" id="endCallBtn">🔴 End Call</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" id="backToDashboardBtn">⬅️ Back</a>
                            </li>
                        </ul>
                        <span class="navbar-text me-3">👤 ${userName}</span>
                    </div>
                </div>
            </nav>
            <div class="container mt-3">
                <div class="alert alert-info">
                    <strong>Room:</strong> ${roomId}<br>
                    <strong>Participant:</strong> ${userName}
                </div>
                <div class="video-container" style="width:100%; height:600px; border-radius:12px; overflow:hidden; background:#1a1a2e;">
                    <div id="jitsi-container" style="width:100%; height:100%;"></div>
                </div>
            </div>
        `;

        // Make sure container exists
        const container = document.querySelector('#jitsi-container');
        if (!container) {
            console.error('❌ Jitsi container not found');
            this.isInitializing = false;
            alert('Failed to initialize video. Please try again.');
            return;
        }

        // Jitsi options
        const options = {
            roomName: roomId,
            width: '100%',
            height: '100%',
            parentNode: container,
            userInfo: {
                displayName: userName
            },
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                prejoinPageEnabled: true,
                enableWelcomePage: false,
                enableClosePage: false,
                disableDeepLinking: false,
                disableInviteFunctions: true,
                disableProfile: false,
                enableCalendarIntegration: false,
                enableEmailIntegration: false,
                enableGoogleIntegration: false,
                enableMicrosoftIntegration: false
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                DEFAULT_BACKGROUND: '#1a1a2e',
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
                ]
            }
        };

        try {
            console.log('📞 Creating Jitsi instance...');
            
            // Check if JitsiMeetExternalAPI is available
            if (typeof window.JitsiMeetExternalAPI === 'undefined') {
                throw new Error('Jitsi API not loaded. Please refresh and try again.');
            }

            this.jitsiApi = new window.JitsiMeetExternalAPI('meet.jit.si', options);
            console.log('✅ Jitsi instance created');

            // Log the event
            this.logVideoEvent('CALL_STARTED', `Started video call in room ${roomId}`);

            // Add event listeners
            this.jitsiApi.addEventListeners({
                readyToClose: () => {
                    console.log('📴 Ready to close');
                    this.handleClose();
                },
                participantJoined: (participant) => {
                    console.log('👤 Participant joined:', participant?.displayName || 'Unknown');
                },
                participantLeft: (participant) => {
                    console.log('👋 Participant left:', participant?.displayName || 'Unknown');
                },
                videoConferenceJoined: () => {
                    console.log('✅ Conference joined');
                    this.logVideoEvent('CONFERENCE_JOINED', 'Joined video conference');
                },
                videoConferenceLeft: () => {
                    console.log('📴 Conference left');
                    this.logVideoEvent('CONFERENCE_LEFT', 'Left video conference');
                },
                audioMutedStatusChanged: (data) => {
                    console.log('🔇 Audio:', data.muted ? 'Muted' : 'Unmuted');
                },
                videoMutedStatusChanged: (data) => {
                    console.log('📹 Video:', data.muted ? 'Muted' : 'Unmuted');
                },
                screenSharingStatusChanged: (data) => {
                    console.log('🖥️ Screen sharing:', data.on ? 'Started' : 'Stopped');
                }
            });

            this.isInitializing = false;

        } catch (error) {
            console.error('❌ Jitsi initialization error:', error);
            this.isInitializing = false;
            
            // Show error message
            const container = document.querySelector('#jitsi-container');
            if (container) {
                container.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:center;height:100%;color:white;text-align:center;padding:20px;">
                        <div>
                            <h3>⚠️ Failed to start video call</h3>
                            <p>${error.message}</p>
                            <button class="btn btn-primary" onclick="videoManager.handleClose()">Go Back</button>
                        </div>
                    </div>
                `;
            }
            
            // Fallback: try loading Jitsi again
            setTimeout(() => {
                if (typeof window.JitsiMeetExternalAPI === 'undefined') {
                    console.log('🔄 Retrying Jitsi load...');
                    this.loadJitsiApi(() => {
                        if (this.currentRoom) {
                            this.initializeJitsi(this.currentRoom, displayName);
                        }
                    });
                }
            }, 3000);
        }

        // Attach event listeners to buttons
        const endCallBtn = document.getElementById('endCallBtn');
        const backBtn = document.getElementById('backToDashboardBtn');
        
        if (endCallBtn) {
            endCallBtn.addEventListener('click', () => {
                console.log('🔴 End call clicked');
                this.endCall();
            });
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                console.log('⬅️ Back button clicked');
                this.handleClose();
            });
        }
    }

    async logVideoEvent(action, details) {
        try {
            if (authManager && authManager.logActivity) {
                await authManager.logActivity(authManager.getUserId(), action, details);
            }
        } catch (error) {
            console.error('Error logging video event:', error);
        }
    }

    endCall() {
        if (this.jitsiApi) {
            try {
                this.jitsiApi.executeCommand('hangup');
                console.log('📴 Call ended');
            } catch (error) {
                console.error('Error ending call:', error);
                this.handleClose();
            }
        } else {
            this.handleClose();
        }
    }

    handleClose() {
        console.log('🔚 Closing video call...');
        
        if (this.jitsiApi) {
            try {
                this.jitsiApi.dispose();
                console.log('✅ Jitsi disposed');
            } catch (error) {
                console.error('Error disposing Jitsi:', error);
            }
            this.jitsiApi = null;
        }
        
        this.currentRoom = null;
        this.isInitializing = false;
        
        // Return to dashboard
        if (authManager && authManager.routeBasedOnRole) {
            setTimeout(() => {
                authManager.routeBasedOnRole();
            }, 100);
        } else if (authManager && authManager.showLoginPage) {
            authManager.showLoginPage();
        } else {
            // Fallback: reload page
            window.location.reload();
        }
    }

    isInCall() {
        return this.jitsiApi !== null;
    }
}

// Initialize video manager
const videoManager = new VideoManager();
console.log('✅ VideoManager initialized');