import { isAuthenticated } from './switch-page.ts';

const headerMenu = document.getElementById('desktopMenu');

const setHeaderMenuList = async () => {
  const isAuth = await isAuthenticated();

  if (headerMenu && isAuth) {
    headerMenu.innerHTML = `
      <a href="#" data-page="home" class="text-light hover:text-gray-300">Home</a>
      <a href="#" data-page="profile" class="text-light hover:text-gray-300">Profile</a>
      <a href="#" data-page="about-us" id="abUsButton" class="text-light hover:text-gray-300">About Us</a>
    `;
  } else if (headerMenu) {
    headerMenu.innerHTML = `
      <a href="#" data-page="home" class="text-light hover:text-gray-300">Home</a>
      <a href="#" data-page="about-us" id="abUsButton" class="text-light hover:text-gray-300">About Us</a>`;
  }
};

const setHeaderBurgerMenu = async () => {
  const burgerMenu = document.getElementById('mobileMenu');
  const isAuth = await isAuthenticated();
  if (burgerMenu && isAuth) {
    burgerMenu.innerHTML = `
    <li><a href="#" data-page="home" class="burger-btn block text-white">HOME</a></li>
    <li><a href="#" data-page="profile" class="burger-btn block text-white">PROFILE</a></li>
    <li><a href="#" data-page="about-us" class="burger-btn block text-white">ABOUT US</a></li>`;
  } else if (burgerMenu) {
    burgerMenu.innerHTML = `
    <li><a href="#" data-page="home" class="burger-btn block text-white">HOME</a></li>
    <li><a href="#" data-page="about-us" class="burger-btn block text-white">ABOUT US</a></li>`;
  }
};

const setHeaderProfilePic = async () => {
  const profilePic = document.getElementById('loginPic');
  const isAuth = await isAuthenticated();
  if (profilePic && isAuth) {
    profilePic.innerHTML = `
    <img
    src="DefaultProfilePic.png"
    alt="ProfilePic"
    class="size-12 rounded-xl hover:rounded-3xl hover:brightness-200 duration-300"
    />`;
  } else if (profilePic) {
    profilePic.innerHTML = `
    <a href="#" id="loginLink" class="flex items-center">
    <h1 id="loginBtn" class="text-white ">Login</h1>
    </a>
    <a href="#" id="registerLink" class="flex items-center p-2">
    <h1 id="registerBtn" class="text-white p-2">Register</h1>
    </a>
    `;
  }
};
const setHeaderMenu = () => {
  setHeaderMenuList();
  setHeaderBurgerMenu();
  setHeaderProfilePic();
};

export { setHeaderMenu };
