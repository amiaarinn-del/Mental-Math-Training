/**
 * GAME HITUNG CEPAT (Rimath) - Dual-Channel Audio System Revision
 * Includes: PEMDAS Math Engine, Streak System, Endless Mode, & Separate BGM/SFX Channels
 */

// ==========================================
// 1. STATE & KONFIGURASI PENGATURAN
// ==========================================
const setting = {
    operators: [],
    panjangSoal: null,
    difficulty: null,
    durasiTimer: 60,
    endlessMode: false,
    // Audio Settings (Default: BGM = 30%, SFX = 70%)
    bgmVolume: 30,
    sfxVolume: 70,
    bgmMuted: false,
    sfxMuted: false
};

let poinBenar = 0;
let poinSalah = 0;
let poinJumlahSoal = 0;
let jawabanBenarCurrent = 0;
let currentStreak = 0;
let maxStreak = 0;

let timerInterval = null;
let feedbackTimeout = null;
let sfxPreviewTimeout = null;
let isProcessingAnswer = false;
let sisaWaktu = 60;
let waktuBerjalan = 0;
let waktuSoalMulai = 0;
let totalWaktuJawab = 0;

// ==========================================
// 2. DUAL-CHANNEL AUDIO ENGINE (WEB AUDIO API)
// ==========================================
let audioCtx = null;
let bgmGainNode = null;
let sfxGainNode = null;
let bgmSourceNode = null;

const bgmAudio = new Audio("Music/BGM.mpeg");
bgmAudio.loop = true;

let isBgmInitialized = false;

// Lazily inisialisasi AudioContext & Gain Nodes tunggal
function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();

            // Channel 1: BGM Gain Node
            bgmGainNode = audioCtx.createGain();
            bgmGainNode.connect(audioCtx.destination);

            // Channel 2: SFX Gain Node (Terpisah penuh dari BGM)
            sfxGainNode = audioCtx.createGain();
            sfxGainNode.connect(audioCtx.destination);

            // Hubungkan bgmAudio ke bgmGainNode
            try {
                bgmSourceNode = audioCtx.createMediaElementSource(bgmAudio);
                bgmSourceNode.connect(bgmGainNode);
            } catch (e) {
                console.log("Audio node setup fallback if CORS limits MediaElementSource.");
            }
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Aktifkan Audio pada klik pertama pengguna
document.addEventListener('click', initBGM, { once: true });

function initBGM() {
    if (isBgmInitialized) return;

    getAudioContext();
    updateBgmVolume();
    updateSfxVolume();

    bgmAudio.play().then(() => {
        isBgmInitialized = true;
    }).catch(err => console.log("Autoplay ditahan browser, menunggu interaksi pengguna."));
}

// Update Volume BGM dengan Transisi Halus (Smooth Transition)
function updateBgmVolume() {
    const actualVol = setting.bgmMuted ? 0 : (setting.bgmVolume / 100);

    if (audioCtx && bgmGainNode) {
        bgmGainNode.gain.setTargetAtTime(actualVol, audioCtx.currentTime, 0.02);
    }
    if (!bgmSourceNode) {
        bgmAudio.volume = actualVol;
    }
}

// Update Volume SFX dengan Transisi Halus
function updateSfxVolume() {
    const actualVol = setting.sfxMuted ? 0 : (setting.sfxVolume / 100);

    if (audioCtx && sfxGainNode) {
        sfxGainNode.gain.setTargetAtTime(actualVol, audioCtx.currentTime, 0.02);
    }
}

// Realtime Handler Slider BGM
function onBgmVolumeInput(val) {
    setting.bgmVolume = parseInt(val, 10);

    const badge = document.getElementById('bgm-volume-value');
    if (badge) badge.innerText = `${setting.bgmVolume}%`;

    updateBgmVolume();
    simpanSettingKeStorage();
}

// Realtime Handler Slider SFX
// Realtime Handler Slider SFX dengan Preview Suara
function onSfxVolumeInput(val) {
    setting.sfxVolume = parseInt(val, 10);

    const badge = document.getElementById('sfx-volume-value');
    if (badge) badge.innerText = `${setting.sfxVolume}%`;

    updateSfxVolume();
    simpanSettingKeStorage();

    // Mainkan sampel suara SFX saat slider digeser
    if (sfxPreviewTimeout) clearTimeout(sfxPreviewTimeout);
    sfxPreviewTimeout = setTimeout(() => {
        playSoundEffect('success');
    }, 80); // Debounce 80ms agar suara stabil
}

// Toggle Mute BGM (Nilai Slider Tidak Berubah)
function toggleMuteBGM() {
    setting.bgmMuted = !setting.bgmMuted;

    const btn = document.getElementById('btn-mute-bgm');
    if (btn) {
        if (setting.bgmMuted) {
            btn.innerText = '🔇';
            btn.classList.add('muted');
        } else {
            btn.innerText = '🔊';
            btn.classList.remove('muted');
        }
    }

    if (!isBgmInitialized) initBGM();
    updateBgmVolume();
    simpanSettingKeStorage();
}

// Toggle Mute SFX (Nilai Slider Tidak Berubah)
function toggleMuteSFX() {
    setting.sfxMuted = !setting.sfxMuted;

    const btn = document.getElementById('btn-mute-sfx');
    if (btn) {
        if (setting.sfxMuted) {
            btn.innerText = '🔇';
            btn.classList.add('muted');
        } else {
            btn.innerText = '🔊';
            btn.classList.remove('muted');
        }
    }

    updateSfxVolume();
    if (!setting.sfxMuted) playSoundEffect('success');
    simpanSettingKeStorage();
}

// ==========================================
// 3. SOUND EFFECT (SFX) SYNTHESIZER
// ==========================================
function playSoundEffect(type) {
    if (setting.sfxMuted || setting.sfxVolume === 0) return;

    const ctx = getAudioContext();
    if (!ctx || !sfxGainNode) return;

    let sfxDuration = 0.2;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    // Hanya terhubung ke SFX Gain Node (TIDAK menyentuh BGM)
    osc.connect(noteGain);
    noteGain.connect(sfxGainNode);

    const now = ctx.currentTime;

    if (type === 'success') {
        sfxDuration = 0.15;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + sfxDuration);
        noteGain.gain.setValueAtTime(0.3, now);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + sfxDuration);
        osc.start(now); osc.stop(now + sfxDuration);

    } else if (type === 'combo5') {
        sfxDuration = 0.3;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        noteGain.gain.setValueAtTime(0.35, now);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + sfxDuration);
        osc.start(now); osc.stop(now + sfxDuration);

    } else if (type === 'combo10') {
        sfxDuration = 0.45;
        osc.type = 'square';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        osc.frequency.setValueAtTime(1174.66, now + 0.2);
        noteGain.gain.setValueAtTime(0.3, now);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + sfxDuration);
        osc.start(now); osc.stop(now + sfxDuration);

    } else if (type === 'wrong') {
        sfxDuration = 0.2;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(164.81, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + sfxDuration);
        noteGain.gain.setValueAtTime(0.35, now);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + sfxDuration);
        osc.start(now); osc.stop(now + sfxDuration);
    }
}

// Helper untuk simpan ke LocalStorage
function simpanSettingKeStorage() {
    localStorage.setItem('rimath_setting', JSON.stringify(setting));
}

// ==========================================
// 4. STREAK UI
// ==========================================
function updateStreakUI(isIncrement = true) {
    const streakDisplay = document.getElementById('streak-display');
    const streakBox = document.getElementById('streak-box');

    if (!streakDisplay || !streakBox) return;

    streakDisplay.innerText = currentStreak;

    streakBox.classList.remove(
        'streak-anim-up',
        'streak-anim-break',
        'milestone-5',
        'milestone-10',
        'milestone-20'
    );

    void streakBox.offsetWidth;

    if (isIncrement && currentStreak > 0) {
        streakBox.classList.add('streak-anim-up');
        if (currentStreak >= 20) streakBox.classList.add('milestone-20');
        else if (currentStreak >= 10) streakBox.classList.add('milestone-10');
        else if (currentStreak >= 5) streakBox.classList.add('milestone-5');
    } else if (!isIncrement) {
        streakBox.classList.add('streak-anim-break');
    }
}

// ==========================================
// 5. NAVIGASI TAMPILAN & INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    muatSettingDariStorage();
});

function tampilkanScreen(idScreen) {
    const semuaScreen = document.querySelectorAll('.screen');
    semuaScreen.forEach(s => s.classList.remove('active'));
    const screenTarget = document.getElementById(idScreen);

    if (screenTarget) screenTarget.classList.add('active');
}

function bukaSetting() {
    tampilkanScreen('screen-setting');
    toggleEndlessMode();
}

// ==========================================
// 6. LOGIKA SETTING & LOCAL STORAGE
// ==========================================
function toggleEndlessMode() {
    const endlessCheck = document.getElementById('endless-mode');
    const inputDurasi = document.getElementById('durasi-timer');

    if (!endlessCheck || !inputDurasi) return;
    if (endlessCheck.checked) {
        inputDurasi.disabled = true;
        inputDurasi.style.opacity = "0.5";
    } else {
        inputDurasi.disabled = false;
        inputDurasi.style.opacity = "1";
    }
}

function simpanSetting() {
    const checkboxes = document.querySelectorAll('.op-check:checked');
    setting.operators = Array.from(checkboxes).map(cb => cb.value);

    let pSoal = parseInt(document.getElementById('panjang-soal').value);
    let durasi = parseInt(document.getElementById('durasi-timer').value);
    const diff = parseInt(document.getElementById('difficulty').value);
    const isEndless = document.getElementById('endless-mode').checked;

    if (setting.operators.length === 0) {
        alert("Operator tidak boleh kosong! Harap pilih minimal 1.");
        return;
    }
    if (isNaN(pSoal) || pSoal < 2 || pSoal > 10) {
        alert("Panjang soal harus antara 2 hingga 10!");
        return;
    }
    if (isNaN(diff)) {
        alert("Harap pilih difficulty!");
        return;
    }

    setting.panjangSoal = pSoal;
    setting.difficulty = diff;
    setting.endlessMode = isEndless;
    setting.durasiTimer = (!isNaN(durasi) && durasi >= 10) ? durasi : 60;

    simpanSettingKeStorage();

    alert("Setting berhasil disimpan!");
    tampilkanScreen('screen-menu');
}

function resetSetting() {
    setting.operators = [];
    setting.panjangSoal = null;
    setting.difficulty = null;
    setting.durasiTimer = 60;
    setting.endlessMode = false;
    setting.bgmVolume = 30;
    setting.sfxVolume = 70;
    setting.bgmMuted = false;
    setting.sfxMuted = false;

    document.querySelectorAll('.op-check').forEach(cb => cb.checked = false);
    document.getElementById('panjang-soal').value = '';
    document.getElementById('difficulty').value = '';
    document.getElementById('durasi-timer').value = '';

    // Reset UI Audio
    const bgmSlider = document.getElementById('bgm-volume');
    const sfxSlider = document.getElementById('sfx-volume');
    if (bgmSlider) bgmSlider.value = 30;
    if (sfxSlider) sfxSlider.value = 70;

    const bgmBadge = document.getElementById('bgm-volume-value');
    const sfxBadge = document.getElementById('sfx-volume-value');
    if (bgmBadge) bgmBadge.innerText = '30%';
    if (sfxBadge) sfxBadge.innerText = '70%';

    const btnBgm = document.getElementById('btn-mute-bgm');
    const btnSfx = document.getElementById('btn-mute-sfx');
    if (btnBgm) { btnBgm.innerText = '🔊'; btnBgm.classList.remove('muted'); }
    if (btnSfx) { btnSfx.innerText = '🔊'; btnSfx.classList.remove('muted'); }

    updateBgmVolume();
    updateSfxVolume();

    const endlessCheck = document.getElementById('endless-mode');
    if (endlessCheck) endlessCheck.checked = false;
    toggleEndlessMode();

    localStorage.removeItem('rimath_setting');
    alert("Setting berhasil di-reset!");
}

function muatSettingDariStorage() {
    const savedData = localStorage.getItem('rimath_setting');

    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            setting.operators = parsed.operators || [];
            setting.panjangSoal = parsed.panjangSoal || null;
            setting.difficulty = parsed.difficulty || null;
            setting.durasiTimer = parsed.durasiTimer || 60;
            setting.endlessMode = parsed.endlessMode || false;

            if (parsed.bgmVolume !== undefined) setting.bgmVolume = parsed.bgmVolume;
            if (parsed.sfxVolume !== undefined) setting.sfxVolume = parsed.sfxVolume;
            if (parsed.bgmMuted !== undefined) setting.bgmMuted = parsed.bgmMuted;
            if (parsed.sfxMuted !== undefined) setting.sfxMuted = parsed.sfxMuted;
        } catch (e) {
            console.error("Gagal memuat setting dari LocalStorage", e);
        }
    }

    // Apply ke UI
    document.querySelectorAll('.op-check').forEach(cb => {
        cb.checked = setting.operators.includes(cb.value);
    });
    if (setting.panjangSoal) document.getElementById('panjang-soal').value = setting.panjangSoal;
    if (setting.difficulty) document.getElementById('difficulty').value = setting.difficulty;
    if (setting.durasiTimer) document.getElementById('durasi-timer').value = setting.durasiTimer;

    const bgmSlider = document.getElementById('bgm-volume');
    const sfxSlider = document.getElementById('sfx-volume');
    if (bgmSlider) bgmSlider.value = setting.bgmVolume;
    if (sfxSlider) sfxSlider.value = setting.sfxVolume;

    const bgmBadge = document.getElementById('bgm-volume-value');
    const sfxBadge = document.getElementById('sfx-volume-value');
    if (bgmBadge) bgmBadge.innerText = `${setting.bgmVolume}%`;
    if (sfxBadge) sfxBadge.innerText = `${setting.sfxVolume}%`;

    const btnBgm = document.getElementById('btn-mute-bgm');
    const btnSfx = document.getElementById('btn-mute-sfx');
    if (btnBgm) {
        btnBgm.innerText = setting.bgmMuted ? '🔇' : '🔊';
        if (setting.bgmMuted) btnBgm.classList.add('muted');
        else btnBgm.classList.remove('muted');
    }
    if (btnSfx) {
        btnSfx.innerText = setting.sfxMuted ? '🔇' : '🔊';
        if (setting.sfxMuted) btnSfx.classList.add('muted');
        else btnSfx.classList.remove('muted');
    }

    const endlessCheck = document.getElementById('endless-mode');
    if (endlessCheck) {
        endlessCheck.checked = setting.endlessMode;
        toggleEndlessMode();
    }
}

// ==========================================
// 7. MATH ENGINE
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
// 8. LOGIKA TIMER SESI GAME
// ==========================================
function startGlobalTimer() {
    stopTimer();
    sisaWaktu = setting.durasiTimer;
    waktuBerjalan = 0;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        if (setting.endlessMode) {
            waktuBerjalan++;
            updateTimerDisplay();
        } else {
            sisaWaktu--;
            updateTimerDisplay();

            if (sisaWaktu <= 0) {
                stopTimer();
                alert("⏰ Waktu Sesi Habis!");
                selesaiGame();
            }
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

    if (setting.endlessMode) {
        if (timerDisplay) timerDisplay.innerText = waktuBerjalan;
        if (timerBox) timerBox.classList.remove('warning');
    } else {
        if (timerDisplay) timerDisplay.innerText = sisaWaktu;

        if (timerBox) {
            if (sisaWaktu <= 5) {
                timerBox.classList.add('warning');
            } else {
                timerBox.classList.remove('warning');
            }
        }
    }
}

// ==========================================
// 9. GAMEPLAY & FEEDBACK
// ==========================================
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
    isProcessingAnswer = false;

    currentStreak = 0;
    maxStreak = 0;
    updateStreakUI();

    tampilkanScreen('screen-game');
    startGlobalTimer();
    generateSoalBaru();
}

function generateSoalBaru() {
    if (!setting.endlessMode && sisaWaktu <= 0) return;

    const { teksSoal, teksJawaban } = buatSoal();
    jawabanBenarCurrent = teksJawaban;

    const displayBox = document.getElementById('display-soal');
    displayBox.innerText = teksSoal;

    displayBox.classList.remove('pop-anim');
    void displayBox.offsetWidth;
    displayBox.classList.add('pop-anim');

    const inputUser = document.getElementById('user-jawab');
    inputUser.value = '';
    inputUser.disabled = false;
    inputUser.focus();

    waktuSoalMulai = Date.now();
    isProcessingAnswer = false;
}

function submitJawaban(event) {
    event.preventDefault();

    if (isProcessingAnswer) return;
    isProcessingAnswer = true;

    const inputUser = document.getElementById('user-jawab');
    inputUser.disabled = true;

    const durasiDetik = (Date.now() - waktuSoalMulai) / 1000;
    totalWaktuJawab += durasiDetik;

    const nilaiUser = parseFloat(inputUser.value);
    const feedbackEl = document.getElementById('feedback');

    const isCorrect = Math.abs(nilaiUser - jawabanBenarCurrent) < 0.01;
    poinJumlahSoal++;

    feedbackEl.className = "feedback";
    void feedbackEl.offsetWidth;

    if (isCorrect) {
        poinBenar++;
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);

        if (currentStreak === 5) {
            feedbackEl.innerText = `🔥 5 COMBO! (${durasiDetik.toFixed(2)}s)`;
            playSoundEffect('combo5');
        } else if (currentStreak === 10) {
            feedbackEl.innerText = `🔥 10 COMBO! (${durasiDetik.toFixed(2)}s)`;
            playSoundEffect('combo10');
        } else if (currentStreak === 20 || (currentStreak > 20 && currentStreak % 10 === 0)) {
            feedbackEl.innerText = `🔥 ${currentStreak} COMBO SPECIAL! (${durasiDetik.toFixed(2)}s)`;
            playSoundEffect('combo10');
        } else {
            feedbackEl.innerText = `✓ Benar! (${durasiDetik.toFixed(2)}s)`;
            playSoundEffect('success');
        }
        feedbackEl.className = "feedback correct";
        updateStreakUI(true);
    } else {
        poinSalah++;
        currentStreak = 0;
        updateStreakUI(false);
        playSoundEffect('wrong');

        feedbackEl.className = "feedback wrong";
        feedbackEl.innerText = `✗ Salah! Jawaban: ${Number(jawabanBenarCurrent.toFixed(2))} (${durasiDetik.toFixed(2)}s)`;
    }

    feedbackTimeout = setTimeout(() => {
        feedbackEl.innerText = '';
        feedbackEl.className = "feedback";
        generateSoalBaru();
    }, 1000);
}

// ==========================================
// 10. SELESAI GAME & STATISTIK
// ==========================================
function selesaiGame() {
    stopTimer();

    if (feedbackTimeout) {
        clearTimeout(feedbackTimeout);
        feedbackTimeout = null;
    }
    isProcessingAnswer = false;
    const rataRata = poinJumlahSoal > 0 ? (totalWaktuJawab / poinJumlahSoal).toFixed(2) : 0;
    document.getElementById('stat-benar').innerText = poinBenar;
    document.getElementById('stat-salah').innerText = poinSalah;
    document.getElementById('stat-total').innerText = poinJumlahSoal;
    document.getElementById('stat-rata-waktu').innerText = `${rataRata}s / soal`;

    const statMaxStreak = document.getElementById('stat-max-streak');
    if (statMaxStreak) {
        statMaxStreak.innerText = `🔥 ${maxStreak}`;
    }
    document.getElementById('feedback').innerText = '';
    tampilkanScreen('screen-stat');
}