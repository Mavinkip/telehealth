/*
 * File: chat.js
 * Purpose: Handle real-time chat functionality between patients and doctors
 * Dependencies: supabase-js (from config.js), auth.js
 * Fits in: Communication module
 */

class ChatManager {
    constructor() {
        this.currentAppointmentId = null;
        this.currentChatPartnerId = null;
        this.subscription = null;
    }

    showChatInterface(appointmentId = null, partnerId = null) {
        this.currentAppointmentId = appointmentId;
        this.currentChatPartnerId = partnerId;

        const app = document.getElementById('app');
        const profile = authManager.getUserProfile();
        
        app.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light">
                <div class="container">
                    <a class="navbar-brand" href="#">Telehealth Chat</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="#" id="backToDashboard">Back to Dashboard</a>
                            </li>
                        </ul>
                        <span class="navbar-text me-3">${profile.full_name}</span>
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Logout</button>
                    </div>
                </div>
            </nav>
            <div class="container mt-4">
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Conversations</h5>
                            </div>
                            <div class="card-body p-0">
                                <div id="conversationList" style="max-height: 500px; overflow-y: auto;">
                                    <!-- Conversations will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0" id="chatTitle">Select a conversation</h5>
                            </div>
                            <div class="card-body">
                                <div id="chatContainer" class="chat-container mb-3">
                                    <!-- Messages will be loaded here -->
                                </div>
                                <div id="messageInputArea" style="display: none;">
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="messageInput" placeholder="Type your message...">
                                        <button class="btn btn-primary" id="sendMessageBtn">Send</button>
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
            if (e.key === 'Enter') this.sendMessage();
        });

        this.loadConversations();
    }

    async loadConversations() {
        const userId = authManager.getUserId();
        const role = authManager.getUserRole();

        let query;
        if (role === 'patient') {
            query = supabase
                .from('appointments')
                .select(`
                    id,
                    doctor:profiles!appointments_doctor_id_fkey (id, full_name, specialty)
                `)
                .eq('patient_id', userId);
        } else {
            query = supabase
                .from('appointments')
                .select(`
                    id,
                    patient:profiles!appointments_patient_id_fkey (id, full_name)
                `)
                .eq('doctor_id', userId);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error loading conversations:', error);
            return;
        }

        const conversationList = document.getElementById('conversationList');
        
        if (data && data.length > 0) {
            conversationList.innerHTML = data.map(conv => {
                const partner = role === 'patient' ? conv.doctor : conv.patient;
                return `
                    <div class="p-3 border-bottom conversation-item" 
                         style="cursor: pointer; ${this.currentAppointmentId === conv.id ? 'background-color: #e9ecef;' : ''}"
                         onclick="chatManager.selectConversation('${conv.id}', '${partner.id}', '${partner.full_name}', event)">
                        <h6 class="mb-1">${partner.full_name}</h6>
                        <small class="text-muted">${role === 'patient' ? partner.specialty : 'Patient'}</small>
                    </div>
                `;
            }).join('');

            if (this.currentAppointmentId) {
                const selectedConv = data.find(c => c.id === this.currentAppointmentId);
                if (selectedConv) {
                    const partner = role === 'patient' ? selectedConv.doctor : selectedConv.patient;
                    this.selectConversation(this.currentAppointmentId, partner.id, partner.full_name);
                }
            }
        } else {
            conversationList.innerHTML = '<p class="p-3 text-muted">No conversations found</p>';
        }
    }

    async selectConversation(appointmentId, partnerId, partnerName, event = null) {
        this.currentAppointmentId = appointmentId;
        this.currentChatPartnerId = partnerId;

        // Update UI
        document.getElementById('chatTitle').textContent = `Chat with ${partnerName}`;
        document.getElementById('messageInputArea').style.display = 'block';
        
        // Highlight selected conversation
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.style.backgroundColor = '';
        });
        if (event && event.target) {
            const item = event.target.closest('.conversation-item');
            if (item) item.style.backgroundColor = '#e9ecef';
        }

        // Load messages
        await this.loadMessages();

        // Subscribe to new messages
        this.subscribeToMessages();
    }

    async loadMessages() {
        const userId = authManager.getUserId();
        
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('appointment_id', this.currentAppointmentId)
            .order('sent_at', { ascending: true });

        if (error) {
            console.error('Error loading messages:', error);
            return;
        }

        const chatContainer = document.getElementById('chatContainer');
        
        if (data && data.length > 0) {
            chatContainer.innerHTML = data.map(msg => {
                const isSent = msg.sender_id === userId;
                return `
                    <div class="chat-message ${isSent ? 'sent' : 'received'}">
                        <p class="mb-1">${msg.content}</p>
                        <small class="text-${isSent ? 'light' : 'muted'}">${new Date(msg.sent_at).toLocaleTimeString()}</small>
                    </div>
                `;
            }).join('');
            
            chatContainer.scrollTop = chatContainer.scrollHeight;
        } else {
            chatContainer.innerHTML = '<p class="text-muted text-center">No messages yet. Start the conversation!</p>';
        }
    }

    subscribeToMessages() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        this.subscription = supabase
            .channel(`messages:${this.currentAppointmentId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `appointment_id=eq.${this.currentAppointmentId}`
            }, (payload) => {
                this.handleNewMessage(payload.new);
            })
            .subscribe();
    }

    handleNewMessage(message) {
        const userId = authManager.getUserId();
        const isSent = message.sender_id === userId;
        
        const chatContainer = document.getElementById('chatContainer');
        
        if (chatContainer.querySelector('.text-muted.text-center')) {
            chatContainer.innerHTML = '';
        }

        const messageHtml = `
            <div class="chat-message ${isSent ? 'sent' : 'received'}">
                <p class="mb-1">${message.content}</p>
                <small class="text-${isSent ? 'light' : 'muted'}">${new Date(message.sent_at).toLocaleTimeString()}</small>
            </div>
        `;

        chatContainer.insertAdjacentHTML('beforeend', messageHtml);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();

        if (!content) return;

        const userId = authManager.getUserId();

        try {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    sender_id: userId,
                    receiver_id: this.currentChatPartnerId,
                    appointment_id: this.currentAppointmentId,
                    content: content,
                    sent_at: new Date().toISOString()
                }]);

            if (error) throw error;

            input.value = '';
            await authManager.logActivity(userId, 'SEND_MESSAGE', `Sent message in appointment ${this.currentAppointmentId}`);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    cleanup() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
        this.currentAppointmentId = null;
        this.currentChatPartnerId = null;
    }
}

// Initialize chat manager
const chatManager = new ChatManager();