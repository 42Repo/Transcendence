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
    <hr></hr>
    <li><a href="#" data-page="home" class="burger-btn block text-white">HOME</a></li>
    <hr></hr>
    <li><a href="#" data-page="profile" class="burger-btn block text-white">PROFILE</a></li>
    <hr></hr>
    <li><a href="#" data-page="about-us" class="burger-btn block text-white">ABOUT US</a></li>`;
        } else if (burgerMenu) {
                burgerMenu.innerHTML = `
    <hr></hr>
    <li><a href="#" data-page="home" class="burger-btn block text-white">HOME</a></li>
    <hr></hr>
    <li><a href="#" data-page="about-us" class="burger-btn block text-white">ABOUT US</a></li>`;
        }
};

const setHeaderProfilePic = async () => {
        const token = localStorage.getItem('authToken');

        if (!token) {
                console.error('No auth token found.');
                throw new Error('Unauthorized');
        }

        const response = await fetch('/api/users/me', {
                method: 'GET',
                headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                },
        });

        if (response.status === 401) {
                console.error('Authentication failed (token invalid or expired).');
                throw new Error('Unauthorized');
        }
        if (response.status === 404) {
                console.error('User data not found on server for /me endpoint.');
                throw new Error('User not found');
        }

        if (!response.ok) {
                console.error(`Server error: ${response.status} ${response.statusText}`);
                let errorMsg = `Server error: ${response.status}`;
                try {
                        const errData = await response.json();
                        if (errData && errData.message) {
                                errorMsg = errData.message;
                        }
                } catch (e) {
                        console.warn('Could not parse error response body as JSON.');
                }
                throw new Error(errorMsg);
        }
        const data: ApiResponse<UserPublicData> = await response.json();
        const profilePicElem = document.getElementById('loginPic');
        const isAuth = await isAuthenticated();
        let profilePic = data.user?.avatar_url ?? 'DefaultProfilePicture.png';

        if (profilePicElem && isAuth) {
                profilePicElem.innerHTML =
                        `
    <img
    src="` +
                        profilePic +
                        `"
    alt="ProfilePic"
    class="size-12 rounded-xl hover:rounded-3xl hover:brightness-200 duration-300"
    />`;
        } else if (profilePicElem) {
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
const setHeaderMenu = () => {
        setHeaderMenuList();
        setHeaderBurgerMenu();
        setHeaderProfilePic();
};

export { setHeaderMenu };
