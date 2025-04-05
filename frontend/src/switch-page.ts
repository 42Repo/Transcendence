const contentContainer = document.getElementById("content") as HTMLElement;

if (contentContainer) {
  fetch("src/views/landing.html")
    .then(response => response.text())
    .then(data => {
      contentContainer.innerHTML = data;
    });
  // Charger la page du jeu lorsque le bouton "Play Game" est cliqué
  document.getElementById("playGameButton")?.addEventListener("click", () => {
    fetch("src/views/pongGame.html")
      .then(response => response.text())
      .then(data => {
        contentContainer.innerHTML = data;

        // Assurez-vous d'appeler mainGame() ou d'initialiser le jeu ici
        // initializeGame();
      });
  });

  // Charger la page "About Us" quand l'utilisateur clique sur ce bouton
  document.getElementById("abUsButton")?.addEventListener("click", () => {
    fetch("src/views/about-us.html")
      .then(response => response.text())
      .then(data => {
        contentContainer.innerHTML = data;
      });
  });

  // Charger la page d'accueil quand l'utilisateur clique sur ce bouton
  document.getElementById("homeButton")?.addEventListener("click", () => {
    fetch("src/views/landing.html")
      .then(response => response.text())
      .then(data => {
        contentContainer.innerHTML = data;
      });
  });
}

// function initializeGame() {
//   // Assurez-vous que le canvas est bien sélectionné avant d'initialiser le jeu
//   const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
//   if (canvas) {
//     const ctx = canvas.getContext('2d')!;
//     ctx.fillStyle = 'red';
//     ctx.fillRect(10, 10, 50, 50); // Par exemple, dessiner un carré rouge
//   }
// }
