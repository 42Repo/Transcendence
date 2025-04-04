// document.addEventListener("DOMContentLoaded", () => {
//   const input1 = document.getElementById("loginEmail") as HTMLInputElement;
//   const input2 = document.getElementById("loginPassword") as HTMLInputElement;
//   const button = document.getElementById("loginConfirm") as HTMLButtonElement;
//   const result = document.getElementById("result") as HTMLParagraphElement;

//   button.addEventListener("click", () => {
//     const loginAttempt = async (email: string, password: string): Promise<void> => {

//       try {
//         const response = await fetch(`/api/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
//         if (response.ok)
//           result.innerText = `Success: ${response.status}`;
//         else
//           result.innerText = `Error: ${response.status}`;
//       } catch (e) {
//         result.innerText = `Error Ping: ${e}`;
//       }
//     }
//     loginAttempt(input1.value, input2.value);
//   });
// });

// document.getElementById("loginConfirm")?.addEventListener("click", () => {
//   // Simule un login, puis redirige
//   localStorage.setItem("authToken", "123456");
//   const contentContainer = document.getElementById("content") as HTMLElement;

//   if (contentContainer) {

//     fetch("src/views/logged.html")
//       .then(response => response.text())
//       .then(data => {
//         contentContainer.innerHTML = data;
//       });
//   }
// });

// import './styles/index.css';

function closeModal(modal: HTMLElement | null) {
  modal?.classList.add("hidden");
}

function openModal(modal: HTMLElement | null) {
  modal?.classList.remove("hidden");
}

// Assure que les modales existent
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;

  // Ouvrir la modale de login
  if (target.closest("#loginLink")) {
    event.preventDefault();
    openModal(loginModal);
  }

  // Fermer la modale de login
  if (target.closest("#closeLoginModal")) {
    event.preventDefault();
    closeModal(loginModal);
  }

  // Ouvrir la modale de register
  if (target.closest("#registerLink")) {
    event.preventDefault();
    openModal(registerModal);
  }

  // Fermer la modale de register
  if (target.closest("#closeRegisterModal")) {
    event.preventDefault();
    closeModal(registerModal);
  }

  // Switch Login → Register
  if (target.closest("#switchRegister")) {
    event.preventDefault();
    closeModal(loginModal);
    openModal(registerModal);
  }

  // Switch Register → Login
  if (target.closest("#switchLogin")) {
    event.preventDefault();
    closeModal(registerModal);
    openModal(loginModal);
  }
});
