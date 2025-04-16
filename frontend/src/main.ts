import { logout } from './login';

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
