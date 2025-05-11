import { switchPage } from './switch-page';
import {
  updateMyProfileData,
  UpdateProfilePayload,
  UserPrivateData,
} from './userService';
import { showFeedback, clearFeedback } from './utils/modalUtils';

const EDIT_PROFILE_FEEDBACK_ID = 'editProfileFeedback';

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

export async function editProfile() {
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
  if (usernameInput.defaultValue !== username && username !== '')
    payload.username = username;
  else if (usernameInput.defaultValue !== username && username === '') {
    showFeedback(EDIT_PROFILE_FEEDBACK_ID, 'Username cannot be empty.', true);
    return;
  }

  if (emailInput.defaultValue !== email) {
    if (email === '' && emailInput.defaultValue !== '') {
      payload.email = '';
    } else if (email !== '') {
      payload.email = email;
    }
  }

  if (bioTextarea.defaultValue !== bio) payload.bio = bio;

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
  } else if (oldPassword && hasPasswordInitially) {
    showFeedback(
      EDIT_PROFILE_FEEDBACK_ID,
      'Please enter the new password and confirm it if you wish to change your password.',
      true
    );
    return;
  }

  if (Object.keys(payload).length === 0) {
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
