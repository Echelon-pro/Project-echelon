import auth from './auth.js';
import { formatTimestamp } from './main.js';
import { getUserColor } from './utils.js';

let chatMessages = [];
const messagesContainer = document.querySelector('.chat-messages');
const messageInput = document.querySelector('#chatInput');
const sendButton = document.querySelector('#sendButton');
const loginLink = document.querySelector('.login-link');
let socket = null;

// Function to update UI based on auth state
function updateChatState() {
    const isAuth = auth.isAuthenticated();
    console.log('Chat state update - Auth status:', isAuth);
    
    if (messageInput) {
        messageInput.disabled = !isAuth;
        messageInput.placeholder = isAuth ? "Type your message..." : "Please login to chat";
    }
    
    if (sendButton) {
        sendButton.disabled = !isAuth;
    }
    
    const loginMessage = document.querySelector('.login-message');
    if (loginMessage) {
        loginMessage.style.display = isAuth ? 'none' : 'block';
    }
    
    if (loginLink) {
        loginLink.style.display = isAuth ? 'none' : 'flex';
    }
}

// Function to create message element
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'chat-message-header';
    
    const usernameLink = document.createElement('a');
    usernameLink.className = 'username';
    usernameLink.textContent = message.username;
    usernameLink.style.color = getUserColor(message.username);
    usernameLink.href = `/profile.html?username=${encodeURIComponent(message.username)}`;
    usernameLink.setAttribute('data-user', message.username);
    
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'timestamp';
    timestampSpan.textContent = formatTimestamp(message.timestamp);
    timestampSpan.setAttribute('data-timestamp', message.timestamp);
    
    headerDiv.appendChild(usernameLink);
    headerDiv.appendChild(timestampSpan);
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = message.text;
    
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(textDiv);
    
    return messageDiv;
}

// Function to update timestamps
function updateTimestamps() {
    const timestamps = document.querySelectorAll('.timestamp[data-timestamp]');
    timestamps.forEach(span => {
        const timestamp = span.getAttribute('data-timestamp');
        span.textContent = formatTimestamp(timestamp);
    });
}

// Function to add message to chat
function addMessageToChat(message) {
    const messageElement = createMessageElement(message);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    chatMessages.push(message);
}

// Function to send message
async function sendMessage(text) {
    if (!text.trim() || !auth.isAuthenticated()) return;
    
    const user = auth.getUser();
    if (!user) return;
    
    try {
        socket.emit('message', {
            username: user.username,
            text: text.trim()
        });
        
        messageInput.value = '';
        messageInput.focus();
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    }
}

// Initialize chat
async function initChat() {
    try {
        // Initialize Socket.IO
        socket = io(window.location.origin);
        
        // Socket event handlers
        socket.on('connect', () => {
            console.log('Connected to chat server');
            const user = auth.getUser();
            if (user) {
                socket.emit('join', user.username);
            }
        });
        
        socket.on('message', (message) => {
            addMessageToChat(message);
        });
        
        socket.on('error', (error) => {
            console.error('Socket error:', error);
            alert('Chat error: ' + error);
        });
        
        // Load initial messages
        const response = await fetch('/api/chat/messages');
        const messages = await response.json();
        messages.forEach(addMessageToChat);
        
        // Setup event listeners
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(messageInput.value);
                }
            });
        }
        
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                sendMessage(messageInput.value);
            });
        }
        
        // Update timestamps periodically
        setInterval(updateTimestamps, 60000);
        
        // Initial UI update
        updateChatState();
        
        // Listen for auth state changes
        auth.onAuthStateChanged(updateChatState);
        
    } catch (error) {
        console.error('Error initializing chat:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initChat);