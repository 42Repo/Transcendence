import {
        closeModal,
        openModal,
        showFeedback,
        clearFeedback,
} from './utils/modalUtils';
import { switchPage } from './switch-page';
import { setHeaderMenu } from './header';

interface LoginResponse {
        success: boolean;
        message: string;
        token?: string; // TODO store this securely
        user?: {
                id: number;
                username: string;
        };
}

// --- Login Specific Elements ---
const loginModal = document.getElementById('loginModal');
const contentContainer = document.getElementById('content');
const loginIdentifierInput = document.getElementById(
        'loginIdentifier'
) as HTMLInputElement | null;
const loginPasswordInput = document.getElementById(
        'loginPassword'
) as HTMLInputElement | null;
const loginConfirmButton = document.getElementById(
        'loginConfirm'
) as HTMLButtonElement | null;
const closeLoginModalButton = document.getElementById(
        'closeLoginModal'
) as HTMLButtonElement | null;
const switchToRegisterButton = document.getElementById(
        'switchRegister'
) as HTMLButtonElement | null;

const LOGIN_FEEDBACK_ID = 'loginFeedback';

// --- Event Listener for Login Confirmation ---
loginConfirmButton?.addEventListener('click', (event: Event) => {
        event.preventDefault();
        const handleLogin = async () => {
                if (!loginIdentifierInput || !loginPasswordInput) {
                        showFeedback(
                                LOGIN_FEEDBACK_ID,
                                'Internal error: Form elements not found.',
                                true
                        );
                        return;
                }

                const identifier = loginIdentifierInput.value.trim();
                const password = loginPasswordInput.value;
                loginIdentifierInput.value = '';
                loginPasswordInput.value = '';
                if (!identifier || !password) {
                        showFeedback(
                                LOGIN_FEEDBACK_ID,
                                'Please enter username/email and password.',
                                true
                        );
                        return;
                }

                try {
                        const response = await fetch('/api/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        loginIdentifier: identifier,
                                        password: password,
                                }),
                        });

                        const data: LoginResponse = (await response.json()) as LoginResponse;

                        if (response.ok && data.success) {
                                const verif2fa = await check2FA(identifier);
                                if (!verif2fa) {
                                        console.log('bah mon reuf');
                                        return;
                                }
                                console.log('glaglaglagla');
                                showFeedback(LOGIN_FEEDBACK_ID, 'Login successful!', false);

                                // --- Post-Login Actions ---
                                // TODO: Store the JWT token (e.g., data.token) securely
                                if (data.token) {
                                        localStorage.setItem('authToken', data.token);
                                } else {
                                        console.error('Token is undefined');
                                }

                                // Update UI
                                if (contentContainer) {
                                        try {
                                                const loggedHtmlResponse = await fetch('views/logged.html');
                                                setHeaderMenu();
                                                if (loggedHtmlResponse.ok) {
                                                        contentContainer.innerHTML = await loggedHtmlResponse.text();
                                                        // TODO: Attach any event listeners needed for the new content
                                                } else {
                                                        console.error('Failed to load logged.html');
                                                        showFeedback(
                                                                LOGIN_FEEDBACK_ID,
                                                                'Login successful, but failed to load page content.',
                                                                true
                                                        );
                                                }
                                        } catch (fetchError) {
                                                console.error('Error fetching logged.html:', fetchError);
                                                showFeedback(
                                                        LOGIN_FEEDBACK_ID,
                                                        'Login successful, but failed to load page content.',
                                                        true
                                                );
                                        }
                                }

                                setTimeout(() => {
                                        if (loginIdentifierInput) loginIdentifierInput.value = '';
                                        if (loginPasswordInput) loginPasswordInput.value = '';
                                        closeModal(loginModal);
                                }, 1000);
                        } else {
                                showFeedback(
                                        LOGIN_FEEDBACK_ID,
                                        data.message || 'Invalid credentials or server error.',
                                        true
                                );
                        }
                } catch (error) {
                        console.error('Login error:', error);
                        showFeedback(
                                LOGIN_FEEDBACK_ID,
                                'Network error or unexpected issue. Please try again.',
                                true
                        );
                }
        };

        void handleLogin();
});

// --- Event Listener for Closing Login Modal ---
closeLoginModalButton?.addEventListener('click', (event) => {
        event.preventDefault();
        closeModal(loginModal);
});

// --- Event Listener for Switching to Register from Login Modal ---
switchToRegisterButton?.addEventListener('click', (event) => {
        event.preventDefault();
        closeModal(loginModal);
        document.dispatchEvent(new CustomEvent('openRegisterModalRequest'));
});

// --- Helper Function to Open Login Modal Safely ---
function showLoginModal(): void {
        openModal(loginModal);
        clearFeedback(LOGIN_FEEDBACK_ID);
}

// --- Event Listener to Open Login Modal ---
document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('#loginLink')) {
                event.preventDefault();
                showLoginModal();
        }
});

// --- Listen for requests to open this modal ---
document.addEventListener('openLoginModalRequest', () => {
        showLoginModal();
});

export async function check2FA(username: string): Promise<boolean> {
        try {
                const response = await fetch('/api/2fa/isenabled', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username }),
                });

                if (!response.ok) return false;

                const data = await response.json();

                if (!data.is_two_factor_enabled) return true; // pas de 2FA, donc on peut continuer

                const login2FAModal = document.getElementById('A2FRefModal') as HTMLElement;
                if (!login2FAModal) {
                        console.error('Modal 2FA non trouvé');
                        return false;
                }

                openModal(login2FAModal);

                const confirm2FAButton = document.getElementById(
                        'A2FRegConfirm'
                ) as HTMLButtonElement | null;
                const input2FAField = document.getElementById(
                        'A2FRegInput'
                ) as HTMLInputElement | null;

                if (!confirm2FAButton || !input2FAField) {
                        console.error('Bouton ou champ 2FA manquant');
                        return false;
                }

                // ⚠️ On retourne une Promise ici
                return new Promise<boolean>((resolve) => {
                        confirm2FAButton.onclick = async () => {
                                const code = input2FAField.value.trim();
                                if (!code) {
                                        alert('Veuillez entrer un code 2FA.');
                                        return;
                                }

                                try {
                                        const verifyResponse = await fetch('/api/2fa/login', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ username, code }),
                                        });

                                        if (!verifyResponse.ok) {
                                                alert('Échec de la vérification 2FA.');
                                                resolve(false);
                                                return;
                                        }

                                        const verifyResult = await verifyResponse.json();
                                        if (verifyResult.success) {
                                                closeModal(login2FAModal);
                                                resolve(true);
                                        } else {
                                                alert('Code 2FA invalide.');
                                                resolve(false);
                                        }
                                } catch (err) {
                                        console.error('Erreur lors de la vérification du code 2FA :', err);
                                        resolve(false);
                                }
                        };
                });
        } catch (error) {
                console.error('Erreur dans check2FA :', error);
                return false;
        }
}

export const logout = () => {
        console.log('Logout function called');
        localStorage.removeItem('authToken');
        switchPage('home');
        setHeaderMenu();
};

export { showLoginModal };
