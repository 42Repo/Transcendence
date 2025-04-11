document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('content') as HTMLElement;
  const navLinks = document.querySelectorAll('nav a');
  console.log('Initialisation du système de navigation');
  console.log('Liens de navigation trouvés :', navLinks);
  const cache: Map<string, string> = new Map();

  // Fonction pour récupérer la page à partir de l'URL (retourne le nom de la page sans extension)
  const getPageName = (): string => {
    const path = window.location.pathname.split('/').pop();
    const page = path?.replace('.html', '') || 'home'; // Page par défaut si vide ou si index.html
    return page;
  };

  // Fonction pour charger le contenu d'une page spécifique
  const fetchPage = async (page: string): Promise<void> => {
    console.log('Chargement de la page :', page);
    if (cache.has(page)) {
      content.innerHTML = cache.get(page)!;
      return;
    }

    console.log('Chargement de la page :', page);

    try {
      console.log('Récupération de la page :', page);
      console.log('URL de la page :', `src/views/${page}.html`);
      const res = await fetch(`src/views/${page}.html`);
      if (!res.ok) throw new Error('Page non trouvée');
      const html = await res.text();
      content.innerHTML = html;
      cache.set(page, html);
    } catch (err) {
      content.innerHTML =
        '<h2>Erreur</h2><p>Impossible de charger la page.</p>';
      console.error('Erreur de chargement :', err);
    }
  };

  // Fonction pour changer de page et mettre à jour l'URL
  const switchPage = (page: string) => {
    history.pushState(null, '', `${page}.html`); // Modifier l'URL sans hash
    void fetchPage(page); // Charger la page
  };

  // Fonction pour gérer le changement de page au rechargement de la page
  const loadCurrentPage = () => {
    const page = getPageName();
    void fetchPage(page);
  };

  // Pré-chargement des pages pour éviter des demandes répétées
  const prefetchAllPages = () => {
    navLinks.forEach((link) => {
      const page = (link as HTMLAnchorElement).dataset.page;
      if (page) {
        fetch(`src/views/${page}.html`)
          .then((res) => res.text())
          .then((html) => cache.set(page, html))
          .catch(() => console.warn(`Échec du prefetch pour ${page}`));
      }
    });
  };

  // Charger la page actuelle
  loadCurrentPage();
  prefetchAllPages();

  // Attacher un événement aux liens pour changer de page sans recharger toute la page
  console.log('Attacher un événement aux liens');
  navLinks.forEach((link) => {
    console.log('Lien trouvé :', link);
    link.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Événement de clic sur le lien');
      const target = (e.currentTarget as HTMLElement).getAttribute('data-page');
      if (target) {
        switchPage(target);
      }
    });
  });

  // Gérer les changements d'URL avec l'historique du navigateur (retour/avant)
  window.addEventListener('popstate', loadCurrentPage);
});
