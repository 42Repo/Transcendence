import { jwtDecode } from 'jwt-decode';
import { closeModal, showFeedback } from './utils/modalUtils';
import { setHeaderMenu } from './header';
import { check2FA } from './login';
import { updateMyStatus } from './userService';

const LOGIN_FEEDBACK_ID = 'loginFeedback';
const contentContainer = document.getElementById('content');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string; // TODO: à sécuriser mieux (ex: httpOnly cookie côté serveur)
  user?: {
    id: number;
    username: string;
  };
}

export class GoogleAuth {
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  public initialize(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
      });
    } else {
      console.error('Google API not loaded');
    }
  }

  public renderButton(elementId: string): void {
    const buttonElement = document.getElementById(elementId);
    if (buttonElement && typeof google !== 'undefined') {
      google.accounts.id.renderButton(buttonElement, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
      });
    }
  }

  private async handleCredentialResponse(response: GoogleCredentialResponse) {
    interface GoogleUser {
      email: string;
      name: string;
      picture: string;
    }

    // Décodage du token JWT
    const user = jwtDecode<GoogleUser>(response.credential);
    try {
      const res = await fetch('/api/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data: LoginResponse = await res.json();

      if (res.ok) {
        if (!data.token) {
          return console.error('Token is undefined');
        }

        closeModal(loginModal);
        const token = data.token;
        try {
          const response = await fetch('/api/2fa/isenabled', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: user.email }),
          });

          if (!response.ok) return false;

          const data = await response.json();

          if (data.is_two_factor_enabled) return check2FA(user.email, token);
        } catch (error) {
          return alert(error.message);
        }
        localStorage.setItem('authToken', data.token || '');
        void updateMyStatus('online');
        if (contentContainer) {
          try {
            const loggedHtmlResponse = await fetch('views/logged.html');
            setHeaderMenu();

            if (loggedHtmlResponse.ok) {
              contentContainer.innerHTML = await loggedHtmlResponse.text();
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

        // Nettoyage du formulaire
        setTimeout(() => {
          closeModal(loginModal);
          closeModal(registerModal);
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
  }
}
