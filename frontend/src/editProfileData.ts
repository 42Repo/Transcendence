import { switchPage } from './switch-page';

export function editProfile() {
  console.log('yo mec');
  const username = document.getElementById('username') as HTMLInputElement;
  const email = document.getElementById('userEmail') as HTMLInputElement;
  const oldPassword = document.getElementById(
    'userOldPswd'
  ) as HTMLInputElement;
  const newPassword = document.getElementById(
    'userNewPswd'
  ) as HTMLInputElement;
  const confirmPassword = document.getElementById(
    'userNewPswdVerif'
  ) as HTMLInputElement;
  const bio = document.getElementById('bioText') as HTMLTextAreaElement;

  console.log(
    'username = ' +
    username.value +
    '\nbioText =' +
    bio.value +
    '\n email = ' +
    email.value +
    '\noldPAssword = ' +
    oldPassword.value +
    '\nnew password = ' +
    newPassword.value +
    '\nconfirmPassword = ' +
    confirmPassword.value
  );
  switchPage('profile');
// TODO - Actually update the db
}
