import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  selectCurrentPlan,
  selectUsagePercentage,
  selectCanSendMessage,
} from '../store/subscriptionSlice';

interface SubscriptionStatusBarProps {
  onUpgradePress?: () => void;
  showUsage?: boolean;
}

export const SubscriptionStatusBar: React.FC<SubscriptionStatusBarProps> = ({
  onUpgradePress,
  showUsage = true,
}) => {
  const currentPlan = useSelector(selectCurrentPlan);
  const usagePercentage = useSelector(selectUsagePercentage);
  const canSendMessage = useSelector(selectCanSendMessage);
  const subscription = useSelector((state: RootState) => state.subscription);

  const isNearLimit = usagePercentage > 80;
  const isAtLimit = !canSendMessage;

  // Don't show for premium users unless at limit
  if (currentPlan.id === 'premium' && !isAtLimit) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      isAtLimit ? styles.containerDanger : isNearLimit ? styles.containerWarning : null,
    ]}>
      <View style={styles.content}>
        <View style={styles.planInfo}>
          <Text style={[styles.planName, { color: currentPlan.color }]}>
            {currentPlan.name}
          </Text>
          {showUsage && currentPlan.limits.dailyAIMessages !== -1 && (
            <Text style={styles.usageText}>
              {subscription.usage.dailyMessages}/{currentPlan.limits.dailyAIMessages} AI messages today
            </Text>
          )}
        </View>

        {(isNearLimit || isAtLimit) && onUpgradePress && (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: currentPlan.color }]}
            onPress={onUpgradePress}
          >
            <Text style={styles.upgradeButtonText}>
              {isAtLimit ? 'Upgrade Now' : 'Upgrade'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showUsage && currentPlan.limits.dailyAIMessages !== -1 && (
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${usagePercentage}%`,
                backgroundColor: isAtLimit ? '#EF4444' : isNearLimit ? '#F59E0B' : currentPlan.color,
              }
            ]} 
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  containerWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  containerDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  usageText: {
    fontSize: 12,
    color: '#6B7280',
  },
  upgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default SubscriptionStatusBar; 