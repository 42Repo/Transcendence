
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
