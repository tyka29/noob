const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Définir les entêtes personnalisées dans une variable
const customHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
};

// Lire le fichier XLSX initial
let workbook = XLSX.readFile('donnees_joueurs.xlsx');
let sheetName = workbook.SheetNames[0];
let playerData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    // Générer une page HTML avec un formulaire pour coller les liens
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Résultats des joueurs</title>
            <style>
            * {
                background-color: black;
                color: white
            }
    body {
        font-family: Arial, sans-serif;
        background-color: #f7f7f7;
        color: #333;
        line-height: 1.6;
        margin: 0;
        padding: 0;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    h1 {
        font-size: 28px;
        margin-bottom: 20px;
        color: #fff;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }

    table, th, td {
        border: .3px solid #fff;
    }

    th, td {
        padding: 15px;
        text-align: center;
    }

    /* Centrer le contenu des cellules de table avec les images */
    table tr td {
        text-align: center;
    }

    /* Définir la largeur et la hauteur maximale pour les images */
    table tr td img {
        max-width: 100px;
        max-height: 100px;
        display: block;
        margin: 0 auto;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    th {
        background-color: #000;
    }

    a {
        text-decoration: none;
        color: #007bff;
    }

    button {
        background-color: #007bff;
        color: #fff;
        border: none;
        padding: 12px 24px;
        cursor: pointer;
        border-radius: 4px;
    }

    button:hover {
        background-color: #0056b3;
    }

    form {
        margin-bottom: 20px;
    }

    .negative {
        color: red;
        font-weight: bold;
    }

    .positive {
        color: green;
    }

    textarea {
        width: 100%;
        padding: 15px;
        border: 1px solid #ccc;
        border-radius: 4px;
        resize: vertical;
    }
</style>
        </head>
        <body>
            <h2>Coller des liens pour obtenir des résultats supplémentaires</h2>
            <form action="/scrape" method="post">
                <label for="liens">Collez les liens ici (un par ligne) :</label><br>
                <textarea id="liens" name="liens" rows="4" cols="50" required></textarea><br>
                <button type="submit">Scrapez les liens</button>
            </form>

            <h1>Résultats des joueurs</h1>
            <table border="1">
                <tr>
                    <th>Url</th>
                    <th>Image</th>
                    <th>Nom du joueur</th>
                    <th>Rating</th>
                    <th>Position</th>
                    <th>Club</th>
                    <th>Ligue</th>
                    <th>Prix</th>
                    <th>Comparaison de prix</th>
                    <th>Dernière mise à jour du prix</th>
                </tr>
                ${playerData.map(player => `
                    <tr>
                        <td>${player['URL']}</td>
                        <td><img src="${player['Image']}" alt="${player['Nom du joueur']}"></td>
                        <td>${player['Nom du joueur']}</td>
                        <td>${player['Rating']}</td> 
                        <td>${player['Position']}</td>
                        <td>${player['Club']}</td>
                        <td>${player['Ligue']}</td>
                        <td>${player['Prix'].replace(/,/g, '')}</td>
                        <td class="${parseFloat(player['Comparaison de prix']) < 0 ? 'negative' : 'positive'}">${player['Comparaison de prix']}</td>
                        <td>${player['Dernière mise à jour du prix']}</td>
                    </tr>
                `).join('')}
            </table>

            <form action="/reset" method="post">
                <button type="submit">Réinitialiser la liste</button>
            </form>
            <form action="/update" method="post">
                <button type="submit">Mettre à jour les URL</button>
            </form>
        </body>
        </html>
    `;

    res.send(html);
});

app.post('/reset', (req, res) => {
    // Réinitialisez la liste des joueurs ici (par exemple, videz playerData)
    playerData = [];
    
    // Redirigez vers la page d'accueil
    res.redirect('/');
});

// Définissez la fonction extractPlayerInfo en dehors des routes
async function extractPlayerInfo(url) {
    try {
        let playerImage = ''; // Déplacez cette ligne à l'intérieur de la fonction extractPlayerInfo
        let rating = ''; // Déclarer rating comme une variable locale
        let position = ''; // Déclarer position comme une variable locale

        const response = await axios.get(url, { headers: customHeaders });
        const html = response.data;
        const $ = cheerio.load(html);

        // Vérifier si la balise div.card-24-face est présente
        const card24Face = $('div.card-24-face');
        const card24FaceAlt = $('div.card-24-face-alt');

        // Utilisez card-24-face-inner ou card-24-face-alt pour extraire l'URL de l'image
        if (card24Face.length > 0) {
            playerImage = card24Face.find('.card-24-face-inner img').attr('src');
            // Autres extractions d'informations ici
        } else if (card24FaceAlt.length > 0) {
            playerImage = card24FaceAlt.find('img').attr('src');
            // Autres extractions d'informations ici
        }

        // Extraire le rating et la position
        rating = $('div.card-24-rating').text().trim();
        position = $('div.card-24-position').text().trim();

        // Recherchez d'autres informations du joueur et créez un objet pour les stocker
        const playerName = $('h1').text().trim();
        const club = $('div.player-detail-row div:contains("Club") + div a').text().trim();
        const league = $('div.player-detail-row div:contains("League") + div a').text().trim();
        const priceElement = $('div.price-num');
        const price = priceElement.first().text().trim();
        const priceCompareText = $('div.price-compare span').text().trim();
        const priceUpdated = $('div.price-updated').text().trim().replace(/Updated: (\d+ \w+ ago)/g, 'Updated: $1 ');

        // Ajoutez le rating et la position à l'objet playerData
        const playerData = {
            'URL': url,
            'Image': playerImage,
            'Nom du joueur': playerName,
            'Club': club,
            'Ligue': league,
            'Prix': price,
            'Comparaison de prix': priceCompareText,
            'Dernière mise à jour du prix': priceUpdated,
            'Rating': rating,
            'Position': position,
        };

        // Renvoyez les informations du joueur
        return playerData;
    } catch (error) {
        console.error("Une erreur s'est produite : ", error);
        return null;
    }
}

app.post('/scrape', async (req, res) => {
    // Obtenir les liens collés depuis le formulaire
    const liens = req.body.liens.split('\n').map(link => link.trim()).filter(link => link !== '');

    // Parcourez les liens et extrayez les informations
    const newPlayerData = [];
    for (const lien of liens) {
        const data = await extractPlayerInfo(lien);
        if (data) {
            newPlayerData.push(data);
        }
    }

    // Fusionnez les nouvelles données avec les données existantes
    playerData = playerData.concat(newPlayerData);

    // Mettez à jour le fichier XLSX avec les nouvelles données
    const newWb = XLSX.utils.book_new();
    const newWs = XLSX.utils.json_to_sheet(playerData);
    XLSX.utils.book_append_sheet(newWb, newWs, 'DonneesJoueurs');
    XLSX.writeFile(newWb, 'donnees_joueurs.xlsx');

    // Redirigez vers la page d'accueil avec les données mises à jour
    res.redirect('/');
});

app.post('/update', async (req, res) => {
    // Obtenir les URL existantes à partir du tableau playerData
    const existingUrls = playerData.map(player => player['URL']);

    // Parcourez les URL existantes et mettez à jour les données
    const updatedPlayerData = [];
    for (const url of existingUrls) {
        const data = await extractPlayerInfo(url);
        if (data) {
            updatedPlayerData.push(data);
        }
    }

    // Mettez à jour le tableau de données avec les nouvelles données
    playerData = updatedPlayerData;

    // Mettez également à jour le fichier XLSX avec les nouvelles données
    const newWb = XLSX.utils.book_new();
    const newWs = XLSX.utils.json_to_sheet(playerData);
    XLSX.utils.book_append_sheet(newWb, newWs, 'DonneesJoueurs');
    XLSX.writeFile(newWb, 'donnees_joueurs.xlsx');

    // Redirigez vers la page d'accueil avec les données mises à jour
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Serveur web local en cours d'exécution sur le port ${port}`);
});
