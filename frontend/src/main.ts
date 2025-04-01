// import './styles/index.css';

const loginLink = document.getElementById("loginLink");
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const closeLoginModal = document.getElementById("closeLoginModal");
const closeRegisterModal = document.getElementById("closeRegisterModal");
const switchRegiter = document.getElementById("switchRegister");
const switchLogin = document.getElementById("switchLogin");

if (loginLink && loginModal && closeLoginModal) {
  loginLink.addEventListener("click", (event) => {
    event.preventDefault();
    loginModal.classList.remove("hidden");
  });

  closeLoginModal.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });
}

if (registerModal && closeRegisterModal) {
  closeRegisterModal.addEventListener("click", () => {
    registerModal.classList.add("hidden");
  });
}

if (switchRegiter) {
  switchRegiter.addEventListener("click", (event) => {
    event.preventDefault();
    loginModal?.classList.add("hidden");
    registerModal?.classList.remove("hidden");
  });
}

if (switchLogin) {
  switchLogin.addEventListener("click", (event) => {
    event.preventDefault();
    registerModal?.classList.add("hidden");
    loginModal?.classList.remove("hidden");
  });
}

// const burgerIcon = document.querySelector(".burger-icon");
const navMobile = document.getElementById("nav-mobile");
// const navMobile = document.querySelector(".nav-mobile");
const burgerIcon = document.getElementById("burger-icon");

if (burgerIcon && navMobile) {
  burgerIcon.addEventListener("click", () => {
    navMobile.classList.toggle("show");
  });
}


// const app = document.querySelector<HTMLDivElement>('#app')!;
// const pingButton = document.querySelector<HTMLButtonElement>('#pingButton')!;
// const pingResult = document.querySelector<HTMLPreElement>('#pingResult')!;

// app.querySelector<HTMLParagraphElement>('p')!.textContent =
//   'Frontend Loaded via TypeScript Bro!';

// pingButton.addEventListener('click', () => {
//   const pingBackend = async () => {
//     pingResult.textContent = 'Pinging...';
//     try {
//       const response = await fetch('/api/ping');
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       interface PingResponse {
//         pong: boolean;
//         timestamp: string;
//       }
//       const data = (await response.json()) as PingResponse;
//       pingResult.textContent = JSON.stringify(data, null, 2);
//     } catch (error) {
//       console.error('Error pinging backend:', error);
//       pingResult.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
//     }
//   };

//   void pingBackend();
// });

// console.log('ft_transcendence frontend initialized!');
