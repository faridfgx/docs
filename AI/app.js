// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

let currentUser = null;

// Check authentication status on page load
supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        currentUser = session.user;
        showChatSection();
        loadChatHistory();
    }
});

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        showChatSection();
        loadChatHistory();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        showAuthSection();
    }
});

// Sign Up Function
async function signUp() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    showLoading(true);

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    showLoading(false);

    if (error) {
        alert('Sign up error: ' + error.message);
    } else {
        alert('Success! Please check your email to verify your account.');
        document.getElementById('emailInput').value = '';
        document.getElementById('passwordInput').value = '';
    }
}

// Sign In Function
async function signIn() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    showLoading(true);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    showLoading(false);

    if (error) {
        alert('Sign in error: ' + error.message);
    } else {
        currentUser = data.user;
        showChatSection();
        loadChatHistory();
    }
}

// Sign Out Function
async function signOut() {
    const confirmed = confirm('Are you sure you want to sign out?');
    if (!confirmed) return;

    await supabaseClient.auth.signOut();
    document.getElementById('chatHistory').innerHTML = '<div class="welcome-message"><p>👋 Hello! I\'m your AI assistant. How can I help you today?</p></div>';
}

// Show/Hide Sections
function showChatSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'block';
    document.getElementById('userEmail').textContent = currentUser.email;
}

function showAuthSection() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('chatSection').style.display = 'none';
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

// Send Message to AI
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) {
        alert('Please enter a message');
        return;
    }

    // Display user message
    addMessageToChat('user', message);
    messageInput.value = '';

    // Show loading on send button
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    sendBtn.querySelector('span:first-child').style.display = 'none';
    sendBtn.querySelector('.loading').style.display = 'inline';

    try {
        // Get the session
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            addMessageToChat('system', '⚠️ Please sign in to continue');
            return;
        }

        // Call the Edge Function
        const { data, error } = await supabaseClient.functions.invoke('chat-with-ai', {
            body: { 
                message: message
            }
        });

        if (error) {
            throw error;
        }

        if (data.success) {
            // Display AI response
            addMessageToChat('ai', data.response);
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }

    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('system', '❌ Error: ' + error.message);
    } finally {
        // Reset send button
        sendBtn.disabled = false;
        sendBtn.querySelector('span:first-child').style.display = 'inline';
        sendBtn.querySelector('.loading').style.display = 'none';
    }
}

// Add message to chat display
function addMessageToChat(sender, message) {
    const chatHistory = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Add icon based on sender
    const icon = sender === 'user' ? '👤' : sender === 'ai' ? '🤖' : '⚠️';
    
    messageDiv.innerHTML = `
        <div class="message-icon">${icon}</div>
        <div class="message-content">${escapeHtml(message)}</div>
    `;
    
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Load chat history from Supabase
async function loadChatHistory() {
    try {
        const { data, error } = await supabaseClient
            .from('chat_messages')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
            // Clear welcome message
            document.getElementById('chatHistory').innerHTML = '';
            
            data.forEach(msg => {
                addMessageToChat('user', msg.user_message);
                addMessageToChat('ai', msg.ai_response);
            });
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enter key to send message
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});
