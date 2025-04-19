import { logout } from './login';
import { setHeaderMenu } from './header';
import { GoogleAuth } from './googleAuth';

const burger = document.getElementById('burger-icon');
const mobileMenu = document.getElementById('nav-mobile');

if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

  document.querySelectorAll('.burger-btn').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  });
}

document.body.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;

  const logoutButtonClicked = target.closest('#logoutBtn');
  if (logoutButtonClicked) {
    event.preventDefault();
    logout();
  }
});

setHeaderMenu();

document.addEventListener('DOMContentLoaded', () => {
  const googleAuth = new GoogleAuth(
    '1063963294590-ce7p97pmdm74fk3gs41fin2j61lsa2q2.apps.googleusercontent.com'
  );

  googleAuth.initialize();

  googleAuth.renderButton('googleButtonContainer');
});
