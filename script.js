/**
 * GAME HITUNG CEPAT (JavaScript Logic)
 */

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
const setting = {
    operators: [],
    panjangSoal: null,
    difficulty: null,
    durasiTimer: 60 // Default 60 detik
};

let poinBenar = 0;
let poinSalah = 0;
let poinJumlahSoal = 0;
let jawabanBenarCurrent = 0;

// Timer & Akumulasi Waktu
let timerInterval = null;
let sisaWaktu = 60;
let waktuSoalMulai = 0;
let totalWaktuJawab = 0; // Menyimpan total detik pengerjaan semua soal

// ==========================================
// 2. NAVIGASI TAMPILAN
// ==========================================
function tampilkanScreen(idScreen) {
    const semuaScreen = document.querySelectorAll('.screen');
    semuaScreen.forEach(s => s.classList.remove('active'));

    const screenTarget = document.getElementById(idScreen);
    screenTarget.classList.add('active');
}

function bukaSetting() {
    tampilkanScreen('screen-setting');
}

// ==========================================
// 3. LOGIKA SETTING
// ==========================================
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

// ==========================================
// 6. GAMEPLAY & HITUNG RATA-RATA WAKTU
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
    totalWaktuJawab = 0; // Reset akumulasi detik pengerjaan

    tampilkanScreen('screen-game');
    startGlobalTimer();
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

    // Hitung durasi waktu pengerjaan soal ini
    const durasiDetik = (Date.now() - waktuSoalMulai) / 1000;
    totalWaktuJawab += durasiDetik; // Akumulasikan total waktu

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
    } else {
        poinSalah++;
        feedbackEl.className = "feedback wrong";
        feedbackEl.innerText = `✗ Salah! Jawaban: ${Number(jawabanBenarCurrent.toFixed(2))} (${durasiDetik.toFixed(2)}s)`;
    }

    setTimeout(() => {
        feedbackEl.innerText = '';
        feedbackEl.className = "feedback";
        generateSoalBaru();
    }, 1000);
}

function selesaiGame() {
    stopTimer();

    // Hitung rata-rata waktu menjawab
    const rataRata = poinJumlahSoal > 0 ? (totalWaktuJawab / poinJumlahSoal).toFixed(2) : 0;

    document.getElementById('stat-benar').innerText = poinBenar;
    document.getElementById('stat-salah').innerText = poinSalah;
    document.getElementById('stat-total').innerText = poinJumlahSoal;
    document.getElementById('stat-rata-waktu').innerText = `${rataRata}s / soal`;
    document.getElementById('feedback').innerText = '';

    tampilkanScreen('screen-stat');
}