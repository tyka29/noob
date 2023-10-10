const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
const linksPerPage = 1000; // Nombre de liens par page

// Dans votre script JavaScript
async function displayResults() {
    try {
      const playerLinks = await scrapeMultiplePages();
      const resultsDiv = document.getElementById('results');
  
      // Affichez les résultats dans la zone d'affichage des résultats
      playerLinks.forEach((link, index) => {
        const linkElement = document.createElement('a');
        linkElement.href = link;
        linkElement.textContent = link;
        resultsDiv.appendChild(linkElement);
      });
    } catch (error) {
      console.error("Une erreur s'est produite : ", error);
    }
  }
  
  // Appelez la fonction pour afficher les résultats
  displayResults();
  
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
    const page = req.query.page || 1; // Page par défaut est 1
    const startIndex = (page - 1) * linksPerPage;
    const endIndex = startIndex + linksPerPage;
    const totalLinks = playerData.length;
    const totalPages = Math.ceil(totalLinks / linksPerPage);
    const linksToDisplay = playerData.slice(startIndex, endIndex);
    // Générer une page HTML avec un formulaire pour coller les liens
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ma liste de joueurs</title>
            <style>
            * {
                max-width: 95%;
                margin: 0 auto;
            }
            body {
                font-family: Arial, sans-serif;
                background-color: #f7f7f7;
                color: #333;
                line-height: 1.6;
                margin: 0 auto;
                padding: 0;
            }
            .article {
                display: flex;
                justify-content: space-between;
            }
            .container {
                margin: 0 auto;
                padding: 20px;
                box-shadow: -4px 4px 20px;
                border-radius: 2rem;
            }
            nav {
                display: flex;
            }
            h1 {
                font-size: 28px;
                margin-bottom: 20px;
                color: #333;
                margin-block: 2rem;
            }
        
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                border: 1px solid #ccc;
            }
        
            th, td {
                padding: 15px;
                text-align: center;
                border: 1px solid #ccc;
            }
        
            th {
                background-color: #f2f2f2;
                color: #333;
            }
        
            table tr td img {
                max-width: 100px;
                max-height: 100px;
                display: block;
                margin: 0 auto;
                border: 1px solid #ccc;
                border-radius: 4px;
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
            
nav {
    color: #000;
    padding: 20px 0;
    display: flex;
    justify-content: right;
    margin-right: 0px;
    margin-bottom: 2rem;
}

ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

li {
    display: inline;
    margin-right: 20px;
}

a {
    text-decoration: none;
    color: #000;
    font-weight: bold;
    transition: color 0.3s;
}

a:hover {
    color: #0056b3; 
}
.dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-content {
    display: none;
    position: absolute;
    background-color: #444444;
    min-width: 160px;
    z-index: 1;
}

.dropdown:hover .dropdown-content {
    display: block;
}

.dropdown-content li {
    padding: 10px;
}

.dropdown-content a {
    color: #fff;
    text-decoration: none;
    display: block;
}

.dropdown-content a:hover {
    background-color: #a3a1a1;
}

        </style>
        </head>
        <body>
        <header>
        <nav>
            <ul>
                <li><a href="/">Mes Liens</a></li>
                <li><a href="/negative_players">Joueurs en Baisse</a></li>
                <li><a href="/positive_players">Joueurs en Hausse</a></li>
                <li class="dropdown">
                    <a href="/fut_mili">Les listes</a>
                    <ul class="dropdown-content">
                        <li><a href="/fut_mili">Fut Millionaire</a></li>
                        <li><a href="low_price">10-20K</a></li>
                        <li><a href="middle_price">20-35K</a></li>
                        <li><a href="hight_price">35-50K</a></li>
                    </ul>
                </li>
            </ul>
        </nav>
    </header>
        <div class="container">
        <h2>Coller les liens des joueurs</h2>
        
        <form action="/scrape" method="post">
            <label for="liens">Collez les liens ici (un par ligne) :</label><br>
            <textarea id="liens" name="liens" rows="4" cols="50" required></textarea><br>
            <button type="submit">Scrapez les liens</button>
        </form>
        <form action="/update" method="post">
            <button type="submit">Mettre à jour les prix</button>
        </form>
        
    </div>
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
                </tr>
                ${linksToDisplay.map(player => `
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
                    </tr>
                `).join('')}
            </table>
            <div>
        </div>

            <form action="/reset" method="post">
                <button type="submit">Réinitialiser la liste</button>
            </form>
            <form action="/update" method="post">
                <button type="submit">Mettre à jour les prix</button>
            </form>
        </body>
        </html>
    `;

    res.send(html);
});
app.get('/negative_players', (req, res) => {
    // Filtrer les joueurs avec une comparaison de prix négative
    const negativePlayers = playerData.filter(player => parseFloat(player['Comparaison de prix']) < 0);
    const page = req.query.page || 5; // Page par défaut est 1
    const startIndex = (page - 1) * linksPerPage;
    const endIndex = startIndex + linksPerPage;
    const totalPlayers = negativePlayers.length;
    const totalPages = Math.ceil(totalPlayers / linksPerPage);
    const playersToDisplay = negativePlayers.slice(startIndex, endIndex);

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ma liste de joueurs</title>
            <style>
            * {
                max-width: 95%;
                margin: 0 auto;
            }
            body {
                font-family: Arial, sans-serif;
                background-color: #f7f7f7;
                color: #333;
                line-height: 1.6;
                margin: 0 auto;
                padding: 0;
            }
            .article {
                display: flex;
                justify-content: space-between;
            }
            .container {
                margin: 0 auto;
                padding: 20px;
                box-shadow: -4px 4px 20px;
                border-radius: 2rem;
            }
            nav {
                display: flex;
            }
            h1 {
                font-size: 28px;
                margin-bottom: 20px;
                color: #333;
                margin-block: 2rem;
            }
        
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                border: 1px solid #ccc;
            }
        
            th, td {
                padding: 15px;
                text-align: center;
                border: 1px solid #ccc;
            }
        
            th {
                background-color: #f2f2f2;
                color: #333;
            }
        
            table tr td img {
                max-width: 100px;
                max-height: 100px;
                display: block;
                margin: 0 auto;
                border: 1px solid #ccc;
                border-radius: 4px;
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
            
nav {
    color: #000;
    padding: 20px 0;
    display: flex;
    justify-content: right;
    margin-right: 0px;
    margin-bottom: 2rem;
}

ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

li {
    display: inline;
    margin-right: 20px;
}

a {
    text-decoration: none;
    color: #000;
    font-weight: bold;
    transition: color 0.3s;
}

a:hover {
    color: #0056b3; 
}
.dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-content {
    display: none;
    position: absolute;
    background-color: #444444;
    min-width: 160px;
    z-index: 1;
}

.dropdown:hover .dropdown-content {
    display: block;
}

.dropdown-content li {
    padding: 10px;
}

.dropdown-content a {
    color: #fff;
    text-decoration: none;
    display: block;
}

.dropdown-content a:hover {
    background-color: #a3a1a1;
}

        </style>
        </head>
        <body>
        <header>
        <nav>
            <ul>
                <li><a href="/">Mes Liens</a></li>
                <li><a href="/negative_players">Joueurs en Baisse</a></li>
                <li><a href="/positive_players">Joueurs en Hausse</a></li>
                <li class="dropdown">
                    <a href="/fut_mili">Les listes</a>
                    <ul class="dropdown-content">
                        <li><a href="/fut_mili">Fut Millionaire</a></li>
                        <li><a href="low_price">10-20K</a></li>
                        <li><a href="middle_price">20-35K</a></li>
                        <li><a href="hight_price">35-50K</a></li>
                    </ul>
                </li>
            </ul>
        </nav>
    </header>
            </nav>
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
                </tr>
                ${negativePlayers.map(player => `
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
                    </tr>
                `).join('')}
            </table>
            <div>
        </div>
        </body>
        </html>
    `);
});

app.get('/fut_mili', (req, res) => {
    const playersInRange = playerData.filter(player => {
        const price = parseFloat(player['Prix'].replace(/,/g, ''));
        return price >= 2500 && price <= 10000;
    });

    const page = parseInt(req.query.page) || 1; // Extraire le numéro de page de la requête
    const startIndex = (page - 1) * linksPerPage;
    const endIndex = startIndex + linksPerPage;
    const totalPlayers = playersInRange.length;
    const totalPages = Math.ceil(totalPlayers / linksPerPage);
    const playersToDisplay = playersInRange.slice(startIndex, endIndex);

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
        <title>Ma liste de joueurs</title>
        <style>
        * {
            max-width: 95%;
            margin: 0 auto;
        }
        body {
            font-family: Arial, sans-serif;
            background-color: #f7f7f7;
            color: #333;
            line-height: 1.6;
            margin: 0 auto;
            padding: 0;
        }
        .article {
            display: flex;
            justify-content: space-between;
        }
        .container {
            margin: 0 auto;
            padding: 20px;
            box-shadow: -4px 4px 20px;
            border-radius: 2rem;
        }
        nav {
            display: flex;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 20px;
            color: #333;
            margin-block: 2rem;
        }
    
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #ccc;
        }
    
        th, td {
            padding: 15px;
            text-align: center;
            border: 1px solid #ccc;
        }
    
        th {
            background-color: #f2f2f2;
            color: #333;
        }
    
        table tr td img {
            max-width: 100px;
            max-height: 100px;
            display: block;
            margin: 0 auto;
            border: 1px solid #ccc;
            border-radius: 4px;
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
        
nav {
color: #000;
padding: 20px 0;
display: flex;
justify-content: right;
margin-right: 0px;
margin-bottom: 2rem;
}

ul {
list-style: none;
padding: 0;
margin: 0;
}

li {
display: inline;
margin-right: 20px;
}

a {
text-decoration: none;
color: #000;
font-weight: bold;
transition: color 0.3s;
}

a:hover {
color: #0056b3; 
}
.dropdown {
position: relative;
display: inline-block;
}

.dropdown-content {
display: none;
position: absolute;
background-color: #444444;
min-width: 160px;
z-index: 1;
}

.dropdown:hover .dropdown-content {
display: block;
}

.dropdown-content li {
padding: 10px;
}

.dropdown-content a {
color: #fff;
text-decoration: none;
display: block;
}

.dropdown-content a:hover {
background-color: #a3a1a1;
}

    </style>
    </head>
    <body>
    <header>
    <nav>
        <ul>
            <li><a href="/">Mes Liens</a></li>
            <li><a href="/negative_players">Joueurs en Baisse</a></li>
            <li><a href="/positive_players">Joueurs en Hausse</a></li>
            <li class="dropdown">
                <a href="/fut_mili">Les listes</a>
                <ul class="dropdown-content">
                    <li><a href="/fut_mili">Fut Millionaire</a></li>
                    <li><a href="low_price">10-20K</a></li>
                    <li><a href="middle_price">20-35K</a></li>
                    <li><a href="hight_price">35-50K</a></li>
                </ul>
            </li>
        </ul>
    </nav>
</header>
            <h1>Résultats des joueurs (Prix entre 10250 et 19750)</h1>
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
                </tr>
                ${playersToDisplay.map(player => `
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
                    </tr>
                `).join('')}
            </table>
            <div>
        </div>
        </body>
        </html>
    `);
});

app.get('/positive_players', (req, res) => {
    // Filtrer les joueurs avec une comparaison de prix positive ou égale à zéro
    const positivePlayers = playerData.filter(player => parseFloat(player['Comparaison de prix']) >= 0);
    const page = req.query.page || 1; // Page par défaut est 1
    const startIndex = (page - 1) * linksPerPage;
    const endIndex = startIndex + linksPerPage;
    const totalPlayers = positivePlayers.length;
    const totalPages = Math.ceil(totalPlayers / linksPerPage);
    const playersToDisplay = positivePlayers.slice(startIndex, endIndex);

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ma liste de joueurs</title>
            <style>
            * {
                max-width: 95%;
                margin: 0 auto;
            }
            body {
                font-family: Arial, sans-serif;
                background-color: #f7f7f7;
                color: #333;
                line-height: 1.6;
                margin: 0 auto;
                padding: 0;
            }
            .article {
                display: flex;
                justify-content: space-between;
            }
            .container {
                margin: 0 auto;
                padding: 20px;
                box-shadow: -4px 4px 20px;
                border-radius: 2rem;
            }
            nav {
                display: flex;
            }
            h1 {
                font-size: 28px;
                margin-bottom: 20px;
                color: #333;
                margin-block: 2rem;
            }
        
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                border: 1px solid #ccc;
            }
        
            th, td {
                padding: 15px;
                text-align: center;
                border: 1px solid #ccc;
            }
        
            th {
                background-color: #f2f2f2;
                color: #333;
            }
        
            table tr td img {
                max-width: 100px;
                max-height: 100px;
                display: block;
                margin: 0 auto;
                border: 1px solid #ccc;
                border-radius: 4px;
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
            
nav {
    color: #000;
    padding: 20px 0;
    display: flex;
    justify-content: right;
    margin-right: 0px;
    margin-bottom: 2rem;
}

ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

li {
    display: inline;
    margin-right: 20px;
}

a {
    text-decoration: none;
    color: #000;
    font-weight: bold;
    transition: color 0.3s;
}

a:hover {
    color: #0056b3; 
}
.dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-content {
    display: none;
    position: absolute;
    background-color: #444444;
    min-width: 160px;
    z-index: 1;
}

.dropdown:hover .dropdown-content {
    display: block;
}

.dropdown-content li {
    padding: 10px;
}

.dropdown-content a {
    color: #fff;
    text-decoration: none;
    display: block;
}

.dropdown-content a:hover {
    background-color: #a3a1a1;
}

        </style>
        </head>
        <body>
        <header>
        <nav>
            <ul>
                <li><a href="/">Mes Liens</a></li>
                <li><a href="/negative_players">Joueurs en Baisse</a></li>
                <li><a href="/positive_players">Joueurs en Hausse</a></li>
                <li class="dropdown">
                    <a href="/fut_mili">Les listes</a>
                    <ul class="dropdown-content">
                        <li><a href="/fut_mili">Fut Millionaire</a></li>
                        <li><a href="low_price">10-20K</a></li>
                        <li><a href="middle_price">20-35K</a></li>
                        <li><a href="hight_price">35-50K</a></li>
                    </ul>
                </li>
            </ul>
        </nav>
    </header>
        <body>
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
                </tr>
                ${playersToDisplay.map(player => `
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
                    </tr>
                `).join('')}
            </table>
            <div>
        </div>

        </body>
        </html>
    `);
});

app.get('/low_price', (req, res) => {
    // Filtrer les joueurs avec un prix compris entre 10250 et 19750
    const playersInRange = playerData.filter(player => {
        const price = parseFloat(player['Prix'].replace(/,/g, ''));
        return price >= 10250 && price <= 19750;
    });

    const page = parseInt(req.query.page) || 1; // Extraire le numéro de page de la requête
    const startIndex = (page - 1) * linksPerPage;
    const endIndex = startIndex + linksPerPage;
    const totalPlayers = playersInRange.length;
    const totalPages = Math.ceil(totalPlayers / linksPerPage);
    const playersToDisplay = playersInRange.slice(startIndex, endIndex);

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ma liste de joueurs</title>
            <style>
            * {
                max-width: 95%;
                margin: 0 auto;
            }
            body {
                font-family: Arial, sans-serif;
                background-color: #f7f7f7;
                color: #333;
                line-height: 1.6;
                margin: 0 auto;
                padding: 0;
            }
            .article {
                display: flex;
                justify-content: space-between;
            }
            .container {
                margin: 0 auto;
                padding: 20px;
                box-shadow: -4px 4px 20px;
                border-radius: 2rem;
            }
            nav {
                display: flex;
            }
            h1 {
                font-size: 28px;
                margin-bottom: 20px;
                color: #333;
                margin-block: 2rem;
            }
        
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                border: 1px solid #ccc;
            }
        
            th, td {
                padding: 15px;
                text-align: center;
                border: 1px solid #ccc;
            }
        
            th {
                background-color: #f2f2f2;
                color: #333;
            }
        
            table tr td img {
                max-width: 100px;
                max-height: 100px;
                display: block;
                margin: 0 auto;
                border: 1px solid #ccc;
                border-radius: 4px;
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
            
nav {
    color: #000;
    padding: 20px 0;
    display: flex;
    justify-content: right;
    margin-right: 0px;
    margin-bottom: 2rem;
}

ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

li {
    display: inline;
    margin-right: 20px;
}

a {
    text-decoration: none;
    color: #000;
    font-weight: bold;
    transition: color 0.3s;
}

a:hover {
    color: #0056b3; 
}
.dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-content {
    display: none;
    position: absolute;
    background-color: #444444;
    min-width: 160px;
    z-index: 1;
}

.dropdown:hover .dropdown-content {
    display: block;
}

.dropdown-content li {
    padding: 10px;
}

.dropdown-content a {
    color: #fff;
    text-decoration: none;
    display: block;
}

.dropdown-content a:hover {
    background-color: #a3a1a1;
}

        </style>
        </head>
        <body>
        <header>
        <nav>
            <ul>
                <li><a href="/">Mes Liens</a></li>
                <li><a href="/negative_players">Joueurs en Baisse</a></li>
                <li><a href="/positive_players">Joueurs en Hausse</a></li>
                <li class="dropdown">
                    <a href="/fut_mili">Les listes</a>
                    <ul class="dropdown-content">
                        <li><a href="/fut_mili">Fut Millionaire</a></li>
                        <li><a href="low_price">10-20K</a></li>
                        <li><a href="middle_price">20-35K</a></li>
                        <li><a href="hight_price">35-50K</a></li>
                    </ul>
                </li>
            </ul>
        </nav>
    </header>
            <h1>Résultats des joueurs (Prix entre 10250 et 19750)</h1>
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
                </tr>
                ${playersToDisplay.map(player => `
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
                    </tr>
                `).join('')}
            </table>
            <div>
        </div>
        </body>
        </html>
    `);
});

app.get('/middle_price', (req, res) => {
    // Filtrer les joueurs avec un prix compris entre 20000 et 34750
    const playersInRange = playerData.filter(player => {
        const price = parseFloat(player['Prix'].replace(/,/g, ''));
        return price >= 20000 && price <= 34750;
    });

    const page = parseInt(req.query.page) || 1; // Extraire le numéro de page de la requête
    const startIndex = (page - 1) * linksPerPage;
    const endIndex = startIndex + linksPerPage;
    const totalPlayers = playersInRange.length;
    const totalPages = Math.ceil(totalPlayers / linksPerPage);
    const playersToDisplay = playersInRange.slice(startIndex, endIndex);

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ma liste de joueurs</title>
            <style>
            * {
                max-width: 95%;
                margin: 0 auto;
            }
            body {
                font-family: Arial, sans-serif;
                background-color: #f7f7f7;
                color: #333;
                line-height: 1.6;
                margin: 0 auto;
                padding: 0;
            }
            .article {
                display: flex;
                justify-content: space-between;
            }
            .container {
                margin: 0 auto;
                padding: 20px;
                box-shadow: -4px 4px 20px;
                border-radius: 2rem;
            }
            nav {
                display: flex;
            }
            h1 {
                font-size: 28px;
                margin-bottom: 20px;
                color: #333;
                margin-block: 2rem;
            }
        
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                border: 1px solid #ccc;
            }
        
            th, td {
                padding: 15px;
                text-align: center;
                border: 1px solid #ccc;
            }
        
            th {
                background-color: #f2f2f2;
                color: #333;
            }
        
            table tr td img {
                max-width: 100px;
                max-height: 100px;
                display: block;
                margin: 0 auto;
                border: 1px solid #ccc;
                border-radius: 4px;
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
            
nav {
    color: #000;
    padding: 20px 0;
    display: flex;
    justify-content: right;
    margin-right: 0px;
    margin-bottom: 2rem;
}

ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

li {
    display: inline;
    margin-right: 20px;
}

a {
    text-decoration: none;
    color: #000;
    font-weight: bold;
    transition: color 0.3s;
}

a:hover {
    color: #0056b3; 
}
.dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-content {
    display: none;
    position: absolute;
    background-color: #444444;
    min-width: 160px;
    z-index: 1;
}

.dropdown:hover .dropdown-content {
    display: block;
}

.dropdown-content li {
    padding: 10px;
}

.dropdown-content a {
    color: #fff;
    text-decoration: none;
    display: block;
}

.dropdown-content a:hover {
    background-color: #a3a1a1;
}

        </style>
        </head>
        <body>
        <header>
        <nav>
            <ul>
                <li><a href="/">Mes Liens</a></li>
                <li><a href="/negative_players">Joueurs en Baisse</a></li>
                <li><a href="/positive_players">Joueurs en Hausse</a></li>
                <li class="dropdown">
                    <a href="/fut_mili">Les listes</a>
                    <ul class="dropdown-content">
                        <li><a href="/fut_mili">Fut Millionaire</a></li>
                        <li><a href="low_price">10-20K</a></li>
                        <li><a href="middle_price">20-35K</a></li>
                        <li><a href="hight_price">35-50K</a></li>
                    </ul>
                </li>
            </ul>
        </nav>
    </header>
            <h1>Résultats des joueurs (Prix entre 10250 et 19750)</h1>
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
                </tr>
                ${playersToDisplay.map(player => `
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
                    </tr>
                `).join('')}
            </table>
            <div>
        </div>
        </body>
        </html>
    `);
});

app.get('/hight_price', (req, res) => {
    // Filtrer les joueurs avec un prix compris entre 35000 et 50000
    const playersInRange = playerData.filter(player => {
        const price = parseFloat(player['Prix'].replace(/,/g, ''));
        return price >= 35000 && price <= 50000;
    });

    const page = parseInt(req.query.page) || 1; // Extraire le numéro de page de la requête
    const startIndex = (page - 1) * linksPerPage;
    const endIndex = startIndex + linksPerPage;
    const totalPlayers = playersInRange.length;
    const totalPages = Math.ceil(totalPlayers / linksPerPage);
    const playersToDisplay = playersInRange.slice(startIndex, endIndex);

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ma liste de joueurs</title>
            <style>
            * {
                max-width: 95%;
                margin: 0 auto;
            }
            body {
                font-family: Arial, sans-serif;
                background-color: #f7f7f7;
                color: #333;
                line-height: 1.6;
                margin: 0 auto;
                padding: 0;
            }
            .article {
                display: flex;
                justify-content: space-between;
            }
            .container {
                margin: 0 auto;
                padding: 20px;
                box-shadow: -4px 4px 20px;
                border-radius: 2rem;
            }
            nav {
                display: flex;
            }
            h1 {
                font-size: 28px;
                margin-bottom: 20px;
                color: #333;
                margin-block: 2rem;
            }
        
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                border: 1px solid #ccc;
            }
        
            th, td {
                padding: 15px;
                text-align: center;
                border: 1px solid #ccc;
            }
        
            th {
                background-color: #f2f2f2;
                color: #333;
            }
        
            table tr td img {
                max-width: 100px;
                max-height: 100px;
                display: block;
                margin: 0 auto;
                border: 1px solid #ccc;
                border-radius: 4px;
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
            
nav {
    color: #000;
    padding: 20px 0;
    display: flex;
    justify-content: right;
    margin-right: 0px;
    margin-bottom: 2rem;
}

ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

li {
    display: inline;
    margin-right: 20px;
}

a {
    text-decoration: none;
    color: #000;
    font-weight: bold;
    transition: color 0.3s;
}

a:hover {
    color: #0056b3; 
}
.dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-content {
    display: none;
    position: absolute;
    background-color: #444444;
    min-width: 160px;
    z-index: 1;
}

.dropdown:hover .dropdown-content {
    display: block;
}

.dropdown-content li {
    padding: 10px;
}

.dropdown-content a {
    color: #fff;
    text-decoration: none;
    display: block;
}

.dropdown-content a:hover {
    background-color: #a3a1a1;
}

        </style>
        </head>
        <body>
        <header>
        <nav>
            <ul>
                <li><a href="/">Mes Liens</a></li>
                <li><a href="/negative_players">Joueurs en Baisse</a></li>
                <li><a href="/positive_players">Joueurs en Hausse</a></li>
                <li class="dropdown">
                    <a href="/fut_mili">Les listes</a>
                    <ul class="dropdown-content">
                        <li><a href="/fut_mili">Fut Millionaire</a></li>
                        <li><a href="low_price">10-20K</a></li>
                        <li><a href="middle_price">20-35K</a></li>
                        <li><a href="hight_price">35-50K</a></li>
                    </ul>
                </li>
            </ul>
        </nav>
    </header>
        <nav>
            <ul>
                <li><a href="/">Mes Liens</a></li>
                <li><a href="/negative_players">Joueurs en Baisse</a></li>
                <li><a href="/positive_players">Joueurs en Hausse</a></li>
                <li class="dropdown">
                    <a href="/fut_mili">Les listes</a>
                    <ul class="dropdown-content">
                        <li><a href="low_price">10-20K</a></li>
                        <li><a href="middle_price">20-35K</a></li>
                        <li><a href="hight_price">35-50K</a></li>
                    </ul>
                </li>
            </ul>
        </nav>
    </header>
            <h1>Résultats des joueurs (Prix entre 10250 et 19750)</h1>
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
                </tr>
                ${playersToDisplay.map(player => `
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
                    </tr>
                `).join('')}
            </table>
            <div>
        </div>
        </body>
        </html>
    `);
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
