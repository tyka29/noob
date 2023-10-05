const express = require('express');
const XLSX = require('xlsx');
const app = express();
const port = 3000;

// Middleware pour servir les fichiers CSS statiques
app.use(express.static(__dirname));

// Lire le fichier XLSX
const workbook = XLSX.readFile('donnees_joueurs.xlsx');
const sheetName = workbook.SheetNames[0];
const playerData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

app.get('/', (req, res) => {
  // Générer une page HTML avec les données du fichier XLSX
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
      <link rel="stylesheet" href="styles.css">
        <title>Résultats des joueurs</title>
      </head>
      <body>
      <!-- Ajoutez ceci à votre fichier HTML -->
<form id="lien-form">
  <label for="lien">Ajouter un lien :</label>
  <input type="text" id="lien" name="lien" required>
  <button type="submit">Ajouter</button>
</form>

<div id="liens-list">
  <!-- Les liens ajoutés seront affichés ici -->
</div>
        <h1>Résultats des joueurs</h1>
        <table border="1">
          <tr>
            <th>Nom du joueur</th>
            <th>Club</th>
            <th>Ligue</th>
            <th>Prix</th>
            <th>Comparaison de prix</th>
            <th>Dernière mise à jour du prix</th>
          </tr>
          ${playerData.map(player => `
            <tr>
              <td>${player['Nom du joueur']}</td>
              <td>${player['Club']}</td>
              <td>${player['Ligue']}</td>
              <td>${player['Prix']}</td>
              <td>${player['Comparaison de prix']}</td>
              <td>${player['Dernière mise à jour du prix']}</td>
            </tr>
          `).join('')}
        </table>
      </body>
    </html>
  `;

  res.send(html);
});

app.listen(port, () => {
  console.log(`Serveur web local en cours d'exécution sur le port ${port}`);
});
