import { showLoginModal, logout } from './login';
import {
  fetchMyProfileData,
  fetchFriendsList,
  fetchGameHistory,
  UserPrivateData,
} from './userService';

const content = document.getElementById('content') as HTMLElement;
const cache: Map<string, string> = new Map();
const existingPages: string[] = [
  'home',
  'about-us',
  'edit-profile',
  'error',
  'logged',
  'pongGame',
  'privacy-policy',
  'profile',
  'publicProfile',
];

export const isAuthenticated = async (): Promise<boolean> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return false;
  }

  try {
    const response = await fetch('/api/verify-jwt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Erreur lors de la vérification du token :', error);
    return false;
  }
};

const getPageName = (): string => {
  const path = window.location.pathname.split('/').pop() || 'home';
  const page = path.replace('.html', '');

  if (page === '' || page === '/') return 'home';
  return existingPages.includes(page) ? page : 'error';
};

const fetchLoadingError = async () => {
  content.innerHTML =
    '<h1>Error 404 - Cannot load page content</h1><p>Please try again later.</p>';
};

const pageRequiresAuth = (page: string): boolean => {
  const authPages = ['profile', 'edit-profile', 'logged'];
  return authPages.includes(page);
};

export const fetchPage = async (page: string): Promise<void> => {
  const isAuth = await isAuthenticated();
  if (pageRequiresAuth(page) && !isAuth) {
    console.log(
      `Page '${page}' requires authentication. Redirecting to home/login.`
    );
    const currentPage = getPageName();
    if (currentPage !== 'home' && currentPage !== 'error') {
      await switchPage('home');
    }
    showLoginModal();
    return;
  }

  console.log('Fetching page structure for:', page);

  if (cache.has(page)) {
    content.innerHTML = cache.get(page)!;
    if (page === 'pongGame') {
      setTimeout(() => {
        console.log('sdf');
        document.dispatchEvent(new Event('pongGameLoaded'));
      }, 50);
    }
  } else {
    try {
      const response = await fetch(`src/views/${page}.html`);
      if (!response.ok) {
        throw new Error(
          `Page not found: ${page}.html (Status: ${response.status})`
        );
      }
      const html = await response.text();
      content.innerHTML = html;
      if (page === 'pongGame') {
        setTimeout(() => {
          console.log('lalalla');
          document.dispatchEvent(new Event('pongGameLoaded'));
        }, 50);
      }
      cache.set(page, html);
    } catch (err) {
      console.error('Error loading page HTML structure:', err);
      await fetchLoadingError();
      return;
    }
  }

  try {
    if (page === 'profile') {
      await loadAndPopulateProfileData();
    }
    // else if (page === 'publicProfile') {
    //    const identifier = window.location.pathname.split('/').pop();
    //    if (identifier && identifier !== 'publicProfile') {
    //        await loadPublicProfileData(identifier);
    //    } else {
    //        console.warn("Could not determine user identifier for public profile page.");
    //    }
    // }
    else if (page === 'logged') {
      console.log("Landed on 'logged' page. Implement data loading if needed.");
    }
  } catch (dataLoadError) {
    console.error(
      `Error loading dynamic data for page '${page}':`,
      dataLoadError
    );
  }
};

async function loadAndPopulateProfileData() {
  console.log('Attempting to load and populate profile data...');

  const loadingIndicator = document.getElementById('profileLoading');
  const errorDisplay = document.getElementById('profileError');
  const profileContentArea = document.getElementById('profileContentArea');

  const usernameElem = document.getElementById('username');
  const joinDateElem = document.getElementById('joinDate');
  const statusElem = document.getElementById('userStatus');
  const emailElem = document.getElementById('userEmail');
  const profilePicElem = document.getElementById(
    'profilePicture'
  ) as HTMLImageElement | null;
  const bioElem = document.getElementById('bioText');
  const friendsLoading = document.getElementById('friendsLoading');
  const friendsError = document.getElementById('friendsError');
  const friendsContainer = document.getElementById('friendsListContainer');
  const historyLoading = document.getElementById('historyLoading');
  const historyError = document.getElementById('historyError');
  const historyContainer = document.getElementById('gameHistoryContainer');

  if (
    !loadingIndicator ||
    !errorDisplay ||
    !profileContentArea ||
    !usernameElem ||
    !joinDateElem ||
    !statusElem ||
    !emailElem ||
    !profilePicElem ||
    !bioElem
  ) {
    console.error(
      'Profile page structure is missing required elements. Check IDs in profile.html and this function.'
    );
    content.innerHTML = '<h2>Error: Page structure is incomplete.</h2>';
    return;
  }

  loadingIndicator.style.display = 'block';
  errorDisplay.style.display = 'none';
  errorDisplay.textContent = '';
  profileContentArea.style.display = 'none';

  try {
    const userData: UserPrivateData = await fetchMyProfileData();

    usernameElem.textContent = userData.username;
    joinDateElem.textContent = new Date(
      userData.created_at
    ).toLocaleDateString();
    statusElem.textContent = userData.status;
    emailElem.textContent = userData.email || 'Not provided';
    if (userData.avatar_url && userData.avatar_url !== '/default-avatar.png') {
      profilePicElem.src = userData.avatar_url;
    } else {
      profilePicElem.src = '/DefaultProfilePic.png';
    }
    // bioElem.textContent = userData.bio || "No biography set.";

    const rankElem = document.getElementById('statsRank');
    // if (rankElem && userData.rank) rankElem.textContent = `Rank: ${userData.rank}`;
    // else if (rankElem) rankElem.textContent = `Rank: Unranked`;
    if (rankElem) rankElem.textContent = `Rank: (Needs API)`;

    profileContentArea.style.display = 'block';
    errorDisplay.style.display = 'none';

    void loadFriends(friendsContainer, friendsLoading, friendsError);
    void loadHistory(historyContainer, historyLoading, historyError);
  } catch (error) {
    console.error('Error loading profile data:', error);
    errorDisplay.style.display = 'block';
    profileContentArea.style.display = 'none';

    if (error instanceof Error) {
      errorDisplay.textContent = `Error loading profile: ${error.message}`;
      if (error.message === 'Unauthorized') {
        errorDisplay.textContent += ' Please log in again.';
        logout();
        showLoginModal();
      }
    } else {
      errorDisplay.textContent =
        'An unknown error occurred while loading the profile.';
    }
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

async function loadFriends(
  container: HTMLElement | null,
  loading: HTMLElement | null,
  errorDisplay: HTMLElement | null
) {
  if (!container || !loading || !errorDisplay) {
    console.error('Friends list elements missing');
    return;
  }
  loading.style.display = 'block';
  errorDisplay.style.display = 'none';
  container.innerHTML = '';
  try {
    const friends = await fetchFriendsList();
    if (friends.length === 0) {
      container.innerHTML =
        '<li class="p-3 text-gray-500">No friends added yet.</li>';
    } else {
      container.innerHTML = friends
        .map((friend) => `<li class="p-3">Friend: ${friend.name}</li>`)
        .join('');
    }
  } catch (e) {
    console.error('Error loading friends:', e);
    errorDisplay.style.display = 'block';
    errorDisplay.textContent = `Could not load friends list.${e instanceof Error ? ` (${e.message})` : ''}`;
    container.innerHTML = '';
  } finally {
    loading.style.display = 'none';
  }
}

async function loadHistory(
  container: HTMLElement | null,
  loading: HTMLElement | null,
  errorDisplay: HTMLElement | null
) {
  if (!container || !loading || !errorDisplay) {
    console.error('Game history elements missing');
    return;
  }
  loading.style.display = 'block';
  errorDisplay.style.display = 'none';
  container.innerHTML = '';
  try {
    const history = await fetchGameHistory();
    if (history.length === 0) {
      container.innerHTML =
        '<li class="p-3 text-gray-500">No game history found.</li>';
    } else {
      container.innerHTML = history
        .map(
          (game) =>
            `<li class="p-3">Game vs ${game.opponent} - ${game.result}</li>`
        )
        .join('');
    }
  } catch (e) {
    console.error('Error loading game history:', e);
    errorDisplay.style.display = 'block';
    errorDisplay.textContent = `Could not load game history.${e instanceof Error ? ` (${e.message})` : ''}`;
    container.innerHTML = '';
  } finally {
    loading.style.display = 'none';
  }
}

export const switchPage = async (page: string) => {
  const isAuth = await isAuthenticated();
  const targetPage = page === 'home' && isAuth ? 'logged' : page;

  const currentLogicalPage = history.state?.page || getPageName();

  if (targetPage === currentLogicalPage) {
    console.log(
      `Already on page '${targetPage}', re-fetching data if applicable.`
    );
    if (targetPage === 'profile') {
      void loadAndPopulateProfileData();
    }
    return;
  }

  const newPath =
    targetPage === 'home' || targetPage === 'logged' ? '/' : `/${targetPage}`;

  console.log(
    `Switching page. Current: '${currentLogicalPage}', Target: '${targetPage}', New path: '${newPath}'`
  );

  history.pushState({ page: targetPage }, '', newPath);

  void fetchPage(targetPage);
};

export const loadCurrentPage = async () => {
  const pageFromState = history.state?.page;
  const pageFromUrl = getPageName();
  let page = pageFromState || pageFromUrl;

  console.log(
    `Loading current page. From State: ${pageFromState}, From URL: ${pageFromUrl}, Effective page: ${page}`
  );
  const isAuth = await isAuthenticated();
  if ((page === 'home' || page === '') && isAuth) {
    console.log(
      "User authenticated on home/root, switching effective page to 'logged'"
    );
    page = 'logged';
    history.replaceState({ page: 'logged' }, '', '/');
  }

  void fetchPage(page);
};

const initializeApp = async () => {
  console.log('Initializing app...');
  // await prefetchAllPages();
  loadCurrentPage();
};

void initializeApp();

window.addEventListener('popstate', async (event) => {
  console.log('Popstate event triggered (back/forward)', event.state);
  const pageToLoad = event.state?.page;

  if (pageToLoad) {
    const isAuth = await isAuthenticated();
    const finalPage = pageToLoad === 'home' && isAuth ? 'logged' : pageToLoad;
    console.log(`Popstate navigating to effective page: ${finalPage}`);
    void fetchPage(finalPage);
  } else {
    console.log('Popstate has no state, loading based on URL.');
    loadCurrentPage();
  }
});

document.body.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest('[data-page]');

  if (link instanceof HTMLElement && link.dataset.page) {
    e.preventDefault();
    const page = link.dataset.page;
    if (page) {
      switchPage(page);
    }
  }

  const logoutButton = target.closest('#logoutBtn');
  if (logoutButton) {
    e.preventDefault();
    console.log('Logout button clicked.');
    logout();
    switchPage('home');
  }
});
