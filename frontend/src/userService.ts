export interface UserPublicData {
  user_id: number;
  username: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

export interface UserPrivateData extends UserPublicData {
  email: string | null;
  preferred_language: string;
  updated_at: string;
  description: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  user?: T;
  message?: string;
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
      console.log('User data fetched successfully:', data.user);
      return data.user;
    } else {
      console.error(
        'API reported success=false or missing user data:',
        data.message
      );
      throw new Error(
        data.message || 'Failed to retrieve profile data from API response.'
      );
    }
  } catch (error) {
    console.error('Error during fetchMyProfileData:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred during profile fetch.');
    }
  }
}

// TODO - Implement fetchUserProfileData(identifier)
export async function fetchFriendsList(): Promise<any[]> {
  console.warn(
    'fetchFriendsList function needs implementation (requires backend API).'
  );

  // Simulate network delay for placeholder
  await new Promise((resolve) => setTimeout(resolve, 500));
  return []; // Return empty array for now
}

// TODO - Replace 'any' with your actual GameHistoryItem interface when available
export async function fetchGameHistory(): Promise<any[]> {
  console.warn(
    'fetchGameHistory function needs implementation (requires backend API).'
  );

  // Simulate network delay for placeholder
  await new Promise((resolve) => setTimeout(resolve, 500));
  return []; // Return empty array for now
}
