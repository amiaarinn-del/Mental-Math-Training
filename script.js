/**
 * GAME HITUNG CEPAT (JavaScript Logic + Web Audio API)
 */

// ==========================================
// 1. SYSTEM AUDIO (WEB AUDIO API)
// ==========================================
let audioCtx = null;
let bgmInterval = null;
let isMuted = false;

// Inisialisasi Audio Context saat interaksi pertama
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Fitur 1: Suara Klik Tombol
function playSoundClick() {
    if (isMuted) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
}

// Fitur 2: Suara Jawaban Benar (Nada Ceria)
function playSoundCorrect() {
    if (isMuted) return;
    initAudio();
    const now = audioCtx.currentTime;

    // Nada C5 - E5 - G5
    [523.25, 659.25, 783.99].forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0.18, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.15);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.15);
    });
}

// Fitur 3: Suara Jawaban Salah (Nada Rendah)
function playSoundWrong() {
    if (isMuted) return;
    initAudio();
    const now = audioCtx.currentTime;

    // Nada F3 -> C3
    [174.61, 130.81].forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0.2, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.12 + 0.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.2);
    });
}

// Fitur 4: Background Music (BGM Chiptune Halus)
let bgmStep = 0;
const bgmNotes = [261.63, 329.63, 392.00, 329.63, 293.66, 349.23, 440.00, 349.23];

function startBGM() {
    stopBGM();
    if (isMuted) return;
    initAudio();
    bgmStep = 0;

    bgmInterval = setInterval(() => {
        if (isMuted || !audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(bgmNotes[bgmStep % bgmNotes.length], now);

        gain.gain.setValueAtTime(0.03, now); // Volume dibuat lembut agar tidak mengganggu
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.22);

        bgmStep++;
    }, 260);
}

function stopBGM() {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
}

// Otomatis jalankan suara klik pada semua tombol bertipe .btn
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn')) {
            playSoundClick();
        }
    });
});


// ==========================================
// 2. STATE MANAGEMENT & SETTING
// ==========================================
const setting = {
    operators: [],
    panjangSoal: null,
    difficulty: null,
    durasiTimer: 60
};

let poinBenar = 0;
let poinSalah = 0;
let poinJumlahSoal = 0;
let jawabanBenarCurrent = 0;

let timerInterval = null;
let sisaWaktu = 60;
let waktuSoalMulai = 0;
let totalWaktuJawab = 0;

function tampilkanScreen(idScreen) {
    const semuaScreen = document.querySelectorAll('.screen');
    semuaScreen.forEach(s => s.classList.remove('active'));

    const screenTarget = document.getElementById(idScreen);
    screenTarget.classList.add('active');
}

function bukaSetting() {
    tampilkanScreen('screen-setting');
}

function simpanSetting() {
    const checkboxes = document.querySelectorAll('.op-check:checked');
    setting.operators = Array.from(checkboxes).map(cb => cb.value);

    const pSoal = parseInt(document.getElementById('panjang-soal').value);
    const diff = parseInt(document.getElementById('difficulty').value);
    const durasi = parseInt(document.getElementById('durasi-timer').value);

    if (setting.operators.length === 0) {
        alert("Operator tidak boleh kosong! Harap pilih minimal 1.");
        return;
    }
    if (isNaN(pSoal) || pSoal < 2) {
        alert("Panjang soal minimal harus 2!");
        return;
    }
    if (isNaN(diff)) {
        alert("Harap pilih difficulty!");
        return;
    }

    setting.panjangSoal = pSoal;
    setting.difficulty = diff;
    setting.durasiTimer = (!isNaN(durasi) && durasi >= 10) ? durasi : 60;

    alert("Setting berhasil disimpan!");
    tampilkanScreen('screen-menu');
}

function resetSetting() {
    setting.operators = [];
    setting.panjangSoal = null;
    setting.difficulty = null;
    setting.durasiTimer = 60;

    document.querySelectorAll('.op-check').forEach(cb => cb.checked = false);
    document.getElementById('panjang-soal').value = '';
    document.getElementById('difficulty').value = '';
    document.getElementById('durasi-timer').value = '';

    alert("Setting berhasil di-reset!");
}


// ==========================================
// 3. MATH ENGINE
// ==========================================
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buatSoal() {
    let lower = 1, higher = 100;
    if (setting.difficulty === 2) {
        lower = 100;
        higher = 1000;
    } else if (setting.difficulty === 3) {
        lower = 10000;
        higher = 100000;
    }

    const soalAngka = [];
    const soalOperator = [];

    for (let i = 0; i < setting.panjangSoal; i++) {
        soalAngka.push(getRandomInt(lower, higher));
    }

    for (let i = 0; i < setting.panjangSoal - 1; i++) {
        const randomOp = setting.operators[Math.floor(Math.random() * setting.operators.length)];
        soalOperator.push(randomOp);
    }

    const token = [];
    for (let i = 0; i < soalOperator.length; i++) {
        token.push(soalAngka[i]);
        token.push(soalOperator[i]);
    }
    token.push(soalAngka[soalAngka.length - 1]);

    const teksSoal = token.join(' ');
    const teksJawaban = new Function(`return ${teksSoal}`)();

    return { teksSoal, teksJawaban };
}


// ==========================================
// 4. TIMER & GAMEPLAY LOGIC
// ==========================================
function startGlobalTimer() {
    stopTimer();
    sisaWaktu = setting.durasiTimer;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        sisaWaktu--;
        updateTimerDisplay();

        if (sisaWaktu <= 0) {
            stopTimer();
            alert("⏰ Waktu Sesi Habis!");
            selesaiGame();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    const timerBox = document.getElementById('timer-box');

    if (timerDisplay) timerDisplay.innerText = sisaWaktu;

    if (timerBox) {
        if (sisaWaktu <= 5) {
            timerBox.classList.add('warning');
        } else {
            timerBox.classList.remove('warning');
        }
    }
}

function mulaiGame() {
    if (setting.operators.length === 0 || !setting.panjangSoal || !setting.difficulty) {
        alert("Anda belum melakukan setting! Harap atur setting terlebih dahulu.");
        bukaSetting();
        return;
    }

    poinBenar = 0;
    poinSalah = 0;
    poinJumlahSoal = 0;
    totalWaktuJawab = 0;

    tampilkanScreen('screen-game');
    startGlobalTimer();
    startBGM(); // <--- Meringankan & memutar BGM saat game mulai
    generateSoalBaru();
}

function generateSoalBaru() {
    if (sisaWaktu <= 0) return;

    const { teksSoal, teksJawaban } = buatSoal();
    jawabanBenarCurrent = teksJawaban;

    const displayBox = document.getElementById('display-soal');
    displayBox.innerText = teksSoal;

    displayBox.classList.remove('pop-anim');
    void displayBox.offsetWidth;
    displayBox.classList.add('pop-anim');

    document.getElementById('user-jawab').value = '';
    document.getElementById('user-jawab').focus();

    waktuSoalMulai = Date.now();
}

function submitJawaban(event) {
    event.preventDefault();

    const durasiDetik = (Date.now() - waktuSoalMulai) / 1000;
    totalWaktuJawab += durasiDetik;

    const inputUser = parseFloat(document.getElementById('user-jawab').value);
    const feedbackEl = document.getElementById('feedback');

    const isCorrect = Math.abs(inputUser - jawabanBenarCurrent) < 0.01;
    poinJumlahSoal++;

    feedbackEl.className = "feedback";
    void feedbackEl.offsetWidth;

    if (isCorrect) {
        poinBenar++;
        feedbackEl.className = "feedback correct";
        feedbackEl.innerText = `✓ Benar! (${durasiDetik.toFixed(2)}s)`;
        playSoundCorrect(); // <--- Suara Jawaban Benar
    } else {
        poinSalah++;
        feedbackEl.className = "feedback wrong";
        feedbackEl.innerText = `✗ Salah! Jawaban: ${Number(jawabanBenarCurrent.toFixed(2))} (${durasiDetik.toFixed(2)}s)`;
        playSoundWrong(); // <--- Suara Jawaban Salah
    }

    setTimeout(() => {
        feedbackEl.innerText = '';
        feedbackEl.className = "feedback";
        generateSoalBaru();
    }, 1000);
}

function selesaiGame() {
    stopTimer();
    stopBGM(); // <--- Hentikan BGM saat game selesai/quit

    const rataRata = poinJumlahSoal > 0 ? (totalWaktuJawab / poinJumlahSoal).toFixed(2) : 0;

    document.getElementById('stat-benar').innerText = poinBenar;
    document.getElementById('stat-salah').innerText = poinSalah;
    document.getElementById('stat-total').innerText = poinJumlahSoal;
    document.getElementById('stat-rata-waktu').innerText = `${rataRata}s / soal`;
    document.getElementById('feedback').innerText = '';

    tampilkanScreen('screen-stat');
}