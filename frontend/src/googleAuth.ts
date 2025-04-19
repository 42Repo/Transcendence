// google-auth.ts
import { jwtDecode } from 'jwt-decode';

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
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
  private handleCredentialResponse(response: GoogleCredentialResponse): void {
    console.log('Encoded JWT ID token: ' + response.credential);

    // Décoder le token JWT pour obtenir les informations utilisateur

    interface GoogleUser {
      email: string;
      name: string;
      picture: string;
    }

    const user = jwtDecode<GoogleUser>(response.credential);

    console.log('User info:', user);

    // Vous pouvez maintenant utiliser les informations utilisateur

    console.log('Email:', user.email);

    console.log('Name:', user.name);

    console.log('Picture:', user.picture);
  }
}
