import { logout } from './login';
import { setHeaderMenu } from './header';
import { GoogleAuth } from './googleAuth';
import './switch-page';
import './pongGame';
import './register';
import './login';
import { editProfile } from './editProfileData';
import { downloadData, deleteAccount } from './userService';

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
                        !burgerBg.contains(e.target) ||
                        e.target.classList.contains('burger-btn')
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
        if (editProfileClicked) {
                editProfile();
        }
        const downloadDataClicked = target.closest('#downloadData');
        if (downloadDataClicked) {
                downloadData();
        }
        const deleteAccountClicked = target.closest('#deleteAccount');
        if (deleteAccountClicked) {
                deleteAccount();
        }
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
