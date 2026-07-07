/*
 * File: video.js - Updated with mobile support
 */

class VideoManager {
    constructor() {
        this.jitsiApi = null;
        this.currentRoom = null;
        this.isInitializing = false;
        this.retryCount = 0;
    }

    joinRoom(roomId, displayName) {
        console.log('🎥 Joining video room:', roomId);
        console.log('👤 Display name:', displayName);
        console.log('📱 Device:', navigator.userAgent);

        if (!roomId) {
            alert('❌ Error: No room ID provided. Please contact your doctor.');
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
        const existingScript = document.querySelector('script[src*="external_api.js"]');
        if (existingScript) {
            console.log('✅ Jitsi script already in DOM');
            if (typeof window.JitsiMeetExternalAPI !== 'undefined') {
                callback();
                return;
            }
            existingScript.addEventListener('load', callback);
            return;
        }

        // Use CDN that works on both desktop and mobile
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
            console.log('✅ Jitsi API loaded successfully');
            callback();
        };
        script.onerror = () => {
            console.error('❌ Failed to load Jitsi API');
            // Try alternative CDN
            this.loadAlternativeJitsiApi(callback);
        };
        document.head.appendChild(script);
    }

    loadAlternativeJitsiApi(callback) {
        console.log('🔄 Loading alternative Jitsi CDN...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jitsi-meet@2.0.0/dist/jitsi-meet.min.js';
        script.async = true;
        script.onload = () => {
            console.log('✅ Jitsi API loaded from CDN');
            callback();
        };
        script.onerror = () => {
            console.error('❌ All Jitsi CDNs failed');
            alert('Failed to load video service. Please check your internet connection.');
            this.handleClose();
        };
        document.head.appendChild(script);
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

        // Mobile-friendly video UI
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const videoHeight = isMobile ? '80vh' : '600px';

        app.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm" style="padding:10px 15px;">
                <div class="container-fluid">
                    <a class="navbar-brand" href="#" style="font-size:1rem;">🎥 Video Call</a>
                    <div class="d-flex gap-2">
                        <button class="btn btn-danger btn-sm" id="endCallBtn">🔴 End</button>
                        <button class="btn btn-secondary btn-sm" id="backToDashboardBtn">✕</button>
                    </div>
                </div>
            </nav>
            <div class="container-fluid mt-2">
                <div class="alert alert-info small" style="padding:8px 12px;">
                    <strong>Room:</strong> ${roomId}<br>
                    <strong>You:</strong> ${userName}
                </div>
                <div class="video-container" style="width:100%; height:${videoHeight}; border-radius:12px; overflow:hidden; background:#1a1a2e;">
                    <div id="jitsi-container" style="width:100%; height:100%;"></div>
                </div>
            </div>
        `;

        const container = document.querySelector('#jitsi-container');
        if (!container) {
            console.error('❌ Jitsi container not found');
            this.isInitializing = false;
            alert('Failed to initialize video. Please try again.');
            return;
        }

        // Jitsi options - mobile friendly
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
                enableMicrosoftIntegration: false,
                // Mobile specific settings
                disableLocalVideoFlip: true,
                disableRtx: true,
                disableH264: true,
                channelLastN: 20
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
            
            if (typeof window.JitsiMeetExternalAPI === 'undefined') {
                throw new Error('Jitsi API not loaded. Please refresh and try again.');
            }

            this.jitsiApi = new window.JitsiMeetExternalAPI('meet.jit.si', options);
            console.log('✅ Jitsi instance created');

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
            
            const containerEl = document.querySelector('#jitsi-container');
            if (containerEl) {
                containerEl.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:center;height:100%;color:white;text-align:center;padding:20px;">
                        <div>
                            <h4>⚠️ Failed to start video</h4>
                            <p>${error.message}</p>
                            <button class="btn btn-primary" onclick="videoManager.handleClose()">Go Back</button>
                        </div>
                    </div>
                `;
            }
        }

        document.getElementById('endCallBtn').addEventListener('click', () => {
            console.log('🔴 End call clicked');
            this.endCall();
        });
        
        document.getElementById('backToDashboardBtn').addEventListener('click', () => {
            console.log('⬅️ Back button clicked');
            this.handleClose();
        });
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
        
        if (authManager && authManager.routeBasedOnRole) {
            setTimeout(() => {
                authManager.routeBasedOnRole();
            }, 100);
        } else {
            window.location.reload();
        }
    }

    isInCall() {
        return this.jitsiApi !== null;
    }
}

// Initialize video manager
const videoManager = new VideoManager();
window.videoManager = videoManager;
console.log('✅ VideoManager initialized');