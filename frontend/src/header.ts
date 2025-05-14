import { isAuthenticated } from './switch-page.ts';

const headerMenu = document.getElementById('desktopMenu');
export interface UserPublicData {
  user_id: number;
  username: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
}
interface ApiResponse<T> {
  success: boolean;
  user?: T;
  matches?: T;
  message?: string;
  requested_for_user_id?: number;
}
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
    <hr>
    <li><a href="#" data-page="home" class="burger-btn block text-white">HOME</a></li>
    <hr>
    <li><a href="#" data-page="profile" class="burger-btn block text-white">PROFILE</a></li>
    <hr>
    <li><a href="#" data-page="about-us" class="burger-btn block text-white">ABOUT US</a></li>`;
  } else if (burgerMenu) {
    burgerMenu.innerHTML = `
    <hr>
    <li><a href="#" data-page="home" class="burger-btn block text-white">HOME</a></li>
    <hr>
    <li><a href="#" data-page="about-us" class="burger-btn block text-white">ABOUT US</a></li>`;
  }
};

const setHeaderProfilePic = async () => {
  const isAuth = await isAuthenticated();
  const profilePicElem = document.getElementById('loginPic');
  if (!profilePicElem) return;

  if (isAuth) {
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.error('No auth token found for header refresh.');

      profilePicElem.innerHTML = `
        <a href="#" id="loginLink" class="flex items-center p-2">
        <h1 id="loginBtn" class="text-white p-2">Login</h1>
        </a>
        <a href="#" id="registerLinkBtn" class="registerLink flex items-center p-2">
        <h1 id="registerBtn" class="text-white p-2">Register</h1>
        </a>
      `;
      return;
    }

    try {
      const response = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn(
            'Header refresh: Auth token invalid or expired. Logging out.'
          );
          localStorage.removeItem('authToken');

          await setHeaderProfilePic();
          await setHeaderMenuList();
          await setHeaderBurgerMenu();
          return;
        }

        console.error(
          `Header refresh: Server error fetching user data: ${response.status}`
        );

        return;
      }
      const data: ApiResponse<UserPublicData> = await response.json();
      const profilePicUrl =
        data.user?.avatar_url && data.user.avatar_url !== '/default-avatar.png'
          ? data.user.avatar_url
          : '/DefaultProfilePic.png';

      profilePicElem.innerHTML = `
            <img
            src="${profilePicUrl}" 
            alt="ProfilePic"
            class="size-12 rounded-xl hover:rounded-3xl hover:brightness-200 duration-300"
            />`;
    } catch (error) {
      console.error(
        'Header refresh: Error fetching user data for profile pic:',
        error
      );
    }
  } else {
    profilePicElem.innerHTML = `
    <a href="#" id="loginLink" class="flex items-center p-2">
    <h1 id="loginBtn" class="text-white p-2">Login</h1>
    </a>
    <a href="#" id="registerLinkBtn" class="registerLink flex items-center p-2">
    <h1 id="registerBtn" class="text-white p-2">Register</h1>
    </a>
    `;
  }
};
const setHeaderMenu = async () => {
  await setHeaderMenuList();
  await setHeaderBurgerMenu();
  await setHeaderProfilePic();
};

export { setHeaderMenu };
