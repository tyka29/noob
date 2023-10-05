const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');

// Définir les entêtes personnalisées dans une variable
const customHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
};

// URLs à scraper
const urls = [
];

// Fonction pour extraire les informations du joueur
async function extractPlayerInfo(url) {
  try {
    const response = await axios.get(url, { headers: customHeaders });
    const html = response.data;
    const $ = cheerio.load(html);

    // Attendre un temps aléatoire entre 5 et 20 secondes (en millisecondes)
    const randomWaitTime = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
    console.log(`Attente de ${randomWaitTime / 1000} secondes avant la prochaine requête...`);
    await new Promise(resolve => setTimeout(resolve, randomWaitTime));

    // Extraire les informations
    const playerName = $('div.player-detail-row div:contains("Name") + div').text().trim();
    const club = $('div.player-detail-row div:contains("Club") + div a').text().trim();
    const league = $('div.player-detail-row div:contains("League") + div a').text().trim();
    const priceElement = $('div.price-num');
    const price = priceElement.first().text().trim();
    const priceCompareText = $('div.price-compare span').text().trim();
    const priceUpdated = $('div.price-updated').text().trim().replace(/Updated: (\d+ \w+ ago)/g, 'Updated: $1 ');

    // Créez un objet pour stocker les informations
    const playerData = {
      'Nom du joueur': playerName,
      'Club': club,
      'Ligue': league,
      'Prix': price,
      'Comparaison de prix': priceCompareText,
      'Dernière mise à jour du prix': priceUpdated
    };

    // Renvoyer les informations du joueur
    return playerData;
  } catch (error) {
    console.error("Une erreur s'est produite : ", error);
    return null;
  }
}

// Appeler la fonction pour extraire les informations de chaque joueur
async function scrapeData() {
  const playerDataArray = [];
  for (const url of urls) {
    const data = await extractPlayerInfo(url);
    if (data) {
      playerDataArray.push(data);
    }
  }

  // Créer un nouveau classeur XLSX
  const wb = XLSX.utils.book_new();

  // Convertir les données en une feuille XLSX
  const ws = XLSX.utils.json_to_sheet(playerDataArray);
  XLSX.utils.book_append_sheet(wb, ws, 'DonneesJoueurs');

  // Écrivez le classeur XLSX dans un fichier
  XLSX.writeFile(wb, 'donnees_joueurs.xlsx');

  console.log('Fichier XLSX créé avec succès.');
}

// Appeler la fonction pour extraire et créer le fichier XLSX
scrapeData();
