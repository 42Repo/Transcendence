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

document.getElementById("loginConfirm")?.addEventListener("click", () => {
  // Simule un login, puis redirige
  localStorage.setItem("authToken", "123456");
  window.location.href = "src/views/logged.html";
});
