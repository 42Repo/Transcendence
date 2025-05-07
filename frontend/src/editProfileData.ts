import { switchPage } from './switch-page';
import { updateMyProfileData, UpdateProfilePayload } from './userService';
import { showFeedback, clearFeedback } from './utils/modalUtils';

const EDIT_PROFILE_FEEDBACK_ID = 'editProfileFeedback';

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

  const feedbackElement = document.getElementById(EDIT_PROFILE_FEEDBACK_ID);
  if (!feedbackElement && document.getElementById('profileContentArea')) {
    const newFeedbackElem = document.createElement('p');
    newFeedbackElem.id = EDIT_PROFILE_FEEDBACK_ID;
    newFeedbackElem.className = 'text-center mt-4 h-6';
    document
      .getElementById('profileContentArea')
      ?.parentNode?.insertBefore(
        newFeedbackElem,
        document.getElementById('profileContentArea')?.nextSibling || null
      );
  }

  if (
    !usernameInput ||
    !emailInput ||
    !bioTextarea ||
    !oldPasswordInput ||
    !newPasswordInput ||
    !confirmPasswordInput
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
  if (usernameInput.defaultValue !== username) payload.username = username;
  if (emailInput.defaultValue !== email) payload.email = email;
  if (bioTextarea.defaultValue !== bio) payload.bio = bio;

  if (newPassword) {
    if (!oldPassword) {
      showFeedback(
        EDIT_PROFILE_FEEDBACK_ID,
        'Current password is required to set a new password.',
        true
      );
      return;
    }
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
    payload.current_password = oldPassword;
    payload.new_password = newPassword;
  } else if (oldPassword && !newPassword) {
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
    if (response.success) {
      showFeedback(
        EDIT_PROFILE_FEEDBACK_ID,
        'Profile updated successfully!',
        false
      );

      if (payload.username !== undefined)
        usernameInput.defaultValue = payload.username;
      if (payload.email !== undefined) emailInput.defaultValue = payload.email;
      if (payload.bio !== undefined) bioTextarea.defaultValue = payload.bio;

      oldPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
      oldPasswordInput.defaultValue = '';
      newPasswordInput.defaultValue = '';
      confirmPasswordInput.defaultValue = '';

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
