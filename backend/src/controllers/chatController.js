const spoonacularService = require('../services/spoonacularService');
const openRouterService = require('../services/openRouterService');

class ChatController {
  // Iniciar conversa com ingredientes
  async sendIngredients(req, res) {
    try {
      const { ingredients, originalIngredients, numberOfSuggestions = 3 } = req.body;

      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({
          error: 'Por favor, forneça uma lista de ingredientes válida'
        });
      }

      console.log('🥗 Ingredientes recebidos (traduzidos):', ingredients);
      console.log('🇵🇹 Ingredientes originais:', originalIngredients);

      // Guardar ingredientes na sessão (usar originais para exibição)
      req.session.userIngredients = originalIngredients || ingredients;
      req.session.translatedIngredients = ingredients;
      req.session.chatState = 'waiting_recipe_choice';

      // Processar ingredientes (já vêm traduzidos do frontend)
      const parsedIngredients = spoonacularService.parseIngredients(ingredients);
      
      console.log('🔧 Ingredientes processados para API:', parsedIngredients);
      
      // Procurar receitas
      const recipes = await spoonacularService.findRecipesByIngredients(
        parsedIngredients, 
        numberOfSuggestions
      );

      if (recipes.length === 0) {
        console.log('❌ Nenhuma receita encontrada com filtros atuais');
        
        // Tentar busca mais permissiva (sem filtros)
        console.log('🔍 Tentando busca mais permissiva...');
        const allRecipes = await spoonacularService.findRecipesByIngredientsPermissive(
          parsedIngredients, 
          numberOfSuggestions * 2
        );
        
        if (allRecipes.length > 0) {
          console.log(`📋 Encontradas ${allRecipes.length} receitas aproximadas`);
          
          // Guardar receitas aproximadas na sessão
          req.session.availableRecipes = allRecipes.slice(0, numberOfSuggestions);
          req.session.adaptedRecipe = null;
          
          // Gerar receita adaptada mesmo com receitas aproximadas
          const displayIngredients = originalIngredients || ingredients;
          console.log('🤖 Gerando receita adaptada (aproximada) para:', displayIngredients);
          
          const prompt = openRouterService.createAdaptedRecipePrompt(displayIngredients, allRecipes.slice(0, numberOfSuggestions));
          const aiResponse = await openRouterService.generateResponse([
            { role: 'user', content: prompt }
          ]);

          // Guardar a receita adaptada gerada
          req.session.adaptedRecipe = {
            originalIngredients: displayIngredients,
            adaptedContent: aiResponse,
            basedOnRecipes: allRecipes.slice(0, numberOfSuggestions).map(r => ({
              id: r.id,
              title: r.title,
              readyInMinutes: r.readyInMinutes
            })),
            isApproximate: true
          };

          req.session.chatState = 'recipe_adapted';

          return res.json({
            message: aiResponse,
            type: 'adapted_recipe_approximate',
            hasNutrition: false,
            canGetDetails: true
          });
        } else {
          return res.json({
            message: 'Não encontrei nenhuma receita na base de dados com esses ingredientes. Tens certeza de que os ingredientes estão escritos corretamente? Podes tentar com ingredientes mais comuns como "frango", "arroz", "tomate".',
            type: 'no_recipes_found',
            suggestions: []
          });
        }
      }

      // Guardar receitas e ingredientes na sessão
      req.session.availableRecipes = recipes;
      req.session.adaptedRecipe = null; // Limpar receita adaptada anterior

      // Gerar receita adaptada usando IA
      const displayIngredients = originalIngredients || ingredients;
      console.log('🤖 Gerando receita adaptada para:', displayIngredients);
      
      const prompt = openRouterService.createAdaptedRecipePrompt(displayIngredients, recipes);
      const aiResponse = await openRouterService.generateResponse([
        { role: 'user', content: prompt }
      ]);

      // Guardar a receita adaptada gerada
      req.session.adaptedRecipe = {
        originalIngredients: displayIngredients,
        adaptedContent: aiResponse,
        basedOnRecipes: recipes.slice(0, 3).map(r => ({
          id: r.id,
          title: r.title,
          readyInMinutes: r.readyInMinutes
        }))
      };

      // Mudar o estado para indicar que a receita foi adaptada
      req.session.chatState = 'recipe_adapted';

      res.json({
        message: aiResponse,
        type: 'adapted_recipe',
        hasNutrition: false, // Não temos info nutricional específica para receita adaptada
        canGetDetails: true // Podemos oferecer mais detalhes
      });

    } catch (error) {
      console.error('Erro ao processar ingredientes:', error);
      
      // Diferentes tipos de erro
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
        return res.status(503).json({
          error: 'Erro de conexão com os serviços de receitas. Verifica a tua conexão à internet.',
          type: 'connection_error',
          retryable: true
        });
      } else if (error.response && error.response.status === 401) {
        return res.status(503).json({
          error: 'Erro de autenticação com os serviços de receitas. O servidor está temporariamente indisponível.',
          type: 'auth_error',
          retryable: true
        });
      } else if (error.response && error.response.status >= 500) {
        return res.status(503).json({
          error: 'Os serviços de receitas estão temporariamente indisponíveis. Tenta novamente em alguns segundos.',
          type: 'server_error',
          retryable: true
        });
      } else {
        return res.status(500).json({
          error: 'Erro interno do servidor. Tenta novamente.',
          type: 'internal_error',
          retryable: true
        });
      }
    }
  }

  // Processar escolha de receita
  // Processar pedidos sobre a receita adaptada
  async chooseRecipe(req, res) {
    try {
      const { choice } = req.body;

      if (!choice || typeof choice !== 'string') {
        return res.status(400).json({
          error: 'Por favor, especifica o que queres saber sobre a receita.'
        });
      }

      // Verificar se existe receita adaptada na sessão
      if (!req.session.adaptedRecipe) {
        return res.status(400).json({
          error: 'Não há receita adaptada. Por favor, começa novamente com os ingredientes.'
        });
      }

      const userMessage = choice.toLowerCase();
      
      // Interpretar o que o utilizador quer
      if (userMessage.includes('detalhe') || userMessage.includes('mais') || userMessage.includes('completo')) {
        
        // Gerar mais detalhes sobre a receita adaptada
        const detailPrompt = `És um chef português útil. O utilizador perguntou: "${choice}"

Receita adaptada atual:
${req.session.adaptedRecipe.adaptedContent}

Ingredientes originais do utilizador: ${req.session.adaptedRecipe.originalIngredients.join(', ')}

Fornece mais detalhes práticos sobre esta receita adaptada:
- Dicas de preparação
- Tempos específicos de cozedura
- Como verificar se está pronto
- Sugestões de apresentação

Sê prático e útil. Máximo 120 palavras, português de Portugal.`;

        const aiResponse = await openRouterService.generateResponse([
          { role: 'user', content: detailPrompt }
        ]);

        return res.json({
          message: aiResponse,
          type: 'recipe_details'
        });

      } else if (userMessage.includes('nutri') || userMessage.includes('caloria') || userMessage.includes('valor')) {
        
        // Resposta sobre nutrição (estimativa)
        const nutritionPrompt = `És um nutricionista português. O utilizador perguntou sobre nutrição para esta receita adaptada:

${req.session.adaptedRecipe.adaptedContent}

Ingredientes: ${req.session.adaptedRecipe.originalIngredients.join(', ')}

Faz uma estimativa nutricional básica e educativa desta receita adaptada. Explica que é uma estimativa e varia conforme preparação. Destaca pontos positivos nutricionais dos ingredientes.

Máximo 100 palavras, português de Portugal.`;

        const aiResponse = await openRouterService.generateResponse([
          { role: 'user', content: nutritionPrompt }
        ]);

        return res.json({
          message: aiResponse,
          type: 'nutrition_estimate'
        });

      } else if (userMessage.includes('substitu') || userMessage.includes('trocar') || userMessage.includes('alternativ')) {
        
        // Sugestões de substituições
        const substitutionPrompt = `És um chef português criativo. O utilizador perguntou: "${choice}"

Receita adaptada:
${req.session.adaptedRecipe.adaptedContent}

Ingredientes disponíveis: ${req.session.adaptedRecipe.originalIngredients.join(', ')}

Sugere substituições ou variações criativas que pode fazer com ingredientes comuns que provavelmente tem em casa. Sê prático e realista.

Máximo 100 palavras, português de Portugal.`;

        const aiResponse = await openRouterService.generateResponse([
          { role: 'user', content: substitutionPrompt }
        ]);

        return res.json({
          message: aiResponse,
          type: 'substitution_suggestions'
        });

      } else {
        
        // Resposta geral sobre a receita
        const generalPrompt = `És um chef português prestável. O utilizador perguntou: "${choice}"

Sobre esta receita adaptada:
${req.session.adaptedRecipe.adaptedContent}

Responde de forma útil e específica à pergunta. Se não tens certeza, sê honesto mas oferece sugestões práticas.

Máximo 80 palavras, português de Portugal.`;

        const aiResponse = await openRouterService.generateResponse([
          { role: 'user', content: generalPrompt }
        ]);

        return res.json({
          message: aiResponse,
          type: 'general_response'
        });
      }

    } catch (error) {
      console.error('Erro ao processar pergunta sobre receita:', error);
      
      // Diferentes tipos de erro
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
        return res.status(503).json({
          error: 'Erro de conexão com os serviços de IA. Verifica a tua conexão à internet.',
          type: 'connection_error',
          retryable: true
        });
      } else if (error.response && error.response.status === 401) {
        return res.status(503).json({
          error: 'Erro de autenticação com os serviços de IA. O servidor está temporariamente indisponível.',
          type: 'auth_error',
          retryable: true
        });
      } else if (error.response && error.response.status >= 500) {
        return res.status(503).json({
          error: 'Os serviços de IA estão temporariamente indisponíveis. Tenta novamente em alguns segundos.',
          type: 'server_error',
          retryable: true
        });
      } else {
        return res.status(500).json({
          error: 'Erro interno do servidor. Tenta novamente.',
          type: 'internal_error',
          retryable: true
        });
      }
    }
  }

  // Obter instruções da receita
  async getInstructions(req, res) {
    try {
      if (!req.session.selectedRecipe) {
        return res.status(400).json({
          error: 'Nenhuma receita selecionada. Por favor, escolhe uma receita primeiro.'
        });
      }

      const recipeId = req.session.selectedRecipe.id;
      const instructions = await spoonacularService.getRecipeInstructions(recipeId);

      if (!instructions || instructions.length === 0) {
        return res.json({
          message: 'Desculpa, não consegui obter as instruções detalhadas para esta receita.',
          instructions: []
        });
      }

      // Gerar resposta com instruções formatadas
      const instructionsPrompt = openRouterService.createInstructionsPrompt(
        req.session.selectedRecipe, 
        instructions
      );
      const aiResponse = await openRouterService.generateResponse([
        { role: 'user', content: instructionsPrompt }
      ]);

      res.json({
        message: aiResponse,
        instructions: instructions[0]?.steps || []
      });

    } catch (error) {
      console.error('Erro ao obter instruções:', error);
      res.status(500).json({
        error: 'Erro ao obter instruções da receita. Tenta novamente.'
      });
    }
  }

  // Reiniciar conversa
  async resetChat(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Erro ao limpar sessão:', err);
        }
      });

      res.json({
        message: 'Conversa reiniciada! Podes começar novamente com os teus ingredientes.',
        reset: true
      });
    } catch (error) {
      console.error('Erro ao reiniciar chat:', error);
      res.status(500).json({
        error: 'Erro ao reiniciar conversa.'
      });
    }
  }

  // Obter estado da sessão
  async getSessionState(req, res) {
    try {
      res.json({
        chatState: req.session.chatState || 'initial',
        hasIngredients: !!req.session.userIngredients,
        hasRecipes: !!req.session.availableRecipes,
        hasSelectedRecipe: !!req.session.selectedRecipe
      });
    } catch (error) {
      console.error('Erro ao obter estado da sessão:', error);
      res.status(500).json({
        error: 'Erro ao obter estado da sessão.'
      });
    }
  }
}

module.exports = new ChatController();
