import { logout } from './login';
import { setHeaderMenu } from './header';
import { GoogleAuth } from './googleAuth';
import './switch-page';
import './pongGame';
import './register';
import './login';
import { editProfile } from './editProfileData';
import { downloadData, deleteAccount } from './userService';
import { confirmA2F, showA2FModal, hideA2FModal } from './A2F';

const burger = document.getElementById('burger-icon');
const mobileMenu = document.getElementById('nav-mobile');
const burgerBg = document.querySelector('.burger-bg');

if (burger && mobileMenu) {
        burger.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
        });

        mobileMenu.addEventListener('click', (e) => {
                // Check if click is OUTSIDE the burger-bg panel or on a button
                if (
                        !burgerBg?.contains(e.target as Node | null) ||
                        (e.target as HTMLElement).classList.contains('burger-btn')
                ) {
                        mobileMenu.classList.add('hidden');
                }
        });
}

document.body.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        const logoutButtonClicked = target.closest('#logoutBtn');
        if (logoutButtonClicked) {
                event.preventDefault();
                logout();
        }
        const editProfileClicked = target.closest('#editProfileButton');
        if (editProfileClicked) editProfile();

        const downloadDataClicked = target.closest('#downloadData');
        if (downloadDataClicked) downloadData();

        const deleteAccountClicked = target.closest('#deleteAccount');
        if (deleteAccountClicked) deleteAccount();

        const enableA2FClicked = target.closest('#enableA2F');
        if (enableA2FClicked) showA2FModal();
        const confirmA2FClicked = target.closest('#A2FConfirm');
        if (confirmA2FClicked) confirmA2F();
        const closeA2F = target.closest('#closeA2FModal');
        if (closeA2F) hideA2FModal();
});

setHeaderMenu();

document.addEventListener('DOMContentLoaded', () => {
        const googleAuth = new GoogleAuth(
                '1063963294590-ce7p97pmdm74fk3gs41fin2j61lsa2q2.apps.googleusercontent.com'
        );

        googleAuth.initialize();
        googleAuth.renderButton('googleButtonContainer');
        googleAuth.renderButton('googleRegisterButtonContainer');
});

const closeModal = () => {
        if (mobileMenu) mobileMenu.classList.add('hidden');
};

const mediaQuery = window.matchMedia('(min-width: 768px)');

const handleResize = (e: MediaQueryListEvent) => {
        if (e.matches) {
                closeModal();
        }
};
mediaQuery.addEventListener('change', handleResize);

if (mediaQuery.matches) {
        closeModal();
}
