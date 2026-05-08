// Check for SpeechRecognition support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
}

// Elements
const micBtn = document.getElementById('mic-btn');
const micBtnText = document.getElementById('mic-btn-text');
const output = document.getElementById('transcription-output');
const languageSelect = document.getElementById('language-select');
const statusText = document.querySelector('.status-text');
const statusIndicator = document.getElementById('status');
const visualizer = document.getElementById('visualizer');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const toast = document.getElementById('toast');

// Recognition Instance
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = languageSelect.value;

let isListening = false;
let noteContent = ''; // Text from previous sessions
let currentSessionFinal = ''; // Finalized text in the current session

// Event Listeners
micBtn.addEventListener('click', toggleListening);
languageSelect.addEventListener('change', updateLanguage);
copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearText);

function toggleListening() {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

function startListening() {
    try {
        // Sync noteContent with the actual textarea value in case the user typed manually
        noteContent = output.value;
        if (noteContent && !noteContent.endsWith(' ')) {
            noteContent += ' ';
        }
        
        currentSessionFinal = ''; // Reset session text
        recognition.start();
        isListening = true;
        updateUI(true);
    } catch (err) {
        console.error("Speech recognition error:", err);
        statusText.innerText = "Error accessing microphone";
    }
}

function stopListening() {
    isListening = false; // Mark as not listening first to prevent auto-restart
    recognition.stop();
    updateUI(false);
}

function updateLanguage() {
    recognition.lang = languageSelect.value;
    if (isListening) {
        stopListening();
        setTimeout(startListening, 300);
    }
}

function updateUI(listening) {
    if (listening) {
        micBtn.classList.add('listening');
        micBtnText.innerText = "Stop Listening";
        statusIndicator.classList.add('listening');
        statusText.innerText = "Listening...";
        visualizer.classList.add('active');
    } else {
        micBtn.classList.remove('listening');
        micBtnText.innerText = "Start Listening";
        statusIndicator.classList.remove('listening');
        statusText.innerText = "Ready to record";
        visualizer.classList.remove('active');
    }
}

// Recognition Handlers
recognition.onresult = (event) => {
    let interimTranscript = '';
    let sessionFinal = '';

    // Iterate through all results in the current session
    for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            sessionFinal += transcript + ' ';
        } else {
            interimTranscript += transcript;
        }
    }

    currentSessionFinal = sessionFinal;
    
    // Combine noteContent (saved before session) + sessionFinal + interim
    output.value = noteContent + sessionFinal + interimTranscript;
    
    // Auto scroll to bottom
    output.scrollTop = output.scrollHeight;
};

recognition.onerror = (event) => {
    console.error("Recognition Error:", event.error);
    
    // On mobile, 'no-speech' is common and shouldn't stop the UI state
    if (event.error === 'no-speech') {
        return; 
    }
    
    if (event.error === 'not-allowed') {
        statusText.innerText = "Permission Denied";
        stopListening();
    }
};

recognition.onend = () => {
    // This is the critical fix for mobile auto-restart & duplication
    if (isListening) {
        // Session ended unexpectedly (common on mobile). 
        // Save what was finalized and restart.
        noteContent += currentSessionFinal;
        currentSessionFinal = '';
        
        try {
            recognition.start();
        } catch (e) {
            // If it fails to restart, just update UI
            console.error("Failed to auto-restart:", e);
            stopListening();
        }
    }
};

// Utils
function copyToClipboard() {
    const text = output.value;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        showToast();
    });
}

function clearText() {
    output.value = '';
    noteContent = '';
    currentSessionFinal = '';
}

function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Add some subtle interaction to the title
const title = document.getElementById('main-title');
title.addEventListener('mousemove', (e) => {
    const { offsetX, offsetY } = e;
    const { width, height } = title.getBoundingClientRect();
    const moveX = (offsetX / width - 0.5) * 10;
    const moveY = (offsetY / height - 0.5) * 10;
    title.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

title.addEventListener('mouseleave', () => {
    title.style.transform = `translate(0, 0)`;
});
