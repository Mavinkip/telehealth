/*
 * File: chat.js - Complete with Debug Logs
 * Purpose: Handle real-time chat between patients and doctors
 */

class ChatManager {
    constructor() {
        console.log('🔧 ChatManager constructor called');
        this.currentAppointmentId = null;
        this.currentChatPartnerId = null;
        this.currentChatPartnerName = null;
        this.subscription = null;
        this.messages = [];
        this.isOpen = false;
        this.messageIds = new Set();
    }

    // =============================================
    // SHOW CHAT INTERFACE - WITH DEBUG LOGS
    // =============================================
    showChatInterface(appointmentId = null, partnerId = null) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💬 showChatInterface called');
        console.log('📌 appointmentId:', appointmentId);
        console.log('📌 partnerId:', partnerId);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        try {
            // Set chat state
            this.currentAppointmentId = appointmentId;
            this.currentChatPartnerId = partnerId;
            this.isOpen = true;
            this.messageIds = new Set();
            console.log('✅ Chat state updated');

            // Find content area
            console.log('🔍 Looking for content area...');
            const contentArea = document.getElementById('patientContent') || 
                               document.getElementById('doctorContent') || 
                               document.getElementById('app-content');
            
            console.log('📄 Content area found:', contentArea ? 'YES' : 'NO');
            if (contentArea) {
                console.log('📄 Content area ID:', contentArea.id);
            }

            if (!contentArea) {
                console.error('❌ Content area not found!');
                // Try to create a fallback
                const app = document.getElementById('app');
                if (app) {
                    console.log('🔄 Creating fallback chat container...');
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.id = 'chatFallback';
                    fallbackDiv.style.padding = '20px';
                    app.appendChild(fallbackDiv);
                    console.log('✅ Fallback container created');
                    this.renderChatContent(fallbackDiv);
                    this.loadConversations();
                }
                return;
            }

            // Render chat
            console.log('📝 Rendering chat content...');
            this.renderChatContent(contentArea);
            
            // Load conversations
            console.log('📞 Loading conversations...');
            this.loadConversations();
            
            console.log('✅ showChatInterface completed');
        } catch (error) {
            console.error('❌ Error in showChatInterface:', error);
            console.error('❌ Error stack:', error.stack);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // =============================================
    // RENDER CHAT CONTENT - WITH DEBUG LOGS
    // =============================================
    renderChatContent(container) {
        console.log('📝 renderChatContent called');
        console.log('📄 Container ID:', container.id || 'unnamed');
        
        try {
            container.innerHTML = `
                <div class="row">
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
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                                <h5 class="mb-0" id="chatTitle">💬 Select a conversation</h5>
                                <span id="onlineStatus" class="badge bg-secondary">Offline</span>
                            </div>
                            <div class="card-body p-0">
                                <div id="chatContainer" class="p-3" style="height: 400px; overflow-y: auto; background: #f8f9fa;">
                                    <div class="text-center text-muted py-5">
                                        <p>👈 Select a conversation to start chatting</p>
                                    </div>
                                </div>
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
            `;
            console.log('✅ Chat HTML rendered');

            // Attach event listeners
            console.log('🔗 Attaching event listeners...');
            
            const sendBtn = document.getElementById('sendMessageBtn');
            if (sendBtn) {
                sendBtn.addEventListener('click', () => {
                    console.log('🖱️ Send button clicked');
                    this.sendMessage();
                });
                console.log('✅ sendMessageBtn listener attached');
            } else {
                console.warn('⚠️ sendMessageBtn not found');
            }

            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        console.log('⌨️ Enter key pressed');
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
                console.log('✅ messageInput listener attached');
            } else {
                console.warn('⚠️ messageInput not found');
            }
            
            console.log('✅ renderChatContent completed');
        } catch (error) {
            console.error('❌ Error in renderChatContent:', error);
            console.error('❌ Error stack:', error.stack);
        }
    }

    // =============================================
    // LOAD CONVERSATIONS - WITH DEBUG LOGS
    // =============================================
    async loadConversations() {
        console.log('📞 loadConversations called');
        
        try {
            const userId = authManager.getUserId();
            const role = authManager.getUserRole();
            console.log('👤 User ID:', userId);
            console.log('👤 User Role:', role);
            
            const conversationList = document.getElementById('conversationList');
            console.log('📄 conversationList element:', conversationList ? 'FOUND' : 'NOT FOUND');

            if (!conversationList) {
                console.error('❌ Conversation list element not found');
                return;
            }

            if (!userId) {
                console.warn('⚠️ No user ID found');
                conversationList.innerHTML = '<p class="p-3 text-muted">Please login to see conversations</p>';
                return;
            }

            console.log('📊 Building query for role:', role);
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
                console.log('🔍 Patient query built');
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
                console.log('🔍 Doctor query built');
            } else {
                console.warn('⚠️ Unknown role:', role);
                conversationList.innerHTML = '<p class="p-3 text-muted">No conversations available</p>';
                return;
            }

            console.log('🚀 Executing Supabase query...');
            const { data, error } = await query;
            console.log('📊 Query result:', { 
                dataLength: data?.length || 0, 
                error: error?.message || 'none' 
            });

            if (error) {
                console.error('❌ Error loading conversations:', error);
                conversationList.innerHTML = `<p class="p-3 text-danger">Error loading conversations: ${error.message}</p>`;
                return;
            }

            const uniqueConversations = [];
            const seenPartners = new Set();

            if (data && data.length > 0) {
                console.log('📊 Processing', data.length, 'appointments');
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
                console.log('📊 Unique conversations:', uniqueConversations.length);

                // Get last message for each conversation
                for (let conv of uniqueConversations) {
                    console.log('📩 Fetching last message for:', conv.partner.full_name);
                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('appointment_id', conv.appointmentId)
                        .order('sent_at', { ascending: false })
                        .limit(1);

                    if (lastMsg && lastMsg.length > 0) {
                        conv.lastMessage = lastMsg[0].content;
                        conv.lastMessageTime = lastMsg[0].sent_at;
                        console.log('📩 Last message found:', conv.lastMessage.substring(0, 30) + '...');
                    }
                }

                uniqueConversations.sort((a, b) => {
                    if (!a.lastMessageTime) return 1;
                    if (!b.lastMessageTime) return -1;
                    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
                });
            }

            if (uniqueConversations.length === 0) {
                console.log('📊 No conversations to display');
                conversationList.innerHTML = `
                    <div class="p-4 text-center text-muted">
                        <p>💬 No conversations yet</p>
                        <small>Book an appointment to start chatting.</small>
                    </div>
                `;
                return;
            }

            console.log('📝 Rendering', uniqueConversations.length, 'conversations');
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

            console.log('✅ Conversations rendered successfully');

            if (!this.currentChatPartnerId && uniqueConversations.length > 0) {
                const first = uniqueConversations[0];
                console.log('📌 Auto-selecting first conversation:', first.partner.full_name);
                this.selectConversation(first.appointmentId, first.partner.id, first.partner.full_name);
            }

        } catch (error) {
            console.error('❌ Error in loadConversations:', error);
            console.error('❌ Error stack:', error.stack);
            const conversationList = document.getElementById('conversationList');
            if (conversationList) {
                conversationList.innerHTML = `<p class="p-3 text-danger">Error: ${error.message}</p>`;
            }
        }
    }

    // =============================================
    // SELECT CONVERSATION - WITH DEBUG LOGS
    // =============================================
    async selectConversation(appointmentId, partnerId, partnerName, event = null) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💬 selectConversation called');
        console.log('📌 appointmentId:', appointmentId);
        console.log('📌 partnerId:', partnerId);
        console.log('📌 partnerName:', partnerName);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        try {
            this.messageIds = new Set();
            
            this.currentAppointmentId = appointmentId;
            this.currentChatPartnerId = partnerId;
            this.currentChatPartnerName = partnerName;
            console.log('✅ Chat state updated');

            const chatTitle = document.getElementById('chatTitle');
            const messageInputArea = document.getElementById('messageInputArea');
            const onlineStatus = document.getElementById('onlineStatus');

            if (chatTitle) {
                chatTitle.textContent = `💬 ${partnerName}`;
                console.log('✅ Chat title updated');
            }
            if (messageInputArea) {
                messageInputArea.style.display = 'block';
                console.log('✅ Message input area shown');
            }
            if (onlineStatus) {
                onlineStatus.textContent = '🟢 Online';
                onlineStatus.className = 'badge bg-success';
                console.log('✅ Online status updated');
            }

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
                    console.log('✅ Conversation item highlighted');
                }
            }

            console.log('📩 Loading messages...');
            await this.loadMessages();
            
            console.log('📡 Subscribing to messages...');
            this.subscribeToMessages();
            
            console.log('📩 Marking messages as read...');
            await this.markMessagesAsRead();
            
            console.log('✅ selectConversation completed successfully');
        } catch (error) {
            console.error('❌ Error in selectConversation:', error);
            console.error('❌ Error stack:', error.stack);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // =============================================
    // LOAD MESSAGES - WITH DEBUG LOGS
    // =============================================
    async loadMessages() {
        console.log('📩 loadMessages called');
        
        if (!this.currentAppointmentId) {
            console.warn('⚠️ No current appointment ID');
            return;
        }
        console.log('📌 Current appointment ID:', this.currentAppointmentId);

        const chatContainer = document.getElementById('chatContainer');
        console.log('📄 chatContainer:', chatContainer ? 'FOUND' : 'NOT FOUND');

        try {
            console.log('🚀 Fetching messages from Supabase...');
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('appointment_id', this.currentAppointmentId)
                .order('sent_at', { ascending: true });

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log('📩 Messages fetched:', data?.length || 0);
            this.messageIds = new Set();
            this.messages = data || [];
            
            this.messages.forEach(msg => {
                this.messageIds.add(msg.id);
            });
            console.log('📩 Message IDs cached:', this.messageIds.size);

            this.renderMessages();

            setTimeout(() => {
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    console.log('📩 Scrolled to bottom');
                }
            }, 100);
            
            console.log('✅ loadMessages completed successfully');

        } catch (error) {
            console.error('❌ Error loading messages:', error);
            console.error('❌ Error stack:', error.stack);
            if (chatContainer) {
                chatContainer.innerHTML = `
                    <div class="alert alert-danger">
                        Error loading messages: ${error.message}
                        <br><button class="btn btn-sm btn-primary mt-2" onclick="chatManager.loadMessages()">Retry</button>
                    </div>
                `;
            }
        }
    }

    // =============================================
    // RENDER MESSAGES - WITH DEBUG LOGS
    // =============================================
    renderMessages() {
        console.log('📝 renderMessages called');
        console.log('📩 Messages count:', this.messages?.length || 0);
        
        try {
            const userId = authManager.getUserId();
            const chatContainer = document.getElementById('chatContainer');

            if (!chatContainer) {
                console.warn('⚠️ chatContainer not found');
                return;
            }

            if (!this.messages || this.messages.length === 0) {
                console.log('📩 No messages to render');
                chatContainer.innerHTML = `
                    <div class="text-center text-muted py-5">
                        <p>💬 No messages yet</p>
                        <small>Start the conversation by sending a message below 👇</small>
                    </div>
                `;
                return;
            }

            console.log('📩 Rendering', this.messages.length, 'messages');
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

            chatContainer.scrollTop = chatContainer.scrollHeight;
            console.log('✅ Messages rendered successfully');
        } catch (error) {
            console.error('❌ Error in renderMessages:', error);
            console.error('❌ Error stack:', error.stack);
        }
    }

    // =============================================
    // SEND MESSAGE - WITH DEBUG LOGS
    // =============================================
    async sendMessage() {
        console.log('📤 sendMessage called');
        
        try {
            const input = document.getElementById('messageInput');
            if (!input) {
                console.warn('⚠️ messageInput not found');
                return;
            }
            
            const content = input.value.trim();
            console.log('📤 Message content:', content);

            if (!content) {
                console.log('📤 Empty message, ignoring');
                return;
            }

            if (!this.currentAppointmentId || !this.currentChatPartnerId) {
                console.warn('⚠️ No conversation selected:', {
                    appointmentId: this.currentAppointmentId,
                    partnerId: this.currentChatPartnerId
                });
                alert('Please select a conversation first.');
                return;
            }

            const userId = authManager.getUserId();
            console.log('👤 Sender ID:', userId);
            
            const sendBtn = document.getElementById('sendMessageBtn');
            const sendText = document.getElementById('sendBtnText');

            if (sendBtn) sendBtn.disabled = true;
            if (sendText) sendText.textContent = '⏳ Sending...';
            console.log('📤 Send button disabled');

            console.log('🚀 Inserting message into Supabase...');
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

            if (error) {
                console.error('❌ Supabase insert error:', error);
                throw error;
            }

            console.log('📤 Message sent successfully:', data);
            input.value = '';

            if (data && data.length > 0) {
                const newMsg = data[0];
                if (!this.messageIds.has(newMsg.id)) {
                    this.messageIds.add(newMsg.id);
                    this.messages.push(newMsg);
                    console.log('📤 Message added to local cache, total:', this.messages.length);
                    this.renderMessages();
                }
            }

        } catch (error) {
            console.error('❌ Error sending message:', error);
            console.error('❌ Error stack:', error.stack);
            alert('Failed to send message: ' + error.message);
        } finally {
            const sendBtn = document.getElementById('sendMessageBtn');
            const sendText = document.getElementById('sendBtnText');
            if (sendBtn) sendBtn.disabled = false;
            if (sendText) sendText.textContent = '📤 Send';
            const input = document.getElementById('messageInput');
            if (input) input.focus();
            console.log('📤 Send button re-enabled');
        }
    }

    // =============================================
    // SUBSCRIBE TO NEW MESSAGES - WITH DEBUG LOGS
    // =============================================
    subscribeToMessages() {
        console.log('📡 subscribeToMessages called');
        
        try {
            if (this.subscription) {
                console.log('📡 Cleaning up existing subscription');
                this.subscription.unsubscribe();
                this.subscription = null;
            }

            if (!this.currentAppointmentId) {
                console.warn('⚠️ No current appointment ID, skipping subscription');
                return;
            }

            console.log('📡 Subscribing to messages for:', this.currentAppointmentId);

            this.subscription = supabase
                .channel(`messages:${this.currentAppointmentId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `appointment_id=eq.${this.currentAppointmentId}`
                }, (payload) => {
                    console.log('📩 New message received via subscription:', payload.new);
                    this.handleNewMessage(payload.new);
                })
                .subscribe((status) => {
                    console.log('📡 Subscription status:', status);
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Subscribed to messages successfully');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Subscription channel error');
                    } else if (status === 'TIMED_OUT') {
                        console.warn('⚠️ Subscription timed out');
                    }
                });
        } catch (error) {
            console.error('❌ Error in subscribeToMessages:', error);
            console.error('❌ Error stack:', error.stack);
        }
    }

    // =============================================
    // HANDLE NEW MESSAGE - WITH DEBUG LOGS
    // =============================================
    handleNewMessage(message) {
        console.log('📩 handleNewMessage called');
        
        try {
            if (this.messageIds.has(message.id)) {
                console.log('⚠️ Duplicate message detected, ignoring:', message.id);
                return;
            }

            const userId = authManager.getUserId();
            const isSent = message.sender_id === userId;
            console.log('📩 Message from:', isSent ? 'me' : 'other');
            
            this.messageIds.add(message.id);
            this.messages.push(message);
            console.log('📩 Message added, total:', this.messages.length);
            
            this.renderMessages();
            this.updateConversationList(message);

            if (!isSent) {
                console.log('📩 Marking messages as read');
                this.markMessagesAsRead();
            }
        } catch (error) {
            console.error('❌ Error in handleNewMessage:', error);
            console.error('❌ Error stack:', error.stack);
        }
    }

    // =============================================
    // MARK MESSAGES AS READ - WITH DEBUG LOGS
    // =============================================
    async markMessagesAsRead() {
        console.log('📩 markMessagesAsRead called');
        
        if (!this.currentAppointmentId) {
            console.warn('⚠️ No current appointment ID');
            return;
        }

        const userId = authManager.getUserId();

        try {
            console.log('🚀 Updating messages as read...');
            const { error } = await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('appointment_id', this.currentAppointmentId)
                .eq('receiver_id', userId)
                .is('read_at', null);

            if (error) {
                console.error('❌ Error marking messages as read:', error);
                throw error;
            }

            console.log('✅ Messages marked as read');

            // Update unread count in conversation list
            document.querySelectorAll('.conversation-item').forEach(item => {
                const badge = item.querySelector('.badge.bg-danger');
                if (badge) {
                    badge.remove();
                }
            });

        } catch (error) {
            console.error('❌ Error in markMessagesAsRead:', error);
            console.error('❌ Error stack:', error.stack);
        }
    }

    // =============================================
    // UPDATE CONVERSATION LIST - WITH DEBUG LOGS
    // =============================================
    updateConversationList(message) {
        console.log('📩 updateConversationList called');
        
        try {
            const items = document.querySelectorAll('.conversation-item');
            let targetItem = null;

            items.forEach(item => {
                const onclick = item.getAttribute('onclick');
                if (onclick && onclick.includes(this.currentAppointmentId)) {
                    targetItem = item;
                }
            });

            if (targetItem) {
                console.log('📩 Target item found');
                const textTruncate = targetItem.querySelector('.text-truncate');
                if (textTruncate) {
                    const small = textTruncate.querySelector('small');
                    if (small) {
                        small.textContent = this.escapeHtml(message.content.substring(0, 40)) + (message.content.length > 40 ? '...' : '');
                    }
                }

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
                            console.log('📩 New unread badge created');
                        }
                    } else {
                        const count = parseInt(badge.textContent) + 1;
                        badge.textContent = count;
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error in updateConversationList:', error);
            console.error('❌ Error stack:', error.stack);
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
        console.log('🧹 cleanup called');
        
        try {
            if (this.subscription) {
                this.subscription.unsubscribe();
                this.subscription = null;
                console.log('🧹 Unsubscribed');
            }
            
            this.currentAppointmentId = null;
            this.currentChatPartnerId = null;
            this.currentChatPartnerName = null;
            this.messages = [];
            this.messageIds = new Set();
            this.isOpen = false;
            console.log('🧹 Chat state cleared');
        } catch (error) {
            console.error('❌ Error in cleanup:', error);
            console.error('❌ Error stack:', error.stack);
        }
    }
}

// Initialize chat manager
console.log('🚀 Creating ChatManager instance...');
const chatManager = new ChatManager();
window.chatManager = chatManager;
console.log('✅ ChatManager initialized and attached to window');