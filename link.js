const axios = require('axios');
const cheerio = require('cheerio');

// URL de base
const baseUrl = "https://www.futwiz.com";
// URLs à scraper
const urls = [
    "https://www.futwiz.com/en/lowest-price-ratings"
];

// Fonction pour extraire les liens des cartes avec une pause aléatoire
async function extractCardLinks(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Sélectionnez tous les éléments <a> avec la classe "latest-player-card"
    const cardLinks = [];
    $('a.latest-player-card').each((index, element) => {
      const href = $(element).attr('href');
      const fullUrl = baseUrl + href; // Ajoutez le début de l'URL au lien
      cardLinks.push(fullUrl);
    });

    return cardLinks;
  } catch (error) {
    console.error("Une erreur s'est produite : ", error);
    return [];
  }
}

// Fonction pour extraire les liens de toutes les pages avec une pause aléatoire
async function extractAllCardLinks() {
  const allCardLinks = [];
  for (const url of urls) {
    const cardLinks = await extractCardLinks(url);
    allCardLinks.push(...cardLinks);

    // Attendre un temps aléatoire entre 5 et 20 secondes (en millisecondes)
    const randomWaitTime = Math.floor(Math.random() * (15000 - 1000 + 1)) + 5000;
    console.log(`Attente de ${randomWaitTime / 1000} secondes avant la prochaine requête...`);
    await new Promise(resolve => setTimeout(resolve, randomWaitTime));
  }
  return allCardLinks;
}

// Appeler la fonction pour extraire les liens des cartes avec pause aléatoire
extractAllCardLinks().then((cardLinks) => {
  console.log(cardLinks); // Affichez tous les liens
  // Ou parcourez-les et affichez-les un par un
  cardLinks.forEach((link, index) => {
    console.log(`Lien ${index + 1}: ${link}`);
  });
});
