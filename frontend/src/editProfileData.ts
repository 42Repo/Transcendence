import { switchPage } from './switch-page';
import {
  updateMyProfileData,
  UpdateProfilePayload,
  UserPrivateData,
  uploadAvatarToCloudinary,
  deleteAvatarFromCloudinary,
} from './userService';
import { showFeedback, clearFeedback } from './utils/modalUtils';

const EDIT_PROFILE_FEEDBACK_ID = 'editProfileFeedback';
const AVATAR_UPLOAD_FEEDBACK_ID = 'avatarUploadFeedback';

let newUploadedAvatarUrl: string | null = null;
let avatarResetToDefault: boolean = false;

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
  const avatarUploadInput = document.getElementById(
    'avatarUploadInput'
  ) as HTMLInputElement | null;
  const profilePicturePreview = document.getElementById(
    'profilePicturePreview'
  ) as HTMLImageElement | null;
  const avatarUploadFeedback = document.getElementById(
    AVATAR_UPLOAD_FEEDBACK_ID
  );
  const resetAvatarButton = document.getElementById('resetAvatarButton');

  avatarUploadInput?.addEventListener('change', async (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (
      files &&
      files.length > 0 &&
      profilePicturePreview &&
      avatarUploadFeedback
    ) {
      const file = files[0];

      if (!file.type.startsWith('image/')) {
        avatarUploadFeedback.textContent = 'Please select an image file.';
        avatarUploadFeedback.className = 'text-xs mt-1 h-4 text-red-600';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        avatarUploadFeedback.textContent = 'File is too large (max 5MB).';
        avatarUploadFeedback.className = 'text-xs mt-1 h-4 text-red-600';
        return;
      }

      avatarUploadFeedback.textContent = 'Uploading...';
      avatarUploadFeedback.className = 'text-xs mt-1 h-4 text-blue-600';
      newUploadedAvatarUrl = null;
      avatarResetToDefault = false;

      try {
        const secureUrl = await uploadAvatarToCloudinary(file);
        profilePicturePreview.src = secureUrl;
        newUploadedAvatarUrl = secureUrl;
        avatarUploadFeedback.textContent = 'Avatar uploaded!';
        avatarUploadFeedback.className = 'text-xs mt-1 h-4 text-green-600';
      } catch (error) {
        console.error('Avatar upload failed:', error);
        avatarUploadFeedback.textContent =
          error instanceof Error ? error.message : 'Upload failed.';
        avatarUploadFeedback.className = 'text-xs mt-1 h-4 text-red-600';
      }
    }
  });

  resetAvatarButton?.addEventListener('click', async () => {
    if (profilePicturePreview && avatarUploadFeedback) {
      const confirmReset = window.confirm(
        'Are you sure you want to reset your avatar to the default image?'
      );
      if (!confirmReset) return;

      avatarUploadFeedback.textContent = 'Resetting avatar...';
      avatarUploadFeedback.className = 'text-xs mt-1 h-4 text-blue-600';
      newUploadedAvatarUrl = null;

      try {
        await deleteAvatarFromCloudinary();
        profilePicturePreview.src = '/DefaultProfilePic.png';
        newUploadedAvatarUrl = '/DefaultProfilePic.png';
        avatarResetToDefault = true;
        avatarUploadFeedback.textContent =
          'Avatar reset. Save changes to confirm.';
        avatarUploadFeedback.className = 'text-xs mt-1 h-4 text-green-600';
      } catch (error) {
        console.error('Avatar reset failed:', error);
        avatarUploadFeedback.textContent =
          error instanceof Error ? error.message : 'Reset failed.';
        avatarUploadFeedback.className = 'text-xs mt-1 h-4 text-red-600';

        newUploadedAvatarUrl = null;
        avatarResetToDefault = false;
      }
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

  if (newUploadedAvatarUrl) {
    payload.avatar_url = newUploadedAvatarUrl;
    changesMade = true;
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
    showFeedback(
      EDIT_PROFILE_FEEDBACK_ID,
      'Please enter the new password and confirm it if you wish to change your password.',
      true
    );
    return;
  }

  if (!changesMade) {
    showFeedback(EDIT_PROFILE_FEEDBACK_ID, 'No changes detected.', false);
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

      const profileContentArea = document.getElementById('profileContentArea');
      if (profileContentArea && updatedUser.avatar_url) {
        profileContentArea.setAttribute(
          'data-current-avatar-url',
          updatedUser.avatar_url
        );
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
        console.log('New JWT received, updating localStorage.');
        localStorage.setItem('authToken', response.token);
      }

      newUploadedAvatarUrl = null;
      avatarResetToDefault = false;

      const avatarUploadFeedback = document.getElementById(
        AVATAR_UPLOAD_FEEDBACK_ID
      );
      if (avatarUploadFeedback) {
        avatarUploadFeedback.textContent = '';
      }

      setTimeout(() => {
        switchPage('profile');
      }, 1500);
    } else {
      showFeedback(
        EDIT_PROFILE_FEEDBACK_ID,
        response.message || 'Failed to update profile.',
        true
      );
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    showFeedback(
      EDIT_PROFILE_FEEDBACK_ID,
      error instanceof Error ? error.message : 'An unexpected error occurred.',
      true
    );
  }
}
