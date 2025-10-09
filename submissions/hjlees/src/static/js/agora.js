// Agora RTC with Speech Recognition and TTS

let agoraClient = null;
let localAudioTrack = null;
let localVideoTrack = null;
let remoteUsers = {};
let conversationalAIActive = false;

// Speech recognition
let recognition = null;
let isListening = false;
let audioContext = null;
let audioQueue = [];

// Barge-in support
let isSpeaking = false;
let currentAudio = null;
let speechSynthesisUtterance = null;

// Initialize Agora voice chat
document.addEventListener('DOMContentLoaded', () => {
    const startVoiceBtn = document.getElementById('startVoiceBtn');
    const stopVoiceBtn = document.getElementById('stopVoiceBtn');
    
    if (startVoiceBtn) {
        startVoiceBtn.addEventListener('click', startVoiceChat);
    }
    
    if (stopVoiceBtn) {
        stopVoiceBtn.addEventListener('click', stopVoiceChat);
    }
});

async function startVoiceChat() {
    const channelName = document.getElementById('channelName').value.trim();
    const enableAvatar = document.getElementById('enableAvatar')?.checked || false;
    
    if (!channelName) {
        alert('Please enter a channel name');
        return;
    }
    
    showLoading(true);
    updateVoiceStatus('Connecting...', 'warning');
    
    try {
        // If avatar is enabled, start Agora Conversational AI with HeyGen
        if (enableAvatar) {
            await startWithAvatarAgent(channelName);
            return;
        }
        
        // Otherwise, use regular voice chat
        // Get Agora token
        const tokenResponse = await fetch('/api/agora/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel_name: channelName,
                uid: 0,
                role: 1
            })
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            throw new Error(tokenData.error + (tokenData.hint ? '\n\n' + tokenData.hint : ''));
        }
        
        // Log configuration
        console.log('Agora configuration:', {
            app_id: tokenData.app_id,
            channel: channelName,
            uid: tokenData.uid,
            has_token: !!tokenData.token,
            testing_mode: tokenData.testing_mode
        });
        
        if (tokenData.testing_mode) {
            console.warn('⚠️  Running in Agora testing mode (no App Certificate)');
            console.warn('   Enable App Certificate in Agora Console for production use');
        }
        
        // Initialize Agora client
        agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        // Set up event listeners
        agoraClient.on('user-published', handleUserPublished);
        agoraClient.on('user-unpublished', handleUserUnpublished);
        
        // Join the channel (token can be null for testing mode)
        await agoraClient.join(
            tokenData.app_id,
            channelName,
            tokenData.token,
            tokenData.uid
        );
        
        // Create and publish local audio track
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await agoraClient.publish([localAudioTrack]);
        
        // Initialize speech recognition
        initializeSpeechRecognition();
        
        // Update UI
        updateVoiceStatus('Connected - Listening...', 'success');
        document.getElementById('startVoiceBtn').classList.add('d-none');
        document.getElementById('stopVoiceBtn').classList.remove('d-none');
        
        // Play welcome greeting
        await playGreeting("Hello! I'm Luna, your personal productivity assistant. How can I help you today?");
        
    } catch (error) {
        console.error('Error starting voice chat:', error);
        alert('Failed to start voice chat: ' + error.message);
        updateVoiceStatus('Not Connected', 'secondary');
    } finally {
        showLoading(false);
    }
}

async function startWithAvatarAgent(channelName) {
    try {
        console.log('🎬 Starting Agora Conversational AI with HeyGen Avatar...');
        
        // Start the conversational AI agent with avatar
        const agentResponse = await fetch('/api/agora/conversational-ai/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel_name: channelName,
                enable_avatar: true
            })
        });
        
        const agentData = await agentResponse.json();
        
        if (agentData.error) {
            throw new Error(agentData.error + (agentData.hint ? '\n\n' + agentData.hint : ''));
        }
        
        console.log('✅ Agora Conversational AI agent started:', agentData);
        conversationalAIActive = true;
        
        // Get token for the user to join the channel
        const tokenResponse = await fetch('/api/agora/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel_name: channelName,
                uid: 0,
                role: 1
            })
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            throw new Error(tokenData.error);
        }
        
        // Initialize Agora client for user to join
        agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        // Set up event listeners for avatar video
        agoraClient.on('user-published', async (user, mediaType) => {
            await agoraClient.subscribe(user, mediaType);
            console.log('✅ Subscribed to:', user.uid, mediaType);
            
            if (mediaType === 'video') {
                // Display avatar video
                const container = document.getElementById('agoraVideoContainer');
                container.innerHTML = '<div id="avatarPlayer" style="width:100%;height:400px;"></div>';
                user.videoTrack.play('avatarPlayer');
                console.log('✅ Avatar video playing');
            }
            
            if (mediaType === 'audio') {
                user.audioTrack.play();
                console.log('✅ Avatar audio playing');
            }
        });
        
        agoraClient.on('user-unpublished', (user, mediaType) => {
            console.log('User unpublished:', user.uid, mediaType);
        });
        
        // Join the channel
        await agoraClient.join(
            tokenData.app_id,
            channelName,
            tokenData.token,
            tokenData.uid
        );
        
        console.log('✅ Joined channel:', channelName);
        
        // Create and publish local audio track
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await agoraClient.publish([localAudioTrack]);
        
        console.log('✅ Published local audio');
        
        // Update UI
        updateVoiceStatus('Connected with Avatar - Speak to Luna!', 'success');
        document.getElementById('startVoiceBtn').classList.add('d-none');
        document.getElementById('stopVoiceBtn').classList.remove('d-none');
        
        console.log('✅ Avatar agent ready! The AI will listen and respond automatically.');
        
    } catch (error) {
        console.error('❌ Error starting avatar agent:', error);
        alert('Failed to start avatar agent: ' + error.message);
        updateVoiceStatus('Not Connected', 'secondary');
    } finally {
        showLoading(false);
    }
}

async function stopVoiceChat() {
    showLoading(true);
    
    try {
        // Stop conversational AI agent if active
        if (conversationalAIActive) {
            const channelName = document.getElementById('channelName').value.trim();
            await fetch('/api/agora/conversational-ai/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    channel_name: channelName
                })
            });
            conversationalAIActive = false;
            console.log('✅ Stopped Conversational AI agent');
        }
        
        // Stop speech recognition
        if (recognition) {
            recognition.stop();
            isListening = false;
        }
        
        // Close local tracks
        if (localAudioTrack) {
            localAudioTrack.close();
            localAudioTrack = null;
        }
        
        if (localVideoTrack) {
            localVideoTrack.close();
            localVideoTrack = null;
        }
        
        // Leave the channel
        if (agoraClient) {
            await agoraClient.leave();
            agoraClient = null;
        }
        
        // Clear remote users
        remoteUsers = {};
        
        // Clear video container
        const container = document.getElementById('agoraVideoContainer');
        if (container) {
            container.innerHTML = '';
        }
        
        // Update UI
        updateVoiceStatus('Not Connected', 'secondary');
        document.getElementById('startVoiceBtn').classList.remove('d-none');
        document.getElementById('stopVoiceBtn').classList.add('d-none');
        
    } catch (error) {
        console.error('Error stopping voice chat:', error);
    } finally {
        showLoading(false);
    }
}

// Initialize speech recognition
function initializeSpeechRecognition() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        isListening = true;
        updateVoiceStatus('Listening...', 'success');
    };
    
    recognition.onresult = async (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim();
        
        console.log('🗣️ User said:', transcript);
        
        // Barge-in: If Luna is speaking, interrupt her
        if (isSpeaking) {
            console.log('🛑 Barge-in detected! Stopping Luna...');
            interruptSpeech();
        }
        
        updateVoiceStatus('Processing...', 'warning');
        
        // Send to AI agent
        await processVoiceInput(transcript);
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            console.log('No speech detected, continuing to listen...');
        }
    };
    
    recognition.onend = () => {
        console.log('Speech recognition ended');
        if (agoraClient) {
            // Restart recognition if still connected
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Failed to restart recognition:', e);
                }
            }, 100);
        }
    };
    
    // Start recognition
    try {
        recognition.start();
    } catch (e) {
        console.error('Failed to start recognition:', e);
    }
}

// Process voice input through AI agent
async function processVoiceInput(text) {
    try {
        // Send to chat API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                session_id: 'voice_' + Date.now()
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error('AI response error:', data.error);
            await speakResponse('Sorry, I encountered an error. Please try again.');
        } else {
            console.log('🤖 Luna says:', data.response);
            await speakResponse(data.response);
        }
        
        updateVoiceStatus('Listening...', 'success');
        
    } catch (error) {
        console.error('Error processing voice input:', error);
        await speakResponse('Sorry, I encountered an error. Please try again.');
        updateVoiceStatus('Listening...', 'success');
    }
}

// Play greeting message
async function playGreeting(text) {
    await speakResponse(text);
}

// Speak response using TTS
async function speakResponse(text) {
    try {
        isSpeaking = true;
        updateVoiceStatus('Speaking...', 'info');
        
        // Try ElevenLabs TTS first
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            
            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                currentAudio = new Audio(audioUrl);
                
                // Wait for audio to finish playing
                await new Promise((resolve, reject) => {
                    currentAudio.onended = () => {
                        isSpeaking = false;
                        currentAudio = null;
                        resolve();
                    };
                    currentAudio.onerror = reject;
                    
                    // Check if already interrupted
                    if (!isSpeaking) {
                        resolve();
                        return;
                    }
                    
                    currentAudio.play().catch(reject);
                });
                
                // Only update status if not interrupted
                if (isSpeaking) {
                    isSpeaking = false;
                    updateVoiceStatus('Listening...', 'success');
                }
                return;
            }
        } catch (e) {
            console.warn('ElevenLabs TTS not available, falling back to browser TTS:', e);
        }
        
        // Fallback to browser's speech synthesis
        if ('speechSynthesis' in window) {
            speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
            speechSynthesisUtterance.lang = 'en-US';
            speechSynthesisUtterance.rate = 0.9;
            speechSynthesisUtterance.pitch = 1.0;
            
            // Wait for speech to finish
            await new Promise((resolve) => {
                speechSynthesisUtterance.onend = () => {
                    isSpeaking = false;
                    speechSynthesisUtterance = null;
                    resolve();
                };
                
                speechSynthesisUtterance.onerror = () => {
                    isSpeaking = false;
                    speechSynthesisUtterance = null;
                    resolve();
                };
                
                // Check if already interrupted
                if (!isSpeaking) {
                    resolve();
                    return;
                }
                
                window.speechSynthesis.speak(speechSynthesisUtterance);
            });
        } else {
            console.error('No TTS available');
            isSpeaking = false;
        }
        
        // Only update status if not interrupted
        if (isSpeaking) {
            isSpeaking = false;
            updateVoiceStatus('Listening...', 'success');
        }
        
    } catch (error) {
        console.error('Error speaking response:', error);
        isSpeaking = false;
        updateVoiceStatus('Listening...', 'success');
    }
}

// Interrupt speech (barge-in)
function interruptSpeech() {
    console.log('🛑 Interrupting Luna\'s speech...');
    
    // Stop HTML5 audio (ElevenLabs)
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Stop browser speech synthesis
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speechSynthesisUtterance = null;
    }
    
    // Reset state
    isSpeaking = false;
    
    // Update UI immediately
    updateVoiceStatus('Processing...', 'warning');
}

async function handleUserPublished(user, mediaType) {
    console.log('User published:', user.uid, mediaType);
    
    await agoraClient.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
        remoteUsers[user.uid] = user;
        
        // Play remote video
        const container = document.getElementById('agoraVideoContainer');
        const playerDiv = document.createElement('div');
        playerDiv.id = `player-${user.uid}`;
        playerDiv.style.width = '100%';
        playerDiv.style.height = '100%';
        container.appendChild(playerDiv);
        
        user.videoTrack.play(playerDiv);
    }
    
    if (mediaType === 'audio') {
        remoteUsers[user.uid] = user;
        user.audioTrack.play();
    }
}

function handleUserUnpublished(user, mediaType) {
    console.log('User unpublished:', user.uid, mediaType);
    
    if (mediaType === 'video') {
        const playerDiv = document.getElementById(`player-${user.uid}`);
        if (playerDiv) {
            playerDiv.remove();
        }
    }
    
    delete remoteUsers[user.uid];
}

function updateVoiceStatus(message, type) {
    const statusElement = document.getElementById('voiceStatus');
    statusElement.innerHTML = `<span class="badge bg-${type}">${message}</span>`;
}

