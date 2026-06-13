(() => {
  // === HAMBURGER MENU ===
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // === ANIME DATABASE ===
  const allAnime = [
    { id: 52991, title: 'Sousou no Frieren', type: 'TV', score: 9.26, picture: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg' },
    { id: 56926, title: 'Steel Ball Run: JoJo no Kimyou na Bouken', type: 'TV', score: 9.13, picture: 'https://cdn.myanimelist.net/images/anime/1448/154111l.jpg' },
    { id: 5114, title: 'Fullmetal Alchemist: Brotherhood', type: 'TV', score: 9.11, picture: 'https://cdn.myanimelist.net/images/anime/1208/94745l.jpg' },
    { id: 55701, title: 'Chainsaw Man Movie: Reze-hen', type: 'Movie', score: 9.07, picture: 'https://cdn.myanimelist.net/images/anime/1763/150638l.jpg' },
    { id: 9253, title: 'Steins;Gate', type: 'TV', score: 9.07, picture: 'https://cdn.myanimelist.net/images/anime/1935/127974l.jpg' },
    { id: 9969, title: 'Gintama: The Final', type: 'Movie', score: 9.05, picture: 'https://cdn.myanimelist.net/images/anime/1245/116760l.jpg' },
    { id: 1535, title: 'Gintama\u00B0', type: 'TV', score: 9.06, picture: 'https://cdn.myanimelist.net/images/anime/3/72078l.jpg' },
    { id: 38524, title: 'Shingeki no Kyojin Season 3 Part 2', type: 'TV', score: 9.05, picture: 'https://cdn.myanimelist.net/images/anime/1517/100633l.jpg' },
    { id: 11061, title: 'Hunter x Hunter (2011)', type: 'TV', score: 9.04, picture: 'https://cdn.myanimelist.net/images/anime/1337/99013l.jpg' },
    { id: 820, title: 'Ginga Eiyuu Densetsu', type: 'TV', score: 9.02, picture: 'https://cdn.myanimelist.net/images/anime/7/75199l.jpg' },
    { id: 15417, title: 'Gintama\u2019', type: 'TV', score: 9.01, picture: 'https://cdn.myanimelist.net/images/anime/2/25314l.jpg' },
    { id: 4181, title: 'Re:Zero kara Hajimeru Isekai Seikatsu 4th Season', type: 'TV', score: 9.01, picture: 'https://cdn.myanimelist.net/images/anime/1171/144438l.jpg' },
    { id: 58514, title: 'One Piece Fan Letter', type: 'Special', score: 9.01, picture: 'https://cdn.myanimelist.net/images/anime/1027/147244l.jpg' },
    { id: 34096, title: 'Bleach: Sennen Kessen-hen', type: 'TV', score: 9.0, picture: 'https://cdn.myanimelist.net/images/anime/1908/135431l.jpg' },
    { id: 918, title: 'Gintama...', type: 'TV', score: 9.0, picture: 'https://cdn.myanimelist.net/images/anime/3/5097l.jpg' },
    { id: 42938, title: 'Kaguya-sama wa Kokurasetai: Ultra Romantic', type: 'TV', score: 8.99, picture: 'https://cdn.myanimelist.net/images/anime/1181/120468l.jpg' },
    { id: 43608, title: 'Clannad: After Story', type: 'TV', score: 8.98, picture: 'https://cdn.myanimelist.net/images/anime/1821/117350l.jpg' },
    { id: 41467, title: 'Fruits Basket: The Final', type: 'TV', score: 8.97, picture: 'https://cdn.myanimelist.net/images/anime/1447/114764l.jpg' },
    { id: 28977, title: 'Gintama', type: 'TV', score: 8.94, picture: 'https://cdn.myanimelist.net/images/anime/10/73272l.jpg' },
    { id: 28851, title: 'Koe no Katachi', type: 'Movie', score: 8.94, picture: 'https://cdn.myanimelist.net/images/anime/1122/96436l.jpg' },
    { id: 60022, title: 'Code Geass: Hangyaku no Lelouch R2', type: 'TV', score: 8.93, picture: 'https://cdn.myanimelist.net/images/anime/1446/117333l.jpg' },
    { id: 61316, title: 'Kusuriya no Hitorigoto 2nd Season', type: 'TV', score: 8.91, picture: 'https://cdn.myanimelist.net/images/anime/1772/148654l.jpg' },
    { id: 61469, title: '3-gatsu no Lion 2nd Season', type: 'TV', score: 8.91, picture: 'https://cdn.myanimelist.net/images/anime/1515/109667l.jpg' },
    { id: 2904, title: 'Gintama Movie 2: Kanketsu-hen', type: 'Movie', score: 8.89, picture: 'https://cdn.myanimelist.net/images/anime/13/48219l.jpg' },
    { id: 57555, title: 'Tongari Boushi no Atelier', type: 'TV', score: 8.8, picture: 'https://cdn.myanimelist.net/images/anime/1527/146836l.jpg' },
  ];

  // === SEARCH FUNCTIONALITY ===
  function renderResults(query, resultsContainer) {
    if (!query || query.length < 2) {
      resultsContainer.classList.add('hidden');
      return;
    }

    const q = query.toLowerCase();
    const matches = allAnime.filter(a => a.title.toLowerCase().includes(q)).slice(0, 8);

    if (matches.length === 0) {
      resultsContainer.innerHTML = '<p class="text-center text-[var(--color-text-muted)] text-sm py-6">No results found</p>';
      resultsContainer.classList.remove('hidden');
      return;
    }

    resultsContainer.innerHTML = '<div class="p-2">' + matches.map(a => {
      return '<a href="https://myanimelist.net/anime/' + a.id + '" target="_blank" rel="noopener" class="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-bg)] transition-colors">' +
        '<img src="' + a.picture + '" alt="' + a.title + '" class="w-10 h-14 object-cover rounded flex-shrink-0" onerror="this.style.display=\'none\'">' +
        '<div class="flex-1 min-w-0">' +
          '<p class="font-medium text-sm truncate">' + a.title + '</p>' +
          '<p class="text-xs text-[var(--color-text-muted)]">' + a.type + (a.score ? ' \u2605 ' + a.score : '') + '</p>' +
        '</div>' +
      '</a>';
    }).join('') + '</div>';
    resultsContainer.classList.remove('hidden');
  }

  const searchInput = document.getElementById('nav-search');
  const searchResults = document.getElementById('search-results');
  const searchInputMobile = document.getElementById('nav-search-mobile');
  const searchResultsMobile = document.getElementById('search-results-mobile');

  let debounceTimer;

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => renderResults(e.target.value, searchResults), 200);
    });
  }

  if (searchInputMobile && searchResultsMobile) {
    searchInputMobile.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => renderResults(e.target.value, searchResultsMobile), 200);
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#nav-search') && !e.target.closest('#search-results')) {
      if (searchResults) searchResults.classList.add('hidden');
    }
    if (!e.target.closest('#nav-search-mobile') && !e.target.closest('#search-results-mobile')) {
      if (searchResultsMobile) searchResultsMobile.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (searchResults) searchResults.classList.add('hidden');
      if (searchResultsMobile) searchResultsMobile.classList.add('hidden');
    }
    if (e.key === '/' && !e.target.closest('input')) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
  });
})();
