/*
 * File: video.js
 * Purpose: Handle video consultations using Jitsi Meet
 * Dependencies: Jitsi Meet External API, config.js
 * Fits in: Communication module
 */

class VideoManager {
    constructor() {
        this.jitsiApi = null;
        this.currentRoom = null;
    }

    joinRoom(roomId, displayName) {
        this.currentRoom = roomId;

        if (!window.JitsiMeetExternalAPI) {
            this.loadJitsiApi(() => {
                this.initializeJitsi(roomId, displayName);
            });
        } else {
            this.initializeJitsi(roomId, displayName);
        }
    }

    loadJitsiApi(callback) {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = callback;
        script.onerror = () => {
            alert('Failed to load Jitsi Meet. Please check your internet connection.');
        };
        document.head.appendChild(script);
    }

    initializeJitsi(roomId, displayName) {
        const app = document.getElementById('app');
        const profile = authManager.getUserProfile();

        app.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light">
                <div class="container">
                    <a class="navbar-brand" href="#">Telehealth Video Consultation</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="#" id="endCallBtn">End Call</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" id="backToDashboardBtn">Back to Dashboard</a>
                            </li>
                        </ul>
                        <span class="navbar-text me-3">${profile.full_name}</span>
                    </div>
                </div>
            </nav>
            <div class="container mt-4">
                <div class="alert alert-info">
                    <strong>Room:</strong> ${roomId}<br>
                    <strong>Participant:</strong> ${displayName}<br>
                    <small>Share this room name with your consultation partner.</small>
                </div>
                <div class="video-container">
                    <div id="jitsi-container"></div>
                </div>
            </div>
        `;

        const options = {
            roomName: roomId,
            width: '100%',
            height: '100%',
            parentNode: document.querySelector('#jitsi-container'),
            userInfo: {
                displayName: displayName
            },
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                prejoinPageEnabled: true,
                enableWelcomePage: false,
                enableClosePage: false
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                DEFAULT_BACKGROUND: '#F4F8FB',
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
                ],
                SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar']
            }
        };

        try {
            this.jitsiApi = new JitsiMeetExternalAPI('meet.jit.si', options);

            this.logVideoEvent('CALL_STARTED', `Started video call in room ${roomId}`);

            this.jitsiApi.addEventListeners({
                readyToClose: this.handleClose.bind(this),
                participantLeft: async (participant) => {
                    console.log('Participant left:', participant);
                },
                participantJoined: async (participant) => {
                    console.log('Participant joined:', participant);
                    await this.logVideoEvent('PARTICIPANT_JOINED', `Participant ${participant.displayName} joined`);
                },
                videoConferenceJoined: async (participant) => {
                    console.log('Video conference joined:', participant);
                    await this.logVideoEvent('CONFERENCE_JOINED', 'Joined video conference');
                },
                videoConferenceLeft: async () => {
                    console.log('Video conference left');
                    await this.logVideoEvent('CONFERENCE_LEFT', 'Left video conference');
                    this.handleClose();
                },
                videoMutedStatusChanged: (data) => {
                    console.log('Video muted status changed:', data);
                },
                audioMutedStatusChanged: (data) => {
                    console.log('Audio muted status changed:', data);
                }
            });

        } catch (error) {
            console.error('Error initializing Jitsi:', error);
            alert('Failed to initialize video call. Please check your internet connection and try again.');
            this.handleClose();
        }

        document.getElementById('endCallBtn').addEventListener('click', () => this.endCall());
        document.getElementById('backToDashboardBtn').addEventListener('click', () => this.handleClose());
    }

    async logVideoEvent(action, details) {
        try {
            await authManager.logActivity(authManager.getUserId(), action, details);
        } catch (error) {
            console.error('Error logging video event:', error);
        }
    }

    endCall() {
        if (this.jitsiApi) {
            this.jitsiApi.executeCommand('hangup');
        }
    }

    handleClose() {
        if (this.jitsiApi) {
            this.jitsiApi.dispose();
            this.jitsiApi = null;
        }
        this.currentRoom = null;
        authManager.routeBasedOnRole();
    }

    isInCall() {
        return this.jitsiApi !== null;
    }
}

// Initialize video manager
const videoManager = new VideoManager();