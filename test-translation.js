// Teste simples do serviço de tradução
const translator = require('./frontend/src/services/translator.js');

console.log('🧪 Testando tradução de ingredientes...\n');

const testIngredients = [
  '1 frango',
  '2 tomates',
  '3 alhos',
  '500g arroz',
  'meia cebola',
  '1 colher de azeite'
];

console.log('Ingredientes originais:', testIngredients);

const translated = translator.translateIngredients(testIngredients);
console.log('Ingredientes traduzidos:', translated);

// Teste de títulos
console.log('\n🧪 Testando tradução de títulos...\n');

const testTitles = [
  'Chicken Rice Bowl',
  'Tomato Garlic Pasta',
  'Simple Fried Rice'
];

testTitles.forEach(title => {
  const translated = translator.translateRecipeTitle(title);
  console.log(`${title} → ${translated}`);
});

console.log('\n✅ Testes de tradução concluídos!');
