/**
 * GAME HITUNG CEPAT (JavaScript Logic) - Final & Bug-Free
 * Standar Matematika: PEMDAS (Standar JavaScript)
 */
const setting = {
    operators: [],
    panjangSoal: null,
    difficulty: null,
    durasiTimer: 60,
    endlessMode: false
};

let poinBenar = 0;
let poinSalah = 0;
let poinJumlahSoal = 0;
let jawabanBenarCurrent = 0;
let currentStreak = 0;
let maxStreak = 0;


const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSoundEffect(type) {
    try {
        if (!AudioContextClass) return;
        if (!audioCtx) {
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.start(now);
            osc.stop(now + 0.15);

        } else if (type === 'combo5') {
            // Combo 5
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.08);
            osc.frequency.setValueAtTime(783.99, now + 0.16);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);

        } else if (type === 'combo10') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.setValueAtTime(880, now + 0.1);
            osc.frequency.setValueAtTime(1174.66, now + 0.2);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);

        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(164.81, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    } catch (e) {
        // Abaikan jika browser memblokir audio.
    }
}
// ==========================================
// STREAK UI
// ==========================================
function updateStreakUI(isIncrement = true) {
    const streakDisplay = document.getElementById('streak-display');
    const streakBox = document.getElementById('streak-box');

    if (!streakDisplay || !streakBox) return;

    // Update angka streak
    streakDisplay.innerText = currentStreak;

    // Reset animasi
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
        if (currentStreak >= 20) {
            streakBox.classList.add('milestone-20');
        } else if (currentStreak >= 10) {
            streakBox.classList.add('milestone-10');
        } else if (currentStreak >= 5) {
            streakBox.classList.add('milestone-5');
        }
    } else if (!isIncrement) {
        streakBox.classList.add('streak-anim-break');
    }
}
let timerInterval = null;
let feedbackTimeout = null;
let isProcessingAnswer = false;
let sisaWaktu = 60;
let waktuBerjalan = 0;
let waktuSoalMulai = 0;
let totalWaktuJawab = 0;
// ==========================================
// 2. NAVIGASI TAMPILAN & INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    muatSettingDariStorage();
});

function tampilkanScreen(idScreen) {
    const semuaScreen = document.querySelectorAll('.screen');
    semuaScreen.forEach(s => s.classList.remove('active'));
    const screenTarget = document.getElementById(idScreen);

    screenTarget.classList.add('active');
}
function bukaSetting() {
    tampilkanScreen('screen-setting');
    toggleEndlessMode();
}
// ==========================================
// 3. LOGIKA SETTING & LOCAL STORAGE
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

    // Simpan ke LocalStorage
    localStorage.setItem('rimath_setting', JSON.stringify(setting));

    alert("Setting berhasil disimpan!");
    tampilkanScreen('screen-menu');
}
function resetSetting() {
    setting.operators = [];
    setting.panjangSoal = null;
    setting.difficulty = null;
    setting.durasiTimer = 60;
    setting.endlessMode = false;

    document.querySelectorAll('.op-check').forEach(cb => cb.checked = false);
    document.getElementById('panjang-soal').value = '';
    document.getElementById('difficulty').value = '';
    document.getElementById('durasi-timer').value = '';

    const endlessCheck = document.getElementById('endless-mode');
    if (endlessCheck) endlessCheck.checked = false;
    toggleEndlessMode();

    localStorage.removeItem('rimath_setting');
    alert("Setting berhasil di-reset!");
}

function muatSettingDariStorage() {
    const savedData = localStorage.getItem('rimath_setting');
    if (!savedData) return;

    try {
        const parsed = JSON.parse(savedData);
        setting.operators = parsed.operators || [];
        setting.panjangSoal = parsed.panjangSoal || null;
        setting.difficulty = parsed.difficulty || null;
        setting.durasiTimer = parsed.durasiTimer || 60;
        setting.endlessMode = parsed.endlessMode || false;

        // Sinkronkan UI Form Setting dengan data tersimpan
        document.querySelectorAll('.op-check').forEach(cb => {
            cb.checked = setting.operators.includes(cb.value);
        });
        if (setting.panjangSoal) document.getElementById('panjang-soal').value = setting.panjangSoal;
        if (setting.difficulty) document.getElementById('difficulty').value = setting.difficulty;
        if (setting.durasiTimer) document.getElementById('durasi-timer').value = setting.durasiTimer;

        const endlessCheck = document.getElementById('endless-mode');
        if (endlessCheck) {
            endlessCheck.checked = setting.endlessMode;
            toggleEndlessMode();
        }
    } catch (e) {
        console.error("Gagal memuat setting dari LocalStorage", e);
    }
}

// ==========================================
// 4. MATH ENGINE
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
// 5. LOGIKA TIMER SESI GAME
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
// 6. GAMEPLAY & FEEDBACK
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


    // Reset streak saat sesi baru
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


// ==========================================
// SUBMIT JAWABAN + STREAK
// ==========================================
function submitJawaban(event) {
    event.preventDefault();

    // Proteksi: Mencegah spam/double submit saat animasi feedback berjalan
    if (isProcessingAnswer) return;
    isProcessingAnswer = true;

    const inputUser = document.getElementById('user-jawab');
    inputUser.disabled = true; // Kunci input sementara

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
        // Tambah streak
        currentStreak++;
        // Simpan streak tertinggi
        maxStreak =
            Math.max(
                maxStreak, currentStreak);

        // ==============================
        // MILESTONE COMBO
        // ==============================

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
        // ======================================
        // JAWABAN SALAH
        // ======================================
    } else {
        poinSalah++;
        // Reset streak
        currentStreak = 0;
        updateStreakUI(false);
        playSoundEffect('wrong');

        feedbackEl.className = "feedback wrong";
        feedbackEl.innerText = `✗ Salah! Jawaban: ${Number(jawabanBenarCurrent.toFixed(2))} (${durasiDetik.toFixed(2)}s)`;
    }

    // Simpan ID timeout agar bisa dibatalkan jika tombol Quit ditekan
    feedbackTimeout = setTimeout(() => {
        feedbackEl.innerText = '';
        feedbackEl.className = "feedback";
        generateSoalBaru();
    }, 1000);
}


// ==========================================
// 7. SELESAI GAME & STATISTIK
// ==========================================
function selesaiGame() {
    stopTimer();

    // Batalkan pemanggilan soal baru jika Quit ditekan saat feedback masih aktif
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
    // Maximum Streak
    const statMaxStreak = document.getElementById('stat-max-streak');
    if (statMaxStreak) {
        statMaxStreak.innerText = `🔥 ${maxStreak}`;
    }
    document.getElementById('feedback').innerText = '';
    tampilkanScreen('screen-stat');
}