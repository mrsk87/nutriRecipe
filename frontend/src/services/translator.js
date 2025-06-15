// Serviço de tradução para ingredientes e receitas
class TranslatorService {
  constructor() {
    // Dicionário português -> inglês para ingredientes
    this.ingredientsToEnglish = {
      'tomate': 'tomato',
      'tomates': 'tomato',
      'frango': 'chicken',
      'galinha': 'chicken',
      'cebola': 'onion',
      'cebolas': 'onion',
      'alho': 'garlic',
      'batata': 'potato',
      'batatas': 'potato',
      'cenoura': 'carrot',
      'cenouras': 'carrot',
      'azeite': 'olive oil',
      'óleo': 'oil',
      'sal': 'salt',
      'pimenta': 'pepper',
      'ovo': 'egg',
      'ovos': 'egg',
      'queijo': 'cheese',
      'leite': 'milk',
      'farinha': 'flour',
      'açúcar': 'sugar',
      'manteiga': 'butter',
      'arroz': 'rice',
      'massa': 'pasta',
      'peixe': 'fish',
      'carne': 'meat',
      'porco': 'pork',
      'vaca': 'beef',
      'vitela': 'beef',
      'courgette': 'zucchini',
      'abobrinha': 'zucchini',
      'beringela': 'eggplant',
      'pimento': 'bell pepper',
      'cogumelos': 'mushrooms',
      'cogumelo': 'mushroom',
      'espinafres': 'spinach',
      'alface': 'lettuce',
      'pepino': 'cucumber',
      'brócolos': 'broccoli',
      'couve-flor': 'cauliflower',
      'feijão': 'beans',
      'lentilhas': 'lentils',
      'grão': 'chickpeas',
      'ervilhas': 'peas',
      'limão': 'lemon',
      'lima': 'lime',
      'laranja': 'orange',
      'maçã': 'apple',
      'banana': 'banana'
    };

    // Dicionário inglês -> português para títulos de receitas
    this.recipeTitlesToPortuguese = {
      // Termos comuns em receitas
      'chicken': 'frango',
      'tomato': 'tomate',
      'soup': 'sopa',
      'salad': 'salada',
      'pasta': 'massa',
      'rice': 'arroz',
      'potato': 'batata',
      'sauce': 'molho',
      'grilled': 'grelhado',
      'fried': 'frito',
      'baked': 'assado',
      'roasted': 'assado',
      'easy': 'fácil',
      'quick': 'rápido',
      'simple': 'simples',
      'classic': 'clássico',
      'homemade': 'caseiro',
      'fresh': 'fresco',
      'spicy': 'picante',
      'sweet': 'doce',
      'crispy': 'crocante',
      'creamy': 'cremoso',
      'with': 'com',
      'and': 'e',
      'salad': 'salada',
      'stew': 'guisado',
      'curry': 'caril',
      'pie': 'tarte',
      'bread': 'pão',
      'cake': 'bolo',
      'cookies': 'bolachas'
    };
  }

  // Traduzir ingredientes de português para inglês
  translateIngredients(portugueseIngredients) {
    return portugueseIngredients.map(ingredient => {
      let normalized = ingredient.toLowerCase().trim();
      
      // Remover quantidades comuns
      normalized = normalized.replace(/^\d+\s*(g|gr|gramas?|kg|quilos?)\s*/i, '');
      normalized = normalized.replace(/^\d+\s*(unidades?|un|c)\s*/i, '');
      normalized = normalized.replace(/^(meia?|meio)\s*/i, '');
      normalized = normalized.replace(/\s*(pequen[oa]|médi[oa]|grande)\s*$/i, '');
      
      const cleanIngredient = normalized.trim();
      
      // Traduzir se estiver em português
      const translated = this.ingredientsToEnglish[cleanIngredient] || cleanIngredient;
      
      console.log(`Traduzindo: "${ingredient}" -> "${cleanIngredient}" -> "${translated}"`);
      
      return translated;
    });
  }

  // Traduzir título de receita de inglês para português (parcial)
  translateRecipeTitle(englishTitle) {
    if (!englishTitle) return englishTitle;
    
    let translatedTitle = englishTitle.toLowerCase();
    
    // Aplicar traduções de termos comuns
    Object.entries(this.recipeTitlesToPortuguese).forEach(([english, portuguese]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedTitle = translatedTitle.replace(regex, portuguese);
    });
    
    // Capitalizar primeira letra de cada palavra
    translatedTitle = translatedTitle.replace(/\b\w/g, char => char.toUpperCase());
    
    console.log(`Traduzindo título: "${englishTitle}" -> "${translatedTitle}"`);
    
    return translatedTitle;
  }

  // Verificar se um ingrediente parece estar em português
  isPortuguese(ingredient) {
    const cleanIngredient = ingredient.toLowerCase().trim()
      .replace(/^\d+\s*(g|gr|gramas?|kg|quilos?)\s*/i, '')
      .replace(/^\d+\s*(unidades?|un|c)\s*/i, '')
      .replace(/^(meia?|meio)\s*/i, '')
      .replace(/\s*(pequen[oa]|médi[oa]|grande)\s*$/i, '')
      .trim();
    
    return this.ingredientsToEnglish.hasOwnProperty(cleanIngredient);
  }

  // Detectar idioma dos ingredientes
  detectLanguage(ingredients) {
    const portugueseCount = ingredients.filter(ing => this.isPortuguese(ing)).length;
    const total = ingredients.length;
    
    // Se mais de 50% dos ingredientes estão em português, considerar português
    return portugueseCount / total > 0.5 ? 'pt' : 'en';
  }
}

export default new TranslatorService();
