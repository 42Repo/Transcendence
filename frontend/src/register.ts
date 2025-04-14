import {
  openModal,
  closeModal,
  showFeedback,
  clearFeedback,
} from './utils/modalUtils';

const registerModal = document.getElementById('registerModal');
const registerUsernameInput = document.getElementById(
  'registerUsername'
) as HTMLInputElement | null;
const registerEmailInput = document.getElementById(
  'registerEmail'
) as HTMLInputElement | null;
const registerPasswordInput = document.getElementById(
  'registerPassword'
) as HTMLInputElement | null;
const registerConfirmPasswordInput = document.getElementById(
  'registerConfirmPassword'
) as HTMLInputElement | null;
const registerConfirmButton = document.getElementById(
  'registerConfirm'
) as HTMLButtonElement | null;
const closeRegisterModalButton = document.getElementById(
  'closeRegisterModal'
) as HTMLButtonElement | null;
const switchToLoginButton = document.getElementById(
  'switchLogin'
) as HTMLButtonElement | null;

const REGISTER_FEEDBACK_ID = 'registerFeedback';

interface RegisterResponse {
  success: boolean;
  message: string;
}

registerConfirmButton?.addEventListener('click', () => {
  const handleRegistration = async () => {
    if (
      !registerUsernameInput ||
      !registerEmailInput ||
      !registerPasswordInput ||
      !registerConfirmPasswordInput
    ) {
      showFeedback(
        REGISTER_FEEDBACK_ID,
        'Internal error: Form elements not found.',
        true
      );
      return;
    }

    // Get input values
    const username = registerUsernameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value.trim();
    const confirmPassword = registerConfirmPasswordInput.value.trim();

    // --- Client-Side Validation ---
    if (!username || !password || !confirmPassword) {
      showFeedback(
        REGISTER_FEEDBACK_ID,
        'Username, password, and confirmation are required.',
        true
      );
      return;
    }

    if (password !== confirmPassword) {
      showFeedback(REGISTER_FEEDBACK_ID, 'Passwords do not match.', true);
      return;
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      showFeedback(
        REGISTER_FEEDBACK_ID,
        'Please enter a valid email address if providing one.',
        true
      );
      return;
    }

    showFeedback(REGISTER_FEEDBACK_ID, 'Registering...', false);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          email: email || null,
          password: password,
        }),
      });

      const data = (await response.json()) as RegisterResponse;

      if (response.ok && data.success) {
        showFeedback(
          REGISTER_FEEDBACK_ID,
          'Registration successful! Switching to login...',
          false
        );
        if (registerUsernameInput) registerUsernameInput.value = '';
        if (registerEmailInput) registerEmailInput.value = '';
        if (registerPasswordInput) registerPasswordInput.value = '';
        if (registerConfirmPasswordInput)
          registerConfirmPasswordInput.value = '';

        setTimeout(() => {
          closeModal(registerModal);
          document.dispatchEvent(new CustomEvent('openLoginModalRequest'));
        }, 1500);
      } else {
        showFeedback(
          REGISTER_FEEDBACK_ID,
          data.message || 'Registration failed. Username/email might be taken.',
          true
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      showFeedback(
        REGISTER_FEEDBACK_ID,
        'Network error or unexpected issue. Please try again.',
        true
      );
    }
  };

  void handleRegistration();
});

// --- Event Listener for Closing Register Modal ---
closeRegisterModalButton?.addEventListener('click', (event) => {
  event.preventDefault();
  closeModal(registerModal);
});

// --- Event Listener for Switching to Login from Register Modal ---
switchToLoginButton?.addEventListener('click', (event) => {
  event.preventDefault();
  closeModal(registerModal);
  document.dispatchEvent(new CustomEvent('openLoginModalRequest'));
});

// --- Helper Function to Open Register Modal Safely ---
function showRegisterModal(): void {
  openModal(registerModal);
  clearFeedback(REGISTER_FEEDBACK_ID);
}

// --- Event Listener to Open Register Modal ---
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (target.closest('#registerLink')) {
    event.preventDefault();
    showRegisterModal();
  }
});

// --- Listen for requests to open this modal ---
document.addEventListener('openRegisterModalRequest', () => {
  showRegisterModal();
});
