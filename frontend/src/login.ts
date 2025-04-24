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
loginConfirmButton?.addEventListener('click', () => {
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
    loginIdentifierInput.value = "";
    loginPasswordInput.value = "";
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
            const loggedHtmlResponse = await fetch('src/views/logged.html');
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

export const logout = () => {
  console.log('Logout function called');
  localStorage.removeItem('authToken');
  switchPage('home');
  setHeaderMenu();
};


export { showLoginModal };
