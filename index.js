const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

// Conexión a PostgreSQL (local o Render)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: 'postgres',
        host: 'localhost',
        database: 'db_libros',
        password: 'mi_password_seguro',
        port: 5432,
      }
);

// Inicializar la tabla de libros
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS libros (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(150) NOT NULL,
        autor VARCHAR(100) NOT NULL,
        anio INT
      );
    `);
    console.log('Base de datos inicializada correctamente (tabla libros creada).');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  }
};

initDb();

// Ruta principal
app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Libros funcionando correctamente 📚' });
});

// 1. OBTENER todos los libros (GET)
app.get('/libros', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM libros ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREAR un libro (POST)
app.post('/libros', async (req, res) => {
  const { titulo, autor, anio } = req.body;
  try {
    const resultado = await pool.query(
      'INSERT INTO libros (titulo, autor, anio) VALUES ($1, $2, $3) RETURNING *',
      [titulo, autor, anio]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Libros corriendo en el puerto ${PORT}`);
});