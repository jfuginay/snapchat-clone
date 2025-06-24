import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Message {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'location'
  metadata?: any
  created_at: string
  sender?: {
    username: string
    display_name: string
    avatar: string
  }
}

interface ChatRoom {
  id: string
  name: string
  type: 'direct' | 'group'
  participants: string[]
  last_message?: Message
  created_at: string
  updated_at: string
  unread_count: number
}

interface MessagingState {
  chatRooms: ChatRoom[]
  messages: { [chatRoomId: string]: Message[] }
  currentChatRoom: string | null
  loadingMessages: boolean
  loadingChatRooms: boolean
  totalUnreadCount: number
  typingUsers: { [chatRoomId: string]: string[] } // user IDs currently typing
}

const initialState: MessagingState = {
  chatRooms: [],
  messages: {},
  currentChatRoom: null,
  loadingMessages: false,
  loadingChatRooms: false,
  totalUnreadCount: 0,
  typingUsers: {},
}

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    setChatRooms: (state, action: PayloadAction<ChatRoom[]>) => {
      state.chatRooms = action.payload
      state.totalUnreadCount = action.payload.reduce((sum, room) => sum + room.unread_count, 0)
      state.loadingChatRooms = false
    },
    addChatRoom: (state, action: PayloadAction<ChatRoom>) => {
      const existingIndex = state.chatRooms.findIndex(room => room.id === action.payload.id)
      if (existingIndex >= 0) {
        state.chatRooms[existingIndex] = action.payload
      } else {
        state.chatRooms.push(action.payload)
      }
      state.totalUnreadCount = state.chatRooms.reduce((sum, room) => sum + room.unread_count, 0)
    },
    setMessages: (state, action: PayloadAction<{ chatRoomId: string; messages: Message[] }>) => {
      state.messages[action.payload.chatRoomId] = action.payload.messages
      state.loadingMessages = false
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const chatRoomId = action.payload.chat_room_id
      if (!state.messages[chatRoomId]) {
        state.messages[chatRoomId] = []
      }
      
      // Check if message already exists
      const existingMessage = state.messages[chatRoomId].find(m => m.id === action.payload.id)
      if (!existingMessage) {
        state.messages[chatRoomId].push(action.payload)
        // Sort by timestamp
        state.messages[chatRoomId].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        
        // Update chat room last message
        const chatRoom = state.chatRooms.find(room => room.id === chatRoomId)
        if (chatRoom) {
          chatRoom.last_message = action.payload
          chatRoom.updated_at = action.payload.created_at
          
          // Increment unread count if not current chat room
          if (state.currentChatRoom !== chatRoomId) {
            chatRoom.unread_count += 1
            state.totalUnreadCount += 1
          }
        }
      }
    },
    setCurrentChatRoom: (state, action: PayloadAction<string | null>) => {
      state.currentChatRoom = action.payload
      
      // Mark messages as read
      if (action.payload) {
        const chatRoom = state.chatRooms.find(room => room.id === action.payload)
        if (chatRoom && chatRoom.unread_count > 0) {
          state.totalUnreadCount -= chatRoom.unread_count
          chatRoom.unread_count = 0
        }
      }
    },
    setLoadingMessages: (state, action: PayloadAction<boolean>) => {
      state.loadingMessages = action.payload
    },
    setLoadingChatRooms: (state, action: PayloadAction<boolean>) => {
      state.loadingChatRooms = action.payload
    },
    setTypingUsers: (state, action: PayloadAction<{ chatRoomId: string; userIds: string[] }>) => {
      state.typingUsers[action.payload.chatRoomId] = action.payload.userIds
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      delete state.messages[action.payload]
    },
    markChatRoomAsRead: (state, action: PayloadAction<string>) => {
      const chatRoom = state.chatRooms.find(room => room.id === action.payload)
      if (chatRoom && chatRoom.unread_count > 0) {
        state.totalUnreadCount -= chatRoom.unread_count
        chatRoom.unread_count = 0
      }
    },
  },
})

export const {
  setChatRooms,
  addChatRoom,
  setMessages,
  addMessage,
  setCurrentChatRoom,
  setLoadingMessages,
  setLoadingChatRooms,
  setTypingUsers,
  clearMessages,
  markChatRoomAsRead,
} = messagingSlice.actions

export default messagingSlice.reducer 