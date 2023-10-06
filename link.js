const axios = require('axios');
const cheerio = require('cheerio');

// URL de base
const baseUrl = "https://www.futwiz.com";
// URL de la page à scraper
const scrapeUrl = "https://www.futwiz.com/en/fc24/players?page=0&release[]=informgold&release[]=uclrttk&release[]=uclwrttk&release[]=eclrttk&release[]=elrttk&release[]=nike&minprice=10250&maxprice=20000";

// Fonction pour extraire les liens des joueurs d'une page donnée avec une pause aléatoire
async function extractPlayerLinks(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Sélectionnez tous les liens des joueurs sur la page
    const playerLinks = [];
    $('a.latest-player-card').each((index, element) => {
      const href = $(element).attr('href');
      const fullUrl = baseUrl + href; // Ajoutez le début de l'URL au lien
      playerLinks.push(fullUrl);
    });

    return playerLinks;
  } catch (error) {
    console.error("Une erreur s'est produite : ", error);
    return [];
  }
}

// Fonction pour générer un délai aléatoire entre minDelay et maxDelay en millisecondes
function getRandomDelay(minDelay, maxDelay) {
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

// Appeler la fonction pour extraire les liens des joueurs avec pause aléatoire
async function scrapeWithRandomDelay() {
  const minDelay = 1000; // Délai minimal en millisecondes (1 seconde)
  const maxDelay = 15000; // Délai maximal en millisecondes (15 secondes)

  const playerLinks = await extractPlayerLinks(scrapeUrl);
  console.log(playerLinks); // Affichez tous les liens des joueurs

  for (const link of playerLinks) {
    console.log(`${link}`);
    const randomWaitTime = getRandomDelay(minDelay, maxDelay);
    
    await new Promise(resolve => setTimeout(resolve, randomWaitTime));
  }
}

// Appeler la fonction principale
scrapeWithRandomDelay();
