import { switchPage } from './switch-page';
import {
        updateMyProfileData,
        UpdateProfilePayload,
        UserPrivateData,
        uploadAvatarToCloudinary,
        deleteAvatarFromCloudinary,
} from './userService';
import { showFeedback, clearFeedback } from './utils/modalUtils';
import { setHeaderMenu } from './header';

const EDIT_PROFILE_FEEDBACK_ID = 'editProfileFeedback';
const AVATAR_UPLOAD_FEEDBACK_ID = 'avatarUploadFeedback';

let pendingAvatarFile: File | null = null;
let pendingAvatarAction: 'UPLOAD' | 'RESET_TO_DEFAULT' | null = null;

function updatePasswordUI(hasPassword: boolean) {
        const currentPasswordContainer = document.getElementById(
                'currentPasswordContainer'
        );
        const passwordSectionTitle = document.getElementById('passwordSectionTitle');
        const profileContentArea = document.getElementById('profileContentArea');

        if (currentPasswordContainer && passwordSectionTitle && profileContentArea) {
                profileContentArea.setAttribute('data-has-password', String(hasPassword));
                if (hasPassword) {
                        currentPasswordContainer.style.display = 'block';
                        passwordSectionTitle.textContent = 'Change Password';
                } else {
                        currentPasswordContainer.style.display = 'none';
                        passwordSectionTitle.textContent = 'Set Password';
                }
        }
}

export function initializeEditProfileAvatarHandling() {
        pendingAvatarFile = null;
        pendingAvatarAction = null;

        const avatarUploadInput = document.getElementById(
                'avatarUploadInput'
        ) as HTMLInputElement | null;
        const profilePicturePreview = document.getElementById(
                'profilePicturePreview'
        ) as HTMLImageElement | null;
        const avatarUploadFeedbackEl = document.getElementById(
                AVATAR_UPLOAD_FEEDBACK_ID
        );
        const resetAvatarButton = document.getElementById('resetAvatarButton');
        const profileContentArea = document.getElementById('profileContentArea');

        if (profilePicturePreview && profileContentArea) {
                profilePicturePreview.src =
                        profileContentArea.getAttribute('data-current-avatar-url') ||
                        '/DefaultProfilePic.png';
        }
        if (avatarUploadFeedbackEl) avatarUploadFeedbackEl.textContent = '';

        avatarUploadInput?.addEventListener('change', async (event) => {
                const files = (event.target as HTMLInputElement).files;
                if (
                        files &&
                        files.length > 0 &&
                        profilePicturePreview &&
                        avatarUploadFeedbackEl
                ) {
                        const file = files[0];

                        if (!file.type.startsWith('image/')) {
                                avatarUploadFeedbackEl.textContent = 'Please select an image file.';
                                avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-red-600';
                                if (avatarUploadInput) avatarUploadInput.value = '';
                                return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                                avatarUploadFeedbackEl.textContent = 'File is too large (max 5MB).';
                                avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-red-600';
                                if (avatarUploadInput) avatarUploadInput.value = '';
                                return;
                        }

                        const reader = new FileReader();
                        reader.onload = (e) => {
                                if (e.target?.result) {
                                        profilePicturePreview.src = e.target.result as string;
                                }
                        };
                        reader.readAsDataURL(file);

                        pendingAvatarFile = file;
                        pendingAvatarAction = 'UPLOAD';
                        avatarUploadFeedbackEl.textContent =
                                'Preview updated. Save changes to apply.';
                        avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-blue-600';
                }
        });

        resetAvatarButton?.addEventListener('click', async () => {
                if (profilePicturePreview && avatarUploadFeedbackEl) {
                        const confirmReset = window.confirm(
                                'Are you sure you want to reset your avatar to the default image? This will take effect when you save changes.'
                        );
                        if (!confirmReset) return;

                        profilePicturePreview.src = '/DefaultProfilePic.png';
                        pendingAvatarFile = null;
                        pendingAvatarAction = 'RESET_TO_DEFAULT';
                        avatarUploadFeedbackEl.textContent =
                                'Avatar will be reset. Save changes to apply.';
                        avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-blue-600';
                        if (avatarUploadInput) avatarUploadInput.value = '';
                }
        });
}

export async function handleSaveChanges() {
        const usernameInput = document.getElementById(
                'username'
        ) as HTMLInputElement | null;
        const emailInput = document.getElementById(
                'userEmail'
        ) as HTMLInputElement | null;
        const bioTextarea = document.getElementById(
                'bioText'
        ) as HTMLTextAreaElement | null;
        const oldPasswordInput = document.getElementById(
                'userOldPswd'
        ) as HTMLInputElement | null;
        const newPasswordInput = document.getElementById(
                'userNewPswd'
        ) as HTMLInputElement | null;
        const confirmPasswordInput = document.getElementById(
                'userNewPswdVerif'
        ) as HTMLInputElement | null;
        const profileContentArea = document.getElementById('profileContentArea');
        const avatarUploadFeedbackEl = document.getElementById(
                AVATAR_UPLOAD_FEEDBACK_ID
        );

        const feedbackElement = document.getElementById(EDIT_PROFILE_FEEDBACK_ID);
        if (!feedbackElement && profileContentArea) {
                const newFeedbackElem = document.createElement('p');
                newFeedbackElem.id = EDIT_PROFILE_FEEDBACK_ID;
                newFeedbackElem.className = 'text-center mt-4 h-6';
                profileContentArea.parentNode?.insertBefore(
                        newFeedbackElem,
                        profileContentArea.nextSibling || null
                );
        }

        if (
                !usernameInput ||
                !emailInput ||
                !bioTextarea ||
                !oldPasswordInput ||
                !newPasswordInput ||
                !confirmPasswordInput ||
                !profileContentArea
        ) {
                console.error(
                        'One or more form elements are missing from edit-profile.html'
                );
                showFeedback(
                        EDIT_PROFILE_FEEDBACK_ID,
                        'Error: Form elements missing.',
                        true
                );
                return;
        }

        const hasPasswordInitially =
                profileContentArea.getAttribute('data-has-password') === 'true';
        const initialAvatarUrl = profileContentArea.getAttribute(
                'data-current-avatar-url'
        );

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const bio = bioTextarea.value.trim();
        const oldPassword = oldPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (username.length > 0 && username.length < 3) {
                showFeedback(
                        EDIT_PROFILE_FEEDBACK_ID,
                        'Username must be at least 3 characters.',
                        true
                );
                return;
        }
        if (email.length > 0 && !/\S+@\S+\.\S+/.test(email)) {
                showFeedback(EDIT_PROFILE_FEEDBACK_ID, 'Invalid email format.', true);
                return;
        }

        const payload: UpdateProfilePayload = {};
        let changesMade = false;

        if (usernameInput.defaultValue !== username && username !== '') {
                payload.username = username;
                changesMade = true;
        } else if (usernameInput.defaultValue !== username && username === '') {
                showFeedback(EDIT_PROFILE_FEEDBACK_ID, 'Username cannot be empty.', true);
                return;
        }

        if (emailInput.defaultValue !== email) {
                if (email === '' && emailInput.defaultValue !== '') {
                        payload.email = null;
                } else if (email !== '') {
                        payload.email = email;
                }
                changesMade = true;
        }

        if (bioTextarea.defaultValue !== bio) {
                payload.bio = bio;
                changesMade = true;
        }

        let processedAvatarUrl: string | undefined = undefined;

        if (pendingAvatarAction === 'UPLOAD' && pendingAvatarFile) {
                if (avatarUploadFeedbackEl) {
                        avatarUploadFeedbackEl.textContent = 'Uploading avatar...';
                        avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-blue-600';
                }
                try {
                        processedAvatarUrl = await uploadAvatarToCloudinary(pendingAvatarFile);
                        payload.avatar_url = processedAvatarUrl;
                        changesMade = true;
                        if (avatarUploadFeedbackEl) {
                                avatarUploadFeedbackEl.textContent = 'Avatar ready to be saved.';
                                avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-green-600';
                        }
                } catch (error) {
                        console.error('Cloudinary upload failed during save:', error);
                        if (avatarUploadFeedbackEl) {
                                avatarUploadFeedbackEl.textContent =
                                        error instanceof Error ? error.message : 'Avatar upload failed.';
                                avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-red-600';
                        }
                        showFeedback(
                                EDIT_PROFILE_FEEDBACK_ID,
                                'Avatar upload failed. Please try again or remove the image.',
                                true
                        );
                        return;
                }
        } else if (pendingAvatarAction === 'RESET_TO_DEFAULT') {
                if (avatarUploadFeedbackEl) {
                        avatarUploadFeedbackEl.textContent = 'Resetting avatar on server...';
                        avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-blue-600';
                }
                try {
                        if (initialAvatarUrl && initialAvatarUrl !== '/DefaultProfilePic.png') {
                                await deleteAvatarFromCloudinary();
                        }
                        processedAvatarUrl = '/DefaultProfilePic.png';
                        payload.avatar_url = processedAvatarUrl;
                        changesMade = true;
                        if (avatarUploadFeedbackEl) {
                                avatarUploadFeedbackEl.textContent = 'Avatar reset ready to be saved.';
                                avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-green-600';
                        }
                } catch (error) {
                        console.error('Cloudinary delete failed during save:', error);
                        if (avatarUploadFeedbackEl) {
                                avatarUploadFeedbackEl.textContent =
                                        error instanceof Error ? error.message : 'Avatar reset failed.';
                                avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-red-600';
                        }
                        showFeedback(
                                EDIT_PROFILE_FEEDBACK_ID,
                                'Failed to clear old avatar from storage, but will attempt to set to default.',
                                true
                        );
                        payload.avatar_url = '/DefaultProfilePic.png';
                        changesMade = true;
                }
        }

        if (newPassword) {
                if (newPassword !== confirmPassword) {
                        showFeedback(
                                EDIT_PROFILE_FEEDBACK_ID,
                                'New passwords do not match.',
                                true
                        );
                        return;
                }
                if (newPassword.length < 6) {
                        showFeedback(
                                EDIT_PROFILE_FEEDBACK_ID,
                                'New password must be at least 6 characters.',
                                true
                        );
                        return;
                }
                payload.new_password = newPassword;
                if (hasPasswordInitially) {
                        if (!oldPassword) {
                                showFeedback(
                                        EDIT_PROFILE_FEEDBACK_ID,
                                        'Current password is required to change password.',
                                        true
                                );
                                return;
                        }
                        payload.current_password = oldPassword;
                }
                changesMade = true;
        } else if (oldPassword && hasPasswordInitially) {
                if (
                        !payload.avatar_url &&
                        !payload.username &&
                        !payload.email &&
                        !payload.bio
                ) {
                        showFeedback(
                                EDIT_PROFILE_FEEDBACK_ID,
                                'Please enter the new password if you wish to change it.',
                                true
                        );
                        return;
                }
        }

        if (!changesMade) {
                showFeedback(EDIT_PROFILE_FEEDBACK_ID, 'No changes detected.', false);
                if (avatarUploadFeedbackEl) avatarUploadFeedbackEl.textContent = '';
                return;
        }

        clearFeedback(EDIT_PROFILE_FEEDBACK_ID);
        showFeedback(EDIT_PROFILE_FEEDBACK_ID, 'Updating profile...', false);

        try {
                const response = await updateMyProfileData(payload);
                if (response.success && response.user) {
                        const updatedUser: UserPrivateData = response.user;
                        showFeedback(
                                EDIT_PROFILE_FEEDBACK_ID,
                                'Profile updated successfully!',
                                false
                        );
                        usernameInput.defaultValue = updatedUser.username;
                        emailInput.defaultValue = updatedUser.email || '';
                        bioTextarea.defaultValue = updatedUser.bio || '';

                        if (profileContentArea && updatedUser.avatar_url) {
                                profileContentArea.setAttribute(
                                        'data-current-avatar-url',
                                        updatedUser.avatar_url
                                );
                                const profilePicturePreview = document.getElementById(
                                        'profilePicturePreview'
                                ) as HTMLImageElement | null;
                                if (profilePicturePreview)
                                        profilePicturePreview.src = updatedUser.avatar_url;
                        }

                        oldPasswordInput.value = '';
                        newPasswordInput.value = '';
                        confirmPasswordInput.value = '';

                        updatePasswordUI(updatedUser.has_password);
                        profileContentArea.setAttribute(
                                'data-has-password',
                                String(updatedUser.has_password)
                        );

                        if (response.token) {
                                localStorage.setItem('authToken', response.token);
                        }

                        pendingAvatarFile = null;
                        pendingAvatarAction = null;
                        if (avatarUploadFeedbackEl)
                                avatarUploadFeedbackEl.textContent = 'Profile saved!';
                        const avatarUploadInput = document.getElementById(
                                'avatarUploadInput'
                        ) as HTMLInputElement | null;
                        if (avatarUploadInput) avatarUploadInput.value = '';

                        setHeaderMenu();

                        setTimeout(() => {
                                switchPage('profile');
                        }, 1500);
                } else {
                        showFeedback(
                                EDIT_PROFILE_FEEDBACK_ID,
                                response.message || 'Failed to update profile.',
                                true
                        );
                        if (
                                payload.avatar_url &&
                                payload.avatar_url !== '/DefaultProfilePic.png' &&
                                pendingAvatarAction === 'UPLOAD'
                        ) {
                                if (avatarUploadFeedbackEl) {
                                        avatarUploadFeedbackEl.textContent =
                                                'Profile save failed. Avatar was uploaded but not linked.';
                                        avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-red-600';
                                }
                        }
                }
        } catch (error) {
                console.error('Error updating profile:', error);
                showFeedback(
                        EDIT_PROFILE_FEEDBACK_ID,
                        error instanceof Error ? error.message : 'An unexpected error occurred.',
                        true
                );
                if (
                        payload.avatar_url &&
                        payload.avatar_url !== '/DefaultProfilePic.png' &&
                        pendingAvatarAction === 'UPLOAD'
                ) {
                        if (avatarUploadFeedbackEl) {
                                avatarUploadFeedbackEl.textContent =
                                        'Profile save error. Avatar was uploaded but not linked.';
                                avatarUploadFeedbackEl.className = 'text-xs mt-1 h-4 text-red-600';
                        }
                }
        }
}
