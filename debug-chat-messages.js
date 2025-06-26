// Debug script to check chat messages and participants
// Add this to your app temporarily to debug the issue

const debugChatMessages = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔍 DEBUG: Current user:', user?.id);
    
    // Check chat rooms
    const { data: chatRooms } = await supabase
      .from('chat_rooms')
      .select('*')
      .contains('participants', [user?.id]);
    
    console.log('🔍 DEBUG: Chat rooms:', chatRooms?.map(room => ({
      id: room.id,
      name: room.name,
      participants: room.participants,
      type: room.type
    })));
    
    // Check messages in each chat room
    for (const room of chatRooms || []) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*, sender:users!messages_sender_id_fkey(username, display_name)')
        .eq('chat_room_id', room.id)
        .order('created_at', { ascending: true });
      
      console.log(`🔍 DEBUG: Messages in room ${room.name}:`, messages?.map(msg => ({
        content: msg.content,
        sender_id: msg.sender_id,
        sender_name: msg.sender?.display_name
      })));
    }
  } catch (error) {
    console.error('Debug error:', error);
  }
};

// Call this function from your component
// debugChatMessages(); 