const axios = require('axios');

class SpoonacularService {
  constructor() {
    this.apiKey = process.env.SPOONACULAR_API_KEY;
    this.baseURL = 'https://api.spoonacular.com';
  }

  // Procurar receitas por ingredientes
  async findRecipesByIngredients(ingredients, number = 3) {
    try {
      const ingredientList = ingredients.join(',');
      const response = await axios.get(`${this.baseURL}/recipes/findByIngredients`, {
        params: {
          apiKey: this.apiKey,
          ingredients: ingredientList,
          number: number * 2, // Pedir mais receitas para filtrar depois
          ranking: 2, // Maximizar uso de ingredientes disponíveis
          ignorePantry: true,
          fillIngredients: false // Não adicionar ingredientes extra
        }
      });
      
      // Filtrar receitas para mostrar apenas as que usam principalmente os ingredientes disponíveis
      const filteredRecipes = response.data
        .filter(recipe => {
          // Só aceitar receitas onde pelo menos 50% dos ingredientes são os que temos
          // E que não precisem de mais de 3 ingredientes extra
          const totalIngredients = recipe.usedIngredientCount + recipe.missedIngredientCount;
          const usagePercentage = recipe.usedIngredientCount / totalIngredients;
          return usagePercentage >= 0.5 && recipe.missedIngredientCount <= 3;
        })
        .sort((a, b) => {
          // Ordenar por compatibilidade (mais ingredientes nossos primeiro)
          const aPercentage = a.usedIngredientCount / (a.usedIngredientCount + a.missedIngredientCount);
          const bPercentage = b.usedIngredientCount / (b.usedIngredientCount + b.missedIngredientCount);
          return bPercentage - aPercentage;
        })
        .slice(0, number); // Limitar ao número pedido
      
      return filteredRecipes;
    } catch (error) {
      console.error('Erro ao procurar receitas:', error.message);
      throw new Error('Erro ao procurar receitas na Spoonacular');
    }
  }

  // Procurar receitas por ingredientes (versão permissiva para sugestões alternativas)
  async findRecipesByIngredientsPermissive(ingredients, number = 6) {
    try {
      const ingredientList = ingredients.join(',');
      const response = await axios.get(`${this.baseURL}/recipes/findByIngredients`, {
        params: {
          apiKey: this.apiKey,
          ingredients: ingredientList,
          number: number,
          ranking: 1, // Ranking mais flexível
          ignorePantry: true,
          fillIngredients: false
        }
      });
      
      // Sem filtros rigorosos - aceitar qualquer receita que use pelo menos 1 ingrediente
      const permissiveRecipes = response.data
        .filter(recipe => recipe.usedIngredientCount > 0)
        .sort((a, b) => {
          // Ordenar por número de ingredientes usados
          return b.usedIngredientCount - a.usedIngredientCount;
        });
      
      console.log(`🔍 Busca permissiva encontrou ${permissiveRecipes.length} receitas`);
      return permissiveRecipes;
    } catch (error) {
      console.error('Erro na busca permissiva:', error.message);
      throw error; // Re-throw para ser capturado no controller
    }
  }
  async getRecipeInformation(recipeId) {
    try {
      const response = await axios.get(`${this.baseURL}/recipes/${recipeId}/information`, {
        params: {
          apiKey: this.apiKey,
          includeNutrition: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações da receita:', error.message);
      throw new Error('Erro ao obter detalhes da receita');
    }
  }

  // Obter instruções da receita
  async getRecipeInstructions(recipeId) {
    try {
      const response = await axios.get(`${this.baseURL}/recipes/${recipeId}/analyzedInstructions`, {
        params: {
          apiKey: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter instruções:', error.message);
      throw new Error('Erro ao obter instruções da receita');
    }
  }

  // Converter ingredientes para formato padronizado (sem tradução)
  parseIngredients(userIngredients) {
    const parsed = [];
    
    userIngredients.forEach(ingredient => {
      let normalized = ingredient.toLowerCase().trim();
      
      // Remover quantidades comuns
      normalized = normalized.replace(/^\d+\s*(g|gr|gramas?|kg|quilos?)\s*/i, '');
      normalized = normalized.replace(/^\d+\s*(unidades?|un)\s*/i, '');
      normalized = normalized.replace(/^(meia?|meio)\s*/i, '');
      normalized = normalized.replace(/\s*(pequen[oa]|médi[oa]|grande)\s*$/i, '');
      
      const cleanIngredient = normalized.trim();
      parsed.push(cleanIngredient);
    });
    
    console.log('🔧 Ingredientes processados:', parsed);
    return parsed;
  }

  // Formatar informação nutricional
  formatNutrition(nutrition) {
    const nutrients = nutrition.nutrients || [];
    
    const findNutrient = (name) => {
      return nutrients.find(n => n.name.toLowerCase().includes(name.toLowerCase()));
    };

    return {
      calorias: findNutrient('calories')?.amount || 0,
      proteina: findNutrient('protein')?.amount || 0,
      hidratos: findNutrient('carbohydrates')?.amount || 0,
      gordura: findNutrient('fat')?.amount || 0,
      fibra: findNutrient('fiber')?.amount || 0,
      acucar: findNutrient('sugar')?.amount || 0,
      sodio: findNutrient('sodium')?.amount || 0
    };
  }
}

module.exports = new SpoonacularService();
