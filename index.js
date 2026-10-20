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

// Recrear la tabla e insertar los libros de prueba
const initDb = async () => {
  try {
    // Borrar la tabla previa si existe para forzar la recarga de datos
    await pool.query(`DROP TABLE IF EXISTS libros;`);

    // Crear la tabla desde cero
    await pool.query(`
      CREATE TABLE libros (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(150) NOT NULL,
        autor VARCHAR(100) NOT NULL,
        anio INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insertar el listado de libros de prueba
    await pool.query(`
      INSERT INTO libros (titulo, autor, anio) VALUES 
      ('Crimen y castigo', 'Fiódor Dostoyevski', 1866),
      ('La Odisea', 'Homero', -800),
      ('Ficciones', 'Jorge Luis Borges', 1944),
      ('Pedro Páramo', 'Juan Rulfo', 1955),
      ('La sombra del viento', 'Carlos Ruiz Zafón', 2001),
      ('Los juegos del hambre', 'Suzanne Collins', 2008);
    `);

    console.log('Tabla libros recreada e insertados 12 registros de prueba.');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  }
};

initDb();

// Ruta principal (Salud / Status)
app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Libros funcionando correctamente 📚' });
});

// 1. OBTENER todos los libros (GET) - Estructurado con "data"
app.get('/libros', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM libros ORDER BY id ASC');
    res.json({
      data: resultado.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. OBTENER un libro por ID (GET /libros/:id)
app.get('/libros/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query('SELECT * FROM libros WHERE id = $1', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    res.json({
      data: resultado.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CREAR un libro (POST)
app.post('/libros', async (req, res) => {
  const { titulo, autor, anio } = req.body;
  try {
    const resultado = await pool.query(
      'INSERT INTO libros (titulo, autor, anio) VALUES ($1, $2, $3) RETURNING *',
      [titulo, autor, anio]
    );
    res.status(201).json({
      data: resultado.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Libros corriendo en el puerto ${PORT}`);
});