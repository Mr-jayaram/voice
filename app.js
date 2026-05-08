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
let noteContent = ''; // Stores the text that was in the textarea before the current recording session

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
        // Capture existing text in the textarea so we can append to it
        noteContent = output.value;
        if (noteContent && !noteContent.endsWith(' ')) {
            noteContent += ' ';
        }
        
        recognition.start();
        isListening = true;
        updateUI(true);
    } catch (err) {
        console.error("Speech recognition error:", err);
        statusText.innerText = "Error accessing microphone";
    }
}

function stopListening() {
    recognition.stop();
    isListening = false;
    updateUI(false);
}

function updateLanguage() {
    recognition.lang = languageSelect.value;
    if (isListening) {
        stopListening();
        setTimeout(startListening, 300); // Restart with new language
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
    let finalTranscript = '';

    // Iterate through all results in the current session
    for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
        } else {
            interimTranscript += transcript;
        }
    }

    // Combine previous session text with current session results
    output.value = noteContent + finalTranscript + interimTranscript;
    
    // Auto scroll to bottom
    output.scrollTop = output.scrollHeight;
};

recognition.onerror = (event) => {
    console.error("Recognition Error:", event.error);
    stopListening();
    statusText.innerText = `Error: ${event.error}`;
};

recognition.onend = () => {
    if (isListening) {
        // Automatically restart if it was supposed to be continuous but ended (e.g. network hiccup)
        recognition.start();
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
