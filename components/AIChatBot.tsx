import React, { useState, useRef, useEffect } from 'react';
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
  Share,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { 
  selectCurrentPlan, 
  selectCanSendMessage, 
  selectUsagePercentage,
  setUpgradePrompt,
  incrementUsage,
} from '../store/subscriptionSlice';
import { aiService } from '../services/AIService';
import TribeFindLogo from './TribeFindLogo';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  hasActivitySuggestion?: boolean;
  activityData?: any;
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
      text: `🌟 Greetings, ${userName}! I'm Engie, your wise AI companion on TribeFIND. "The unexamined life is not worth living" - Socrates. 

What brings you here today? Are you seeking new connections, activity ideas, or perhaps some philosophical guidance? I'm here to help you find your tribe! 🤔✨`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { user } = useSelector((state: RootState) => state.auth);
  const { currentLocation } = useSelector((state: RootState) => state.location);

  // Engie pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Check if this is an activity request
      const isActivityRequest = /bored|activity|activities|do|time|hours|hrs|suggestions|recommend|ideas|plans|what can|what should/i.test(inputText);

      const response = await aiService.generateResponse(inputText.trim(), {
        userName,
        userInterests,
        location: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        } : undefined,
        isActivityRequest,
        conversationHistory: messages.slice(-5).map(m => ({
          role: m.isUser ? 'user' as const : 'assistant' as const,
          content: m.text
        }))
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        hasActivitySuggestion: response.includes('Activity Plan') || response.includes('tribe members'),
        activityData: isActivityRequest ? { 
          originalRequest: inputText,
          responseType: 'activity_suggestion' 
        } : undefined,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Increment usage after successful message
      dispatch(incrementUsage());
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `🕯️ Hmm, I seem to be having some connection issues. As the Stoics teach: "The impediment to action advances action. What stands in the way becomes the way." 

Let's try again, or perhaps we could explore your interests offline for now? 💫`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const shareActivityPlan = async (message: Message) => {
    try {
      if (!message.activityData) return;

      const shareText = await aiService.generateSocialExport(
        message.text,
        [] // Would include actual participants from nearby users
      );

      await Share.share({
        message: shareText,
        title: 'TribeFIND Activity Plan'
      });
    } catch (error) {
      console.error('Error sharing activity plan:', error);
      Alert.alert('Sharing Error', 'Unable to share activity plan right now.');
    }
  };

  const exportToSocial = (message: Message, platform: 'facebook' | 'instagram' | 'twitter' | 'threads') => {
    Alert.alert(
      'Export to Social',
      `Export this activity plan to ${platform}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => shareActivityPlan(message)
        }
      ]
    );
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.engieHeader}>
        <View style={styles.engieContainer}>
          <View style={styles.engieAvatarContainer}>
            <Text style={styles.engieOnlineIndicator}></Text>
          </View>
          <View style={styles.engieInfo}>
            <Text style={styles.engieName}>Engie</Text>
            <Text style={styles.engieTitle}>Your personal discovery assistant</Text>
            <Text style={styles.engieStatus}>Online</Text>
          </View>
          <TouchableOpacity style={styles.engieStatsButton}>
            <Text style={styles.engieStatsText}>Stats</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View key={message.id} style={styles.messageWrapper}>
            <View
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              {!message.isUser && (
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>🧙‍♂️</Text>
                </View>
              )}
              
              <View style={styles.messageContent}>
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.aiMessageText,
                ]}>
                  {message.text}
                </Text>
                
                <Text style={[
                  styles.messageTime,
                  message.isUser ? styles.userMessageTime : styles.aiMessageTime,
                ]}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>

                {/* Activity Suggestion Actions */}
                {message.hasActivitySuggestion && !message.isUser && (
                  <View style={styles.activityActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => shareActivityPlan(message)}
                    >
                      <Text style={styles.actionButtonText}>📤 Share Plan</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.socialButton]}
                      onPress={() => exportToSocial(message, 'instagram')}
                    >
                      <Text style={styles.actionButtonText}>📱 Export</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.aiMessage}>
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>🧙‍♂️</Text>
              </View>
              <View style={styles.loadingDots}>
                <Text style={styles.loadingText}>Engie is thinking</Text>
                <View style={styles.dotsContainer}>
                  <Text style={styles.dots}>...</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.95)']}
          style={styles.inputGradient}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Engie anything... try 'I'm bored and have 2 hours'"
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <LinearGradient
                colors={inputText.trim() ? ['#6366f1', '#8b5cf6'] : ['#e2e8f0', '#cbd5e1']}
                style={styles.sendButtonGradient}
              >
                <Text style={styles.sendButtonText}>
                  {isLoading ? '⏳' : '🚀'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {/* Quick Actions */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickActions}
          >
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setInputText("I'm bored and have 2 hours")}
            >
              <Text style={styles.quickActionText}>⏰ I'm bored</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setInputText("Help me find people nearby")}
            >
              <Text style={styles.quickActionText}>👥 Find people</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setInputText("I need some wisdom today")}
            >
              <Text style={styles.quickActionText}>💭 Need wisdom</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setInputText("Activity suggestions for today")}
            >
              <Text style={styles.quickActionText}>🎯 Activity ideas</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  engieHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  engieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  engieAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  engieOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  engieInfo: {
    flex: 1,
  },
  engieName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  engieTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  engieStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  engieStatsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  engieStatsText: {
    fontSize: 18,
  },
  engieWisdom: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  wisdomText: {
    fontSize: 13,
    color: 'white',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  aiAvatarText: {
    fontSize: 16,
  },
  messageContent: {
    flex: 1,
    maxWidth: '85%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    alignSelf: 'flex-end',
  },
  aiMessageText: {
    color: '#1f2937',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userMessageTime: {
    color: '#64748b',
    alignSelf: 'flex-end',
    marginRight: 16,
  },
  aiMessageTime: {
    color: '#64748b',
    marginLeft: 16,
  },
  activityActions: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 16,
  },
  actionButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  socialButton: {
    backgroundColor: '#8b5cf6',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    marginBottom: 16,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#1f2937',
    marginRight: 8,
  },
  dotsContainer: {
    width: 30,
  },
  dots: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputGradient: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
  },
  quickActions: {
    flexDirection: 'row',
  },
  quickActionButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
});

export default AIChatBot; 