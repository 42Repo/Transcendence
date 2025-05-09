import {
        closeModal,
        openModal,
        //   showFeedback,
        // clearFeedback,
} from './utils/modalUtils';
import { switchPage } from './switch-page';

//interface LoginResponse { }

// --- Login Specific Elements ---
//const modalA2F = document.getElementById('A2FModal');
//const inputA2F = document.getElementById('A2FInput') as HTMLInputElement | null;
//const confirmButton = document.getElementById(
//        'A2FConfirm'
//) as HTMLButtonElement | null;

// --- Event Listener for Login Confirmation ---

export function manageA2F() {
        console.log('manageA2F() Called');
        hideA2FModal();
        switchPage('profile');
}

export function hideA2FModal(): void {
        const modalA2F = document.getElementById('A2FModal');

        closeModal(modalA2F);
}

export function showA2FModal(): void {
        const modalA2F = document.getElementById('A2FModal');

        openModal(modalA2F);
}
