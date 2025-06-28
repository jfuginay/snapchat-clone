import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSelector } from 'react-redux';
import { selectCurrentPlan } from '../store/subscriptionSlice';

interface SubscriptionUpgradeButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  compact?: boolean;
  text?: string;
}

export const SubscriptionUpgradeButton: React.FC<SubscriptionUpgradeButtonProps> = ({
  onPress,
  style,
  compact = false,
  text,
}) => {
  const currentPlan = useSelector(selectCurrentPlan);
  
  // Don't show for premium users
  if (currentPlan.id === 'premium') {
    return null;
  }

  const defaultText = currentPlan.id === 'free' ? '⭐ Upgrade to Pro' : '🚀 Go Premium';
  const buttonText = text || defaultText;

  return (
    <TouchableOpacity
      style={[
        compact ? styles.compactButton : styles.button,
        { backgroundColor: currentPlan.id === 'free' ? '#3B82F6' : '#8B5CF6' },
        style,
      ]}
      onPress={onPress}
    >
      <Text style={compact ? styles.compactButtonText : styles.buttonText}>
        {buttonText}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SubscriptionUpgradeButton; 