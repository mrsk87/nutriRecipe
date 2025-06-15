<template>
  <div class="app-container">
    <!-- Header -->
    <header class="header">
      <h1>🍳 NutriRecipe</h1>
      <p>O teu chef virtual que cria receitas baseadas nos teus ingredientes</p>
    </header>

    <!-- Chat Container -->
    <div class="chat-container">
      <!-- Mensagens do Chat -->
      <div class="chat-messages" ref="chatMessages">
        <transition-group name="fade" tag="div">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', message.type, { 'message-error': message.error }, message.errorClass]"
          >
            <div class="message-avatar">
              {{ message.type === 'bot' ? '🤖' : '👤' }}
            </div>
            <div class="message-content">
              <div v-html="formatMessage(message.content)"></div>
              
              <!-- Botão de Retry para Erros -->
              <div v-if="message.error && message.retryable" class="error-retry">
                <button 
                  class="btn-retry" 
                  @click="retryLastAction(message)"
                  :disabled="isLoading"
                >
                  <span>🔄</span>
                  {{ isLoading ? 'A tentar...' : 'Tentar novamente' }}
                </button>
              </div>
              
        <!-- Receita Adaptada (substituindo cards) -->
        <div v-if="message.type === 'adapted_recipe' || message.type === 'adapted_recipe_approximate'" class="adapted-recipe">
          <div class="recipe-adapted-indicator">
            <span v-if="message.type === 'adapted_recipe'">✨ Receita adaptada aos teus ingredientes</span>
            <span v-else>⚡ Receita aproximada com os teus ingredientes</span>
          </div>
        </div>

        <!-- Botão de Retry -->
        <div v-if="message.error && message.retryable" class="error-retry">
          <button 
            class="btn-retry" 
            @click="retryLastAction(message)"
            :disabled="isLoading"
          >
            🔄 Tentar novamente
          </button>
        </div>

              <!-- Botão de Retry para Erros -->
              <div v-if="message.error && message.retryable" class="error-retry">
                <button class="btn btn-retry" @click="retryLastAction(message)">
                  🔄 Tentar novamente
                </button>
              </div>
            </div>
          </div>
        </transition-group>

        <!-- Loading -->
        <div v-if="isLoading" class="loading">
          <div class="loading-spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <!-- Input de Ingredientes -->
        <div v-if="chatState === 'initial'" class="ingredient-input">
          <label for="ingredient">Que ingredientes tens disponíveis?</label>
          <div class="ingredient-list">
            <div
              v-for="(ingredient, index) in ingredients"
              :key="index"
              class="ingredient-tag"
            >
              {{ ingredient }}
              <button @click="removeIngredient(index)">×</button>
            </div>
          </div>
          <div class="input-group">
            <input
              id="ingredient"
              v-model="currentIngredient"
              type="text"
              class="input-field"
              placeholder="Ex: 2 tomates, 300g frango, meia cebola..."
              @keyup.enter="addIngredient"
            />
            <button class="btn btn-secondary" @click="addIngredient" :disabled="!currentIngredient.trim()">
              Adicionar
            </button>
          </div>
          <div style="margin-top: 1rem; text-align: center;">
            <button
              class="btn btn-primary"
              @click="sendIngredients"
              :disabled="ingredients.length === 0 || isLoading"
            >
              🔍 Encontrar receitas
            </button>
          </div>
        </div>

        <!-- Input para conversa sobre a receita adaptada -->
        <div v-else-if="chatState === 'recipe_adapted'" class="input-group">
          <input
            v-model="userMessage"
            type="text"
            class="input-field"
            placeholder="Pergunta algo sobre a receita (detalhes, nutrição, substituições...)"
            @keyup.enter="sendQuestion"
          />
          <button class="btn btn-primary" @click="sendQuestion" :disabled="!userMessage.trim() || isLoading">
            Enviar
          </button>
        </div>

        <!-- Input geral para conversa -->
        <div v-else-if="chatState === 'general_chat'" class="input-group">
          <input
            v-model="userMessage"
            type="text"
            class="input-field"
            placeholder="Faz outra pergunta sobre a receita..."
            @keyup.enter="sendQuestion"
          />
          <button class="btn btn-primary" @click="sendQuestion" :disabled="!userMessage.trim() || isLoading">
            Enviar
          </button>
        </div>

        <!-- Botão para reiniciar -->
        <div v-if="chatState !== 'initial'" style="margin-top: 0.75rem; text-align: center;">
          <button class="btn btn-secondary" @click="resetChat">
            🔄 Nova conversa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, onMounted } from 'vue'
import apiService from './services/api.js'

export default {
  name: 'App',
  setup() {
    // Estado da aplicação
    const messages = ref([])
    const ingredients = ref([])
    const currentIngredient = ref('')
    const userMessage = ref('')
    const isLoading = ref(false)
    const loadingMessage = ref('')
    const chatState = ref('initial')
    const chatMessages = ref(null)

    // Estado para retry
    const lastAction = ref(null)
    const lastActionParams = ref(null)

    let messageId = 0

    // Adicionar mensagem ao chat
    const addMessage = (content, type = 'bot', data = {}) => {
      messages.value.push({
        id: ++messageId,
        content,
        type,
        timestamp: new Date(),
        ...data
      })
      scrollToBottom()
    }

    // Adicionar mensagem de erro com retry
    const addErrorMessage = (error, actionType, actionParams) => {
      const errorClass = getErrorClass(error.type)
      
      addMessage(error.message, 'bot', {
        error: true,
        errorType: error.type,
        retryable: error.retryable,
        actionType,
        actionParams,
        errorClass
      })
    }

    // Obter classe CSS baseada no tipo de erro
    const getErrorClass = (errorType) => {
      switch (errorType) {
        case 'connection_error':
        case 'network_error':
          return 'error-connection'
        case 'auth_error':
          return 'error-auth'
        case 'server_error':
          return 'error-server'
        case 'internal_error':
        default:
          return 'error-internal'
      }
    }

    // Scroll para o bottom
    const scrollToBottom = async () => {
      await nextTick()
      if (chatMessages.value) {
        chatMessages.value.scrollTop = chatMessages.value.scrollHeight
      }
    }

    // Formatar mensagem (converter quebras de linha em HTML)
    const formatMessage = (message) => {
      return message.replace(/\n/g, '<br>')
    }

    // Adicionar ingrediente
    const addIngredient = () => {
      const ingredient = currentIngredient.value.trim()
      if (ingredient && !ingredients.value.includes(ingredient)) {
        ingredients.value.push(ingredient)
        currentIngredient.value = ''
      }
    }

    // Remover ingrediente
    const removeIngredient = (index) => {
      ingredients.value.splice(index, 1)
    }

    // Enviar ingredientes
    const sendIngredients = async () => {
      if (ingredients.value.length === 0) return

      isLoading.value = true
      loadingMessage.value = 'A procurar receitas e adaptar para os teus ingredientes...'

      // Guardar ação para retry
      lastAction.value = 'sendIngredients'
      lastActionParams.value = { ingredients: [...ingredients.value] }

      // Adicionar mensagem do utilizador
      addMessage(`Ingredientes: ${ingredients.value.join(', ')}`, 'user')

      try {
        const response = await apiService.sendIngredients(ingredients.value)
        
        // Adicionar receita adaptada
        addMessage(response.message, 'bot', {
          type: response.type,
          hasNutrition: response.hasNutrition,
          canGetDetails: response.canGetDetails
        })

        // Mudar estado para conversa sobre receita adaptada
        chatState.value = 'recipe_adapted'
      } catch (error) {
        addErrorMessage(error, 'sendIngredients', { ingredients: [...ingredients.value] })
        console.error('Erro ao enviar ingredientes:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Selecionar receita clicando no card
    const selectRecipe = async (recipeIndex) => {
      await sendChoice(recipeIndex.toString())
    }

    // Enviar pergunta sobre a receita adaptada
    const sendQuestion = async () => {
      const question = userMessage.value.trim()
      if (!question) return

      isLoading.value = true
      loadingMessage.value = 'A processar a tua pergunta...'

      // Guardar ação para retry
      lastAction.value = 'sendQuestion'
      lastActionParams.value = { question }

      // Adicionar mensagem do utilizador
      addMessage(question, 'user')
      userMessage.value = ''

      try {
        const response = await apiService.chooseRecipe(question)
        
        addMessage(response.message, 'bot', {
          type: response.type
        })

        // Mudar para chat geral após primeira pergunta
        if (chatState.value === 'recipe_adapted') {
          chatState.value = 'general_chat'
        }
      } catch (error) {
        addErrorMessage(error, 'sendQuestion', { question })
        console.error('Erro ao enviar pergunta:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Tentar novamente a última ação
    const retryLastAction = async (messageData) => {
      if (isLoading.value) return

      const actionType = messageData.actionType
      const actionParams = messageData.actionParams

      console.log('🔄 Tentando novamente:', actionType, actionParams)

      switch (actionType) {
        case 'sendIngredients':
          if (actionParams.ingredients) {
            // Restaurar ingredientes se necessário
            if (ingredients.value.length === 0) {
              ingredients.value = [...actionParams.ingredients]
            }
            await sendIngredients()
          }
          break
        case 'sendQuestion':
          if (actionParams.question) {
            userMessage.value = actionParams.question
            await sendQuestion()
          }
          break
        default:
          console.warn('Tipo de ação desconhecido para retry:', actionType)
      }
    }

    // Reiniciar chat
    const resetChat = async () => {
      try {
        await apiService.resetChat()
        
        // Limpar estado
        messages.value = []
        ingredients.value = []
        currentIngredient.value = ''
        userMessage.value = ''
        chatState.value = 'initial'
        lastAction.value = null
        lastActionParams.value = null

        // Mensagem de boas-vindas
        addMessage('Olá! 👋 Sou o teu chef virtual. Diz-me que ingredientes tens disponíveis e vou criar uma receita adaptada especialmente para ti!', 'bot')
      } catch (error) {
        console.error('Erro ao reiniciar chat:', error)
      }
    }

    // Verificar estado da sessão no início
    const checkSessionState = async () => {
      try {
        const state = await apiService.getSessionState()
        chatState.value = state.chatState || 'initial'
      } catch (error) {
        console.error('Erro ao verificar estado da sessão:', error)
      }
    }

    // Inicialização
    onMounted(async () => {
      await checkSessionState()
      
      // Mensagem de boas-vindas se não houver estado
      if (chatState.value === 'initial') {
        addMessage('Olá! 👋 Sou o teu chef virtual. Diz-me que ingredientes tens disponíveis e vou criar uma receita adaptada especialmente para ti!', 'bot')
      }
    })

    return {
      // Estado
      messages,
      ingredients,
      currentIngredient,
      userMessage,
      isLoading,
      loadingMessage,
      chatState,
      chatMessages,

      // Métodos
      addMessage,
      formatMessage,
      addIngredient,
      removeIngredient,
      sendIngredients,
      sendQuestion,
      resetChat,
      retryLastAction,
      getErrorClass
    }
  }
}
</script>
