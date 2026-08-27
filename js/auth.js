// ==========================================
// BUKU KAS DIGITAL
// AUTHENTICATION
// ==========================================

const authRoot = document.getElementById('bk-app');


// ==========================================
// STYLE LOGIN
// ==========================================

const authStyle = document.createElement('style');

authStyle.textContent = `
    #bk-auth {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: #ebe7dc;
        font-family: Inter, sans-serif;
    }

    .bk-auth-card {
        width: 100%;
        max-width: 420px;
        background: #f8f3e7;
        border-radius: 18px;
        padding: 32px;
        box-sizing: border-box;
        box-shadow: 0 10px 35px rgba(0,0,0,.12);
        border: 1px solid #ddd3bd;
    }

    .bk-auth-label {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        letter-spacing: 2px;
        color: #006b57;
        margin-bottom: 8px;
    }

    .bk-auth-title {
        font-family: Fraunces, serif;
        font-size: 34px;
        color: #18372d;
        margin: 0 0 8px;
    }

    .bk-auth-subtitle {
        color: #777064;
        margin-bottom: 28px;
        font-size: 14px;
    }

    .bk-auth-field {
        margin-bottom: 16px;
    }

    .bk-auth-field label {
        display: block;
        font-size: 13px;
        color: #4f514d;
        margin-bottom: 7px;
    }

    .bk-auth-field input {
        width: 100%;
        box-sizing: border-box;
        padding: 13px 14px;
        border: 1px solid #d8ccb2;
        border-radius: 9px;
        background: white;
        font-size: 14px;
        outline: none;
    }

    .bk-auth-field input:focus {
        border-color: #006b57;
        box-shadow: 0 0 0 2px rgba(0,107,87,.10);
    }

    .bk-auth-button {
        width: 100%;
        border: none;
        border-radius: 9px;
        padding: 14px;
        background: #006b57;
        color: white;
        font-family: "JetBrains Mono", monospace;
        font-weight: 700;
        cursor: pointer;
        margin-top: 8px;
    }

    .bk-auth-button:hover {
        background: #005746;
    }

    .bk-auth-button:disabled {
        opacity: .6;
        cursor: not-allowed;
    }

    .bk-auth-switch {
        text-align: center;
        margin-top: 20px;
        font-size: 13px;
        color: #777064;
    }

    .bk-auth-switch button {
        border: none;
        background: none;
        color: #006b57;
        font-weight: 700;
        cursor: pointer;
        padding: 0;
    }

    .bk-auth-message {
        display: none;
        margin-bottom: 16px;
        padding: 11px 13px;
        border-radius: 8px;
        font-size: 13px;
    }

    .bk-auth-message.error {
        display: block;
        background: #fbe9e7;
        color: #b42318;
        border: 1px solid #f1c2bd;
    }

    .bk-auth-message.success {
        display: block;
        background: #e8f5ef;
        color: #006b57;
        border: 1px solid #b8dccd;
    }
`;

document.head.appendChild(authStyle);


// ==========================================
// LOAD DASHBOARD
// ==========================================

function loadDashboard() {
    const storageScript = document.createElement('script');

    storageScript.src = 'js/storage.js';

    storageScript.onload = function () {
        const appScript = document.createElement('script');

        appScript.src = 'js/app.js';

        document.body.appendChild(appScript);
    };

    document.body.appendChild(storageScript);
}


// ==========================================
// LOGIN UI
// ==========================================

function showLogin() {
    authRoot.innerHTML = `
        <section id="bk-auth">
            <div class="bk-auth-card">

                <div class="bk-auth-label">
                    BUKU KAS DIGITAL
                </div>

                <h1 class="bk-auth-title">
                    Catatan Keuangan
                </h1>

                <div class="bk-auth-subtitle">
                    Masuk untuk mengakses catatan keuanganmu.
                </div>

                <div id="bk-auth-message" class="bk-auth-message"></div>

                <form id="bk-login-form">

                    <div class="bk-auth-field">
                        <label for="bk-login-email">
                            Email
                        </label>

                        <input
                            type="email"
                            id="bk-login-email"
                            placeholder="email@example.com"
                            required
                        >
                    </div>

                    <div class="bk-auth-field">
                        <label for="bk-login-password">
                            Password
                        </label>

                        <input
                            type="password"
                            id="bk-login-password"
                            placeholder="Masukkan password"
                            required
                        >
                    </div>

                    <button
                        type="submit"
                        class="bk-auth-button"
                        id="bk-login-button"
                    >
                        MASUK
                    </button>

                </form>

                <div class="bk-auth-switch">
                    Belum punya akun?
                    <button type="button" id="bk-show-register">
                        Daftar
                    </button>
                </div>

            </div>
        </section>
    `;

    document
        .getElementById('bk-login-form')
        .addEventListener('submit', loginUser);

    document
        .getElementById('bk-show-register')
        .addEventListener('click', showRegister);
}


// ==========================================
// REGISTER UI
// ==========================================

function showRegister() {
    authRoot.innerHTML = `
        <section id="bk-auth">
            <div class="bk-auth-card">

                <div class="bk-auth-label">
                    BUKU KAS DIGITAL
                </div>

                <h1 class="bk-auth-title">
                    Buat Akun
                </h1>

                <div class="bk-auth-subtitle">
                    Buat akun pribadi untuk menyimpan data keuanganmu.
                </div>

                <div id="bk-auth-message" class="bk-auth-message"></div>

                <form id="bk-register-form">

                    <div class="bk-auth-field">
                        <label for="bk-register-email">
                            Email
                        </label>

                        <input
                            type="email"
                            id="bk-register-email"
                            placeholder="email@example.com"
                            required
                        >
                    </div>

                    <div class="bk-auth-field">
                        <label for="bk-register-password">
                            Password
                        </label>

                        <input
                            type="password"
                            id="bk-register-password"
                            placeholder="Minimal 6 karakter"
                            minlength="6"
                            required
                        >
                    </div>

                    <div class="bk-auth-field">
                        <label for="bk-register-password-confirm">
                            Konfirmasi Password
                        </label>

                        <input
                            type="password"
                            id="bk-register-password-confirm"
                            placeholder="Ulangi password"
                            minlength="6"
                            required
                        >
                    </div>

                    <button
                        type="submit"
                        class="bk-auth-button"
                        id="bk-register-button"
                    >
                        DAFTAR
                    </button>

                </form>

                <div class="bk-auth-switch">
                    Sudah punya akun?
                    <button type="button" id="bk-show-login">
                        Masuk
                    </button>
                </div>

            </div>
        </section>
    `;

    document
        .getElementById('bk-register-form')
        .addEventListener('submit', registerUser);

    document
        .getElementById('bk-show-login')
        .addEventListener('click', showLogin);
}


// ==========================================
// MESSAGE
// ==========================================

function showMessage(message, type = 'error') {
    const element = document.getElementById('bk-auth-message');

    if (!element) return;

    element.textContent = message;
    element.className = `bk-auth-message ${type}`;
}


// ==========================================
// LOGIN
// ==========================================

async function loginUser(event) {
    event.preventDefault();

    const email = document
        .getElementById('bk-login-email')
        .value
        .trim();

    const password = document
        .getElementById('bk-login-password')
        .value;

    const button = document.getElementById('bk-login-button');

    button.disabled = true;
    button.textContent = 'MEMPROSES...';

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showMessage(error.message);

        button.disabled = false;
        button.textContent = 'MASUK';

        return;
    }

    console.log('Login berhasil:', data.user);

    loadDashboard();
}


// ==========================================
// REGISTER
// ==========================================

async function registerUser(event) {
    event.preventDefault();

    const email = document
        .getElementById('bk-register-email')
        .value
        .trim();

    const password = document
        .getElementById('bk-register-password')
        .value;

    const passwordConfirm = document
        .getElementById('bk-register-password-confirm')
        .value;

    const button = document.getElementById('bk-register-button');

    if (password !== passwordConfirm) {
        showMessage('Konfirmasi password tidak sama.');
        return;
    }

    button.disabled = true;
    button.textContent = 'MEMBUAT AKUN...';

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        showMessage(error.message);

        button.disabled = false;
        button.textContent = 'DAFTAR';

        return;
    }

    console.log('Register berhasil:', data.user);

    showMessage(
        'Akun berhasil dibuat. Silakan masuk.',
        'success'
    );

    setTimeout(() => {
        showLogin();
    }, 1000);
}


// ==========================================
// CHECK SESSION
// ==========================================

async function initAuth() {
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {
        console.log('Session ditemukan:', session.user);
        loadDashboard();
    } else {
        showLogin();
    }
}


// ==========================================
// START
// ==========================================

initAuth();