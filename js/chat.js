/*
 * File: chat.js - Complete real-time chat with no duplication
 * Purpose: Handle real-time chat between patients and doctors
 */

class ChatManager {
    constructor() {
        this.currentAppointmentId = null;
        this.currentChatPartnerId = null;
        this.currentChatPartnerName = null;
        this.subscription = null;
        this.messages = [];
        this.isOpen = false;
        this.messageIds = new Set(); // Track message IDs to prevent duplicates
    }

    // =============================================
    // MAIN CHAT INTERFACE
    // =============================================
    showChatInterface(appointmentId = null, partnerId = null) {
        console.log('💬 Opening chat interface...', { appointmentId, partnerId });
        
        this.currentAppointmentId = appointmentId;
        this.currentChatPartnerId = partnerId;
        this.isOpen = true;
        this.messageIds = new Set(); // Reset message IDs

        const app = document.getElementById('app');
        const profile = authManager.getUserProfile();
        
        if (!profile) {
            authManager.showLoginPage();
            return;
        }

        const isDoctor = profile.role === 'doctor';
        const isPatient = profile.role === 'patient';

        app.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
                <div class="container">
                    <a class="navbar-brand" href="#">💬 Telehealth Chat</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="#" id="backToDashboard">⬅️ Back</a>
                            </li>
                        </ul>
                        <span class="navbar-text me-3">👤 ${profile.full_name} (${profile.role})</span>
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Logout</button>
                    </div>
                </div>
            </nav>
            
            <div class="container mt-4">
                <div class="row">
                    <!-- Conversations List - Left Side -->
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">💬 Conversations</h5>
                            </div>
                            <div class="card-body p-0">
                                <div id="conversationList" style="max-height: 550px; overflow-y: auto;">
                                    <div class="text-center p-4 text-muted">
                                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <p class="mt-2">Loading conversations...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Chat Area - Right Side -->
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                                <h5 class="mb-0" id="chatTitle">💬 Select a conversation</h5>
                                <span id="onlineStatus" class="badge bg-secondary">Offline</span>
                            </div>
                            <div class="card-body p-0">
                                <!-- Messages -->
                                <div id="chatContainer" class="p-3" style="height: 400px; overflow-y: auto; background: #f8f9fa;">
                                    <div class="text-center text-muted py-5">
                                        <p>👈 Select a conversation to start chatting</p>
                                    </div>
                                </div>
                                
                                <!-- Message Input -->
                                <div id="messageInputArea" class="p-3 border-top" style="display: none; background: white;">
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="messageInput" 
                                               placeholder="Type your message..." 
                                               aria-label="Message">
                                        <button class="btn btn-primary" id="sendMessageBtn">
                                            <span id="sendBtnText">📤 Send</span>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <small class="text-muted">Press Enter to send</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Attach event listeners
        document.getElementById('backToDashboard').addEventListener('click', (e) => {
            e.preventDefault();
            this.cleanup();
            authManager.routeBasedOnRole();
        });

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            this.cleanup();
            const result = await authManager.logout();
            if (result.success) {
                alert(result.message);
            }
        });

        document.getElementById('sendMessageBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Load conversations
        this.loadConversations();
    }

    // =============================================
    // LOAD CONVERSATIONS
    // =============================================
    async loadConversations() {
        const userId = authManager.getUserId();
        const role = authManager.getUserRole();
        const conversationList = document.getElementById('conversationList');

        if (!userId) {
            conversationList.innerHTML = '<p class="p-3 text-muted">Please login to see conversations</p>';
            return;
        }

        try {
            let query;
            if (role === 'patient') {
                query = supabase
                    .from('appointments')
                    .select(`
                        id,
                        status,
                        scheduled_at,
                        consultation_type,
                        doctor:profiles!appointments_doctor_id_fkey (
                            id,
                            full_name,
                            specialty,
                            phone
                        )
                    `)
                    .eq('patient_id', userId)
                    .in('status', ['scheduled', 'completed'])
                    .order('scheduled_at', { ascending: false });
            } else if (role === 'doctor') {
                query = supabase
                    .from('appointments')
                    .select(`
                        id,
                        status,
                        scheduled_at,
                        consultation_type,
                        patient:profiles!appointments_patient_id_fkey (
                            id,
                            full_name,
                            phone
                        )
                    `)
                    .eq('doctor_id', userId)
                    .in('status', ['scheduled', 'completed'])
                    .order('scheduled_at', { ascending: false });
            } else {
                conversationList.innerHTML = '<p class="p-3 text-muted">No conversations available</p>';
                return;
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error loading conversations:', error);
                conversationList.innerHTML = `<p class="p-3 text-danger">Error loading conversations: ${error.message}</p>`;
                return;
            }

            // Get unique conversations (by partner ID)
            const uniqueConversations = [];
            const seenPartners = new Set();

            if (data && data.length > 0) {
                data.forEach(conv => {
                    const partner = role === 'patient' ? conv.doctor : conv.patient;
                    if (partner && !seenPartners.has(partner.id)) {
                        seenPartners.add(partner.id);
                        uniqueConversations.push({
                            appointmentId: conv.id,
                            partner: partner,
                            lastMessage: null,
                            lastMessageTime: null,
                            unreadCount: 0,
                            status: conv.status,
                            consultationType: conv.consultation_type || 'video'
                        });
                    }
                });

                // Get last message for each conversation
                for (let conv of uniqueConversations) {
                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('appointment_id', conv.appointmentId)
                        .order('sent_at', { ascending: false })
                        .limit(1);

                    if (lastMsg && lastMsg.length > 0) {
                        conv.lastMessage = lastMsg[0].content;
                        conv.lastMessageTime = lastMsg[0].sent_at;
                        conv.lastMessageSender = lastMsg[0].sender_id;
                        
                        // Count unread messages
                        const { count, error: countError } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('appointment_id', conv.appointmentId)
                            .eq('receiver_id', userId)
                            .is('read_at', null);

                        if (!countError) {
                            conv.unreadCount = count || 0;
                        }
                    }
                }

                // Sort by most recent message
                uniqueConversations.sort((a, b) => {
                    if (!a.lastMessageTime) return 1;
                    if (!b.lastMessageTime) return -1;
                    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
                });
            }

            if (uniqueConversations.length === 0) {
                conversationList.innerHTML = `
                    <div class="p-4 text-center text-muted">
                        <p>💬 No conversations yet</p>
                        <small>Book an appointment to start chatting with your doctor.</small>
                        <br><br>
                        <button class="btn btn-primary btn-sm" onclick="patientManager?.loadView('appointments')">
                            📅 Book Appointment
                        </button>
                    </div>
                `;
                return;
            }

            // Render conversations
            conversationList.innerHTML = uniqueConversations.map(conv => {
                const partner = conv.partner;
                const isActive = this.currentChatPartnerId === partner.id;
                const lastMsg = conv.lastMessage || 'No messages yet';
                const timeAgo = conv.lastMessageTime ? this.timeAgo(new Date(conv.lastMessageTime)) : '';
                
                return `
                    <div class="conversation-item p-3 border-bottom ${isActive ? 'active' : ''}" 
                         style="cursor: pointer; ${isActive ? 'background-color: #e3f2fd; border-left: 3px solid #1976d2;' : ''}"
                         onclick="chatManager.selectConversation('${conv.appointmentId}', '${partner.id}', '${partner.full_name}', event)">
                        <div class="d-flex justify-content-between align-items-start">
                            <div style="flex: 1;">
                                <h6 class="mb-0">${partner.full_name}</h6>
                                <small class="text-muted">${partner.specialty || 'Patient'}</small>
                                <div class="text-truncate" style="max-width: 150px;">
                                    <small class="text-muted">${this.escapeHtml(lastMsg.substring(0, 40))}${lastMsg.length > 40 ? '...' : ''}</small>
                                </div>
                            </div>
                            <div class="text-end" style="min-width: 50px;">
                                ${conv.unreadCount > 0 ? `<span class="badge bg-danger rounded-pill">${conv.unreadCount}</span>` : ''}
                                ${timeAgo ? `<br><small class="text-muted" style="font-size: 0.65rem;">${timeAgo}</small>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Auto-select first conversation if none selected
            if (!this.currentChatPartnerId && uniqueConversations.length > 0) {
                const first = uniqueConversations[0];
                this.selectConversation(first.appointmentId, first.partner.id, first.partner.full_name);
            }

        } catch (error) {
            console.error('Error loading conversations:', error);
            conversationList.innerHTML = `<p class="p-3 text-danger">Error: ${error.message}</p>`;
        }
    }

    // =============================================
    // SELECT CONVERSATION
    // =============================================
    async selectConversation(appointmentId, partnerId, partnerName, event = null) {
        console.log('💬 Selecting conversation:', { appointmentId, partnerId, partnerName });
        
        // Reset message IDs for new conversation
        this.messageIds = new Set();
        
        this.currentAppointmentId = appointmentId;
        this.currentChatPartnerId = partnerId;
        this.currentChatPartnerName = partnerName;

        // Update UI
        document.getElementById('chatTitle').textContent = `💬 ${partnerName}`;
        document.getElementById('messageInputArea').style.display = 'block';
        document.getElementById('onlineStatus').textContent = '🟢 Online';
        document.getElementById('onlineStatus').className = 'badge bg-success';

        // Highlight selected conversation
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.style.backgroundColor = '';
            item.style.borderLeft = '3px solid transparent';
        });
        if (event && event.target) {
            const item = event.target.closest('.conversation-item');
            if (item) {
                item.style.backgroundColor = '#e3f2fd';
                item.style.borderLeft = '3px solid #1976d2';
            }
        }

        // Load messages
        await this.loadMessages();

        // Subscribe to new messages
        this.subscribeToMessages();

        // Mark messages as read
        await this.markMessagesAsRead();
    }

    // =============================================
    // LOAD MESSAGES
    // =============================================
    async loadMessages() {
        if (!this.currentAppointmentId) return;

        const chatContainer = document.getElementById('chatContainer');

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('appointment_id', this.currentAppointmentId)
                .order('sent_at', { ascending: true });

            if (error) throw error;

            // Clear message IDs and add new ones
            this.messageIds = new Set();
            this.messages = data || [];
            
            // Track message IDs to prevent duplicates
            this.messages.forEach(msg => {
                this.messageIds.add(msg.id);
            });

            this.renderMessages();

            // Scroll to bottom
            setTimeout(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);

        } catch (error) {
            console.error('Error loading messages:', error);
            chatContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error loading messages: ${error.message}
                    <br><button class="btn btn-sm btn-primary mt-2" onclick="chatManager.loadMessages()">Retry</button>
                </div>
            `;
        }
    }

    // =============================================
    // RENDER MESSAGES
    // =============================================
    renderMessages() {
        const userId = authManager.getUserId();
        const chatContainer = document.getElementById('chatContainer');

        if (!this.messages || this.messages.length === 0) {
            chatContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <p>💬 No messages yet</p>
                    <small>Start the conversation by sending a message below 👇</small>
                </div>
            `;
            return;
        }

        chatContainer.innerHTML = this.messages.map(msg => {
            const isSent = msg.sender_id === userId;
            const time = new Date(msg.sent_at).toLocaleTimeString();
            
            return `
                <div class="message-wrapper mb-2 ${isSent ? 'text-end' : 'text-start'}">
                    <div class="chat-message ${isSent ? 'sent' : 'received'} d-inline-block p-2 rounded"
                         style="max-width: 75%; ${isSent ? 'background: #0087CC; color: white;' : 'background: white; border: 1px solid #e0e0e0;'}">
                        <p class="mb-1" style="word-wrap: break-word;">${this.escapeHtml(msg.content)}</p>
                        <small class="${isSent ? 'text-light' : 'text-muted'}" style="font-size: 0.7rem;">
                            ${time} 
                            ${msg.read_at ? '✅' : '✓'}
                        </small>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // =============================================
    // SEND MESSAGE
    // =============================================
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();

        if (!content) return;
        if (!this.currentAppointmentId || !this.currentChatPartnerId) {
            alert('Please select a conversation first.');
            return;
        }

        const userId = authManager.getUserId();
        const sendBtn = document.getElementById('sendMessageBtn');
        const sendText = document.getElementById('sendBtnText');

        // Disable button
        sendBtn.disabled = true;
        sendText.textContent = '⏳ Sending...';

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    sender_id: userId,
                    receiver_id: this.currentChatPartnerId,
                    appointment_id: this.currentAppointmentId,
                    content: content,
                    sent_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;

            // Clear input
            input.value = '';

            // Add to local messages (prevent duplicate)
            if (data && data.length > 0) {
                const newMsg = data[0];
                // Check if message already exists
                if (!this.messageIds.has(newMsg.id)) {
                    this.messageIds.add(newMsg.id);
                    this.messages.push(newMsg);
                    this.renderMessages();
                }
            }

            // Log activity
            await authManager.logActivity(userId, 'SEND_MESSAGE', 
                `Sent message in appointment ${this.currentAppointmentId}`);

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + error.message);
        } finally {
            sendBtn.disabled = false;
            sendText.textContent = '📤 Send';
            document.getElementById('messageInput').focus();
        }
    }

    // =============================================
    // SUBSCRIBE TO NEW MESSAGES (Realtime)
    // =============================================
    subscribeToMessages() {
        // Cleanup existing subscription
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }

        if (!this.currentAppointmentId) return;

        console.log('📡 Subscribing to messages for:', this.currentAppointmentId);

        this.subscription = supabase
            .channel(`messages:${this.currentAppointmentId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `appointment_id=eq.${this.currentAppointmentId}`
            }, (payload) => {
                console.log('📩 New message received:', payload.new);
                this.handleNewMessage(payload.new);
            })
            .subscribe((status) => {
                console.log('📡 Subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to messages');
                }
            });
    }

    // =============================================
    // HANDLE NEW MESSAGE (Realtime) - NO DUPLICATES
    // =============================================
    handleNewMessage(message) {
        // Check if message already exists (prevent duplicates)
        if (this.messageIds.has(message.id)) {
            console.log('⚠️ Duplicate message detected, ignoring:', message.id);
            return;
        }

        const userId = authManager.getUserId();
        const isSent = message.sender_id === userId;
        
        // Add to message IDs set
        this.messageIds.add(message.id);
        
        // Add to messages array
        this.messages.push(message);
        
        // Update UI
        this.renderMessages();

        // Update conversation list
        this.updateConversationList(message);

        // Mark as read if received
        if (!isSent) {
            this.markMessagesAsRead();
        }
    }

    // =============================================
    // MARK MESSAGES AS READ
    // =============================================
    async markMessagesAsRead() {
        if (!this.currentAppointmentId) return;

        const userId = authManager.getUserId();

        try {
            const { error } = await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('appointment_id', this.currentAppointmentId)
                .eq('receiver_id', userId)
                .is('read_at', null);

            if (error) throw error;

            // Update unread count in conversation list
            document.querySelectorAll('.conversation-item').forEach(item => {
                const badge = item.querySelector('.badge.bg-danger');
                if (badge) {
                    badge.remove();
                }
            });

        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // =============================================
    // UPDATE CONVERSATION LIST
    // =============================================
    updateConversationList(message) {
        // Find the conversation in the list
        const items = document.querySelectorAll('.conversation-item');
        let targetItem = null;

        items.forEach(item => {
            const onclick = item.getAttribute('onclick');
            if (onclick && onclick.includes(this.currentAppointmentId)) {
                targetItem = item;
            }
        });

        if (targetItem) {
            // Update the last message preview
            const textTruncate = targetItem.querySelector('.text-truncate');
            if (textTruncate) {
                const small = textTruncate.querySelector('small');
                if (small) {
                    small.textContent = this.escapeHtml(message.content.substring(0, 40)) + (message.content.length > 40 ? '...' : '');
                }
            }

            // Update unread badge
            const userId = authManager.getUserId();
            if (message.sender_id !== userId) {
                let badge = targetItem.querySelector('.badge.bg-danger');
                if (!badge) {
                    const timeDiv = targetItem.querySelector('.text-end');
                    if (timeDiv) {
                        badge = document.createElement('span');
                        badge.className = 'badge bg-danger rounded-pill';
                        badge.textContent = '1';
                        timeDiv.prepend(badge);
                    }
                } else {
                    const count = parseInt(badge.textContent) + 1;
                    badge.textContent = count;
                }
            }
        }
    }

    // =============================================
    // UTILITY FUNCTIONS
    // =============================================
    timeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =============================================
    // CLEANUP
    // =============================================
    cleanup() {
        console.log('🧹 Cleaning up chat...');
        
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
        
        this.currentAppointmentId = null;
        this.currentChatPartnerId = null;
        this.currentChatPartnerName = null;
        this.messages = [];
        this.messageIds = new Set();
        this.isOpen = false;
    }
}

// Initialize chat manager
const chatManager = new ChatManager();
window.chatManager = chatManager;
console.log('✅ ChatManager initialized');