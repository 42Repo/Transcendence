import { showLoginModal } from './login';
import { jwtDecode } from 'jwt-decode';

const content = document.getElementById('content') as HTMLElement;
const cache: Map<string, string> = new Map();
const existingPages : string[] = [
  "home",
  "about-us",
  "edit-profile",
  "error",
  "logged",
  "pongGame",
  "privacy-policy",
  "profile",
  "public-profile"];

document.body.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest('[data-page]') as HTMLElement;

  if (link) {
    e.preventDefault();
    const page = link.dataset.page;
    if (page){
       switchPage(page)
    };
  }
});

const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    console.log('Token non trouvé');
    return false;
  }
  try {
    const decodedToken = jwtDecode(token);

    if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
      console.log('Token expiré');
      return false; // Token expiré
    }
    console.log('Token OK');
    return true;
  } catch (error) {
    console.error('Erreur de décodage du token :', error);
    console.log('Token invalide');
    return false; // Token invalide
  }
};

// Get page from URL
const getPageName = (): string => {
  const path = window.location.pathname.split('/').pop();
  const page = path?.replace('.html', '') || 'home';
  return existingPages.includes(page) ? page : 'error';
};

const fetchLoadingError = async () => {
  content.innerHTML = '<h1>Error 404 - Cannot load page</h1>';
};

// Fetch page content
const fetchPage = async (page: string): Promise<void> => {
  if (pageRequiresAuth(page) && !isAuthenticated()) {
    console.log("Page protégée, redirection vers la page de d'accueil");
    history.pushState(null, '', '/');
    void fetchPage('home');
    showLoginModal();
    return;
  }
  console.log('Chargement de la page :', page);
  if (cache.has(page)) {
    console.log("page in cache", page);
    content.innerHTML = cache.get(page)!;
    return;
  }

  try {
    console.log("page not in cache", page, cache);
    const res = await fetch(`src/views/${page}.html`);
    if (!res.ok) throw new Error('Page non trouvée');
    const html = await res.text();
    content.innerHTML = html;
    cache.set(page, html);
  } catch (err) {
    console.error('Erreur de chargement :', err);
    await fetchLoadingError();
  }
};

const pageRequiresAuth = (page: string): boolean => {
  const authPages = ['profile', 'edit-profile'];
  return authPages.includes(page);
};

// Switch page + update URL
const switchPage = (page: string) => {
 
  if (page == 'home') {
    if (isAuthenticated()) page = 'logged';
    history.pushState(null, '', '/');
    console.log('home = pas de hash');
  } else {
    console.log('hash = ', page);

    history.pushState(null, '', `${page}`);
  }
  void fetchPage(page).then(() => {
	  if (page === 'pongGame') {
		  // Dynamically import and run the game logic
		  import('./pongGame').then((module) => {
			  module.mainGame();
		  });
	  }
  });
};

// Change page after a reload
const loadCurrentPage = () => {
  const page = getPageName();
  if (isAuthenticated() && page == 'home') {
    switchPage('home');
    return;
  }
  void fetchPage(page);
};

const prefetchAllPages = async (): Promise<void> => {
  const prefetchPromises: Promise<void>[] = [];

  existingPages.forEach((page) => {
    const linkExists = document.querySelector(`[data-page="${page}"]`) !== null;

    if (linkExists) {
      if (!cache.has(page)) {
        const fetchPromise = fetch(`src/views/${page}.html`)
          .then((res) => {
            if (!res.ok) throw new Error(`Page ${page} not found`);
            return res.text();
          })
          .then((html) => {
            cache.set(page, html);
          })
          .catch((err) => console.warn(`Prefetch failed for ${page}:`, err));
        prefetchPromises.push(fetchPromise);
      }
    }
  });

  await Promise.all(prefetchPromises);
};

// Await prefetch before loading the current page
const initializeApp = async () => {
  await prefetchAllPages();
  loadCurrentPage();
};

initializeApp();

window.addEventListener('popstate', () => {
  console.log('Handling back/forward navigation');
  loadCurrentPage();
});

export { switchPage, loadCurrentPage, isAuthenticated, fetchPage, fetchLoadingError };
