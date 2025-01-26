// Import auth module
import auth from '/js/auth.js';
import { updateNavigation } from '/js/nav.js';
import { getUserColor } from './utils.js';

// Format timestamp
export function formatTimestamp(timestamp) {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - messageDate) / 1000);
    
    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    } else if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks}w ago`;
    } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months}mo ago`;
    } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years}y ago`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const chatMessagesContainer = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const loginLink = document.querySelector('.login-link');
    const chartContainer = document.getElementById('dogeChart');
    const progressBar = document.querySelector('.progress-bar');

    console.log('Initial DOM elements:', { 
        chatInput: chatInput ? 'Found' : 'Not found',
        sendButton: sendButton ? 'Found' : 'Not found',
        chatMessagesContainer: chatMessagesContainer ? 'Found' : 'Not found',
        chartContainer: chartContainer ? 'Found' : 'Not found',
        progressBar: progressBar ? 'Found' : 'Not found'
    });

    console.log('Chat elements:', { 
        chatInput: chatInput ? 'Found' : 'Not found',
        sendButton: sendButton ? 'Found' : 'Not found',
        chatMessagesContainer: chatMessagesContainer ? 'Found' : 'Not found'
    });

    // Initialize price display elements
    const priceStatsContainer = document.querySelector('.current-price');
    if (priceStatsContainer) {
        priceStatsContainer.innerHTML = ''; // Clear any existing content
        
        // Create wrapper for price
        const priceWrapper = document.createElement('div');
        priceWrapper.className = 'price-wrapper';
        
        // Create label and value spans
        const priceLabel = document.createElement('span');
        priceLabel.className = 'price-label';
        priceLabel.textContent = 'DOGE Price:';
        
        const priceValue = document.createElement('span');
        priceValue.className = 'price-value';
        priceValue.textContent = ' Loading...';
        
        // Create change span
        const changeSpan = document.createElement('span');
        changeSpan.className = 'price-change';
        
        // Assemble the elements
        priceWrapper.appendChild(priceLabel);
        priceWrapper.appendChild(priceValue);
        priceStatsContainer.appendChild(priceWrapper);
        priceStatsContainer.appendChild(changeSpan);
    }

    // Get initial 24h price change
    let priceChange24h = 0;
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=DOGEUSDT');
        const data = await response.json();
        priceChange24h = parseFloat(data.priceChangePercent);
    } catch (err) {
        console.error('Error fetching initial price change:', err);
    }

    // Initialize WebSocket for real-time price updates
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/dogeusdt@ticker');
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const price = parseFloat(data.c);
        const newPriceChange = parseFloat(data.P); // 24h price change percentage
        
        const priceValue = document.querySelector('.price-value');
        const changeSpan = document.querySelector('.price-change');
        
        if (priceValue && changeSpan) {
            // Update price
            priceValue.textContent = ` $${price.toFixed(4)}`;
            
            // Update change percentage
            const changeText = newPriceChange >= 0 ? 
                `(+${newPriceChange.toFixed(2)}%)` : 
                `(${newPriceChange.toFixed(2)}%)`;
            changeSpan.textContent = changeText;
            changeSpan.style.color = newPriceChange >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';
        }
    };

    // Chat functionality
    const chatMessages = [];
    let socket = null;

    function updateChatState() {
        const isAuth = auth.isAuthenticated();
        console.log('Updating chat state, auth:', isAuth);

        if (chatInput) {
            chatInput.disabled = !isAuth;
            chatInput.placeholder = isAuth ? "Type your message..." : "Please login to chat";
        }

        if (sendButton) {
            sendButton.disabled = !isAuth;
        }

        if (loginLink) {
            loginLink.style.display = isAuth ? 'none' : 'flex';
        }
    }

    // Connect to Socket.IO server
    function connectChat() {
        console.log('Connecting to chat server...');
        
        socket = io('http://localhost:5000', {
            reconnectionDelayMax: 10000,
            reconnection: true,
            reconnectionAttempts: Infinity
        });

        socket.on('connect', () => {
            console.log('Connected to chat server', socket.id);
            updateChatState();
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            if (chatInput) {
                chatInput.disabled = true;
                chatInput.placeholder = 'Chat connection error...';
            }
        });

        socket.on('chat:history', (messages) => {
            console.log('Received chat history:', messages);
            chatMessages.length = 0;
            chatMessages.push(...messages);
            updateChatMessages();
        });

        socket.on('chat:new_message', (message) => {
            console.log('Received new message:', message);
            chatMessages.push(message);
            updateChatMessages();
        });

        socket.on('chat:error', (error) => {
            console.error('Chat error:', error);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
            if (chatInput) {
                chatInput.disabled = true;
                chatInput.placeholder = 'Reconnecting to chat...';
            }
        });
    }

    // Handle sending messages
    function sendMessage() {
        if (!auth.isAuthenticated() || !socket || !socket.connected) {
            console.error('Cannot send message: not authenticated or not connected');
            return;
        }

        const text = chatInput.value.trim();
        if (!text) return;

        const user = auth.getUser();
        if (!user) {
            console.error('No user found');
            return;
        }

        console.log('Sending message:', {
            userId: user._id,
            username: user.username,
            text: text
        });

        socket.emit('chat:message', {
            userId: user._id,
            username: user.username,
            text: text
        });

        chatInput.value = '';
    }

    // Add event listeners for chat
    if (chatInput && sendButton) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !chatInput.disabled && chatInput.value.trim()) {
                e.preventDefault();
                sendMessage();
            }
        });

        sendButton.addEventListener('click', () => {
            if (!sendButton.disabled && chatInput.value.trim()) {
                sendMessage();
            }
        });
    }

    function createChatMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'chat-message-header';
        
        const usernameLink = document.createElement('a');
        usernameLink.className = 'username';
        usernameLink.textContent = message.username;
        usernameLink.href = `/profile.html?username=${encodeURIComponent(message.username)}`;
        usernameLink.style.color = getUserColor(message.username);
        
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = formatTimestamp(message.timestamp);
        
        const contentSpan = document.createElement('span');
        contentSpan.className = 'content';
        contentSpan.textContent = message.text;
        
        messageHeader.appendChild(usernameLink);
        messageHeader.appendChild(timestamp);
        messageDiv.appendChild(messageHeader);
        messageDiv.appendChild(contentSpan);
        
        return messageDiv;
    }

    function updateChatMessages() {
        if (!chatMessagesContainer) return;
        
        chatMessagesContainer.innerHTML = '';
        chatMessages.forEach(message => {
            const messageElement = createChatMessage(message);
            chatMessagesContainer.appendChild(messageElement);
        });
        
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    // Initialize everything
    try {
        const isLoggedIn = auth.isAuthenticated();
        console.log('User authentication status:', isLoggedIn);
        updateChatState();
        connectChat();
        
        // Initialize chart if container exists
        const chartElement = document.getElementById('dogeChart');
        if (chartElement) {
            console.log('Found chart container, initializing DOGE chart...');
            setTimeout(() => {
                try {
                    initDogeChart();
                    console.log('Chart initialization completed');
                } catch (err) {
                    console.error('Error in chart initialization:', err);
                }
            }, 100); // Small delay to ensure DOM is fully ready
        } else {
            console.error('Chart container not found! Make sure element with id "dogeChart" exists');
        }
        
        // Update progress bar if it exists
        if (progressBar) {
            updatePoolProgress();
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// DOGE Price Chart
function initDogeChart() {
    const chartContainer = document.getElementById('dogeChart');
    console.log('Initializing DOGE chart...', { chartContainer });
    
    if (!chartContainer) {
        console.error('Chart container not found!');
        return;
    }

    try {
        const chartProperties = {
            width: chartContainer.clientWidth,
            height: chartContainer.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: '#D1D4DC',
            },
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            }
        };

        console.log('Creating chart with properties:', chartProperties);
        const chart = LightweightCharts.createChart(chartContainer, chartProperties);
        console.log('Chart created successfully');

        const candleSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350'
        });

        // Fetch historical data
        fetch('https://api.binance.com/api/v3/klines?symbol=DOGEUSDT&interval=1h&limit=100')
            .then(res => res.json())
            .then(data => {
                console.log('Received historical data:', data.length, 'candles');
                const cdata = data.map(d => ({
                    time: d[0] / 1000,
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4])
                }));
                candleSeries.setData(cdata);
                console.log('Historical data set successfully');
            })
            .catch(err => console.error('Error fetching historical data:', err));

        // Set up WebSocket for real-time updates
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/dogeusdt@kline_1h');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const candle = data.k;
            
            candleSeries.update({
                time: candle.t / 1000,
                open: parseFloat(candle.o),
                high: parseFloat(candle.h),
                low: parseFloat(candle.l),
                close: parseFloat(candle.c)
            });
        };

        // Handle window resize
        const resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                chart.applyOptions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            });
        });

        resizeObserver.observe(chartContainer);
        console.log('Resize observer set up');

    } catch (error) {
        console.error('Error initializing chart:', error);
    }
}

// Update pool progress
function updatePoolProgress() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = '10%';
    }
}
