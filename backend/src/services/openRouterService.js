const axios = require('axios');

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.model = 'google/gemma-3n-e4b-it:free';
  }

  async generateResponse(messages) {
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'NutriRecipe Chatbot'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Erro ao comunicar com OpenRouter:', error.message);
      throw new Error('Erro ao gerar resposta do chatbot');
    }
  }

  // Criar prompt para sugestões de receitas
  createRecipeSuggestionPrompt(ingredients, recipes) {
    const ingredientsList = ingredients.join(', ');
    
    // Criar descrição detalhada de cada receita
    const recipesInfo = recipes.map((recipe, index) => {
      const usedIngredients = recipe.usedIngredients.map(ing => ing.name).join(', ');
      const missedIngredients = recipe.missedIngredients.map(ing => ing.name);
      const compatibilityPercentage = Math.round((recipe.usedIngredientCount / (recipe.usedIngredientCount + recipe.missedIngredientCount)) * 100);
      
      let description = `${index + 1}. **${recipe.title}**
   - Compatibilidade: ${compatibilityPercentage}% (usa ${recipe.usedIngredientCount} dos teus ingredientes)
   - Usa: ${usedIngredients}`;

      if (missedIngredients.length > 0) {
        description += `
   - Precisa ainda de: ${missedIngredients.join(', ')}`;
      }

      if (recipe.readyInMinutes) {
        description += `
   - Tempo: ${recipe.readyInMinutes} minutos`;
      }
      
      return description;
    }).join('\n\n');

    return `És um chef virtual português honesto e útil. O utilizador tem: ${ingredientsList}

Analisei receitas reais da base de dados e encontrei estas opções:

${recipesInfo}

Fala sobre estas receitas ESPECÍFICAS de forma entusiástica mas honesta:
1. Destaca qual tem melhor compatibilidade com os ingredientes disponíveis
2. Menciona quais ingredientes em falta são mais básicos/fáceis de ter
3. Se alguma receita for muito rápida, destaca isso
4. Dá conselhos práticos sobre substitutos simples se aplicável

Pergunta qual receita prefere ou se quer alternativas.
Máximo 130 palavras, português de Portugal.`;
  }

  // Criar prompt para sugestões alternativas quando receitas ideais não foram encontradas
  createAlternativeSuggestionPrompt(ingredients, recipes) {
    const ingredientsList = ingredients.join(', ');
    
    const recipesInfo = recipes.map((recipe, index) => {
      const usedIngredients = recipe.usedIngredients.map(ing => ing.name).join(', ');
      const missedIngredients = recipe.missedIngredients.map(ing => ing.name);
      const compatibilityPercentage = Math.round((recipe.usedIngredientCount / (recipe.usedIngredientCount + recipe.missedIngredientCount)) * 100);
      
      let description = `${index + 1}. **${recipe.title}**
   - Usa ${recipe.usedIngredientCount} dos teus ingredientes (${compatibilityPercentage}%)
   - Ingredientes teus usados: ${usedIngredients}`;

      if (missedIngredients.length > 0) {
        description += `
   - Precisa também de: ${missedIngredients.join(', ')}`;
      }

      if (recipe.readyInMinutes) {
        description += `
   - Tempo: ${recipe.readyInMinutes} minutos`;
      }
      
      return description;
    }).join('\n\n');

    return `És um chef virtual português compreensivo. O utilizador tem: ${ingredientsList}

Não encontrei receitas que usem principalmente esses ingredientes, mas tenho estas sugestões alternativas que pelo menos aproveitam alguns deles:

${recipesInfo}

Explica honestamente que estas receitas precisam de ingredientes adicionais, mas:
1. Destaca qual usa mais dos ingredientes disponíveis
2. Sugere substitutos ou alternativas simples para ingredientes em falta
3. Menciona que estas são as melhores opções disponíveis com esses ingredientes
4. Oferece-te para procurar com ingredientes diferentes se preferir

Sê útil e encorajador, em português de Portugal.
Máximo 140 palavras.`;
  }

  // Criar prompt para detalhes nutricionais
  createNutritionPrompt(recipe, nutrition) {
    return `És um nutricionista virtual português. Apresenta a informação nutricional desta receita de forma clara e apelativa:

Receita: ${recipe.title}
Tempo: ${recipe.readyInMinutes} minutos
Doses: ${recipe.servings}

Informação nutricional por dose:
- Calorias: ${nutrition.calorias} kcal
- Proteína: ${nutrition.proteina}g
- Hidratos de carbono: ${nutrition.hidratos}g
- Gordura: ${nutrition.gordura}g
- Fibra: ${nutrition.fibra}g

Responde em português de Portugal, de forma entusiástica e educativa. Termina perguntando se quer ver a receita passo-a-passo.

Máximo 120 palavras.`;
  }

  // Criar prompt para instruções de receita
  createInstructionsPrompt(recipe, instructions) {
    const steps = instructions[0]?.steps || [];
    const stepsList = steps.map(step => `${step.number}. ${step.step}`).join('\n');

    return `És um chef virtual português. Apresenta esta receita passo-a-passo de forma clara:

${recipe.title}
Tempo: ${recipe.readyInMinutes} minutos
Doses: ${recipe.servings}

Passos:
${stepsList}

Reescreve as instruções em português de Portugal, de forma clara e motivadora. Adiciona dicas úteis se necessário.

Máximo 200 palavras.`;
  }

  // Criar prompt para receitas adaptadas aos ingredientes disponíveis
  createAdaptedRecipePrompt(userIngredients, foundRecipes) {
    const ingredientsList = userIngredients.join(', ');
    
    // Obter detalhes das 2-3 melhores receitas
    const topRecipes = foundRecipes.slice(0, 3).map((recipe, index) => {
      const usedIngredients = recipe.usedIngredients.map(ing => `${ing.amount} ${ing.unit} ${ing.name}`).join(', ');
      const allIngredients = [...recipe.usedIngredients, ...recipe.missedIngredients];
      const fullIngredientsList = allIngredients.map(ing => `${ing.amount} ${ing.unit} ${ing.name}`).join(', ');
      
      return `RECEITA ${index + 1}: ${recipe.title}
Ingredientes originais: ${fullIngredientsList}
Ingredientes que tens: ${usedIngredients}
Tempo: ${recipe.readyInMinutes} minutos`;
    }).join('\n\n');

    return `És um chef português criativo e prático. O utilizador tem exatamente: ${ingredientsList}

Baseando-te nestas receitas reais que encontrei:

${topRecipes}

**INSTRUÇÕES IMPORTANTES:**
1. Escolhe a receita que melhor se adapta aos ingredientes disponíveis
2. ADAPTA as quantidades proporcionalmente ao que o utilizador tem
3. Se a receita original pede 3 tomates e ele tem 2, ajusta toda a receita proporcionalmente
4. Remove ingredientes que não tem ou sugere substitutos simples
5. Apresenta apenas: TÍTULO da receita adaptada + DESCRIÇÃO com quantidades ajustadas

**FORMATO OBRIGATÓRIO:**
**[Título da Receita Adaptada]**

[Descrição clara da receita com quantidades ajustadas para os ingredientes disponíveis, incluindo modo de preparação básico]

Não mostres links, cards ou listas numeradas. Apenas o título e descrição da receita adaptada.
Máximo 150 palavras, português de Portugal.`;
  }
}

module.exports = new OpenRouterService();
