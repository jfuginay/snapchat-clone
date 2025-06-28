import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { 
  selectCanSendMessage, 
  selectCurrentPlan, 
  incrementUsage,
  setUpgradePrompt,
} from '../store/subscriptionSlice';

export interface AIProvider {
  name: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  quality: 'basic' | 'good' | 'excellent';
  latency: 'fast' | 'medium' | 'slow';
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  RULE_BASED: {
    name: 'Rule-based Responses',
    cost: 'free',
    quality: 'basic',
    latency: 'fast',
  },
  OLLAMA_LOCAL: {
    name: 'Ollama (Local)',
    cost: 'free',
    quality: 'good',
    latency: 'medium',
  },
  HUGGINGFACE_FREE: {
    name: 'Hugging Face (Free)',
    cost: 'free',
    quality: 'good',
    latency: 'slow',
  },
  OPENAI_GPT3: {
    name: 'OpenAI GPT-3.5',
    cost: 'low',
    quality: 'excellent',
    latency: 'fast',
  },
  CLAUDE_HAIKU: {
    name: 'Claude 3.5 Haiku',
    cost: 'medium',
    quality: 'excellent',
    latency: 'fast',
  },
};

class AIService {
  private currentProvider: string = 'RULE_BASED';
  private fallbackChain: string[] = ['OLLAMA_LOCAL', 'HUGGINGFACE_FREE', 'RULE_BASED'];
  private usageTracker: Record<string, number> = {};
  private dailyLimit: number = 100; // Free tier daily limit

  async initialize() {
    try {
      const savedProvider = await AsyncStorage.getItem('ai_provider');
      const savedUsage = await AsyncStorage.getItem('ai_usage');
      
      if (savedProvider && AI_PROVIDERS[savedProvider]) {
        this.currentProvider = savedProvider;
      }
      
      if (savedUsage) {
        this.usageTracker = JSON.parse(savedUsage);
      }
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
  }

  async setProvider(provider: string) {
    if (AI_PROVIDERS[provider]) {
      this.currentProvider = provider;
      await AsyncStorage.setItem('ai_provider', provider);
    }
  }

  private async trackUsage(provider: string) {
    const today = new Date().toDateString();
    const key = `${provider}_${today}`;
    
    this.usageTracker[key] = (this.usageTracker[key] || 0) + 1;
    await AsyncStorage.setItem('ai_usage', JSON.stringify(this.usageTracker));
  }

  private hasReachedDailyLimit(provider: string): boolean {
    const today = new Date().toDateString();
    const key = `${provider}_${today}`;
    return (this.usageTracker[key] || 0) >= this.dailyLimit;
  }

  async generateResponse(
    prompt: string, 
    context: {
      userInterests?: string[];
      userName?: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    } = {}
  ): Promise<string> {
    // Check subscription limits first
    const canSendMessage = selectCanSendMessage(store.getState());
    const currentPlan = selectCurrentPlan(store.getState());
    
    if (!canSendMessage) {
      // User has reached their daily limit
      store.dispatch(setUpgradePrompt(true));
      return `You've reached your daily limit of ${currentPlan.limits.dailyAIMessages} AI messages. Upgrade to ${currentPlan.id === 'free' ? 'Pro' : 'Premium'} for ${currentPlan.id === 'free' ? '100 daily messages' : 'unlimited messages'}! 🚀`;
    }

    // Filter providers based on subscription tier
    const allowedProviders = [this.currentProvider, ...this.fallbackChain].filter(provider => 
      currentPlan.limits.aiProviders.includes(provider)
    );

    // Try each allowed provider
    for (const provider of allowedProviders) {
      if (this.hasReachedDailyLimit(provider) && AI_PROVIDERS[provider].cost === 'free') {
        continue; // Skip if daily limit reached for free providers
      }

      try {
        const response = await this.callProvider(provider, prompt, context);
        if (response) {
          await this.trackUsage(provider);
          // Increment subscription usage counter
          store.dispatch(incrementUsage());
          return response;
        }
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error);
        continue; // Try next provider
      }
    }

    // Fallback to rule-based if all else fails
    const fallbackResponse = this.generateRuleBasedResponse(prompt, context.userInterests || []);
    store.dispatch(incrementUsage());
    return fallbackResponse;
  }

  private async callProvider(
    provider: string,
    prompt: string,
    context: any
  ): Promise<string | null> {
    switch (provider) {
      case 'OLLAMA_LOCAL':
        return this.callOllama(prompt, context);
      
      case 'HUGGINGFACE_FREE':
        return this.callHuggingFace(prompt, context);
      
      case 'OPENAI_GPT3':
        return this.callOpenAI(prompt, context);
      
      case 'CLAUDE_HAIKU':
        return this.callClaudeHaiku(prompt, context);
      
      case 'RULE_BASED':
        return this.generateRuleBasedResponse(prompt, context.userInterests || []);
      
      default:
        return null;
    }
  }

  private async callOllama(prompt: string, context: any): Promise<string | null> {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2:3b',
          prompt: this.buildContextualPrompt(prompt, context),
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 150, // Keep responses concise
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.response?.trim() || null;
      }
    } catch (error) {
      console.error('Ollama error:', error);
    }
    return null;
  }

  private async callHuggingFace(prompt: string, context: any): Promise<string | null> {
    try {
      // Using free inference API - limited but functional
      const response = await fetch(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        {
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            inputs: this.buildContextualPrompt(prompt, context),
            parameters: {
              max_length: 100,
              temperature: 0.7,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data[0]?.generated_text?.trim() || null;
      }
    } catch (error) {
      console.error('Hugging Face error:', error);
    }
    return null;
  }

  private async callOpenAI(prompt: string, context: any): Promise<string | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for TribeFind, a social discovery app. Keep responses concise and encouraging.',
            },
            {
              role: 'user',
              content: this.buildContextualPrompt(prompt, context),
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content?.trim() || null;
      }
    } catch (error) {
      console.error('OpenAI error:', error);
    }
    return null;
  }

  private async callClaudeHaiku(prompt: string, context: any): Promise<string | null> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 150,
          messages: [
            {
              role: 'user',
              content: this.buildContextualPrompt(prompt, context),
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.content[0]?.text?.trim() || null;
      }
    } catch (error) {
      console.error('Claude error:', error);
    }
    return null;
  }

  private buildContextualPrompt(prompt: string, context: any): string {
    let contextualPrompt = `You are a helpful AI assistant for TribeFind, a social discovery app that helps people find others with shared interests.`;
    
    if (context.userInterests?.length > 0) {
      contextualPrompt += ` The user's interests include: ${context.userInterests.join(', ')}.`;
    }
    
    if (context.userName) {
      contextualPrompt += ` The user's name is ${context.userName}.`;
    }
    
    contextualPrompt += ` Keep your response concise (1-2 sentences), helpful, and encouraging. Focus on connecting people and shared interests.\n\nUser: ${prompt}`;
    
    return contextualPrompt;
  }

  private generateRuleBasedResponse(prompt: string, userInterests: string[]): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Interest-based responses
    if (lowerPrompt.includes('find') || lowerPrompt.includes('people') || lowerPrompt.includes('connect')) {
      if (userInterests.length > 0) {
        const randomInterest = userInterests[Math.floor(Math.random() * userInterests.length)];
        return `Great! I can help you find people who love ${randomInterest} nearby. Check the map view to discover your tribe! 📍`;
      }
      return `I'd love to help you find your tribe! What interests would you like to explore with others? 🌟`;
    }
    
    if (lowerPrompt.includes('activity') || lowerPrompt.includes('do') || lowerPrompt.includes('event')) {
      return `Try sharing a photo in camera mode or start a chat with someone who shares your hobbies! The best connections happen through shared experiences. 📸`;
    }
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
      return `Hey there! Welcome to TribeFind! 👋 I'm here to help you discover amazing people who share your passions. What brings you here today?`;
    }
    
    if (lowerPrompt.includes('help') || lowerPrompt.includes('how')) {
      return `I'm here to help! You can use the map to find nearby tribe members, share moments with the camera, or start conversations with people who share your interests. What would you like to explore? 🚀`;
    }
    
    // Default encouraging response
    const responses = [
      "That sounds interesting! TribeFind is perfect for connecting with people who share your passions. Have you checked the map lately? 🗺️",
      "I love helping people find their tribe! What interests would you like to explore with others today? ✨",
      "Great question! The best connections happen when you share what you're passionate about. Try the camera feature to show your world! 📱",
      "TribeFind is all about bringing people together through shared interests. What's your favorite way to connect with others? 💫",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getUsageStats(): Record<string, number> {
    return this.usageTracker;
  }

  getCurrentProvider(): AIProvider {
    return AI_PROVIDERS[this.currentProvider];
  }

  getAvailableProviders(): Record<string, AIProvider> {
    return AI_PROVIDERS;
  }
}

export const aiService = new AIService(); 