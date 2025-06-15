const express = require('express');
const chatController = require('../controllers/chatController');

const router = express.Router();

// Enviar ingredientes e obter sugestões
router.post('/ingredients', chatController.sendIngredients);

// Escolher receita específica
router.post('/choose-recipe', chatController.chooseRecipe);

// Obter instruções da receita selecionada
router.get('/instructions', chatController.getInstructions);

// Reiniciar conversa
router.post('/reset', chatController.resetChat);

// Obter estado da sessão
router.get('/session-state', chatController.getSessionState);

module.exports = router;
