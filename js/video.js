/*
 * File: video.js - Complete with doctor end call detection and payment marking
 * Purpose: Handle video consultations with Jitsi Meet
 */

class VideoManager {
    constructor() {
        this.jitsiApi = null;
        this.currentRoom = null;
        this.currentAppointmentId = null;
        this.isInitializing = false;
        this.retryCount = 0;
        this.isDoctor = false;
        this.isPatient = false;
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
        
        // Check if user is doctor or patient
        const profile = authManager?.getUserProfile();
        this.isDoctor = profile?.role === 'doctor';
        this.isPatient = profile?.role === 'patient';
        
        console.log('👤 User role:', profile?.role);
        console.log('🩺 Is doctor:', this.isDoctor);
        console.log('👤 Is patient:', this.isPatient);

        // Find appointment by room ID
        this.findAppointmentByRoom(roomId);

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

    async findAppointmentByRoom(roomId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('id, consultation_type, status, patient_id, doctor_id')
                .eq('jitsi_room_id', roomId)
                .single();

            if (error) {
                console.error('❌ Error finding appointment:', error);
                return;
            }

            if (data) {
                this.currentAppointmentId = data.id;
                console.log('✅ Found appointment:', data);
                console.log('📋 Consultation type:', data.consultation_type);
                console.log('📊 Status:', data.status);
            }
        } catch (error) {
            console.error('❌ Error finding appointment:', error);
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
                    ${this.isDoctor ? '<br><span class="badge bg-primary">👨‍⚕️ Doctor</span>' : '<br><span class="badge bg-success">👤 Patient</span>'}
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

        // Check if Jitsi API is available
        if (typeof window.JitsiMeetExternalAPI === 'undefined') {
            console.error('❌ JitsiMeetExternalAPI not available');
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:white;text-align:center;padding:20px;">
                    <div>
                        <h4>⚠️ Loading Video Service...</h4>
                        <p>Please wait while we load the video service.</p>
                        <div class="spinner-border text-light" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <br><br>
                        <button class="btn btn-primary" onclick="videoManager.loadJitsiApi(() => videoManager.initializeJitsi('${roomId}', '${displayName}'))">
                            Retry
                        </button>
                    </div>
                </div>
            `;
            this.isInitializing = false;
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
                enableMicrosoftIntegration: false,
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
            this.jitsiApi = new window.JitsiMeetExternalAPI('meet.jit.si', options);
            console.log('✅ Jitsi instance created');

            this.logVideoEvent('CALL_STARTED', `Started video call in room ${roomId}`);

            // =============================================
            // EVENT LISTENERS - CRITICAL FOR END CALL DETECTION
            // =============================================
            this.jitsiApi.addEventListeners({
                // When the conference is ready
                videoConferenceJoined: () => {
                    console.log('✅ Conference joined');
                    this.logVideoEvent('CONFERENCE_JOINED', 'Joined video conference');
                },

                // When a participant joins
                participantJoined: (participant) => {
                    console.log('👤 Participant joined:', participant?.displayName || 'Unknown');
                    this.logVideoEvent('PARTICIPANT_JOINED', `Participant ${participant?.displayName} joined`);
                },

                // ⭐ CRITICAL: When a participant leaves (doctor ends call)
                participantLeft: async (participant) => {
                    const name = participant?.displayName || 'Unknown';
                    console.log('👋 Participant left:', name);
                    
                    // Check if the participant who left was the doctor
                    // If the current user is the patient, and the doctor left, mark as completed
                    if (this.isPatient && this.currentAppointmentId) {
                        console.log('🔄 Patient detected doctor left. Marking appointment as completed...');
                        await this.markAppointmentCompleted(this.currentAppointmentId, 'doctor_ended');
                    }
                    
                    // If the current user is the doctor and they left, mark as completed
                    if (this.isDoctor && this.currentAppointmentId) {
                        console.log('🔄 Doctor ended the call. Marking appointment as completed...');
                        await this.markAppointmentCompleted(this.currentAppointmentId, 'doctor_ended');
                    }
                    
                    await this.logVideoEvent('PARTICIPANT_LEFT', `Participant ${name} left`);
                },

                // ⭐ CRITICAL: When the conference ends (call fully ends)
                videoConferenceLeft: async () => {
                    console.log('📴 Conference left');
                    
                    // If this is a doctor, mark as completed
                    if (this.isDoctor && this.currentAppointmentId) {
                        console.log('🔄 Doctor ended call, marking as completed...');
                        await this.markAppointmentCompleted(this.currentAppointmentId, 'doctor_ended');
                    }
                    
                    // If this is a patient and doctor ended the call
                    if (this.isPatient && this.currentAppointmentId) {
                        console.log('🔄 Patient left after doctor ended, checking if needs payment...');
                        // Check if appointment was already marked completed
                        const { data } = await supabase
                            .from('appointments')
                            .select('status')
                            .eq('id', this.currentAppointmentId)
                            .single();
                            
                        if (data && data.status !== 'completed') {
                            await this.markAppointmentCompleted(this.currentAppointmentId, 'doctor_ended');
                        }
                    }
                    
                    await this.logVideoEvent('CONFERENCE_LEFT', 'Left video conference');
                    this.handleClose();
                },

                // When audio is muted/unmuted
                audioMutedStatusChanged: (data) => {
                    console.log('🔇 Audio:', data.muted ? 'Muted' : 'Unmuted');
                },

                // When video is muted/unmuted
                videoMutedStatusChanged: (data) => {
                    console.log('📹 Video:', data.muted ? 'Muted' : 'Unmuted');
                },

                // When screen sharing starts/stops
                screenSharingStatusChanged: (data) => {
                    console.log('🖥️ Screen sharing:', data.on ? 'Started' : 'Stopped');
                },

                // When the call is ready to close
                readyToClose: () => {
                    console.log('📴 Ready to close');
                    this.handleClose();
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

        // Button listeners
        document.getElementById('endCallBtn').addEventListener('click', () => {
            console.log('🔴 End call clicked');
            
            // If doctor ends call, mark as completed
            if (this.isDoctor && this.currentAppointmentId) {
                console.log('🔄 Doctor clicked end call, marking as completed...');
                this.markAppointmentCompleted(this.currentAppointmentId, 'doctor_ended');
            }
            
            this.endCall();
        });
        
        document.getElementById('backToDashboardBtn').addEventListener('click', () => {
            console.log('⬅️ Back button clicked');
            this.handleClose();
        });
    }

    // =============================================
    // MARK APPOINTMENT COMPLETED AND TRIGGER PAYMENT
    // =============================================
    async markAppointmentCompleted(appointmentId, source = 'unknown') {
        console.log(`📋 Marking appointment ${appointmentId} as completed (source: ${source})`);
        
        try {
            // First, get the appointment details
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('id', appointmentId)
                .single();

            if (error) {
                console.error('❌ Error fetching appointment:', error);
                return false;
            }

            if (!data) {
                console.error('❌ Appointment not found:', appointmentId);
                return false;
            }

            // Only update if not already completed
            if (data.status === 'completed') {
                console.log('ℹ️ Appointment already completed');
                return true;
            }

            // Update appointment to completed
            const { error: updateError } = await supabase
                .from('appointments')
                .update({ 
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', appointmentId);

            if (updateError) {
                console.error('❌ Error updating appointment:', updateError);
                return false;
            }

            console.log('✅ Appointment marked as completed:', appointmentId);
            
            // For video calls, payment is now due (KES 300)
            if (data.consultation_type === 'video') {
                console.log('💰 Video call completed. Payment is now due: KES 300');
                
                // Show notification to patient
                if (this.isPatient) {
                    setTimeout(() => {
                        alert('✅ Video consultation completed!\n\n💳 Please pay KES 300 for this consultation.\n\nYou can pay from the Appointments page.');
                    }, 2000);
                }
                
                // Show notification to doctor
                if (this.isDoctor) {
                    setTimeout(() => {
                        alert('✅ Consultation completed!\n\n💰 Patient will be charged KES 300 for this video consultation.');
                    }, 2000);
                }
                
                // Refresh the dashboard to show pending payment
                setTimeout(() => {
                    if (authManager && authManager.routeBasedOnRole) {
                        authManager.routeBasedOnRole();
                    }
                }, 3000);
            }

            // Log the event
            await this.logVideoEvent('APPOINTMENT_COMPLETED', 
                `Appointment ${appointmentId} completed. Type: ${data.consultation_type}. Payment: ${data.consultation_type === 'video' ? 'KES 300 due' : 'N/A'}`);

            return true;

        } catch (error) {
            console.error('❌ Error marking appointment completed:', error);
            return false;
        }
    }

    // =============================================
    // LOG VIDEO EVENT
    // =============================================
    async logVideoEvent(action, details) {
        try {
            if (authManager && authManager.logActivity) {
                await authManager.logActivity(authManager.getUserId(), action, details);
            }
        } catch (error) {
            console.error('Error logging video event:', error);
        }
    }

    // =============================================
    // END CALL
    // =============================================
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

    // =============================================
    // HANDLE CLOSE
    // =============================================
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
        this.currentAppointmentId = null;
        this.isInitializing = false;
        
        if (authManager && authManager.routeBasedOnRole) {
            setTimeout(() => {
                authManager.routeBasedOnRole();
            }, 100);
        } else {
            window.location.reload();
        }
    }

    // =============================================
    // IS IN CALL
    // =============================================
    isInCall() {
        return this.jitsiApi !== null;
    }
}

// Initialize video manager and attach to window
const videoManager = new VideoManager();
window.videoManager = videoManager;
console.log('✅ VideoManager initialized and attached to window');
console.log('📹 window.videoManager:', window.videoManager);