import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface SubscriptionLimits {
  dailyAIMessages: number;
  monthlyAIMessages: number;
  aiProviders: string[];
  features: string[];
  responseQuality: 'basic' | 'enhanced' | 'premium';
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge?: string;
  color: string;
  limits: SubscriptionLimits;
  features: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: '#6B7280',
    limits: {
      dailyAIMessages: 10,
      monthlyAIMessages: 200,
      aiProviders: ['RULE_BASED'],
      features: ['basic_chat'],
      responseQuality: 'basic',
    },
    features: [
      '10 AI messages per day',
      'Basic rule-based responses',
      'TribeFind integration',
      'Interest-based suggestions',
    ],
  },
  pro: {
    id: 'pro',
    name: 'TribeFind Pro',
    price: '$4.99/month',
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    badge: 'Most Popular',
    color: '#8B5CF6',
    popular: true,
    limits: {
      dailyAIMessages: 100,
      monthlyAIMessages: 2500,
      aiProviders: ['HUGGINGFACE_FREE', 'RULE_BASED'],
      features: ['enhanced_chat', 'personality_responses', 'context_memory'],
      responseQuality: 'enhanced',
    },
    features: [
      '100 AI messages per day',
      'Enhanced AI responses',
      'Conversation memory',
      'Personality-based replies',
      'Priority support',
      'No ads in chat',
    ],
  },
  premium: {
    id: 'premium',
    name: 'TribeFind Premium',
    price: '$9.99/month',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    badge: 'Best Value',
    color: '#EF4444',
    limits: {
      dailyAIMessages: -1, // Unlimited
      monthlyAIMessages: -1, // Unlimited
      aiProviders: ['ENGIE_OPENAI', 'CLAUDE_HAIKU', 'OPENAI_GPT3', 'HUGGINGFACE_FREE', 'RULE_BASED'],
      features: ['premium_chat', 'unlimited_messages', 'advanced_ai', 'custom_personality'],
      responseQuality: 'premium',
    },
    features: [
      'Unlimited AI messages',
      'Premium AI models (OpenAI GPT-4o)',
      'Advanced conversation abilities',
      'Extended conversation memory',
      'Custom AI personality',
      'Priority features access',
      'Premium support',
      'Early access to new features',
    ],
  },
};

interface UsageStats {
  dailyMessages: number;
  monthlyMessages: number;
  lastResetDate: string;
  totalLifetimeMessages: number;
}

interface SubscriptionState {
  currentTier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
  usage: UsageStats;
  purchaseHistory: Array<{
    tier: SubscriptionTier;
    purchaseDate: string;
    transactionId: string;
    amount: number;
  }>;
  loading: boolean;
  showUpgradePrompt: boolean;
}

const initialUsageStats: UsageStats = {
  dailyMessages: 0,
  monthlyMessages: 0,
  lastResetDate: new Date().toDateString(),
  totalLifetimeMessages: 0,
};

const initialState: SubscriptionState = {
  currentTier: 'free',
  isActive: true,
  expiresAt: null,
  usage: initialUsageStats,
  purchaseHistory: [],
  loading: false,
  showUpgradePrompt: false,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionTier: (state, action: PayloadAction<{
      tier: SubscriptionTier;
      expiresAt?: string;
      transactionId?: string;
    }>) => {
      state.currentTier = action.payload.tier;
      state.isActive = true;
      state.expiresAt = action.payload.expiresAt || null;
      
      if (action.payload.transactionId) {
        state.purchaseHistory.push({
          tier: action.payload.tier,
          purchaseDate: new Date().toISOString(),
          transactionId: action.payload.transactionId,
          amount: SUBSCRIPTION_PLANS[action.payload.tier].monthlyPrice,
        });
      }
    },

    incrementUsage: (state) => {
      const today = new Date().toDateString();
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Reset daily counter if new day
      if (state.usage.lastResetDate !== today) {
        state.usage.dailyMessages = 0;
        state.usage.lastResetDate = today;
      }
      
      // Reset monthly counter if new month
      if (!state.usage.lastResetDate.startsWith(currentMonth)) {
        state.usage.monthlyMessages = 0;
      }
      
      state.usage.dailyMessages += 1;
      state.usage.monthlyMessages += 1;
      state.usage.totalLifetimeMessages += 1;
    },

    resetUsage: (state) => {
      state.usage = initialUsageStats;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setUpgradePrompt: (state, action: PayloadAction<boolean>) => {
      state.showUpgradePrompt = action.payload;
    },

    expireSubscription: (state) => {
      state.currentTier = 'free';
      state.isActive = false;
      state.expiresAt = null;
    },

    restoreSubscription: (state, action: PayloadAction<{
      tier: SubscriptionTier;
      expiresAt: string;
    }>) => {
      state.currentTier = action.payload.tier;
      state.isActive = true;
      state.expiresAt = action.payload.expiresAt;
    },
  },
});

export const {
  setSubscriptionTier,
  incrementUsage,
  resetUsage,
  setLoading,
  setUpgradePrompt,
  expireSubscription,
  restoreSubscription,
} = subscriptionSlice.actions;

// Selectors
export const selectCurrentPlan = (state: { subscription: SubscriptionState }) => 
  SUBSCRIPTION_PLANS[state.subscription.currentTier];

export const selectCanSendMessage = (state: { subscription: SubscriptionState }) => {
  const plan = SUBSCRIPTION_PLANS[state.subscription.currentTier];
  const usage = state.subscription.usage;
  
  // Unlimited for premium
  if (plan.limits.dailyAIMessages === -1) return true;
  
  // Check daily limit
  return usage.dailyMessages < plan.limits.dailyAIMessages;
};

export const selectUsagePercentage = (state: { subscription: SubscriptionState }) => {
  const plan = SUBSCRIPTION_PLANS[state.subscription.currentTier];
  const usage = state.subscription.usage;
  
  if (plan.limits.dailyAIMessages === -1) return 0; // Unlimited
  
  return Math.min((usage.dailyMessages / plan.limits.dailyAIMessages) * 100, 100);
};

// Async storage persistence
export const persistSubscriptionData = async (state: SubscriptionState) => {
  try {
    await AsyncStorage.setItem('subscription_data', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist subscription data:', error);
  }
};

export const loadSubscriptionData = async (): Promise<Partial<SubscriptionState> | null> => {
  try {
    const data = await AsyncStorage.getItem('subscription_data');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load subscription data:', error);
    return null;
  }
};

export default subscriptionSlice.reducer; 