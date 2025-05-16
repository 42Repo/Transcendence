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
        is_two_factor_enabled: boolean;
}

export interface GameMatch {
        match_id: number;
        player1_id: number | null;
        player1_username: string | null;
        player1_guest_name: string | null;
        player1_avatar_url?: string | null;
        player2_id: number | null;
        player2_username: string | null;
        player2_guest_name: string | null;
        player2_avatar_url?: string | null;
        player1_score: number;
        player2_score: number;
        winner_id: number | null;
        match_date: string;
        player1_touched_ball: number;
        player1_missed_ball: number;
        player1_touched_ball_in_row: number;
        player1_missed_ball_in_row: number;
        player2_touched_ball: number;
        player2_missed_ball: number;
        player2_touched_ball_in_row: number;
        player2_missed_ball_in_row: number;
}

// TODO: Add more fields to FriendData
export interface FriendData {
        friend_user_id: number;
        username: string;
        avatar_url: string | null;
        online_status: string;
        // status: 'pending' | 'accepted' | 'declined' | 'blocked'; // from friendships table if needed directly
        // action_user_id: number; // from friendships table if needed directly
}

export interface FriendRequestData {
        requester_user_id?: number;
        addressee_user_id?: number;
        username: string;
        avatar_url: string | null;
        online_status: string;
        request_date: string;
}

export function getMatchResultForUser(
        match: GameMatch,
        currentUserId: number
): 'win' | 'loss' | 'draw' {
        if (match.winner_id === null) {
                if (
                        match.player1_id === currentUserId &&
                        match.player1_score < match.player2_score
                )
                        return 'loss';
                if (
                        match.player2_id === currentUserId &&
                        match.player2_score < match.player1_score
                )
                        return 'loss';
                if (match.player1_score === match.player2_score) return 'draw';
                return 'draw';
        }
        if (match.winner_id === currentUserId) return 'win';
        return 'loss';
}

interface ApiResponse<T> {
        success: boolean;
        user?: T;
        matches?: T;
        friends?: T;
        requests?: T;
        message?: string;
        requested_for_user_id?: number;
        token?: string;
        avatar_url?: string;
}

export interface UpdateProfilePayload {
        username?: string;
        email?: string | null;
        bio?: string;
        current_password?: string;
        new_password?: string;
        avatar_url?: string;
}

async function fetchApi<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: object
): Promise<T> {
        const token = localStorage.getItem('authToken');
        if (!token) {
                console.error(`No auth token found for API call to ${endpoint}.`);
                throw new Error('Unauthorized');
        }

        const headers: HeadersInit = {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
        };

        const config: RequestInit = {
                method,
                headers,
        };

        if (method === 'POST' || method === 'PUT') {
                headers['Content-Type'] = 'application/json';
                config.body = JSON.stringify(body || {});
        }

        try {
                const response = await fetch(endpoint, config);

                if (response.status === 401) {
                        console.error(
                                `Authentication failed for ${endpoint} (token invalid or expired).`
                        );
                        logout();
                        throw new Error('Unauthorized');
                }
                if (response.status === 404 && endpoint.startsWith('/api/users/me')) {
                        console.error(`User data not found on server for ${endpoint}.`);
                        throw new Error('User not found');
                }

                const responseData: ApiResponse<T> = await response.json();

                if (!response.ok) {
                        console.error(
                                `API error for ${endpoint}: ${response.status} ${response.statusText}`,
                                responseData
                        );
                        throw new Error(
                                responseData.message || `Server error: ${response.status}`
                        );
                }

                if (!responseData.success) {
                        console.warn(
                                `API call to ${endpoint} was not successful:`,
                                responseData.message
                        );
                        throw new Error(responseData.message || 'API operation failed');
                }
                return responseData as T;
        } catch (error) {
                console.error(`Network or processing error for ${endpoint}:`, error);
                if (error instanceof Error && error.name !== 'AbortError') {
                        if (error instanceof SyntaxError) {
                                console.error('Failed to parse JSON response from API.');
                                throw new Error('Received non-JSON response from server.');
                        }
                        throw error;
                } else if (!(error instanceof Error && error.name === 'AbortError')) {
                        throw new Error(
                                `An unknown error occurred during API call to ${endpoint}.`
                        );
                }

                throw error;
        }
}

export async function fetchMyProfileData(): Promise<UserPrivateData> {
        const data = await fetchApi<ApiResponse<UserPrivateData>>('/api/users/me');
        if (data.user) {
                return { ...data.user, bio: data.user.bio || null };
        }
        throw new Error(
                data.message || 'Failed to retrieve profile data from API response.'
        );
}

export async function updateMyProfileData(
        payload: UpdateProfilePayload
): Promise<ApiResponse<UserPrivateData>> {
        return fetchApi<ApiResponse<UserPrivateData>>(
                '/api/users/me',
                'PUT',
                payload
        );
}

export async function fetchGameHistory(
        userId: string | number
): Promise<GameMatch[]> {
        const data = await fetchApi<ApiResponse<GameMatch[]>>(
                `/api/users/${userId}/matches`
        );
        if (data.matches && Array.isArray(data.matches)) {
                return data.matches;
        }
        throw new Error(data.message || 'Failed to retrieve game history.');
}

export async function fetchAcceptedFriends(): Promise<FriendData[]> {
        const response = await fetchApi<ApiResponse<FriendData[]>>('/api/friends');
        if (response.friends && Array.isArray(response.friends)) {
                return response.friends;
        }
        throw new Error(response.message || 'Failed to retrieve accepted friends.');
}

export async function fetchIncomingFriendRequests(): Promise<
        FriendRequestData[]
> {
        const response = await fetchApi<ApiResponse<FriendRequestData[]>>(
                '/api/friends/requests/pending'
        );
        if (response.requests && Array.isArray(response.requests)) {
                return response.requests;
        }
        throw new Error(
                response.message || 'Failed to retrieve incoming friend requests.'
        );
}

export async function fetchSentFriendRequests(): Promise<FriendRequestData[]> {
        const response = await fetchApi<ApiResponse<FriendRequestData[]>>(
                '/api/friends/requests/sent'
        );
        if (response.requests && Array.isArray(response.requests)) {
                return response.requests;
        }
        throw new Error(
                response.message || 'Failed to retrieve sent friend requests.'
        );
}

export async function sendFriendRequest(
        targetIdentifier: string | number
): Promise<ApiResponse<null>> {
        return fetchApi<ApiResponse<null>>(
                `/api/friends/request/${targetIdentifier}`,
                'POST',
                {}
        );
}

export async function acceptFriendRequest(
        requesterId: number
): Promise<ApiResponse<null>> {
        return fetchApi<ApiResponse<null>>(
                `/api/friends/accept/${requesterId}`,
                'POST',
                {}
        );
}

export async function declineFriendRequest(
        targetUserId: number
): Promise<ApiResponse<null>> {
        return fetchApi<ApiResponse<null>>(
                `/api/friends/action/${targetUserId}`,
                'POST',
                { type: 'decline' }
        );
}

export async function cancelFriendRequest(
        targetUserId: number
): Promise<ApiResponse<null>> {
        return fetchApi<ApiResponse<null>>(
                `/api/friends/action/${targetUserId}`,
                'POST',
                { type: 'cancel' }
        );
}

export async function removeFriend(
        friendId: number
): Promise<ApiResponse<null>> {
        return fetchApi<ApiResponse<null>>(`/api/friends/${friendId}`, 'DELETE');
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
                const feedbackElem = document.getElementById(EDIT_PROFILE_FEEDBACK_ID);
                if (feedbackElem)
                        showFeedback(
                                EDIT_PROFILE_FEEDBACK_ID,
                                'Account deletion cancelled.',
                                false
                        );
                else console.log('Account deletion cancelled.');
                return;
        }

        try {
                await fetchApi<ApiResponse<null>>('/api/users/me', 'DELETE');
                alert('Account deleted successfully. You will now be logged out.');
                logout();
        } catch (error) {
                const feedbackElem = document.getElementById(EDIT_PROFILE_FEEDBACK_ID);
                const message = `Error deleting account: ${error instanceof Error ? error.message : 'Network error or unexpected issue.'}`;
                if (feedbackElem) showFeedback(EDIT_PROFILE_FEEDBACK_ID, message, true);
                else alert(message);
        }
}

export async function uploadAvatarToCloudinary(file: File): Promise<string> {
        const token = localStorage.getItem('authToken');
        if (!token) {
                throw new Error('Unauthorized: No token for avatar upload.');
        }

        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/avatar', {
                method: 'PUT',
                headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                },
                body: formData,
        });

        const data: ApiResponse<null> = await response.json();

        if (!response.ok || !data.success || !data.avatar_url) {
                throw new Error(data.message || 'Failed to upload avatar.');
        }
        return data.avatar_url;
}

export async function deleteAvatarFromCloudinary(): Promise<void> {
        const response = await fetchApi<ApiResponse<null>>('/api/avatar', 'DELETE');
        if (!response.success) {
                throw new Error(
                        response.message || 'Failed to delete avatar from Cloudinary.'
                );
        }
}
