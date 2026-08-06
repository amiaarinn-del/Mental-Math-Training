/**
 * GAME HITUNG CEPAT (JavaScript Logic) - Final & Fixed
 * Standar Matematika: PEMDAS (Standar JavaScript)
 */

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
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

// Timer, Timeout & Flags Proteksi
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

    if (!isEndless) {
        if (isNaN(durasi) || durasi < 10 || durasi > 300) {
            alert("Durasi timer harus antara 10 hingga 300 detik!");
            return;
        }
    } else {
        durasi = 60;
    }

    setting.panjangSoal = pSoal;
    setting.difficulty = diff;
    setting.endlessMode = isEndless;
    setting.durasiTimer = durasi;

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
// 4. MATH ENGINE (PEMDAS + Pembagian Variatif)
// ==========================================
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buatSoal() {
    let lower = 2, higher = 10;
    if (setting.difficulty === 2) {
        lower = 5;
        higher = 25;
    } else if (setting.difficulty === 3) {
        lower = 10;
        higher = 50;
    }

    const soalAngka = [];
    const soalOperator = [];

    // 1. Pilih operator acak
    for (let i = 0; i < setting.panjangSoal - 1; i++) {
        const randomOp = setting.operators[Math.floor(Math.random() * setting.operators.length)];
        soalOperator.push(randomOp);
    }

    // 2. Isi nilai acak awal pada array angka
    for (let i = 0; i < setting.panjangSoal; i++) {
        soalAngka.push(getRandomInt(lower, higher));
    }

    // 3. Algoritma Pembagian Presisi (Garansi Hasil Bulat & Variatif)
    let idx = 0;
    while (idx < soalOperator.length) {
        if (soalOperator[idx] === '/') {
            let L = idx;
            let R = idx;

            // Identifikasi blok pembagian beruntun (misal: A / B / C)
            while (R + 1 < soalOperator.length && soalOperator[R + 1] === '/') {
                R++;
            }

            const maxDiv = (setting.difficulty === 1) ? 10 : (setting.difficulty === 2 ? 15 : 25);
            const maxAns = (setting.difficulty === 1) ? 10 : (setting.difficulty === 2 ? 20 : 30);

            let totalPembagi = 1;
            for (let k = L; k <= R; k++) {
                const pembagi = getRandomInt(2, maxDiv);
                soalAngka[k + 1] = pembagi;
                totalPembagi *= pembagi;
            }

            // Target hasil selalu >= 2 (mencegah jawaban bernilai 1)
            const targetHasil = getRandomInt(2, maxAns);
            soalAngka[L] = targetHasil * totalPembagi;

            idx = R + 1;
        } else {
            idx++;
        }
    }

    // 4. Gabungkan token menjadi string ekspresi matematika
    const token = [];
    for (let k = 0; k < soalOperator.length; k++) {
        token.push(soalAngka[k]);
        token.push(soalOperator[k]);
    }
    token.push(soalAngka[soalAngka.length - 1]);

    const teksSoal = token.join(' ');

    // Evaluasi sesuai standar PEMDAS
    const rawResult = new Function(`return ${teksSoal}`)();
    const teksJawaban = Math.round(rawResult * 100) / 100;

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
        feedbackEl.className = "feedback correct";
        feedbackEl.innerText = `✓ Benar! (${durasiDetik.toFixed(2)}s)`;
    } else {
        poinSalah++;
        feedbackEl.className = "feedback wrong";
        feedbackEl.innerText = `✗ Salah! Jawaban: ${Number(jawabanBenarCurrent.toFixed(2))} (${durasiDetik.toFixed(2)}s)`;
    }

    feedbackTimeout = setTimeout(() => {
        feedbackEl.innerText = '';
        feedbackEl.className = "feedback";
        generateSoalBaru();
    }, 1000);
}

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
    document.getElementById('feedback').innerText = '';

    tampilkanScreen('screen-stat');
}