require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // URL do frontend Vue.js
  credentials: true
}));

app.use(express.json());

// Configuração de sessões
app.use(session({
  secret: process.env.SESSION_SECRET || 'nutrirecipe-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true em produção com HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Rotas
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'NutriRecipe Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr na porta ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
