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
                                if (!data.token) {
                                        return;
                                }

                                closeModal(loginModal);
                                const token = data.token;
                                try {
                                        const response = await fetch('/api/2fa/isenabled', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ identifier }),
                                        });

                                        if (!response.ok) return false;

                                        const data = await response.json();

                                        if (data.is_two_factor_enabled) return check2FA(identifier, token);
                                } catch (error) {
                                        return alert(error.message);
                                }
                                showFeedback(LOGIN_FEEDBACK_ID, 'Login successful!', false);

                                // --- Post-Login Actions ---
                                // TODO: Store the JWT token (e.g., data.token) securely

                                localStorage.setItem('authToken', data.token);
                                // Update UI
                                if (contentContainer) {
                                        try {
                                                const loggedHtmlResponse = await fetch('views/logged.html');
                                                setHeaderMenu();
                                                if (loggedHtmlResponse.ok) {
                                                        contentContainer.innerHTML = await loggedHtmlResponse.text();
                                                        // TODO: Attach any event listeners needed for the new content
                                                } else {
                                                        alert('Failed to load logged.html');
                                                        showFeedback(
                                                                LOGIN_FEEDBACK_ID,
                                                                'Login successful, but failed to load page content.',
                                                                true
                                                        );
                                                }
                                        } catch (fetchError) {
                                                alert('Error fetching logged.html:' + fetchError.message);
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
                        alert('Login error: ' + error.message);
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

const onSubmit = async (
        username: string,
        login2FAModal: HTMLElement,
        token: string
) => {
        const input2FAField = document.getElementById(
                'A2FRegInput'
        ) as HTMLInputElement | null;
        const code = input2FAField?.value.trim();
        if (input2FAField) input2FAField.value = '';

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

                let verifyResult: any;
                try {
                        verifyResult = await verifyResponse.json();

                        if (!verifyResponse.ok || !verifyResult.success) {
                                alert(
                                        verifyResult.message || 'Erreur lors de la vérification du code 2FA.'
                                );
                                return;
                        }

                        localStorage.setItem('authToken', token);
                        closeModal(login2FAModal);
                } catch (jsonError) {
                        alert('Réponse invalide du serveur 2FA.');
                        return;
                }
                location.reload();
        } catch (err) {
                console.error('Erreur réseau ou parsing JSON', err);
                alert('Une erreur est survenue lors de la connexion 2FA.');
        }
};
export async function check2FA(username: string, token: string) {
        try {
                const login2FAModal = document.getElementById('A2FRefModal') as HTMLElement;
                if (!login2FAModal) {
                        alert('Modal 2FA non trouvé');
                        return;
                }

                openModal(login2FAModal);

                const confirm2FAButton = document.getElementById(
                        'A2FRegConfirm'
                ) as HTMLButtonElement | null;

                if (!confirm2FAButton) {
                        alert('Bouton ou champ 2FA manquant');
                        return;
                }
                confirm2FAButton.addEventListener('click', async () => {
                        try {
                                await onSubmit(username, login2FAModal, token);
                        } catch (err) {
                                alert('Erreur capturée dans onSubmit:' + err);
                        }
                });
        } catch (error) {
                alert('Erreur dans check2FA :' + error.message);
                return;
        }
}

export const logout = () => {
        localStorage.removeItem('authToken');
        switchPage('home');
        setHeaderMenu();
};

export { showLoginModal };
