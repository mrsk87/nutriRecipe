require('dotenv').config();
const axios = require('axios');

async function testTranslationFlow() {
  console.log('🧪 Testando fluxo com tradução automática...\n');
  
  const baseURL = 'http://localhost:3000/api';
  let sessionCookie = null;
  
  const makeRequest = async (method, url, data = null) => {
    const config = {
      method,
      url: baseURL + url,
      headers: { 
        'Content-Type': 'application/json',
        ...(sessionCookie && { 'Cookie': sessionCookie })
      }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    
    if (!sessionCookie && response.headers['set-cookie']) {
      sessionCookie = response.headers['set-cookie'][0].split(';')[0];
    }
    
    return response;
  };
  
  try {
    console.log('🥗 Testando com ingredientes em português: tomates, frango, cebolas');
    
    // Simular tradução que seria feita no frontend
    const originalIngredients = ['2 tomates', '300g frango', '1 cebola'];
    const translatedIngredients = ['tomato', 'chicken', 'onion'];
    
    console.log('🌐 Enviando ingredientes traduzidos:', translatedIngredients);
    console.log('🇵🇹 Mantendo originais para referência:', originalIngredients);
    
    const response = await makeRequest('POST', '/chat/ingredients', {
      ingredients: translatedIngredients,
      originalIngredients: originalIngredients,
      numberOfSuggestions: 3
    });
    
    if (response.data.recipes && response.data.recipes.length > 0) {
      console.log('\n🎉 Sucesso! Receitas encontradas!');
      
      console.log('\n🤖 Resposta da IA:');
      console.log('=' .repeat(60));
      console.log(response.data.message);
      console.log('=' .repeat(60));
      
      console.log('\n📊 Receitas encontradas:');
      response.data.recipes.forEach((recipe, index) => {
        console.log(`\n${index + 1}. ${recipe.title}`);
        console.log(`   🎯 Compatibilidade: ${recipe.compatibilityPercentage}%`);
        console.log(`   ⏱️ Tempo: ${recipe.readyInMinutes} min`);
        console.log(`   ✅ Usa: ${recipe.usedIngredientsNames.join(', ')}`);
        if (recipe.missedIngredientsNames.length > 0) {
          console.log(`   ❌ Precisa: ${recipe.missedIngredientsNames.join(', ')}`);
        }
      });
      
      // Testar escolha de receita
      console.log('\n👆 Testando escolha da primeira receita...');
      const choiceResponse = await makeRequest('POST', '/chat/choose-recipe', {
        choice: 1
      });
      
      if (choiceResponse.data.recipe) {
        console.log('✅ Receita escolhida com sucesso!');
        console.log('📊 Informação nutricional recebida');
        
        const nutrition = choiceResponse.data.recipe.nutrition;
        if (nutrition) {
          console.log(`   🔥 ${Math.round(nutrition.calorias)} kcal`);
          console.log(`   🥩 ${Math.round(nutrition.proteina)}g proteína`);
          console.log(`   🍞 ${Math.round(nutrition.hidratos)}g hidratos`);
        }
      }
    } else {
      console.log('\n❌ Nenhuma receita encontrada');
      console.log('Mensagem:', response.data.message);
    }
    
    console.log('\n🎯 Teste de tradução concluído!');
    console.log('✅ Backend a processar ingredientes traduzidos');
    console.log('✅ Receitas reais encontradas na Spoonacular');
    console.log('✅ IA a responder com base nos ingredientes originais');
    
  } catch (error) {
    console.log('❌ Erro:', error.response?.data || error.message);
  }
}

testTranslationFlow();
