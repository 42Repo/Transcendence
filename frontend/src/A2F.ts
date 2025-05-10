import { closeModal, openModal } from './utils/modalUtils';
import { switchPage } from './switch-page';
import { UserPublicData } from './header';

// Interface adaptée à la réponse de votre API
interface TwoFAResponse {
        qrCode: string; // URL du QR code au format data URL
        qrCodeImage?: string; // Représentation texte du QR code
        success?: boolean; // Ce champ est présent dans les réponses d'erreur
        message?: string; // Message d'erreur éventuel
}

export function showA2FModal() {
        const token = localStorage.getItem('authToken');

        if (!token) {
                console.error("User isn't connected");
                switchPage('login');
                return;
        }
        setupTwoFactorAuth(token);
}

export function hideA2FModal(): void {
        const modalA2F = document.getElementById('A2FModal');
        closeModal(modalA2F);
}

async function setupTwoFactorAuth(token: string) {
        const modalA2F = document.getElementById('A2FModal');
        const imgQRCode = document.getElementById(
                'A2FQRCode'
        ) as HTMLImageElement | null;

        try {
                // Faire la requête à l'API 2FA
                const twoFAResponse = await fetch('/api/2fa/setup', {
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                        },
                        // Le serveur récupère l'ID depuis le token,
                        // donc nous envoyons juste un objet vide
                        body: JSON.stringify({}),
                });

                if (twoFAResponse.status === 401 || twoFAResponse.status === 404) {
                        console.error('Invalid token. Please sign-in again.');
                        localStorage.removeItem('authToken');
                        switchPage('home');
                        return;
                }

                if (twoFAResponse.status === 400) {
                        const errorData = await twoFAResponse.json();
                        console.warn('2FA Error:', errorData.message);
                        // Si 2FA est déjà activé, vous pouvez rediriger vers une autre page ou informer l'utilisateur
                        alert(errorData.message || '2FA is already activated');
                        return;
                }

                if (!twoFAResponse.ok) {
                        throw new Error(`Failed to enable 2FA: ${twoFAResponse.statusText}`);
                }

                const data = (await twoFAResponse.json()) as TwoFAResponse;

                if (data.qrCode && imgQRCode) {
                        imgQRCode.src = data.qrCode;
                }

                openModal(modalA2F);
        } catch (error) {
                console.error('Error setting up 2FA: ', error);
        }
}

export async function confirmA2F() {
        const inputA2F = document.getElementById(
                'A2FInput'
        ) as HTMLInputElement | null;
        const token = localStorage.getItem('authToken');

        if (!inputA2F || !token) {
                console.error('Champ de code 2FA ou token manquant');
                return;
        }
        const code = inputA2F.value.trim();
        try {
                const response = await fetch('/api/2fa/confirm', {
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                                code: code,
                                token: localStorage.authToken,
                        }),
                });
                if (!response.ok) {
                        alert('Invalid 2FA Code, try again !');
                        return;
                }
                const result = await response.json();
                console.log(result);
        } catch (error) {
                console.log('error : ' + error);
        }
        hideA2FModal();
}

/**
 * Fonction pour désactiver le 2FA
 * (à implémenter pour fonctionner avec la future route /2fa/delete)
 */
export function disableA2F() {
        // Cette fonction pourra être utilisée pour désactiver le 2FA
        // via la future route /2fa/delete
        alert('Fonctionnalité à implémenter: désactivation du 2FA');
}
