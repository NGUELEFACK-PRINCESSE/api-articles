const express = require('express');
const app = express();
const mysql = require('mysql2');

// ================= DATABASE =================
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'log'
});

db.connect(err => {
  if (err) console.log(err);
  else console.log('MySQL connecté');
});

// ================= SWAGGER =================
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Articles",
      version: "1.0.0",
      description: "API complète de gestion des articles"
    }
  },
  apis: ["./endex.js"]
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());

// ================= HOME =================
app.get('/', (req, res) => {
  res.send("API is working");
});

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Gestion des articles
 */

/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: Créer un article
 *     description: Ajouter un nouvel article dans la base de données
 *     tags: [Articles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titre
 *               - contenu
 *               - auteur
 *               - date
 *               - categorie
 *             properties:
 *               titre:
 *                 type: string
 *               contenu:
 *                 type: string
 *               auteur:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               categorie:
 *                 type: string
 *               tags:
 *                 type: string
 *     responses:
 *       201:
 *         description: Article créé avec succès
 *       400:
 *         description: Champs manquants
 */
app.post('/api/articles', (req, res) => {
  const { titre, contenu, auteur, date, categorie, tags } = req.body;

  if (!titre || !contenu || !auteur || !date || !categorie) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO articles (titre, contenu, auteur, date, categorie, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [titre, contenu, auteur, date, categorie, tags], (err, result) => {
    if (err) return res.status(500).json(err);

    res.status(201).json({
      message: "Article created successfully",
      article: {
        id: result.insertId,
        titre,
        contenu,
        auteur,
        date,
        categorie,
        tags
      }
    });
  });
});

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: Récupérer tous les articles
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: Liste des articles
 */
app.get('/api/articles', (req, res) => {
  db.query('SELECT * FROM articles', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

/**
 * @swagger
 * /api/articles/{id}:
 *   get:
 *     summary: Récupérer un article par ID
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Article trouvé
 *       404:
 *         description: Article non trouvé
 */
app.get('/api/articles/:id', (req, res) => {
  db.query('SELECT * FROM articles WHERE id=?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.json(results[0]);
  });
});

/**
 * @swagger
 * /api/articles/{id}:
 *   put:
 *     summary: Modifier un article
 *     description: Mettre à jour un article existant
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               contenu:
 *                 type: string
 *               auteur:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               categorie:
 *                 type: string
 *               tags:
 *                 type: string
 *     responses:
 *       200:
 *         description: Article modifié avec succès
 */

app.put('/api/articles/:id', (req, res) => {
  const { titre, contenu, auteur, date, categorie, tags } = req.body;

  const sql = `
    UPDATE articles 
    SET titre=?, contenu=?, auteur=?, date=?, categorie=?, tags=? 
    WHERE id=?
  `;

  db.query(sql, [titre, contenu, auteur, date, categorie, tags, req.params.id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Article updated successfully" });
  });
});

/**
 * @swagger
 * /api/articles/{id}:
 *   delete:
 *     summary: Supprimer un article
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Article supprimé
 */
app.delete('/api/articles/:id', (req, res) => {
  db.query('DELETE FROM articles WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Article deleted successfully" });
  });
});

/**
 * @swagger
 * /api/articles/search:
 *   get:
 *     summary: Rechercher des articles
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: titre
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Résultats de recherche
 */
app.get('/api/articles/search', (req, res) => {
  const { titre } = req.query;

  db.query(
    'SELECT * FROM articles WHERE titre LIKE ? OR contenu LIKE ?',
    [`%${titre}%`, `%${titre}%`],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// ================= SERVER =================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
