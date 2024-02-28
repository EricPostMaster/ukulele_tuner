const noteSelector = document.getElementById('note');
const signalBar = document.getElementById('signal-bar');
const noteLabel = document.getElementById('note-label');
const frequencyDisplay = document.getElementById('frequency-display');
const startButton = document.getElementById('start-button');

const targetNotes = {
    'G': 1000,// 392.00,
    'C': 261.63,
    'E': 329.63,
    'A': 440.00
};

let audioContext;
let analyser;
let microphoneStream;

async function setupMicrophone() {
    audioContext = new AudioContext();
    try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(microphoneStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        updateTuner();
    } catch (err) {
        console.error('Error accessing microphone:', err);
    }
}

function getCurrentFrequency() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const peakIndex = getPeak(dataArray);
    const binWidth = audioContext.sampleRate / analyser.fftSize;
    const dominantFrequency = peakIndex * binWidth;

    return dominantFrequency;
}

function getPeak(dataArray) {
    let max = 0;
    let maxIndex = 0;
    for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > max) {
            max = dataArray[i];
            maxIndex = i;
        }
    }
    return maxIndex;
}

function updateTuner() {
    const selectedNote = noteSelector.value;
    const targetFrequency = targetNotes[selectedNote];
    const currentFrequency = getCurrentFrequency();

    const difference = targetFrequency - currentFrequency;
    const maxDifference = 200; // Adjust this value based on the sensitivity of your tuning
    const normalizedDifference = difference / maxDifference;

    signalBar.style.backgroundColor = normalizedDifference >= 0 ? '#000' : '#000';

    // Adjusting the width and position of the needle
    needle.style.left = `${50 - normalizedDifference * 50}%`;

    noteLabel.textContent = `Target Note: ${selectedNote}`;
    frequencyDisplay.textContent = `Detected Frequency: ${currentFrequency.toFixed(2)} Hz`;

    requestAnimationFrame(updateTuner);
}


// Add event listener to update tuner when note selection changes
noteSelector.addEventListener('change', updateTuner);

// Add event listener to start the tuner when the button is clicked
startButton.addEventListener('click', () => {
    setupMicrophone();
    startButton.disabled = true; // Disable the button after it's clicked
});
