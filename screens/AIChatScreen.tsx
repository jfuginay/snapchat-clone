import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AIChatBot from '../components/AIChatBot';
import { aiService } from '../services/AIService';

export default function AIChatScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  useEffect(() => {
    // Initialize AI service when screen loads
    aiService.initialize();
  }, []);

  // Extract user interests from profile or default ones
  const userInterests = [
    'photography', 'hiking', 'music', 'technology', 'travel'
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <AIChatBot 
        userName={user?.display_name || user?.email?.split('@')[0] || 'Friend'}
        userInterests={userInterests}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
}); 