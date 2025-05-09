import { logout } from './login';
import { showFeedback } from './utils/modalUtils';

const EDIT_PROFILE_FEEDBACK_ID = 'editProfileFeedback';

export interface UserPublicData {
  user_id: number;
  username: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

export interface UserPrivateData extends UserPublicData {
  email: string | null;
  bio: string | null;
  updated_at: string;
  total_wins: number;
  total_losses: number;
  has_password: boolean;
}

export interface GameMatch {
  match_id: number;
  player1_id: number;
  player2_id: number;
  player1_username: string;
  player1_avatar_url?: string;
  player2_username: string;
  player2_avatar_url?: string;
  player1_score: number;
  player2_score: number;
  winner_id: number | null;
  match_date: string;
}

export function getMatchResultForUser(
  match: GameMatch,
  currentUserId: number
): 'win' | 'loss' | 'draw' {
  if (match.winner_id === null) return 'draw';
  if (match.winner_id === currentUserId) return 'win';
  return 'loss';
}

interface ApiResponse<T> {
  success: boolean;
  user?: T;
  matches?: T;
  message?: string;
  requested_for_user_id?: number;
  token?: string;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  bio?: string;
  current_password?: string;
  new_password?: string;
}

export async function fetchMyProfileData(): Promise<UserPrivateData> {
  const token = localStorage.getItem('authToken');

  if (!token) {
    console.error('No auth token found.');
    throw new Error('Unauthorized');
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

    const data: ApiResponse<UserPrivateData> = await response.json();

    if (data.success && data.user) {
      const userWithDefaults = {
        total_wins: 0,
        total_losses: 0,
        bio: null,
        has_password: false,
        ...data.user,
      };
      return userWithDefaults;
    } else {
      throw new Error(
        data.message || 'Failed to retrieve profile data from API response.'
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred during profile fetch.');
    }
  }
}

export async function updateMyProfileData(
  payload: UpdateProfilePayload
): Promise<ApiResponse<UserPrivateData>> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const response = await fetch('/api/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData: ApiResponse<UserPrivateData> = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.message || `Server error: ${response.status}`
      );
    }

    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred during profile update.');
  }
}

export async function fetchGameHistory(
  userId: string | number
): Promise<GameMatch[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Unauthorized: No token');
  }

  try {
    const response = await fetch(`/api/users/${userId}/matches`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (response.status === 401) throw new Error('Unauthorized');
    if (response.status === 404)
      throw new Error('User or match history not found');
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Server error: ${response.status}`);
    }

    const data: ApiResponse<GameMatch[]> = await response.json();

    if (data.success && Array.isArray(data.matches)) {
      return data.matches;
    } else {
      throw new Error(data.message || 'Failed to retrieve game history.');
    }
  } catch (error) {
    throw error;
  }
}

export async function fetchFriendsList(): Promise<any[]> {
  console.warn(
    'fetchFriendsList function needs implementation (requires backend API).'
  );
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [];
}

function downloadJSONFile(filename: string, data: object) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadData() {
  try {
    const data = await fetchMyProfileData();
    downloadJSONFile((data.username || 'user') + '_personal_data.json', data);
  } catch (error) {
    console.error('Failed to download data:', error);
    showFeedback(
      EDIT_PROFILE_FEEDBACK_ID,
      `Failed to download data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      true
    );
  }
}

export async function deleteAccount() {
  const confirmation = window.confirm(
    'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently erased.'
  );

  if (!confirmation) {
    showFeedback(
      EDIT_PROFILE_FEEDBACK_ID,
      'Account deletion cancelled.',
      false
    );
    return;
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    showFeedback(
      EDIT_PROFILE_FEEDBACK_ID,
      'Error: You are not logged in.',
      true
    );
    logout();
    return;
  }

  showFeedback(EDIT_PROFILE_FEEDBACK_ID, 'Deleting account...', false);

  try {
    const response = await fetch('/api/users/me', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const data: ApiResponse<null> = await response.json();

    if (response.ok && data.success) {
      alert('Account deleted successfully. You will now be logged out.');
      logout();
    } else {
      showFeedback(
        EDIT_PROFILE_FEEDBACK_ID,
        data.message || 'Failed to delete account.',
        true
      );
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    showFeedback(
      EDIT_PROFILE_FEEDBACK_ID,
      `Error deleting account: ${error instanceof Error ? error.message : 'Network error or unexpected issue.'}`,
      true
    );
  }
}

export function enable2FA() {
  const tmp = prompt('2FA Enabled !');
  alert(tmp);
}
