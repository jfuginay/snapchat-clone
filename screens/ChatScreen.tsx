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
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAppSelector } from '../store';
import type { RootStackParamList } from '../types/navigation';

type NavigationProps = NavigationProp<RootStackParamList>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

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

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
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

  useEffect(() => {
    if (chatRoomId) {
      loadMessages();
      setupRealtimeSubscriptions();
    }

    return () => {
      cleanup();
    };
  }, [chatRoomId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const loadMessages = async () => {
    if (!chatRoomId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`*, sender:users!messages_sender_id_fkey(username, display_name, avatar)`)
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      
      // Debug logging
      console.log('🔍 DEBUG: Current user ID:', user?.id);
      console.log('🔍 DEBUG: Chat room ID:', chatRoomId);
      console.log('🔍 DEBUG: Loaded messages:', data ? data.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        sender_name: msg.sender?.display_name
      })) : []);
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!chatRoomId || !user) return;

    messagesSubscriptionRef.current = supabase
      .channel(`messages-${chatRoomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_room_id=eq.${chatRoomId}` },
        handleNewMessage
      )
      .subscribe();

    typingSubscriptionRef.current = supabase
      .channel(`typing-${chatRoomId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = typingSubscriptionRef.current.presenceState();
        const typingUsers = Object.keys(newState).filter(id => id !== user.id);
        setOtherUserTyping(typingUsers.length > 0);
      })
      .subscribe();
  };

  const handleNewMessage = async (payload: any) => {
    if (!user) return; // Early return if no user
    
    const newMessage = payload.new;
    
    // Get sender data
    const { data: senderData } = await supabase
      .from('users')
      .select('username, display_name, avatar')
      .eq('id', newMessage.sender_id)
      .single();

    const messageWithSender = { ...newMessage, sender: senderData };

    setMessages(prev => {
      // If this message is from the current user, remove any optimistic messages
      // and replace with the real message from the database
      if (newMessage.sender_id === user.id) {
        // Remove any temporary messages with the same content
        const filteredMessages = prev.filter(msg => 
          !(msg.id.startsWith('temp-') && msg.content === newMessage.content && msg.sender_id === user.id)
        );
        
        // Check if this exact message already exists (prevent duplicates)
        const messageExists = filteredMessages.some(msg => msg.id === newMessage.id);
        if (messageExists) {
          return prev; // Don't add duplicate
        }
        
        return [...filteredMessages, messageWithSender];
      } else {
        // For messages from other users, just check for duplicates
        const messageExists = prev.some(msg => msg.id === newMessage.id);
        if (messageExists) {
          return prev; // Don't add duplicate
        }
        
        return [...prev, messageWithSender];
      }
    });
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !chatRoomId || !user || sending) return;
    const content = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}-${content.slice(0, 10)}`, // More unique ID
        chat_room_id: chatRoomId,
        sender_id: user.id,
        content,
        message_type: 'text',
        created_at: new Date().toISOString(),
        sender: { username: user.username, display_name: user.display_name, avatar: user.avatar },
      };
      
      // Add optimistic message immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // Send to database
      const { error } = await supabase
        .from('messages')
        .insert({ 
          chat_room_id: chatRoomId, 
          sender_id: user.id, 
          content 
        });

      if (error) {
        console.error('Error sending message:', error);
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        Alert.alert('Error', 'Failed to send message.');
        setMessageText(content);
      }
      // Note: On success, the real message will come through handleNewMessage
      // and will replace the optimistic message
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message.');
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  const cleanup = () => {
    if (messagesSubscriptionRef.current) messagesSubscriptionRef.current.unsubscribe();
    if (typingSubscriptionRef.current) typingSubscriptionRef.current.unsubscribe();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };
  
  const renderAvatar = (avatarValue: string | undefined, size: number) => {
    const isUrl = avatarValue?.startsWith('http');
    if (isUrl) {
      return <Image source={{ uri: avatarValue }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E5E7EB' }} />;
    }
    return <Text style={{ fontSize: size * 0.8, textAlign: 'center' }}>{avatarValue || '👤'}</Text>;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;
    
    // Debug logging
    console.log('🔍 DEBUG: Message:', {
      content: item.content,
      sender_id: item.sender_id,
      current_user_id: user?.id,
      isMyMessage,
      sender_name: item.sender?.display_name
    });
    
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {!isMyMessage && (
          <View style={styles.senderInfo}>
            {renderAvatar(item.sender?.avatar, 20)}
            <Text style={styles.senderName}>{item.sender?.display_name}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
          <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#1F2937" /></TouchableOpacity>
            <View style={styles.headerInfo}>
                {renderAvatar(otherUser?.avatar, 36)}
                <View>
                    <Text style={styles.headerName}>{otherUser?.display_name}</Text>
                    <Text style={styles.headerStatus}>{otherUser?.is_online ? 'Online' : 'Offline'}</Text>
                </View>
            </View>
        </View>
        
        {loading ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                style={styles.messagesList}
                contentContainerStyle={{ paddingVertical: 10 }}
            />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={!messageText.trim() || sending}>
            {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    backButton: { padding: 4, marginRight: 8 },
    headerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    headerName: { fontSize: 16, fontWeight: '600', marginLeft: 10 },
    headerStatus: { fontSize: 12, color: '#6B7280', marginLeft: 10 },
    messagesList: { flex: 1, paddingHorizontal: 10 },
    messageContainer: { marginVertical: 5, maxWidth: '80%' },
    myMessageContainer: { alignSelf: 'flex-end' },
    otherMessageContainer: { alignSelf: 'flex-start' },
    senderInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginLeft: 4 },
    senderName: { fontSize: 12, color: '#6B7280', marginLeft: 6 },
    messageBubble: { padding: 12, borderRadius: 18 },
    myMessageBubble: { backgroundColor: '#3B82F6', borderBottomRightRadius: 4 },
    otherMessageBubble: { backgroundColor: '#E5E7EB', borderBottomLeftRadius: 4 },
    myMessageText: { color: '#FFFFFF', fontSize: 16 },
    otherMessageText: { color: '#1F2937', fontSize: 16 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
    textInput: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, marginRight: 8 },
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
});

export default ChatScreen; 