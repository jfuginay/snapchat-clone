import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAppSelector } from '../store';

interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'location';
  metadata?: any;
  created_at: string;
  sender?: {
    username: string;
    display_name: string;
    avatar: string;
  };
}

interface ChatUser {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  is_online: boolean;
  last_active: string;
}

type RootStackParamList = {
  ChatScreen: {
    chatRoomId?: string;
    otherUser?: ChatUser;
  };
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ChatScreenRouteProp>();
  const user = useAppSelector((state) => state.auth.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesSubscriptionRef = useRef<any>();
  const typingSubscriptionRef = useRef<any>();

  const { chatRoomId, otherUser } = route.params || {};

  // Load messages when screen mounts
  useEffect(() => {
    if (chatRoomId) {
      loadMessages();
      setupRealtimeSubscriptions();
    }

    return () => {
      cleanup();
    };
  }, [chatRoomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  /**
   * Load messages for current chat room
   */
  const loadMessages = async () => {
    if (!chatRoomId) return;

    try {
      setLoading(true);

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            username,
            display_name,
            avatar
          )
        `)
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading messages:', error);
        Alert.alert('Error', 'Failed to load messages.');
        return;
      }

      const formattedMessages = messagesData?.map(msg => ({
        ...msg,
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Setup real-time subscriptions
   */
  const setupRealtimeSubscriptions = () => {
    if (!chatRoomId || !user) return;

    // Messages subscription
    messagesSubscriptionRef.current = supabase
      .channel(`messages-${chatRoomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_room_id=eq.${chatRoomId}`,
      }, handleNewMessage)
      .subscribe();

    // Typing indicators subscription
    typingSubscriptionRef.current = supabase
      .channel(`typing-${chatRoomId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = typingSubscriptionRef.current.presenceState();
        const typingUsers = Object.keys(newState).filter(id => id !== user.id);
        setOtherUserTyping(typingUsers.length > 0);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== user.id) {
          setOtherUserTyping(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== user.id) {
          setOtherUserTyping(false);
        }
      })
      .subscribe();
  };

  /**
   * Handle new message from real-time subscription
   */
  const handleNewMessage = async (payload: any) => {
    const newMessage = payload.new;

    // Fetch sender details
    const { data: senderData } = await supabase
      .from('users')
      .select('username, display_name, avatar')
      .eq('id', newMessage.sender_id)
      .single();

    const messageWithSender = {
      ...newMessage,
      sender: senderData,
    };

    setMessages(prev => [...prev, messageWithSender]);
  };

  /**
   * Send a new message
   */
  const sendMessage = async () => {
    if (!messageText.trim() || !chatRoomId || !user || sending) return;

    const content = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_room_id: chatRoomId,
        sender_id: user.id,
        content,
        message_type: 'text',
        created_at: new Date().toISOString(),
        sender: {
          username: user.username,
          display_name: user.display_name,
          avatar: user.avatar,
        },
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // Send to database
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: user.id,
          content,
          message_type: 'text',
        });

      if (error) {
        console.error('Error sending message:', error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        Alert.alert('Error', 'Failed to send message.');
        setMessageText(content); // Restore message text
      } else {
        // Reload messages to show the new one
        loadMessages();
      }

      // Update chat room timestamp
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatRoomId);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message.');
      setMessageText(content); // Restore message text
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle typing indicator
   */
  const handleTyping = useCallback(() => {
    if (!chatRoomId || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator
      typingSubscriptionRef.current?.track({
        user_id: user.id,
        typing: true,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      typingSubscriptionRef.current?.untrack();
    }, 2000);
  }, [isTyping, chatRoomId, user]);

  /**
   * Cleanup subscriptions and timeouts
   */
  const cleanup = () => {
    if (messagesSubscriptionRef.current) {
      messagesSubscriptionRef.current.unsubscribe();
    }
    if (typingSubscriptionRef.current) {
      typingSubscriptionRef.current.unsubscribe();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  /**
   * Get time display for message
   */
  const getTimeDisplay = (timestamp: string): string => {
    const messageTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageTime.toLocaleDateString();
  };

  /**
   * Render individual message
   */
  const renderMessage = ({ item: message }: { item: Message }) => {
    const isMyMessage = message.sender_id === user?.id;
    const showSender = !isMyMessage && message.sender;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {showSender && (
          <View style={styles.senderInfo}>
            <Text style={styles.senderAvatar}>{message.sender?.avatar}</Text>
            <Text style={styles.senderName}>{message.sender?.display_name}</Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {getTimeDisplay(message.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render typing indicator
   */
  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      
      <View style={styles.headerInfo}>
        <Text style={styles.headerAvatar}>{otherUser?.avatar || '👤'}</Text>
        <View style={styles.headerText}>
          <Text style={styles.headerName}>{otherUser?.display_name || 'Unknown'}</Text>
          <Text style={styles.headerStatus}>
            {otherUser?.is_online ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.headerAction}>
        <Ionicons name="ellipsis-vertical" size={24} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {renderHeader()}
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={(text) => {
              setMessageText(text);
              handleTyping();
            }}
            multiline
            maxLength={1000}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 8,
  },
  senderAvatar: {
    fontSize: 16,
    marginRight: 6,
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});

export default ChatScreen; 