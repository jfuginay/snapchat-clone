import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  selectCurrentPlan,
  selectUsagePercentage,
  selectCanSendMessage,
} from '../store/subscriptionSlice';

interface SubscriptionUsageWidgetProps {
  onUpgradePress?: () => void;
  compact?: boolean;
}

export const SubscriptionUsageWidget: React.FC<SubscriptionUsageWidgetProps> = ({
  onUpgradePress,
  compact = false,
}) => {
  const currentPlan = useSelector(selectCurrentPlan);
  const usagePercentage = useSelector(selectUsagePercentage);
  const canSendMessage = useSelector(selectCanSendMessage);
  const subscription = useSelector((state: RootState) => state.subscription);

  if (currentPlan.limits.dailyAIMessages === -1) {
    // Premium users don't need usage widget
    return null;
  }

  const isNearLimit = usagePercentage > 80;
  const isAtLimit = !canSendMessage;

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactWidget,
          isAtLimit && styles.compactWidgetDanger,
        ]}
        onPress={onUpgradePress}
      >
        <View style={styles.compactContent}>
          <Text style={[
            styles.compactText,
            isAtLimit && styles.compactTextDanger,
          ]}>
            {subscription.usage.dailyMessages}/{currentPlan.limits.dailyAIMessages} AI messages
          </Text>
          {isAtLimit && (
            <Text style={styles.upgradeText}>Tap to upgrade</Text>
          )}
        </View>
        <View style={styles.compactUsageBar}>
          <View 
            style={[
              styles.compactUsageProgress, 
              { 
                width: `${usagePercentage}%`,
                backgroundColor: isAtLimit ? '#EF4444' : isNearLimit ? '#F59E0B' : currentPlan.color,
              }
            ]} 
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={
          isAtLimit 
            ? ['#FEE2E2', '#FECACA'] 
            : isNearLimit 
            ? ['#FEF3C7', '#FDE68A']
            : [currentPlan.color + '10', currentPlan.color + '05']
        }
        style={styles.widgetGradient}
      >
        <View style={styles.widgetHeader}>
          <View>
            <Text style={[styles.planName, { color: currentPlan.color }]}>
              {currentPlan.name}
            </Text>
            <Text style={styles.usageText}>
              {subscription.usage.dailyMessages} of {currentPlan.limits.dailyAIMessages} messages used today
            </Text>
          </View>
          
          {(isNearLimit || isAtLimit) && onUpgradePress && (
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: currentPlan.color }]}
              onPress={onUpgradePress}
            >
              <Text style={styles.upgradeButtonText}>
                {isAtLimit ? 'Upgrade' : 'Pro'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.usageBarContainer}>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageProgress, 
                { 
                  width: `${usagePercentage}%`,
                  backgroundColor: isAtLimit ? '#EF4444' : isNearLimit ? '#F59E0B' : currentPlan.color,
                }
              ]} 
            />
          </View>
          <Text style={styles.percentageText}>{Math.round(usagePercentage)}%</Text>
        </View>

        {isAtLimit && (
          <View style={styles.limitReachedBanner}>
            <Text style={styles.limitReachedText}>
              🚀 Daily limit reached! Upgrade for unlimited AI messages.
            </Text>
          </View>
        )}
        
        {isNearLimit && !isAtLimit && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚡ You're almost at your daily limit. Consider upgrading!
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  widget: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  widgetGradient: {
    padding: 16,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  usageText: {
    fontSize: 14,
    color: '#6B7280',
  },
  upgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  usageBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usageBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 35,
    textAlign: 'right',
  },
  limitReachedBanner: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  limitReachedText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  warningBanner: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  // Compact widget styles
  compactWidget: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactWidgetDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  compactContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  compactTextDanger: {
    color: '#DC2626',
  },
  upgradeText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  compactUsageBar: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactUsageProgress: {
    height: '100%',
    borderRadius: 2,
  },
});

export default SubscriptionUsageWidget; 