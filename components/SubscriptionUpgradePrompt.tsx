import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  SUBSCRIPTION_PLANS,
  selectCurrentPlan,
  setUpgradePrompt,
} from '../store/subscriptionSlice';

interface SubscriptionUpgradePromptProps {
  navigation?: any;
  feature?: string;
  onClose?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const SubscriptionUpgradePrompt: React.FC<SubscriptionUpgradePromptProps> = ({
  navigation,
  feature = 'AI chat',
  onClose,
}) => {
  const dispatch = useDispatch();
  const currentPlan = useSelector(selectCurrentPlan);
  const showUpgradePrompt = useSelector((state: RootState) => state.subscription.showUpgradePrompt);

  const handleClose = () => {
    dispatch(setUpgradePrompt(false));
    onClose?.();
  };

  const handleUpgrade = () => {
    dispatch(setUpgradePrompt(false));
    if (navigation) {
      navigation.navigate('SubscriptionScreen', { 
        upgradePrompt: true, 
        fromFeature: feature 
      });
    }
  };

  const nextTier = currentPlan.id === 'free' ? 'pro' : 'premium';
  const nextPlan = SUBSCRIPTION_PLANS[nextTier];

  return (
    <Modal
      visible={showUpgradePrompt}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#a855f7']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.emoji}>🚀</Text>
            <Text style={styles.title}>Upgrade Your Experience</Text>
            <Text style={styles.subtitle}>
              You've reached your {feature} limit
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.currentLimits}>
            <Text style={styles.sectionTitle}>Current Plan: {currentPlan.name}</Text>
            <View style={styles.limitItem}>
              <Text style={styles.limitIcon}>💬</Text>
              <Text style={styles.limitText}>
                {currentPlan.limits.dailyAIMessages === -1 
                  ? 'Unlimited' 
                  : currentPlan.limits.dailyAIMessages
                } daily AI messages
              </Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitIcon}>🤖</Text>
              <Text style={styles.limitText}>
                {currentPlan.limits.responseQuality} AI responses
              </Text>
            </View>
          </View>

          <View style={styles.upgradeSection}>
            <Text style={styles.sectionTitle}>Upgrade to {nextPlan.name}</Text>
            <View style={styles.upgradeCard}>
              <LinearGradient
                colors={[nextPlan.color + '20', nextPlan.color + '10']}
                style={styles.upgradeGradient}
              >
                <View style={styles.upgradeHeader}>
                  <Text style={[styles.upgradeName, { color: nextPlan.color }]}>
                    {nextPlan.name}
                  </Text>
                  <Text style={styles.upgradePrice}>{nextPlan.price}</Text>
                </View>
                
                <View style={styles.upgradeFeatures}>
                  {nextPlan.features.slice(0, 3).map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Text style={styles.checkmark}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.comparisonTable}>
            <Text style={styles.sectionTitle}>Quick Comparison</Text>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Daily AI Messages</Text>
              <Text style={styles.currentValue}>
                {currentPlan.limits.dailyAIMessages === -1 ? '∞' : currentPlan.limits.dailyAIMessages}
              </Text>
              <Text style={[styles.upgradeValue, { color: nextPlan.color }]}>
                {nextPlan.limits.dailyAIMessages === -1 ? '∞' : nextPlan.limits.dailyAIMessages}
              </Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>AI Quality</Text>
              <Text style={styles.currentValue}>{currentPlan.limits.responseQuality}</Text>
              <Text style={[styles.upgradeValue, { color: nextPlan.color }]}>
                {nextPlan.limits.responseQuality}
              </Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Premium Features</Text>
              <Text style={styles.currentValue}>Basic</Text>
              <Text style={[styles.upgradeValue, { color: nextPlan.color }]}>
                All Included
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.laterButton} onPress={handleClose}>
            <Text style={styles.laterButtonText}>Maybe Later</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: nextPlan.color }]}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeButtonText}>
              Upgrade to {nextPlan.name}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  currentLimits: {
    marginBottom: 32,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  limitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  limitText: {
    fontSize: 16,
    color: '#6B7280',
  },
  upgradeSection: {
    marginBottom: 32,
  },
  upgradeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    padding: 20,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  upgradePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  upgradeFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#10B981',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  comparisonTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  comparisonLabel: {
    flex: 2,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  currentValue: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  upgradeValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  laterButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  upgradeButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default SubscriptionUpgradePrompt; 