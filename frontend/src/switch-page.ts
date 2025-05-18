import { showLoginModal, logout } from './login';
import {
  fetchMyProfileData,
  fetchGameHistory,
  UserPrivateData,
  GameMatch,
  getMatchResultForUser,
  fetchAcceptedFriends,
  fetchIncomingFriendRequests,
  fetchSentFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from './userService';
import { initializeEditProfileAvatarHandling } from './editProfileData';
import {
  showFeedback as showSnackbar,
  clearFeedback as clearSnackbar,
} from './utils/modalUtils';

const content = document.getElementById('content');
const cache: Map<string, string> = new Map();
const existingPages: string[] = [
  'home',
  'about-us',
  'edit-profile',
  'error',
  'logged',
  'pongGame',
  'pongTournament',
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
    if (!data.success && token) localStorage.removeItem('authToken');
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
  if (content) {
    content.innerHTML =
      '<h1>Error 404 - Cannot load page content</h1><p>Please try again later.</p>';
  }
};

const pageRequiresAuth = (page: string): boolean => {
  const authPages = ['profile', 'edit-profile', 'logged'];
  return authPages.includes(page);
};

export const fetchPage = async (page: string): Promise<void> => {
  if (!content) {
    console.error('Content container not found in DOM.');
    return;
  }

  const isAuth = await isAuthenticated();
  if (pageRequiresAuth(page) && !isAuth) {
    const currentPage = getPageName();
    if (currentPage !== 'home' && currentPage !== 'error') {
      await switchPage('home');
    }
    showLoginModal();
    return;
  }

  const realPage: string = page;
  if (page === 'pongTournament') page = 'pongGame';

  if (page !== 'pongGame') {
    document.dispatchEvent(new Event('pong:leaving'));
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (cache.has(page)) {
    content.innerHTML = cache.get(page)!;
    if (realPage === 'pongTournament') {
      setTimeout(() => {
        document.dispatchEvent(new Event('pongTournamentLoaded'));
      }, 100);
    } else if (page === 'pongGame') {
      setTimeout(() => {
        document.dispatchEvent(new Event('pongGameLoaded'));
      }, 100);
    }
  } else {
    try {
      const response = await fetch(`views/${page}.html`);
      if (!response.ok) {
        throw new Error(
          `Page not found: ${page}.html (Status: ${response.status})`
        );
      }
      const html = await response.text();
      content.innerHTML = html;
      if (realPage === 'pongTournament') {
        setTimeout(() => {
          document.dispatchEvent(new Event('pongTournamentLoaded'));
        }, 100);
      } else if (page === 'pongGame') {
        setTimeout(() => {
          document.dispatchEvent(new Event('pongGameLoaded'));
        }, 100);
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
    } else if (page === 'edit-profile') {
      await loadAndPopulateEditProfileData();
      initializeEditProfileAvatarHandling();
    } else if (page === 'logged') {
      await loadAndPopulateLoggedDashboardData();
      setupLoggedDashboardEventListeners();
    }
  } catch (dataLoadError) {
    console.error(
      `Error loading dynamic data for page '${page}':`,
      dataLoadError
    );
  }
};

async function loadAndPopulateLoggedDashboardData() {
  const avatarElem = document.getElementById(
    'loggedUserAvatar'
  ) as HTMLImageElement | null;
  const usernameElem = document.getElementById('loggedUserUsername');

  try {
    const userData = await fetchMyProfileData();
    if (avatarElem)
      avatarElem.src = userData.avatar_url || '/DefaultProfilePic.png';
    if (usernameElem)
      usernameElem.textContent = `Welcome, ${userData.username}!`;
  } catch (error) {
    console.error(
      "Failed to load user's own data for dashboard header:",
      error
    );
    if (usernameElem) usernameElem.textContent = 'Welcome!';
  }

  initializeTabs();

  void loadMyFriendsList();
  void loadIncomingRequestsList();
  void loadSentRequestsList();
}

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      tabButtons.forEach((btn) => btn.classList.remove('active-tab'));
      button.classList.add('active-tab');

      const targetTabContentId = `tabContent${button.id.substring(3)}`;
      tabContents.forEach((content) => {
        if (content.id === targetTabContentId) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    });
  });
  const firstTabButton = document.getElementById('tabMyFriends');
  if (firstTabButton) {
    firstTabButton.click();
  }
}

async function loadMyFriendsList() {
  const listElem = document.getElementById('myFriendsList');
  const loadingElem = document.getElementById('myFriendsLoading');
  const errorElem = document.getElementById('myFriendsError');

  if (!listElem || !loadingElem || !errorElem) return;

  loadingElem.style.display = 'block';
  errorElem.style.display = 'none';
  listElem.innerHTML = '';

  try {
    const friends = await fetchAcceptedFriends();
    if (friends.length === 0) {
      listElem.innerHTML =
        '<li class="text-mediumlight text-center">You have no friends yet.</li>';
    } else {
      friends.forEach((friend) => {
        const item = document.createElement('li');
        item.className =
          'flex items-center justify-between bg-mediumlightdark p-3 rounded-lg text-lightlight';
        item.innerHTML = `
          <div class="flex items-center">
            <img src="${friend.avatar_url || '/DefaultProfilePic.png'}" alt="${friend.username}" class="w-10 h-10 rounded-full mr-3 object-cover">
            <span>${friend.username} (${friend.online_status})</span>
          </div>
          <div>
            <button data-user-id="${friend.friend_user_id}" class="view-profile-btn text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded mr-1 hidden">Profile</button>
            <button data-user-id="${friend.friend_user_id}" data-username="${friend.username}" class="remove-friend-btn text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded">Remove</button>
          </div>
        `;
        listElem.appendChild(item);
      });
    }
  } catch (error) {
    errorElem.textContent = `Error loading friends: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errorElem.style.display = 'block';
  } finally {
    loadingElem.style.display = 'none';
  }
}

async function loadIncomingRequestsList() {
  const listElem = document.getElementById('incomingRequestsList');
  const loadingElem = document.getElementById('incomingRequestsLoading');
  const errorElem = document.getElementById('incomingRequestsError');

  if (!listElem || !loadingElem || !errorElem) return;

  loadingElem.style.display = 'block';
  errorElem.style.display = 'none';
  listElem.innerHTML = '';

  try {
    const requests = await fetchIncomingFriendRequests();
    if (requests.length === 0) {
      listElem.innerHTML =
        '<li class="text-mediumlight text-center">No incoming friend requests.</li>';
    } else {
      requests.forEach((req) => {
        const item = document.createElement('li');
        item.className =
          'flex items-center justify-between bg-mediumlightdark p-3 rounded-lg text-lightlight';
        item.innerHTML = `
          <div class="flex items-center">
            <img src="${req.avatar_url || '/DefaultProfilePic.png'}" alt="${req.username}" class="w-10 h-10 rounded-full mr-3 object-cover">
            <span title="Requested on: ${new Date(req.request_date).toLocaleDateString()}">${req.username}</span>
          </div>
          <div>
            <button data-user-id="${req.requester_user_id}" class="accept-request-btn text-xs bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded mr-1">Accept</button>
            <button data-user-id="${req.requester_user_id}" class="decline-request-btn text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded">Decline</button>
          </div>
        `;
        listElem.appendChild(item);
      });
    }
  } catch (error) {
    errorElem.textContent = `Error loading incoming requests: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errorElem.style.display = 'block';
  } finally {
    loadingElem.style.display = 'none';
  }
}

async function loadSentRequestsList() {
  const listElem = document.getElementById('sentRequestsList');
  const loadingElem = document.getElementById('sentRequestsLoading');
  const errorElem = document.getElementById('sentRequestsError');

  if (!listElem || !loadingElem || !errorElem) return;

  loadingElem.style.display = 'block';
  errorElem.style.display = 'none';
  listElem.innerHTML = '';

  try {
    const requests = await fetchSentFriendRequests();
    if (requests.length === 0) {
      listElem.innerHTML =
        '<li class="text-mediumlight text-center">No pending sent requests.</li>';
    } else {
      requests.forEach((req) => {
        const item = document.createElement('li');
        item.className =
          'flex items-center justify-between bg-mediumlightdark p-3 rounded-lg text-lightlight';
        item.innerHTML = `
          <div class="flex items-center">
            <img src="${req.avatar_url || '/DefaultProfilePic.png'}" alt="${req.username}" class="w-10 h-10 rounded-full mr-3 object-cover">
            <span title="Sent on: ${new Date(req.request_date).toLocaleDateString()}">${req.username}</span>
          </div>
          <button data-user-id="${req.addressee_user_id}" class="cancel-request-btn text-xs bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-2 rounded">Cancel</button>
        `;
        listElem.appendChild(item);
      });
    }
  } catch (error) {
    errorElem.textContent = `Error loading sent requests: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errorElem.style.display = 'block';
  } finally {
    loadingElem.style.display = 'none';
  }
}

function setupLoggedDashboardEventListeners() {
  const findFriendInput = document.getElementById(
    'findFriendInput'
  ) as HTMLInputElement | null;
  const sendFriendRequestButton = document.getElementById(
    'sendFriendRequestButton'
  );
  const findFriendFeedback = document.getElementById('findFriendFeedback');

  sendFriendRequestButton?.addEventListener('click', async () => {
    if (!findFriendInput || !findFriendFeedback) return;
    const username = findFriendInput.value.trim();
    if (!username) {
      showSnackbar('findFriendFeedback', 'Please enter a username.', true);
      return;
    }
    clearSnackbar('findFriendFeedback');
    showSnackbar(
      'findFriendFeedback',
      `Sending request to ${username}...`,
      false
    );
    try {
      await sendFriendRequest(username);
      showSnackbar(
        'findFriendFeedback',
        `Friend request sent to ${username}.`,
        false
      );
      findFriendInput.value = '';
      void loadSentRequestsList();
    } catch (error) {
      showSnackbar(
        'findFriendFeedback',
        `Error: ${error instanceof Error ? error.message : 'Could not send request.'}`,
        true
      );
    }
  });

  content?.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;

    if (target.classList.contains('accept-request-btn')) {
      const userId = target.dataset.userId;
      if (userId) {
        showSnackbar('findFriendFeedback', `Accepting request...`, false);
        try {
          await acceptFriendRequest(parseInt(userId, 10));
          showSnackbar('findFriendFeedback', `Friend request accepted.`, false);
          void loadMyFriendsList();
          void loadIncomingRequestsList();
        } catch (error) {
          showSnackbar(
            'findFriendFeedback',
            `Error: ${error instanceof Error ? error.message : 'Could not accept request.'}`,
            true
          );
        }
      }
    }

    if (target.classList.contains('decline-request-btn')) {
      const userId = target.dataset.userId;
      if (userId) {
        showSnackbar('findFriendFeedback', `Declining request...`, false);
        try {
          await declineFriendRequest(parseInt(userId, 10));
          showSnackbar('findFriendFeedback', `Friend request declined.`, false);
          void loadIncomingRequestsList();
        } catch (error) {
          showSnackbar(
            'findFriendFeedback',
            `Error: ${error instanceof Error ? error.message : 'Could not decline request.'}`,
            true
          );
        }
      }
    }

    if (target.classList.contains('cancel-request-btn')) {
      const userId = target.dataset.userId;
      if (userId) {
        showSnackbar('findFriendFeedback', `Cancelling request...`, false);
        try {
          await cancelFriendRequest(parseInt(userId, 10));
          showSnackbar(
            'findFriendFeedback',
            `Friend request cancelled.`,
            false
          );
          void loadSentRequestsList();
        } catch (error) {
          showSnackbar(
            'findFriendFeedback',
            `Error: ${error instanceof Error ? error.message : 'Could not cancel request.'}`,
            true
          );
        }
      }
    }

    if (target.classList.contains('remove-friend-btn')) {
      const userId = target.dataset.userId;
      const username = target.dataset.username;
      if (
        userId &&
        window.confirm(
          `Are you sure you want to remove ${username || 'this user'} as a friend?`
        )
      ) {
        showSnackbar('findFriendFeedback', `Removing friend...`, false);
        try {
          await removeFriend(parseInt(userId, 10));
          showSnackbar(
            'findFriendFeedback',
            `Successfully removed ${username || 'user'} from friends.`,
            false
          );
          void loadMyFriendsList();
        } catch (error) {
          showSnackbar(
            'findFriendFeedback',
            `Error: ${error instanceof Error ? error.message : 'Could not remove friend.'}`,
            true
          );
        }
      }
    }
  });
}

async function loadAndPopulateEditProfileData() {
  const loadingIndicator = document.getElementById('profileLoading');
  const errorDisplay = document.getElementById('profileError');
  const profileContentArea = document.getElementById('profileContentArea');

  const usernameElem = document.getElementById('username') as HTMLInputElement;
  const joinDateElem = document.getElementById('joinDate');
  const emailElem = document.getElementById('userEmail') as HTMLInputElement;
  const profilePicPreviewElem = document.getElementById(
    'profilePicturePreview'
  ) as HTMLImageElement | null;
  const bioElem = document.getElementById(
    'bioText'
  ) as HTMLTextAreaElement | null;

  const currentPasswordContainer = document.getElementById(
    'currentPasswordContainer'
  );
  const passwordSectionTitle = document.getElementById('passwordSectionTitle');

  const enableA2FButton = document.getElementById(
    'enableA2F'
  ) as HTMLButtonElement | null;

  if (
    !loadingIndicator ||
    !errorDisplay ||
    !profileContentArea ||
    !usernameElem ||
    !joinDateElem ||
    !enableA2FButton ||
    !emailElem ||
    !profilePicPreviewElem ||
    !bioElem ||
    !currentPasswordContainer ||
    !passwordSectionTitle
  ) {
    console.error(
      'Edit Profile page structure is missing required elements. Check IDs in edit-profile.html and this function.'
    );
    if (content)
      content.innerHTML = '<h2>Error: Page structure is incomplete.</h2>';
    return;
  }

  loadingIndicator.style.display = 'block';
  errorDisplay.style.display = 'none';
  errorDisplay.textContent = '';
  profileContentArea.style.display = 'none';

  try {
    const userData: UserPrivateData = await fetchMyProfileData();

    usernameElem.value = userData.username;
    usernameElem.defaultValue = userData.username;

    if (!userData.is_two_factor_enabled)
      enableA2FButton.classList.remove('hidden');
    else enableA2FButton.classList.add('hidden');

    joinDateElem.textContent = new Date(
      userData.created_at
    ).toLocaleDateString();

    emailElem.value = userData.email || '';
    emailElem.defaultValue = userData.email || '';

    const currentAvatarUrl = userData.avatar_url || '/DefaultProfilePic.png';
    profilePicPreviewElem.src = currentAvatarUrl;
    profileContentArea.setAttribute(
      'data-current-avatar-url',
      currentAvatarUrl
    );

    bioElem.value = userData.bio || '';
    bioElem.defaultValue = userData.bio || '';

    profileContentArea.setAttribute(
      'data-has-password',
      String(userData.has_password)
    );

    if (userData.has_password) {
      currentPasswordContainer.style.display = 'block';
      passwordSectionTitle.textContent = 'Change Password';
    } else {
      currentPasswordContainer.style.display = 'none';
      passwordSectionTitle.textContent = 'Set Password';
    }

    profileContentArea.style.display = 'block';
    errorDisplay.style.display = 'none';
  } catch (error) {
    console.error('Error loading edit profile data:', error);
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

function calculateBestWinStreak(
  matches: GameMatch[],
  currentUserId: number
): number {
  let bestStreak = 0;
  let currentStreak = 0;

  const chronologicalMatches = [...matches].sort(
    (a, b) =>
      new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
  );

  for (const match of chronologicalMatches) {
    const result = getMatchResultForUser(match, currentUserId);
    if (result === 'win') {
      currentStreak++;
    } else {
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }
      currentStreak = 0;
    }
  }
  if (currentStreak > bestStreak) bestStreak = currentStreak;
  return bestStreak;
}

async function loadAndPopulateProfileData() {
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
  const bioElem = document.getElementById(
    'bioText'
  ) as HTMLParagraphElement | null;

  const statsWinsElem = document.getElementById('statsWins');
  const statsLossesElem = document.getElementById('statsLosses');
  const statsWinLossRateElem = document.getElementById('statsWinLossRate');
  const statsBestWinStreakElem = document.getElementById('statsBestWinStreak');

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
    !bioElem ||
    !statsWinsElem ||
    !statsLossesElem ||
    !statsWinLossRateElem ||
    !statsBestWinStreakElem ||
    !historyLoading ||
    !historyError ||
    !historyContainer
  ) {
    console.error(
      'Profile page structure is missing required elements. Check IDs in profile.html and this function.'
    );
    if (content)
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
    statusElem.textContent =
      userData.status.charAt(0).toUpperCase() + userData.status.slice(1);
    emailElem.textContent = userData.email || 'Not provided';
    if (
      userData.avatar_url &&
      userData.avatar_url !== '/default-avatar.png' &&
      userData.avatar_url !== '/DefaultProfilePic.png'
    ) {
      profilePicElem.src = userData.avatar_url;
    } else {
      profilePicElem.src = '/DefaultProfilePic.png';
    }
    bioElem.textContent = userData.bio || 'No biography set.';

    statsWinsElem.textContent = `Wins: ${userData.total_wins}`;
    statsLossesElem.textContent = `Losses: ${userData.total_losses}`;

    if (userData.total_losses > 0) {
      const ratio = userData.total_wins / userData.total_losses;
      statsWinLossRateElem.textContent = `W/L Rate: ${ratio.toFixed(2)}`;
    } else if (userData.total_wins > 0) {
      statsWinLossRateElem.textContent = `W/L Rate: Perfect! (∞)`;
    } else {
      statsWinLossRateElem.textContent = `W/L Rate: N/A`;
    }

    const rankElem = document.getElementById('statsRank');
    if (rankElem) rankElem.textContent = `Rank: (Needs API)`;

    profileContentArea.style.display = 'block';
    errorDisplay.style.display = 'none';

    const historyItems: GameMatch[] = await fetchGameHistory(userData.user_id);
    const bestStreak = calculateBestWinStreak(historyItems, userData.user_id);
    statsBestWinStreakElem.textContent = `Best Win Streak: ${bestStreak}`;

    void loadHistory(
      userData.user_id,
      historyContainer,
      historyLoading,
      historyError,
      historyItems
    );
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

async function loadHistory(
  currentUserId: number,
  container: HTMLElement | null,
  loading: HTMLElement | null,
  errorDisplay: HTMLElement | null,
  historyItemsToDisplay?: GameMatch[]
) {
  if (!container || !loading || !errorDisplay) {
    console.error('Game history elements missing');
    return;
  }
  loading.style.display = 'block';
  errorDisplay.style.display = 'none';
  container.innerHTML = '';
  try {
    const historyItems: GameMatch[] =
      historyItemsToDisplay ?? (await fetchGameHistory(currentUserId));

    if (historyItems.length === 0) {
      container.innerHTML =
        '<li class="p-3 text-gray-500">No game history found.</li>';
    } else {
      const historyHtml = historyItems
        .map((item) => {
          const result = getMatchResultForUser(item, currentUserId);

          let opponentDisplayName: string;
          let opponentAvatar: string | null | undefined;

          if (currentUserId === item.player1_id) {
            opponentDisplayName =
              item.player2_username || item.player2_guest_name || 'Guest';
            opponentAvatar = item.player2_id ? item.player2_avatar_url : null;
          } else {
            opponentDisplayName =
              item.player1_username || item.player1_guest_name || 'Guest';
            opponentAvatar = item.player1_id ? item.player1_avatar_url : null;
          }

          const userScore =
            currentUserId === item.player1_id
              ? item.player1_score
              : item.player2_score;
          const opponentScore =
            currentUserId === item.player1_id
              ? item.player2_score
              : item.player1_score;

          const userTouchedBall =
            currentUserId === item.player1_id
              ? item.player1_touched_ball
              : item.player2_touched_ball;
          const userMissedBall =
            currentUserId === item.player1_id
              ? item.player1_missed_ball
              : item.player2_missed_ball;

          const opponentTouchedBall =
            currentUserId === item.player1_id
              ? item.player2_touched_ball
              : item.player1_touched_ball;
          const opponentMissedBall =
            currentUserId === item.player1_id
              ? item.player2_missed_ball
              : item.player1_missed_ball;

          const resultClass =
            result === 'win'
              ? 'text-green-500'
              : result === 'loss'
                ? 'text-red-500'
                : 'text-gray-500';
          const avatarSrc =
            opponentAvatar &&
            opponentAvatar !== '/default-avatar.png' &&
            opponentAvatar !== '/DefaultProfilePic.png'
              ? opponentAvatar
              : '/DefaultProfilePic.png';

          return `
          <li class="flex flex-col p-3 border-b border-mediumlightdark hover:bg-mediumdark text-light">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
                <img src="${avatarSrc}" alt="${opponentDisplayName}" class="w-10 h-10 rounded-full mr-3 object-cover">
                <span>vs ${opponentDisplayName}</span>
              </div>
              <span class="${resultClass} font-semibold">${result.toUpperCase()} (${userScore} - ${opponentScore})</span>
              <span>${new Date(item.match_date).toLocaleDateString()}</span>
            </div>
            <div class="text-xs text-gray-400 mt-1 pl-12">
              <p>Your Performance: Touched: ${userTouchedBall || 0}, Missed: ${userMissedBall || 0}</p>
              <p>Opponent's Performance: Touched: ${opponentTouchedBall || 0}, Missed: ${opponentMissedBall || 0}</p>
            </div>
          </li>
        `;
        })
        .join('');
      container.innerHTML = historyHtml;
    }
  } catch (e) {
    console.error('Error loading game history:', e);
    errorDisplay.style.display = 'block';
    errorDisplay.textContent = `Could not load game history. ${e instanceof Error ? `(${e.message})` : ''}`;
    container.innerHTML = '';
  } finally {
    loading.style.display = 'none';
  }
}

export const switchPage = async (page: string) => {
  const isAuth = await isAuthenticated();
  const targetPage = page === 'home' && isAuth ? 'logged' : page;

  const currentLogicalPage = history.state?.page || getPageName();

  if (
    targetPage === currentLogicalPage &&
    targetPage !== 'profile' &&
    targetPage !== 'edit-profile' &&
    targetPage !== 'logged'
  ) {
    return;
  }

  const newPath =
    targetPage === 'home' || targetPage === 'logged' ? '/' : `/${targetPage}`;
  history.pushState({ page: targetPage }, '', newPath);
  void fetchPage(targetPage);
};

export const loadCurrentPage = async () => {
  const pageFromState = history.state?.page;
  const pageFromUrl = getPageName();
  let page = pageFromState || pageFromUrl;

  const isAuth = await isAuthenticated();
  if ((page === 'home' || page === '') && isAuth) {
    page = 'logged';
    history.replaceState({ page: 'logged' }, '', '/');
  }

  void fetchPage(page);
};

const initializeApp = async () => {
  await loadCurrentPage();
};

void initializeApp();

window.addEventListener('popstate', async (event) => {
  let pageToLoad = event.state?.page;

  if (!pageToLoad) {
    pageToLoad = getPageName();
  }

  const isAuth = await isAuthenticated();
  const finalPage =
    (pageToLoad === 'home' || pageToLoad === '') && isAuth
      ? 'logged'
      : pageToLoad;

  void fetchPage(finalPage);
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
});
