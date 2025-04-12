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

  const fetch404 = async () => {
    try {
      const res = await fetch('src/views/404.html');
      if (!res.ok) throw new Error('Page 404 non trouvée');
      const html = await res.text();
      content.innerHTML = html; // <-- ici !
      cache.set('404', html);
    } catch (err) {
      console.error('Erreur de chargement de la page 404 :', err);
      content.innerHTML = '<h1>Erreur 404 - Page non trouvée</h1>';
    }
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
      const res = await fetch(`src/views/${page}.html`);
      if (!res.ok) throw new Error('Page non trouvée');
      const html = await res.text();
      content.innerHTML = html;
      cache.set(page, html);
    } catch (err) {
      console.error('Erreur de chargement :', err);
      await fetch404();
    }
  };

  // Fonction pour changer de page et mettre à jour l'URL
  const switchPage = (page: string) => {
    if (page == 'home') {
      history.pushState(null, '', '/'); // Modifier l'URL sans hash
      console.log('home = pas de hash');
    } else {
      console.log('hash = ', page);

      history.pushState(null, '', `${page}`); // Modifier l'URL sans hash
    }
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

  console.log('Attacher un événement aux liens');

  // Gérer les changements d'URL avec l'historique du navigateur (retour/avant)
  document.querySelectorAll('[data-page]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const page = (el as HTMLElement).getAttribute('data-page');
      if (page) {
        switchPage(page);
      }
    });
  });
});
