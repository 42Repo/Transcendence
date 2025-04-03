
document.getElementById("abUsButton")?.addEventListener("click", () => {
  // Simule un login, puis redirige
  localStorage.setItem("authToken", "123456");
  window.location.href = "src/views/about-us.html";
});
