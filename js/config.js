/*
 * File: config.js
 * Purpose: Configuration file for Supabase and app settings
 * Dependencies: supabase.min.js (loaded before this file)
 * Fits in: Frontend configuration layer
 *
 * IMPORTANT: Replace these placeholder values with your actual Supabase project credentials
 * Get these from: https://supabase.com/dashboard > Project Settings > API
 */

const SUPABASE_CONFIG = {
    url: 'https://bkzmfubfhtqhujdcmkey.supabase.co', // e.g., 'https://your-project.supabase.co'
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrem1mdWJmaHRxaHVqZGNta2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzgyNDMsImV4cCI6MjA5NzQ1NDI0M30.71dLmAF3jUhnSGijrT1gmPsUQUNXK_eqmzQV9ocfkzk'  // e.g., 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};

window.SUPABASE_CONFIG = SUPABASE_CONFIG;

const supabaseLib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
if (supabaseLib && supabaseLib.createClient) {
    var supabase = supabaseLib.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
} else {
    console.error('Supabase library not loaded. Ensure js/supabase.min.js is included before config.js.');
}

// Jitsi Meet configuration
const JITSI_CONFIG = {
    domain: 'meet.jit.si', // Use the free Jitsi Meet server
    options: {
        roomName: '', // Will be set dynamically per appointment
        width: '100%',
        height: '100%',
        parentNode: document.querySelector('#jitsi-container'),
        userInfo: {
            displayName: '', // Will be set dynamically
        },
        configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false
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
            ]
        }
    }
};

// App configuration
const APP_CONFIG = {
    appName: 'Telehealth Communication System',
    version: '1.0.0',
    defaultAvatar: 'https://via.placeholder.com/150',
    itemsPerPage: 10
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, JITSI_CONFIG, APP_CONFIG, supabase };
}
