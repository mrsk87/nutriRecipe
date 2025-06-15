import axios from 'axios'
import translator from './translator.js'

class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api'
    this.client = axios.create({
      baseURL: this.baseURL,
      withCredentials: true, // Para manter sessões
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // Enviar ingredientes e obter sugestões
  async sendIngredients(ingredients, numberOfSuggestions = 3) {
    try {
      console.log('🥗 Ingredientes originais:', ingredients);
      
      // Traduzir ingredientes para inglês se necessário
      const translatedIngredients = translator.translateIngredients(ingredients);
      console.log('🌐 Ingredientes traduzidos:', translatedIngredients);
      
      const response = await this.client.post('/chat/ingredients', {
        ingredients: translatedIngredients,
        originalIngredients: ingredients, // Manter originais para referência
        numberOfSuggestions
      });
      
      // Traduzir títulos das receitas para português
      if (response.data.recipes) {
        response.data.recipes = response.data.recipes.map(recipe => ({
          ...recipe,
          originalTitle: recipe.title, // Manter título original
          title: translator.translateRecipeTitle(recipe.title)
        }));
        
        console.log('🍽️ Receitas com títulos traduzidos:', response.data.recipes.map(r => r.title));
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Escolher receita específica
  async chooseRecipe(choice) {
    try {
      const response = await this.client.post('/chat/choose-recipe', {
        choice
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Obter instruções da receita
  async getInstructions() {
    try {
      const response = await this.client.get('/chat/instructions')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Reiniciar conversa
  async resetChat() {
    try {
      const response = await this.client.post('/chat/reset')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Obter estado da sessão
  async getSessionState() {
    try {
      const response = await this.client.get('/chat/session-state')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Verificar se o servidor está disponível
  async healthCheck() {
    try {
      const response = await this.client.get('/health')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Tratar erros da API
  handleError(error) {
    if (error.response) {
      // Erro com resposta do servidor
      const errorData = error.response.data;
      const message = errorData?.error || 'Erro no servidor';
      const errorType = errorData?.type || 'unknown';
      const retryable = errorData?.retryable || false;
      
      // Criar erro customizado com informação adicional
      const customError = new Error(message);
      customError.type = errorType;
      customError.retryable = retryable;
      customError.status = error.response.status;
      
      return customError;
    } else if (error.request) {
      // Erro de rede
      const networkError = new Error('Erro de conexão. Verifica se o servidor está a funcionar.');
      networkError.type = 'network_error';
      networkError.retryable = true;
      return networkError;
    } else {
      // Outro tipo de erro
      const unknownError = new Error('Erro inesperado: ' + error.message);
      unknownError.type = 'unknown_error';
      unknownError.retryable = false;
      return unknownError;
    }
  }
}

export default new ApiService()
