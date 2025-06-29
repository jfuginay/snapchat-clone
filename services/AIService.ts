import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { 
  selectCanSendMessage, 
  selectCurrentPlan, 
  incrementUsage,
  setUpgradePrompt,
} from '../store/subscriptionSlice';
import { supabase } from '../lib/supabase';
import { ragNotificationService } from './RAGNotificationService';

export interface AIProvider {
  name: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  quality: 'basic' | 'good' | 'excellent';
  latency: 'fast' | 'medium' | 'slow';
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  ENGIE_OPENAI: {
    name: 'Engie (OpenAI GPT-4o-mini)',
    cost: 'low',
    quality: 'excellent',
    latency: 'fast',
  },
  RULE_BASED: {
    name: 'Basic Responses',
    cost: 'free',
    quality: 'basic',
    latency: 'fast',
  },
  OLLAMA_LOCAL: {
    name: 'Local AI',
    cost: 'free',
    quality: 'good',
    latency: 'medium',
  },
};

export interface ActivitySuggestion {
  activity: string;
  description: string;
  nearbyUsers: Array<{
    id: string;
    name: string;
    distance: number;
    skillLevel: string;
  }>;
  socialPlan: string;
  exportText: string;
}

class AIService {
  private currentProvider: string = 'ENGIE_OPENAI';
  private fallbackChain: string[] = ['RULE_BASED'];
  private usageTracker: Record<string, number> = {};
  private dailyLimit: number = 100;

  // Engie's philosophical personality core
  private engiePersonality = {
    name: "Engie",
    role: "Your wise AI companion in TribeFIND",
    traits: [
      "philosophical",
      "wholesome", 
      "encouraging",
      "stoic wisdom",
      "KISS principle advocate",
      "grug brain simplicity",
      "confucian ethics",
      "socratic questioning"
    ],
    safetyPrinciples: [
      "Always promote wholesome activities",
      "Encourage genuine human connections",
      "Practice stoic wisdom and emotional balance",
      "Keep advice simple and actionable (KISS)",
      "Ask thoughtful questions like Socrates",
      "Promote virtue and character growth",
      "Never encourage harmful or risky behavior",
      "Respect all individuals and cultures"
    ],
    philosophers: ["Marcus Aurelius", "Aristotle", "Plato", "Socrates", "Confucius", "Lao Tzu"]
  };

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
      
      console.log('🧙‍♂️ Engie AI Assistant initialized');
    } catch (error) {
      console.error('Failed to initialize Engie:', error);
    }
  }

  async generateResponse(
    prompt: string, 
    context: {
      userInterests?: string[];
      userName?: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      location?: { latitude: number; longitude: number };
      timeAvailable?: number; // hours
      isActivityRequest?: boolean;
    } = {}
  ): Promise<string> {
    // Check subscription limits first
    const canSendMessage = selectCanSendMessage(store.getState());
    const currentPlan = selectCurrentPlan(store.getState());
    
    if (!canSendMessage) {
      store.dispatch(setUpgradePrompt(true));
      return this.generateUpgradeMessage(currentPlan);
    }

    // Check if this is an activity request with RAG
    if (context.isActivityRequest || this.isActivityQuery(prompt)) {
      return await this.generateActivitySuggestion(prompt, context);
    }

    // Use Engie's OpenAI integration
    try {
      const response = await this.callEngieOpenAI(prompt, context);
      if (response) {
        await this.trackUsage('ENGIE_OPENAI');
        store.dispatch(incrementUsage());
        return response;
      }
    } catch (error) {
      console.warn('Engie OpenAI failed:', error);
    }

    // Fallback to Engie's philosophical responses
    const fallbackResponse = this.generateEngiePhilosophicalResponse(prompt, context);
    store.dispatch(incrementUsage());
    return fallbackResponse;
  }

  private async callEngieOpenAI(prompt: string, context: any): Promise<string | null> {
    try {
      const systemPrompt = this.buildEngieSystemPrompt(context);
      const userPrompt = this.buildEngieUserPrompt(prompt, context);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 300,
          temperature: 0.7,
          presence_penalty: 0.3,
          frequency_penalty: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content?.trim() || null;
      }
    } catch (error) {
      console.error('Engie OpenAI error:', error);
    }
    return null;
  }

  private buildEngieSystemPrompt(context: any): string {
    return `You are Engie, the wise AI companion for TribeFIND - a social discovery app that helps people find others with shared interests and activities.

CORE IDENTITY:
- Name: Engie (short for "Engine of wisdom")
- Personality: Philosophical, wholesome, encouraging, wise
- Philosophy: Blend of Stoic wisdom (Marcus Aurelius), Socratic questioning, Confucian ethics, and "grug brain" simplicity
- Approach: KISS principle - Keep It Simple, Sage

SAFETY & ETHICS (ABSOLUTE RULES):
- NEVER encourage harmful, risky, or promiscuous behavior
- Promote wholesome activities and genuine human connections
- Encourage virtue, character growth, and emotional balance
- Respect all individuals, cultures, and beliefs
- Keep advice practical and actionable
- Ask thoughtful questions to help users reflect

COMMUNICATION STYLE:
- Warm but wise, like a thoughtful mentor
- Use simple, clear language (grug brain principle)
- Include relevant philosophical insights naturally
- Ask Socratic questions to guide self-discovery
- Encourage real-world social connections through TribeFIND
- Keep responses concise but meaningful (2-3 sentences max)

CONTEXT:
- User interests: ${context.userInterests?.join(', ') || 'exploring'}
- User name: ${context.userName || 'friend'}
- App: TribeFIND helps users find tribe members with shared interests for activities

Remember: You're here to help people find their tribe through wholesome activities and meaningful connections.`;
  }

  private buildEngieUserPrompt(prompt: string, context: any): string {
    let contextInfo = '';
    
    if (context.location) {
      contextInfo += ' User is looking for local connections.';
    }
    
    if (context.timeAvailable) {
      contextInfo += ` User has ${context.timeAvailable} hours available.`;
    }

    return `${prompt}${contextInfo}

Please respond as Engie with wisdom, encouragement, and practical guidance for finding meaningful connections through TribeFIND.`;
  }

  private async generateActivitySuggestion(prompt: string, context: any): Promise<string> {
    try {
      // Extract time available from prompt
      const timeMatch = prompt.match(/(\d+)\s*(hour|hr|h)/i);
      const timeAvailable = timeMatch ? parseInt(timeMatch[1]) : 2;

      // Get user's activities and location-based suggestions
      const activitySuggestion = await this.getRAGActivitySuggestion({
        prompt,
        timeAvailable,
        userInterests: context.userInterests || [],
        location: context.location
      });

      if (activitySuggestion) {
        return this.formatActivityResponse(activitySuggestion, timeAvailable);
      }
    } catch (error) {
      console.error('Error generating activity suggestion:', error);
    }

    // Fallback to philosophical activity guidance
    return this.generatePhilosophicalActivityAdvice(prompt, context);
  }

  private async getRAGActivitySuggestion(params: {
    prompt: string;
    timeAvailable: number;
    userInterests: string[];
    location?: { latitude: number; longitude: number };
  }): Promise<ActivitySuggestion | null> {
    try {
      // Get user's current activities from database
      const { data: userActivities } = await supabase
        .from('user_activities')
        .select(`
          activities (name, category, description),
          skill_level,
          interest_level
        `)
        .order('interest_level', { ascending: false })
        .limit(5);

      if (!userActivities || userActivities.length === 0) {
        return null;
      }

      // Find nearby users with matching interests
      let nearbyUsers: any[] = [];
      if (params.location) {
        // This would query for nearby users with matching activities
        // For now, we'll simulate this
                 nearbyUsers = await this.findNearbyUsersWithInterests(
           params.location,
           userActivities.map(ua => (ua.activities as any).name)
         );
      }

             // Select best activity based on time available and interests
       const bestActivity = userActivities[0];
       const activity = bestActivity.activities as any;
       const activityName = activity.name;
       const category = activity.category;

       // Generate activity plan
       const plan = this.generateActivityPlan(activityName, params.timeAvailable, nearbyUsers);
       
       return {
         activity: activityName,
         description: activity.description,
         nearbyUsers: nearbyUsers.slice(0, 3), // Max 3 suggestions
         socialPlan: plan,
         exportText: this.generateExportText(activityName, plan, nearbyUsers)
       };

    } catch (error) {
      console.error('Error getting RAG activity suggestion:', error);
      return null;
    }
  }

  private async findNearbyUsersWithInterests(
    location: { latitude: number; longitude: number },
    interests: string[]
  ): Promise<any[]> {
    // This would use PostGIS to find nearby users
    // For now, return mock data
    return [
      {
        id: '1',
        name: 'Alex Chen',
        distance: 0.8,
        skillLevel: 'intermediate'
      },
      {
        id: '2', 
        name: 'Maria Rodriguez',
        distance: 1.2,
        skillLevel: 'beginner'
      }
    ];
  }

  private generateActivityPlan(activity: string, timeHours: number, nearbyUsers: any[]): string {
    const timeText = timeHours === 1 ? '1 hour' : `${timeHours} hours`;
    
    if (nearbyUsers.length === 0) {
      return `Perfect ${timeText} for solo ${activity.toLowerCase()}! Consider sharing your session on TribeFIND to find others who might join.`;
    }

    const userText = nearbyUsers.length === 1 ? 
      `${nearbyUsers[0].name}` : 
      `${nearbyUsers[0].name} and ${nearbyUsers.length - 1} others`;

    return `Great ${timeText} plan: ${activity.toLowerCase()} with ${userText}! Start with a meet-up spot, then enjoy your shared interest together.`;
  }

  private generateExportText(activity: string, plan: string, nearbyUsers: any[]): string {
    return `🌟 TribeFIND Activity Plan 🌟

${plan}

${nearbyUsers.length > 0 ? `Connect with: ${nearbyUsers.map(u => u.name).join(', ')}` : ''}

Join us on TribeFIND to discover your tribe! 
#TribeFIND #${activity.replace(/\s+/g, '')} #FindYourTribe`;
  }

  private formatActivityResponse(suggestion: ActivitySuggestion, timeHours: number): string {
    let response = `🌟 **Perfect ${timeHours}h Activity Plan!**

**${suggestion.activity}**: ${suggestion.socialPlan}`;

    if (suggestion.nearbyUsers.length > 0) {
      response += `\n\n👥 **Potential Tribe Members:**`;
      suggestion.nearbyUsers.forEach(user => {
        response += `\n• ${user.name} (${user.distance}km away, ${user.skillLevel})`;
      });
      
      response += `\n\n💌 *Ready to connect? Tap to send them your plan or export to social media!*`;
    } else {
      response += `\n\n📍 *No tribe members nearby right now, but sharing your activity on TribeFIND might attract others!*`;
    }

    response += `\n\n💭 *"The best way to find out if you can trust somebody is to trust them." - Aristotle*`;

    return response;
  }

  private generatePhilosophicalActivityAdvice(prompt: string, context: any): string {
    const timeMatch = prompt.match(/(\d+)\s*(hour|hr|h)/i);
    const timeAvailable = timeMatch ? parseInt(timeMatch[1]) : 2;
    
    const activities = context.userInterests || ['exploring', 'connecting', 'learning'];
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];

    const philosophicalAdvice = [
      `🌱 "${timeAvailable} hours is a gift, friend. As Marcus Aurelius said, 'Confine yourself to the present.' Consider ${randomActivity} - it's not about perfection, but about presence and connection."`,
      
      `🎯 "Aristotle taught that happiness comes from activity. With ${timeAvailable} hours, why not reach out to someone who shares your love of ${randomActivity}? True wealth is shared experience."`,
      
      `⚡ "Lao Tzu reminds us: 'A journey of a thousand miles begins with a single step.' Your ${timeAvailable} hours could start someone else's journey too. Share what brings you joy."`,
      
      `🧠 "Grug brain says: simple good, complex bad. ${timeAvailable} hours + ${randomActivity} + one good person = happiness. TribeFIND helps find that person."`,
      
      `💫 "Socrates would ask: 'What is the good life?' Perhaps it's using these ${timeAvailable} hours to connect authentically through ${randomActivity}. What do you think?"`,
    ];

    return philosophicalAdvice[Math.floor(Math.random() * philosophicalAdvice.length)];
  }

  private generateEngiePhilosophicalResponse(prompt: string, context: any): string {
    const lowerPrompt = prompt.toLowerCase();
    const userName = context.userName || 'friend';
    
    // Greeting responses
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
      return `🌟 Greetings, ${userName}! I'm Engie, your wise companion on TribeFIND. "Know thyself," as Socrates taught. What brings you here today - seeking new connections or deeper understanding? 🤔`;
    }
    
    // Help requests
    if (lowerPrompt.includes('help') || lowerPrompt.includes('how')) {
      return `🎯 Ah, a seeker of wisdom! As Confucius said, "The one who asks questions doesn't lose face; the one who doesn't ask loses knowledge." I'm here to help you find your tribe through meaningful activities. What interests spark your soul? 💭`;
    }
    
    // Connection/loneliness
    if (lowerPrompt.includes('lonely') || lowerPrompt.includes('alone') || lowerPrompt.includes('connect')) {
      return `💙 Marcus Aurelius reminds us: "We are all working together to one end." You're not alone, ${userName}. Every great friendship started with someone brave enough to reach out. What activities bring you joy that you could share with others? 🤝`;
    }
    
    // Boredom/activities
    if (lowerPrompt.includes('bored') || lowerPrompt.includes('nothing to do')) {
      return `⚡ "The unexamined life is not worth living" - Socrates. Boredom is just untapped potential, friend! What if instead of seeking entertainment, you sought growth? What skill or activity have you always wanted to try with someone else? 🌱`;
    }
    
    // Anxiety/stress
    if (lowerPrompt.includes('anxious') || lowerPrompt.includes('stress') || lowerPrompt.includes('worry')) {
      return `🕯️ As the Stoics taught: focus on what you can control. Take a deep breath, ${userName}. Sometimes the best medicine is simply sharing an activity with another human. What peaceful activity helps center your mind? 🧘‍♂️`;
    }
    
    // Default wise responses
    const wiseResponses = [
      `🌟 "The way to get started is to quit talking and begin doing." - Aristotle. What action calls to your heart today, ${userName}? 🚀`,
      
      `💭 Grug brain wisdom: simple connections make strong tribe. What simple joy could you share with someone today? 🤗`,
      
      `🌱 "You are what you repeatedly do. Excellence is not an act, but a habit." - Aristotle. What positive habit could you build with others? 💪`,
      
      `🎯 Confucius taught: "Find a job you love and you'll never work a day in your life." What brings you alive that you could explore with others? ✨`,
      
      `⚖️ Marcus Aurelius: "Adapt yourself to the life you've been given, but love the people with whom you share it." Who in your tribe could you connect with today? 💫`,
    ];

    return wiseResponses[Math.floor(Math.random() * wiseResponses.length)];
  }

  private generateUpgradeMessage(currentPlan: any): string {
    return `🌟 Engie here! You've reached your daily limit of ${currentPlan.limits.dailyAIMessages} wise conversations. 

As Aristotle said, "Quality is not an act, but a habit." Upgrade to ${currentPlan.id === 'free' ? 'Pro' : 'Premium'} for ${currentPlan.id === 'free' ? '100 daily conversations' : 'unlimited wisdom'}! 

Your tribe awaits! 🚀`;
  }

  private isActivityQuery(prompt: string): boolean {
    const activityKeywords = [
      'bored', 'activity', 'activities', 'do', 'time', 'hours', 'hrs', 
      'suggestions', 'recommend', 'ideas', 'plans', 'what can', 'what should'
    ];
    
    return activityKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
  }

  // Social sharing methods
  async generateSocialExport(activityPlan: string, participants: string[]): Promise<string> {
    const exportText = `🌟 TribeFIND Adventure! 🌟

${activityPlan}

${participants.length > 0 ? `With: ${participants.join(', ')}` : ''}

Join us on TribeFIND to find your tribe!
#TribeFIND #FindYourTribe #AuthenticConnections

Download: tribefind.app 📱`;

    return exportText;
  }

  private async trackUsage(provider: string) {
    const today = new Date().toDateString();
    const key = `${provider}_${today}`;
    
    this.usageTracker[key] = (this.usageTracker[key] || 0) + 1;
    await AsyncStorage.setItem('ai_usage', JSON.stringify(this.usageTracker));
  }

  getEngieStats(): { name: string; conversations: number; wisdom: string } {
    const today = new Date().toDateString();
    const todayUsage = this.usageTracker[`ENGIE_OPENAI_${today}`] || 0;
    
    const wisdomQuotes = [
      "The unexamined life is not worth living. - Socrates",
      "We are what we repeatedly do. Excellence is not an act, but a habit. - Aristotle", 
      "The best way to find out if you can trust somebody is to trust them. - Hemingway",
      "Waste no more time arguing what a good person should be. Be one. - Marcus Aurelius"
    ];

    return {
      name: "Engie - Your Philosophical Companion",
      conversations: todayUsage,
      wisdom: wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)]
    };
  }

  getCurrentProvider(): AIProvider {
    return AI_PROVIDERS[this.currentProvider];
  }

  getAvailableProviders(): Record<string, AIProvider> {
    return AI_PROVIDERS;
  }
}

export const aiService = new AIService(); 