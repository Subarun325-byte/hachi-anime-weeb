const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const IMG_DIR = path.join(__dirname, '..', 'static', 'images', 'anime');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });
    req.on('error', reject);
  });
}

function fetchBin(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Referer': 'https://myanimelist.net/' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBin(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function toLargeUrl(url) {
  return url;
}

function parseTopPage(html) {
  const anime = [];
  const re = /hoverinfo_trigger[^"]*"\s+href="(https:\/\/myanimelist\.net\/anime\/(\d+)\/[^"]*)"[^>]*>\s*<img[^>]*?alt="([^"]*)"[^>]*?(?:data-src|src)="([^"]*)"/gs;
  let m;
  while ((m = re.exec(html)) !== null) {
    const title = m[3].replace(/^Anime:\s*/, '').trim();
    anime.push({ id: parseInt(m[2]), url: m[1], picture: m[4].replace(/^http:/, 'https:'), title });
  }
  return anime;
}

function parseSeasonalPage(html) {
  const anime = [];
  // Seasonal uses: <a href="...anime/ID/NAME" class="link-title">TITLE</a>
  // and <span class="js-score">SCORE</span>, <img src="IMG" ...>
  const re = /<a\s+href="(https:\/\/myanimelist\.net\/anime\/(\d+)\/[^"]*)"[^>]*class="link-title"[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = parseInt(m[2]);
    const title = m[3].trim();
    const after = html.substring(m.index, m.index + 8000);
    const scoreM = after.match(/class="js-score">([0-9.]+)</);
    const membersM = after.match(/class="js-members">(\d+)/);
    const imgM = after.match(/<img[^>]*(?:src|data-src)="(https:\/\/cdn\.myanimelist\.net\/[^"]*)"/);
    anime.push({
      id,
      url: m[1],
      title,
      picture: imgM ? imgM[1] : '',
      score: scoreM ? parseFloat(scoreM[1]) : null,
      members: membersM ? parseInt(membersM[1]) : null,
    });
  }
  return anime;
}

function parseDetail(html, fallback) {
  const r = { ...fallback };

  // Title: <strong>TITLE</strong> inside h1.title-name
  const tM = html.match(/<h1[^>]*title-name[^>]*><strong>([^<]+)<\/strong>/);
  if (tM) r.title = tM[1].trim();

  // Score: itemprop="ratingValue">9.26</span>
  const sM = html.match(/itemprop="ratingValue"[^>]*>([0-9.]+)</);
  if (sM) r.mean = parseFloat(sM[1]);

  // Episodes: Episodes:</span>   28
  const eM = html.match(/<span class="dark_text">Episodes:<\/span>\s*([^\n<]+)/);
  if (eM) {
    const v = eM[1].trim();
    if (v && v !== 'Unknown') r.num_episodes = parseInt(v);
  }

  // Type: Type:</span>       <a href="...">TV</a>
  const tyM = html.match(/<span class="dark_text">Type:<\/span>\s*<a[^>]*>([^<]+)<\/a>/);
  if (tyM) r.media_type = tyM[1].trim().toLowerCase();

  // Status: Status:</span>   Finished Airing
  const stM = html.match(/<span class="dark_text">Status:<\/span>\s*([^\n<]+)/);
  if (stM) r.status = stM[1].trim();

  // Ranked: #1<sup>
  const rkM = html.match(/<span class="dark_text">Ranked:<\/span>\s*#(\d+)/);
  if (rkM) r.rank = parseInt(rkM[1]);

  // Popularity: #104
  const poM = html.match(/<span class="dark_text">Popularity:<\/span>\s*#(\d+)/);
  if (poM) r.popularity = parseInt(poM[1]);

  // Members: 1,457,080
  const mbM = html.match(/<span class="dark_text">Members:<\/span>\s*([\d,]+)/);
  if (mbM) r.num_list_users = parseInt(mbM[1].replace(/,/g, ''));

  // Genres: itemprop="genre" style="display: none">Adventure</span>
  const genres = [];
  const gRe = /itemprop="genre"[^>]*>([^<]+)<\/span>/g;
  let gm;
  while ((gm = gRe.exec(html)) !== null) {
    genres.push({ name: gm[1].trim() });
  }
  r.genres = genres;

  // Description: itemprop="description">TEXT</p>
  const dM = html.match(/itemprop="description">([\s\S]*?)<\/p>/);
  if (dM) {
    r.synopsis = dM[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&#0*39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '…')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Large image: look for img with itemprop="image", which may use data-src (lazy loading)
  const iM = html.match(/<img[^>]*itemprop="image"[^>]*/);
  if (iM) {
    const urlM = iM[0].match(/(?:data-src|src)="([^"]*)"/);
    if (urlM) r.picture_large = urlM[1].replace(/^http:/, 'https:');
  }

  return r;
}

async function scrapeList(url, label, seasonal = false) {
  console.log(`Scraping ${label}...`);
  const html = await fetch(url);
  const list = seasonal ? parseSeasonalPage(html) : parseTopPage(html);
  console.log(`  Found ${list.length} anime`);
  return list;
}

async function scrapeDetails(list, max) {
  const results = [];
  const items = list.slice(0, max);
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    process.stdout.write(`  [${i + 1}/${items.length}] ${a.title}... `);
    try {
      const html = await fetch(`https://myanimelist.net/anime/${a.id}`);
      const d = parseDetail(html, a);
      results.push({
        node: {
          id: d.id || a.id,
          title: d.title || a.title,
          main_picture: {
            medium: a.picture,
            large: toLargeUrl(d.picture_large || a.picture),
          },
          mean: d.mean || null,
          rank: d.rank || null,
          popularity: d.popularity || null,
          num_list_users: d.num_list_users || null,
          media_type: d.media_type || 'unknown',
          status: d.status || null,
          genres: d.genres || [],
          num_episodes: d.num_episodes || null,
          synopsis: d.synopsis || '',
        },
      });
      console.log('ok');
    } catch (e) {
      console.log('err:', e.message);
      results.push({
        node: {
          id: a.id,
          title: a.title,
          main_picture: { medium: a.picture, large: toLargeUrl(a.picture) },
          mean: null, rank: null, genres: [], synopsis: '',
        },
      });
    }
    await delay(1500);
  }
  return results;
}

async function main() {
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

  const topRaw = await scrapeList('https://myanimelist.net/topanime.php', 'Top Anime (all)');
  await delay(2000);

  const topTvRaw = await scrapeList('https://myanimelist.net/topanime.php?type=tv', 'Top TV');
  await delay(2000);

  const topMovieRaw = await scrapeList('https://myanimelist.net/topanime.php?type=movie', 'Top Movies');
  await delay(2000);

  const now = new Date();
  const year = now.getFullYear();
  const season = ['winter', 'spring', 'summer', 'fall'][Math.floor(now.getMonth() / 3)];
  const seasonalRaw = await scrapeList(
    `https://myanimelist.net/anime/season/${year}/${season}`,
    `Seasonal ${season} ${year}`,
    true
  );
  await delay(2000);

  console.log('\n--- Fetching details (top 25) ---');
  const topAll = await scrapeDetails(topRaw, 25);

  console.log('\n--- Fetching details (seasonal 10) ---');
  const seasonal = await scrapeDetails(seasonalRaw, 10);

  // Download images
  console.log('\nDownloading cover images...');
  for (const a of [...topAll, ...seasonal]) {
    const pic = a.node.main_picture.large || a.node.main_picture.medium;
    if (pic && pic.startsWith('http')) {
      const ext = path.extname(new URL(pic).pathname) || '.jpg';
      const fp = path.join(IMG_DIR, `${a.node.id}${ext}`);
      if (!fs.existsSync(fp)) {
        try {
          const buf = await fetchBin(pic);
          fs.writeFileSync(fp, buf);
          a.node.main_picture.local = `/images/anime/${a.node.id}${ext}`;
        } catch (e) {
          // keep remote URL
        }
      } else {
        a.node.main_picture.local = `/images/anime/${a.node.id}${ext}`;
      }
    }
  }

  const allData = {
    topAnime: [
      { type: 'all', data: topAll },
      { type: 'tv', data: topAll.filter((a) => a.node.media_type === 'tv') },
      { type: 'movie', data: topAll.filter((a) => a.node.media_type === 'movie') },
    ],
    seasonal: { year, season, data: seasonal },
    genres: [],
  };

  fs.writeFileSync(path.join(DATA_DIR, 'anime.json'), JSON.stringify(allData, null, 2));
  console.log('\nDone! Data saved to data/anime.json');
}

main().catch(console.error);
