import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  SUBSCRIPTION_PLANS,
  SubscriptionTier,
  setSubscriptionTier,
  setLoading,
  selectCurrentPlan,
  selectUsagePercentage,
} from '../store/subscriptionSlice';
import { InAppPurchaseService } from '../services/InAppPurchaseService';

interface SubscriptionScreenProps {
  navigation: any;
  route?: {
    params?: {
      upgradePrompt?: boolean;
      fromFeature?: string;
    };
  };
}

export default function SubscriptionScreen({ navigation, route }: SubscriptionScreenProps) {
  const dispatch = useDispatch();
  const currentPlan = useSelector(selectCurrentPlan);
  const usagePercentage = useSelector(selectUsagePercentage);
  const subscription = useSelector((state: RootState) => state.subscription);
  
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(currentPlan.id);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [purchaseService] = useState(new InAppPurchaseService());

  const upgradePrompt = route?.params?.upgradePrompt;
  const fromFeature = route?.params?.fromFeature;

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      await purchaseService.initialize();
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
    }
  };

  const handlePurchase = async (tier: SubscriptionTier) => {
    if (tier === 'free') {
      // Handle free tier selection
      dispatch(setSubscriptionTier({ tier: 'free' }));
      navigation.goBack();
      return;
    }

    dispatch(setLoading(true));

    try {
      const productId = `tribefind_${tier}_${billingPeriod}`;
      const result = await purchaseService.purchaseSubscription(productId);
      
      if (result.success) {
        dispatch(setSubscriptionTier({
          tier,
          expiresAt: result.expiresAt,
          transactionId: result.transactionId,
        }));

        Alert.alert(
          '🎉 Subscription Activated!',
          `Welcome to ${SUBSCRIPTION_PLANS[tier].name}! Your AI assistant is now more powerful.`,
          [
            {
              text: 'Start Chatting',
              onPress: () => navigation.navigate('AIChatScreen'),
            },
          ]
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Error', 'Unable to complete purchase. Please try again.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRestorePurchases = async () => {
    dispatch(setLoading(true));
    try {
      const restoredPurchases = await purchaseService.restorePurchases();
      if (restoredPurchases.length > 0) {
        Alert.alert('Purchases Restored', 'Your previous subscriptions have been restored.');
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Unable to restore purchases.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const renderPlanCard = (tier: SubscriptionTier) => {
    const plan = SUBSCRIPTION_PLANS[tier];
    const isSelected = selectedTier === tier;
    const isCurrent = currentPlan.id === tier;
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    const priceText = billingPeriod === 'monthly' ? plan.price : `$${plan.yearlyPrice}/year`;

    return (
      <TouchableOpacity
        key={tier}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          isCurrent && styles.currentPlan,
        ]}
        onPress={() => setSelectedTier(tier)}
      >
        <LinearGradient
          colors={
            isSelected || isCurrent
              ? [plan.color + '20', plan.color + '10']
              : ['#FFFFFF', '#F9FAFB']
          }
          style={styles.planGradient}
        >
          {plan.badge && (
            <View style={[styles.badge, { backgroundColor: plan.color }]}>
              <Text style={styles.badgeText}>{plan.badge}</Text>
            </View>
          )}

          {isCurrent && (
            <View style={[styles.badge, styles.currentBadge]}>
              <Text style={styles.badgeText}>Current Plan</Text>
            </View>
          )}

          <View style={styles.planHeader}>
            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
            <Text style={styles.planPrice}>{priceText}</Text>
            {billingPeriod === 'yearly' && tier !== 'free' && (
              <Text style={styles.savings}>Save ${((plan.monthlyPrice * 12) - plan.yearlyPrice).toFixed(0)}/year</Text>
            )}
          </View>

          <View style={styles.featuresList}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {isCurrent && tier !== 'free' && (
            <View style={styles.usageIndicator}>
              <Text style={styles.usageText}>
                Daily Usage: {subscription.usage.dailyMessages}/{plan.limits.dailyAIMessages === -1 ? '∞' : plan.limits.dailyAIMessages}
              </Text>
              {plan.limits.dailyAIMessages !== -1 && (
                <View style={styles.usageBar}>
                  <View 
                    style={[
                      styles.usageProgress, 
                      { 
                        width: `${usagePercentage}%`,
                        backgroundColor: usagePercentage > 80 ? '#EF4444' : plan.color,
                      }
                    ]} 
                  />
                </View>
              )}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {upgradePrompt ? '🚀 Upgrade Your AI' : '🤖 AI Assistant Plans'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {upgradePrompt 
              ? `You've reached your daily limit. Upgrade for more AI power!`
              : 'Choose the perfect plan for your tribe discovery needs'
            }
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Billing Period Toggle */}
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[styles.billingOption, billingPeriod === 'monthly' && styles.activeBilling]}
            onPress={() => setBillingPeriod('monthly')}
          >
            <Text style={[styles.billingText, billingPeriod === 'monthly' && styles.activeBillingText]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingOption, billingPeriod === 'yearly' && styles.activeBilling]}
            onPress={() => setBillingPeriod('yearly')}
          >
            <Text style={[styles.billingText, billingPeriod === 'yearly' && styles.activeBillingText]}>
              Yearly
            </Text>
            <Text style={styles.discountText}>Save 20%</Text>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionTier[]).map(renderPlanCard)}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {selectedTier !== currentPlan.id && (
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: SUBSCRIPTION_PLANS[selectedTier].color }]}
              onPress={() => handlePurchase(selectedTier)}
              disabled={subscription.loading}
            >
              {subscription.loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.selectButtonText}>
                  {selectedTier === 'free' ? 'Switch to Free' : `Upgrade to ${SUBSCRIPTION_PLANS[selectedTier].name}`}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>

        {/* Features Comparison */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>Why upgrade your AI assistant?</Text>
          
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonFeature}>🧠 Advanced AI Models</Text>
            <Text style={styles.comparisonDescription}>
              Access Claude and GPT for more intelligent, contextual responses
            </Text>
          </View>
          
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonFeature}>💬 Unlimited Conversations</Text>
            <Text style={styles.comparisonDescription}>
              Chat as much as you want without daily limits
            </Text>
          </View>
          
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonFeature}>🎯 Personalized Suggestions</Text>
            <Text style={styles.comparisonDescription}>
              Get better recommendations for finding your tribe
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Subscriptions auto-renew unless cancelled. Cancel anytime in your App Store settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginVertical: 20,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeBilling: {
    backgroundColor: '#6366f1',
  },
  billingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeBillingText: {
    color: 'white',
  },
  discountText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlan: {
    borderColor: '#6366f1',
  },
  currentPlan: {
    borderColor: '#10B981',
  },
  planGradient: {
    padding: 20,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentBadge: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  savings: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  featuresList: {
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
  usageIndicator: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  usageText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  usageBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    borderRadius: 2,
  },
  actionButtons: {
    marginVertical: 24,
    gap: 12,
  },
  selectButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  comparisonSection: {
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  comparisonItem: {
    marginBottom: 16,
  },
  comparisonFeature: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  comparisonDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
}); 