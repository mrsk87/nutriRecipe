# 🍳 NutriRecipe - Chef Virtual

Um chatbot inteligente que sugere receitas baseadas nos ingredientes que tens disponíveis, com informações nutricionais completas.

## ✨ Funcionalidades

- 🥗 **Sugestões personalizadas**: Introduz os teus ingredientes e recebe 3 sugestões de receitas
- 🌐 **Tradução inteligente**: Aceita ingredientes em português e traduz automaticamente para inglês
- ⏱️ **Informação rápida**: Tempo de preparação e compatibilidade de ingredientes
- 📊 **Valores nutricionais**: Calorias, proteínas, hidratos, gorduras e mais
- 📱 **Design responsivo**: Funciona perfeitamente no telemóvel
- 🤖 **IA conversacional**: Chatbot inteligente powered by Google Gemma
- 🔄 **Sistema de retry**: Botões para tentar novamente em caso de erro
- ⚠️ **Tratamento de erros**: Diferentes tipos de erro com feedback específico
- 🎯 **Busca inteligente**: Filtragem por compatibilidade de ingredientes
- 📝 **Receitas traduzidas**: Títulos das receitas apresentados em português
- 🔄 **Sessões temporárias**: Sem registo, conversas não são guardadas

## 🛠️ Tecnologias

### Frontend
- **Vue.js 3** - Framework reativo
- **Vite** - Build tool moderno
- **CSS puro** - Design responsivo e moderno

### Backend
- **Node.js + Express** - Servidor API
- **Express-session** - Gestão de sessões
- **Axios** - Cliente HTTP

### APIs Externas
- **OpenRouter** - IA conversacional (Google Gemma 2 9B)
- **Spoonacular** - Base de dados de receitas e nutrição

## 🌟 Funcionalidades Avançadas

### 🌐 Sistema de Tradução
- **Entrada em português**: Aceita ingredientes como "frango", "arroz", "tomates"
- **Tradução automática**: Converte para inglês para pesquisa na API
- **Títulos traduzidos**: Receitas apresentadas em português
- **Dicionário integrado**: Mais de 20 ingredientes portugueses mapeados

### ⚠️ Tratamento de Erros Inteligente
- **Erros de conexão**: Problemas de rede com indicação visual
- **Erros de autenticação**: Problemas com API keys
- **Erros de servidor**: Serviços temporariamente indisponíveis
- **Botões de retry**: Tentativa automática sem perder contexto
- **Feedback visual**: Cores e ícones diferentes por tipo de erro

### 🎯 Busca Inteligente de Receitas
- **Compatibilidade por percentagem**: Filtra receitas com >50% de ingredientes disponíveis
- **Máximo 3 ingredientes em falta**: Evita receitas muito complexas
- **Busca permissiva**: Se nenhuma receita exata, mostra alternativas próximas
- **Scoring inteligente**: Ordena por compatibilidade de ingredientes

## 🚀 Como usar

### Pré-requisitos
- Node.js (v18 ou superior)
- Contas nas APIs:
  - [OpenRouter](https://openrouter.ai) (modelo gratuito)
  - [Spoonacular](https://spoonacular.com/food-api)

### Instalação

1. **Clona o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd nutriRecipe
   ```

2. **Configura as APIs**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edita o ficheiro `.env` com as tuas chaves:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   SPOONACULAR_API_KEY=your_spoonacular_api_key_here
   SESSION_SECRET=your_session_secret_here
   PORT=3000
   ```

3. **Instala dependências**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

4. **Inicia os servidores**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   # Servidor disponível em: http://localhost:3000
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   # Frontend disponível em: http://localhost:5173
   ```

5. **Acede à aplicação**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

## 📖 Como funciona

### Fluxo da aplicação

1. **Introdução de ingredientes**
   - O utilizador adiciona ingredientes (ex: "2 tomates", "300g frango")
   - Suporta quantidades por peso ou tamanho

2. **Sugestões de receitas**
   - API Spoonacular procura receitas compatíveis
   - IA OpenRouter gera resposta natural e entusiástica
   - Mostra 3 sugestões com tempo e ingredientes necessários

3. **Escolha da receita**
   - Utilizador clica numa receita ou escreve escolha
   - Sistema aceita números (1, 2, 3) ou texto ("a mais rápida")

4. **Informação nutricional**
   - Mostra valores por dose: calorias, proteínas, hidratos, etc.
   - IA apresenta informação de forma educativa

5. **Receita passo-a-passo**
   - Instruções detalhadas formatadas pela IA
   - Linguagem clara em português de Portugal

### Exemplo de uso

```
👤: Ingredientes: tomate, cebola, frango

🤖: Fantástico! Com esses ingredientes sugiro:
    1. Frango Grelhado com Tomate (25 min) - 85% compatível
    2. Refogado de Frango com Cebola (15 min) - 90% compatível
    3. Sopa de Frango e Legumes (30 min) - 75% compatível
    
    Qual preferes?

👤: 2

🤖: Perfeito! Refogado de Frango com Cebola (15 min):
    🔥 380 kcal | 🥩 28g proteína | 🍞 12g hidratos | 🥑 18g gordura
    
    [Botão: 📝 Ver receita passo-a-passo]
```

### Gestão de Erros

```
❌ Erro de conexão com os serviços de receitas.
   Verifica a tua conexão à internet.
   
   [🔄 Tentar novamente]
```

## 📁 Estrutura do projeto

```
nutriRecipe/
├── frontend/                 # Cliente Vue.js
│   ├── src/
│   │   ├── App.vue          # Componente principal com retry
│   │   ├── main.js          # Entry point
│   │   ├── services/
│   │   │   ├── api.js       # Cliente da API com error handling
│   │   │   └── translator.js # Serviço de tradução PT→EN
│   │   └── assets/css/
│   │       └── style.css    # Estilos + error styling
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Servidor Express
│   ├── src/
│   │   ├── app.js           # Servidor principal
│   │   ├── controllers/
│   │   │   └── chatController.js # Lógica + error handling
│   │   ├── services/
│   │   │   ├── openRouterService.js # Google Gemma integration
│   │   │   └── spoonacularService.js # Recipe filtering
│   │   └── routes/
│   │       └── chatRoutes.js
│   ├── .env                 # Configurações (não commitado)
│   └── package.json
├── test-frontend-retry.js   # Script de testes
├── IMPROVEMENTS.md          # Log de melhorias
└── README.md
```

## 🔧 API Endpoints

### Chat
- `POST /api/chat/ingredients` - Enviar ingredientes (com tradução)
- `POST /api/chat/choose-recipe` - Escolher receita específica
- `GET /api/chat/instructions` - Obter instruções passo-a-passo
- `POST /api/chat/reset` - Reiniciar conversa e sessão
- `GET /api/chat/session-state` - Estado da sessão atual

### Sistema
- `GET /api/health` - Health check do servidor

### Códigos de Erro
- `400` - Dados inválidos
- `503` - Serviços externos indisponíveis (retryable)
- `500` - Erro interno do servidor (retryable)

## 🎨 Design

- **Mobile-first**: Optimizado para dispositivos móveis
- **Gradientes modernos**: Interface visualmente apelativa
- **Cards interativos**: Receitas com hover effects e compatibilidade
- **Loading states**: Feedback visual durante carregamentos
- **Error handling**: Cores e ícones específicos por tipo de erro
- **Retry buttons**: Interface para tentar novamente sem perder contexto
- **Emojis contextuais**: Interface amigável e intuitiva
- **Responsive design**: Adapta-se a qualquer tamanho de ecrã

## 🚧 Próximas funcionalidades

- [ ] Modo offline com receitas em cache
- [ ] Filtros dietéticos avançados (vegetariano, sem glúten, low-carb)
- [ ] Histórico de receitas favoritas (localStorage)
- [ ] Partilha de receitas via URL
- [ ] Sugestões baseadas no que sobra no frigorífico
- [ ] Integração com lista de compras
- [ ] Modo escuro/claro
- [ ] Notificações push para lembrar de cozinhar
- [ ] Integração com calendário de refeições
- [ ] Suporte para mais idiomas (ES, FR, EN)

## 🤝 Contribuir

1. Fork o projeto
2. Cria uma branch para a tua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit as mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abre um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Vê o ficheiro [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimientos

- **Spoonacular** - Base de dados de receitas
- **OpenRouter** - Acesso a modelos de IA
- **DeepSeek** - Modelo de linguagem
- **Vue.js** - Framework frontend