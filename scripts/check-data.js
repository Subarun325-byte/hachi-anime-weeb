const d = require('../data/anime.json');
console.log('Top all:', d.topAnime[0].data.length);
console.log('Top TV:', d.topAnime[1].data.length);
console.log('Top Movie:', d.topAnime[2].data.length);
console.log('Seasonal:', d.seasonal.data.length);
const first = d.topAnime[0].data[0].node;
console.log('First:', first.title, '|', first.mean, '|', first.genres.map(g => g.name).join(', '));
