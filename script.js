const noteSelector = document.getElementById('note');
const signalBar = document.getElementById('signal-bar');
const noteLabel = document.getElementById('note-label');
const frequencyDisplay = document.getElementById('frequency-display');
const startButton = document.getElementById('start-button');

const targetNotes = {
    'G': 392.00,
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
        analyser.fftSize = 8192; // Increase FFT size for higher frequency resolution
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

    // Apply thresholding
    const threshold = 150; // Adjust the threshold value as needed
    const filteredDataArray = dataArray.map(value => value >= threshold ? value : 0);

    const peakIndex = getPeak(filteredDataArray);
    const binWidth = audioContext.sampleRate / analyser.fftSize;
    const dominantFrequency = peakIndex * binWidth;

    return dominantFrequency;
}

function smooth(dataArray) {
    const smoothedArray = [];
    const smoothingFactor = 0.8; // Adjust the smoothing factor as needed
    let lastValue = 0;

    for (let i = 0; i < dataArray.length; i++) {
        smoothedArray[i] = lastValue * smoothingFactor + dataArray[i] * (1 - smoothingFactor);
        lastValue = smoothedArray[i];
    }

    return smoothedArray;
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
    const maxDifference = 100; // Adjust this value based on the sensitivity of your tuning
    const normalizedDifference = difference / maxDifference;

    signalBar.style.backgroundColor = normalizedDifference >= 0 ? '#fff' : '#fff';

    // Adjusting the width and position of the needle
    needle.style.left = `${50 - normalizedDifference * 50}%`;

    noteLabel.textContent = `Target Note: ${selectedNote}`;
    frequencyDisplay.textContent = `Detected Frequency: ${currentFrequency.toFixed(0)} Hz`;

    requestAnimationFrame(updateTuner);
}


// Add event listener to update tuner when note selection changes
noteSelector.addEventListener('change', updateTuner);

// Add event listener to start the tuner when the button is clicked
startButton.addEventListener('click', () => {
    setupMicrophone();
    startButton.disabled = true; // Disable the button after it's clicked
});
