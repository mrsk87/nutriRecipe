#!/usr/bin/env node

// Script para testar funcionalidades de retry do frontend
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Configurar cliente com session
const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testHealthCheck() {
  console.log('🏥 Testando health check...');
  try {
    const response = await client.get('/health');
    console.log('✅ Health check OK:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Health check FAILED:', error.message);
    return false;
  }
}

async function testIngredientsWithPortuguese() {
  console.log('\n🥗 Testando ingredientes em português...');
  try {
    const response = await client.post('/chat/ingredients', {
      ingredients: ['chicken', 'rice', 'tomatoes'], // Traduzidos
      originalIngredients: ['frango', 'arroz', 'tomates'], // Originais
      numberOfSuggestions: 3
    });
    
    console.log('✅ Ingredientes processados com sucesso!');
    console.log('📋 Receitas encontradas:', response.data.recipes?.length || 0);
    console.log('💬 Mensagem:', response.data.message.substring(0, 100) + '...');
    
    if (response.data.recipes && response.data.recipes.length > 0) {
      console.log('🍽️ Primeira receita:', response.data.recipes[0].title);
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ Erro ao processar ingredientes:', error.response?.data || error.message);
    console.log('🔄 Erro retryable:', error.response?.data?.retryable);
    console.log('📝 Tipo de erro:', error.response?.data?.type);
    return null;
  }
}

async function testChooseRecipe() {
  console.log('\n🎯 Testando escolha de receita...');
  try {
    const response = await client.post('/chat/choose-recipe', {
      choice: '1'
    });
    
    console.log('✅ Receita escolhida com sucesso!');
    console.log('📊 Tem informação nutricional:', !!response.data.recipe?.nutrition);
    console.log('💬 Mensagem:', response.data.message.substring(0, 100) + '...');
    
    return response.data;
  } catch (error) {
    console.log('❌ Erro ao escolher receita:', error.response?.data || error.message);
    console.log('🔄 Erro retryable:', error.response?.data?.retryable);
    console.log('📝 Tipo de erro:', error.response?.data?.type);
    return null;
  }
}

async function testInstructions() {
  console.log('\n📝 Testando instruções...');
  try {
    const response = await client.get('/chat/instructions');
    
    console.log('✅ Instruções obtidas com sucesso!');
    console.log('💬 Mensagem:', response.data.message.substring(0, 100) + '...');
    
    return response.data;
  } catch (error) {
    console.log('❌ Erro ao obter instruções:', error.response?.data || error.message);
    console.log('🔄 Erro retryable:', error.response?.data?.retryable);
    console.log('📝 Tipo de erro:', error.response?.data?.type);
    return null;
  }
}

async function testInvalidIngredients() {
  console.log('\n❌ Testando ingredientes inválidos...');
  try {
    const response = await client.post('/chat/ingredients', {
      ingredients: ['xyz123', 'abcdef', 'nonexistent'],
      originalIngredients: ['xyz123', 'abcdef', 'inexistente'],
      numberOfSuggestions: 3
    });
    
    console.log('✅ Resposta para ingredientes inválidos:', response.data.type);
    console.log('💬 Mensagem:', response.data.message.substring(0, 100) + '...');
    console.log('📋 Receitas encontradas:', response.data.recipes?.length || 0);
    
    return response.data;
  } catch (error) {
    console.log('❌ Erro com ingredientes inválidos:', error.response?.data || error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🧪 INICIANDO TESTES DE RETRY E FUNCIONALIDADES\n');
  
  // Test 1: Health Check
  const healthOK = await testHealthCheck();
  if (!healthOK) {
    console.log('❌ Servidor não está disponível. Abortando testes.');
    return;
  }
  
  // Test 2: Ingredientes válidos em português
  const ingredientsResult = await testIngredientsWithPortuguese();
  
  if (ingredientsResult && ingredientsResult.recipes?.length > 0) {
    // Test 3: Escolher receita
    const choiceResult = await testChooseRecipe();
    
    if (choiceResult) {
      // Test 4: Obter instruções
      await testInstructions();
    }
  }
  
  // Test 5: Ingredientes inválidos
  await testInvalidIngredients();
  
  console.log('\n✅ TESTES CONCLUÍDOS!');
}

// Executar testes
runAllTests().catch(console.error);
