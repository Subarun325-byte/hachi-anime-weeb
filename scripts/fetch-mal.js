const https = require('https');
const fs = require('fs');
const path = require('path');

const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID || '';
const DATA_DIR = path.join(__dirname, '..', 'data');
const FIELDS = 'id,title,main_picture,alternative_titles,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,media_type,status,genres,num_episodes,start_season,average_episode_duration,rating,background';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'X-MAL-CLIENT-ID': MAL_CLIENT_ID,
      },
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTopAnime() {
  console.log('Fetching top anime...');
  const results = [];
  for (const type of ['all', 'tv', 'movie', 'ova']) {
    const url = `https://api.myanimelist.net/v2/anime/ranking?ranking_type=${type}&limit=25&fields=${FIELDS}`;
    try {
      const res = await fetch(url);
      results.push({ type, data: res.data || [] });
      console.log(`  ${type}: ${(res.data || []).length} anime`);
      await delay(1000);
    } catch (e) {
      console.error(`  Error fetching ${type}:`, e.message);
      results.push({ type, data: [] });
    }
  }
  return results;
}

async function fetchSeasonalAnime() {
  console.log('Fetching seasonal anime...');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const seasons = ['winter', 'spring', 'summer', 'fall'];
  const seasonIndex = Math.floor(month / 3);
  const season = seasons[seasonIndex];

  const url = `https://api.myanimelist.net/v2/anime/season/${year}/${season}?sort=anime_score&limit=25&fields=${FIELDS}`;
  try {
    const res = await fetch(url);
    console.log(`  ${season} ${year}: ${(res.data || []).length} anime`);
    return { year, season, data: res.data || [] };
  } catch (e) {
    console.error(`  Error fetching seasonal:`, e.message);
    return { year, season, data: [] };
  }
}

async function fetchByGenre(genreId, genreName) {
  const url = `https://api.myanimelist.net/v2/anime?genre_id=${genreId}&limit=10&fields=${FIELDS}&order_by=score&sort=desc`;
  try {
    const res = await fetch(url);
    console.log(`  ${genreName}: ${(res.data || []).length} anime`);
    return { id: genreId, name: genreName, data: res.data || [] };
  } catch (e) {
    console.error(`  Error fetching ${genreName}:`, e.message);
    return { id: genreId, name: genreName, data: [] };
  }
}

async function main() {
  if (!MAL_CLIENT_ID) {
    console.log('No MAL_CLIENT_ID set. Creating placeholder data...');
    console.log('Set MAL_CLIENT_ID environment variable or edit hugo.toml to use real data.');
    console.log('');
    console.log('To get a client ID:');
    console.log('1. Go to https://myanimelist.net/apiconfig');
    console.log('2. Create or edit your API client');
    console.log('3. Copy the Client ID');
    console.log('4. Run: set MAL_CLIENT_ID=your_client_id');
    console.log('');

    const placeholder = {
      topAnime: [
        {
          type: 'all',
          data: generatePlaceholderAnime(25),
        },
        {
          type: 'tv',
          data: generatePlaceholderAnime(25),
        },
        {
          type: 'movie',
          data: generatePlaceholderAnime(10),
        },
      ],
      seasonal: {
        year: new Date().getFullYear(),
        season: ['winter', 'spring', 'summer', 'fall'][Math.floor(new Date().getMonth() / 3)],
        data: generatePlaceholderAnime(20),
      },
      genres: [
        { id: 1, name: 'Action', data: generatePlaceholderAnime(10) },
        { id: 4, name: 'Comedy', data: generatePlaceholderAnime(10) },
        { id: 22, name: 'Romance', data: generatePlaceholderAnime(10) },
        { id: 24, name: 'Sci-Fi', data: generatePlaceholderAnime(10) },
        { id: 36, name: 'Slice of Life', data: generatePlaceholderAnime(10) },
        { id: 14, name: 'Horror', data: generatePlaceholderAnime(10) },
      ],
    };

    fs.writeFileSync(path.join(DATA_DIR, 'anime.json'), JSON.stringify(placeholder, null, 2));
    console.log('Placeholder data written to data/anime.json');
    return;
  }

  const topAnime = await fetchTopAnime();
  await delay(1500);

  const seasonal = await fetchSeasonalAnime();
  await delay(1500);

  console.log('Fetching genre-based anime...');
  const genreIds = [
    [1, 'Action'], [2, 'Adventure'], [4, 'Comedy'], [8, 'Drama'],
    [10, 'Fantasy'], [14, 'Horror'], [22, 'Romance'], [24, 'Sci-Fi'],
    [36, 'Slice of Life'], [30, 'Sports'], [37, 'Supernatural'], [40, 'Mystery'],
  ];
  const genres = [];
  for (const [id, name] of genreIds) {
    genres.push(await fetchByGenre(id, name));
    await delay(1000);
  }

  const allData = { topAnime, seasonal, genres };
  fs.writeFileSync(path.join(DATA_DIR, 'anime.json'), JSON.stringify(allData, null, 2));
  console.log('Data written to data/anime.json');
}

function generatePlaceholderAnime(count) {
  const titles = [
    'Attack on Titan', 'Fullmetal Alchemist: Brotherhood', 'Steins;Gate',
    'Cowboy Bebop', 'Neon Genesis Evangelion', 'Death Note', 'One Punch Man',
    'Demon Slayer', 'Jujutsu Kaisen', 'My Hero Academia', 'Spy x Family',
    'Chainsaw Man', 'Mob Psycho 100', 'Vinland Saga', 'Hunter x Hunter',
    'Code Geass', 'Sword Art Online', 'Re:Zero', 'No Game No Life',
    'Spirited Away', 'Your Name', 'A Silent Voice', 'Princess Mononoke',
    'Akira', 'Ghost in the Shell',
  ];
  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi', 'Slice of Life'];
  const types = ['tv', 'movie', 'ova', 'ona', 'special'];

  return Array.from({ length: count }, (_, i) => ({
    node: {
      id: 1000 + i,
      title: titles[i % titles.length] + (i >= titles.length ? ` ${Math.floor(i / titles.length) + 1}` : ''),
      main_picture: {
        medium: `https://cdn.myanimelist.net/images/anime/${(i * 7 + 3) % 200}/${(i * 13 + 5) % 3000}m.jpg`,
        large: `https://cdn.myanimelist.net/images/anime/${(i * 7 + 3) % 200}/${(i * 13 + 5) % 3000}l.jpg`,
      },
      mean: (7 + Math.random() * 2.5).toFixed(1),
      rank: i + 1,
      popularity: 100 + i * 50,
      num_list_users: 100000 - i * 3000,
      num_scoring_users: 80000 - i * 2500,
      media_type: types[i % types.length],
      num_episodes: [12, 24, 1, 13, 26][i % 5],
      genres: [{ id: i % 10, name: genres[i % genres.length] }],
      synopsis: `${titles[i % titles.length]} is a critically acclaimed anime series known for its compelling story and stunning animation.`,
    },
  }));
}

main().catch(console.error);
