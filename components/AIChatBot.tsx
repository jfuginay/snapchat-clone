import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { 
  selectCurrentPlan, 
  selectCanSendMessage, 
  selectUsagePercentage,
  setUpgradePrompt,
  incrementUsage,
} from '../store/subscriptionSlice';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatBotProps {
  userName?: string;
  userInterests?: string[];
  onUpgradePress?: () => void;
}

export const AIChatBot: React.FC<AIChatBotProps> = ({ 
  userName = 'User',
  userInterests = [],
  onUpgradePress,
}) => {
  const dispatch = useDispatch();
  const currentPlan = useSelector(selectCurrentPlan);
  const canSendMessage = useSelector(selectCanSendMessage);
  const usagePercentage = useSelector(selectUsagePercentage);
  const subscription = useSelector((state: RootState) => state.subscription);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hey ${userName}! 👋 I'm your TribeFind AI assistant. I can help you find people with shared interests, suggest activities, or just chat about your hobbies!`,
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Free AI API options (replace with your chosen service)
  const callFreeAI = async (prompt: string): Promise<string> => {
    try {
      // Option 1: Local Ollama server
      const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2:3b', // Lightweight model for mobile
          prompt: `You are a helpful AI assistant for TribeFind, a social discovery app. User interests: ${userInterests.join(', ')}. ${prompt}`,
          stream: false,
        }),
      });
      
      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json();
        return data.response;
      }

      // Option 2: Fallback to Hugging Face Inference API (free tier)
      const hfResponse = await fetch(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        {
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            inputs: {
              past_user_inputs: messages.filter(m => m.isUser).slice(-3).map(m => m.text),
              generated_responses: messages.filter(m => !m.isUser).slice(-3).map(m => m.text),
              text: prompt,
            },
          }),
        }
      );

      if (hfResponse.ok) {
        const data = await hfResponse.json();
        return data.generated_text || "I'm here to help you connect with your tribe! 🌟";
      }

      // Option 3: Simple rule-based responses (always works)
      return generateRuleBasedResponse(prompt, userInterests);
      
    } catch (error) {
      console.error('AI API Error:', error);
      return generateRuleBasedResponse(prompt, userInterests);
    }
  };

  const generateRuleBasedResponse = (prompt: string, interests: string[]): string => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Interest-based responses
    if (lowerPrompt.includes('find') || lowerPrompt.includes('people')) {
      const randomInterest = interests[Math.floor(Math.random() * interests.length)];
      return `I can help you find people nearby who love ${randomInterest || 'similar things'}! Try checking the map view to see tribe members in your area. 📍`;
    }
    
    if (lowerPrompt.includes('activity') || lowerPrompt.includes('do')) {
      return `Based on your interests, I suggest checking out local events or starting a chat with someone who shares your hobbies! The camera feature is great for sharing moments too 📸`;
    }
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return `Hello! Welcome to TribeFind! I'm here to help you discover your tribe. What are you interested in exploring today? 🎉`;
    }
    
    // Default encouraging response
    const responses = [
      "That's interesting! TribeFind is all about connecting people with shared passions. Have you explored the map feature yet?",
      "I love helping people find their tribe! What interests would you like to explore with others?",
      "Great question! The best way to connect is through shared interests. What's your favorite hobby?",
      "TribeFind is perfect for that! Try using the camera to share your experiences or browse nearby tribe members.",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Check subscription limits before sending
    if (!canSendMessage) {
      Alert.alert(
        '🚀 Upgrade Your AI Assistant',
        `You've reached your daily limit of ${currentPlan.limits.dailyAIMessages} messages. Upgrade to get more AI power!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { 
            text: 'Upgrade Now', 
            onPress: () => {
              dispatch(setUpgradePrompt(true));
              // Navigate to subscription screen - you'll need to pass navigation prop
              // navigation.navigate('SubscriptionScreen', { upgradePrompt: true });
            }
          },
        ]
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const aiResponse = await callFreeAI(userMessage.text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Increment usage after successful message
      dispatch(incrementUsage());
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. But I'm still here to help you find your tribe! 🤖",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>🤖 TribeFind AI</Text>
            <Text style={styles.headerSubtitle}>Your personal discovery assistant</Text>
          </View>
          <View style={styles.planBadge}>
            <Text style={[styles.planBadgeText, { color: currentPlan.color }]}>
              {currentPlan.name}
            </Text>
          </View>
        </View>
        
        {/* Usage Indicator */}
        {currentPlan.limits.dailyAIMessages !== -1 && (
          <View style={styles.usageIndicator}>
            <Text style={styles.usageText}>
              Daily usage: {subscription.usage.dailyMessages}/{currentPlan.limits.dailyAIMessages}
            </Text>
            <View style={styles.usageBar}>
              <View 
                style={[
                  styles.usageProgress, 
                  { 
                    width: `${usagePercentage}%`,
                    backgroundColor: usagePercentage > 80 ? '#EF4444' : currentPlan.color,
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <Text style={[
              styles.messageText,
              message.isUser ? styles.userMessageText : styles.aiMessageText,
            ]}>
              {message.text}
            </Text>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        ))}
        
        {isLoading && (
          <View style={[styles.messageBubble, styles.aiMessage]}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything about finding your tribe..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#6366f1',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  usageIndicator: {
    marginTop: 8,
  },
  usageText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  usageBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 14,
    color: '#6366f1',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default AIChatBot; 