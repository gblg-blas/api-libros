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

// Inicializar la tabla e insertar datos de prueba si está vacía
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS libros (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(150) NOT NULL,
        autor VARCHAR(100) NOT NULL,
        anio INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Verificar si hay registros
    const check = await pool.query('SELECT COUNT(*) FROM libros');
    if (parseInt(check.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO libros (titulo, autor, anio) VALUES 
        ('Cien años de soledad', 'Gabriel García Márquez', 1967),
        ('Don Quijote de la Mancha', 'Miguel de Cervantes', 1605);
      `);
      console.log('Datos de prueba insertados en la tabla libros.');
    }

    console.log('Base de datos inicializada correctamente.');
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

// 2. OBTENER un libro por ID (GET /libros/:id) - Formato de objeto único en "data"
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

// 3. CREAR un libro (POST) - Responde envuelto en "data"
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