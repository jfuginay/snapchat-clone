export type RootStackParamList = {
  // Auth Screens
  AuthScreen: undefined;
  
  // Main Tab Screens
  HomeScreen: undefined;
  MapScreen: undefined;
  CameraScreen: undefined;
  ChatListScreen: undefined;
  ProfileScreen: undefined;
  
  // Activity Screens
  ActivitiesScreen: undefined;
  Activities: undefined;
  
  // Chat Screens
  ChatScreen: {
    chatRoomId: string;
    otherUser: {
      id: string;
      username: string;
      display_name: string;
      avatar: string;
      is_online: boolean;
      last_active: string;
      distance?: number;
    } | null;
  };
  
  // User Screens
  UserSearch: undefined;
  
  // Settings Screens
  LocationSettings: undefined;
  HomeLocationSettings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Map: undefined;
  Camera: undefined;
  Chat: undefined;
  Profile: undefined;
}; 