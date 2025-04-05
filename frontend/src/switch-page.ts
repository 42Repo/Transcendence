
// document.getElementById("abUsButton")?.addEventListener("click", () => {
//   // Simule un login, puis redirige
//   localStorage.setItem("authToken", "123456");
//   window.location.href = "src/views/about-us.html";
// });

const contentContainer = document.getElementById("content") as HTMLElement;

if(contentContainer){
  fetch("src/views/landing.html")
  .then(response => response.text())
  .then(data => {
      contentContainer.innerHTML = data;
  });
  document.getElementById("abUsButton")?.addEventListener("click", () => {
    // Simule un login, puis redirige
    fetch("src/views/about-us.html")
  .then(response => response.text())
  .then(data => {
      contentContainer.innerHTML = data;
  });
  });
  document.getElementById("homeButton")?.addEventListener("click", () => {
    // Simule un login, puis redirige
    fetch("src/views/landing.html")
  .then(response => response.text())
  .then(data => {
      contentContainer.innerHTML = data;
  });
  });
  
}