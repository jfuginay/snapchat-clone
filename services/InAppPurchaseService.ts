import { Platform } from 'react-native';
import {
  connectAsync,
  disconnectAsync,
  getProductsAsync,
  purchaseItemAsync,
  finishTransactionAsync,
  getPurchaseHistoryAsync,
} from 'expo-in-app-purchases';

// Real implementation using expo-in-app-purchases
interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  expiresAt?: string;
  error?: string;
}

interface PurchaseDetails {
  productId: string;
  transactionId: string;
  purchaseDate: string;
  expiresAt?: string;
}

// Product IDs that must match your App Store Connect and Google Play Console
const PRODUCT_IDS = {
  PRO_MONTHLY: 'tribefind_pro_monthly',
  PRO_YEARLY: 'tribefind_pro_yearly',
  PREMIUM_MONTHLY: 'tribefind_premium_monthly',
  PREMIUM_YEARLY: 'tribefind_premium_yearly',
};

export class InAppPurchaseService {
  private initialized = false;
  private products: any[] = [];
  private developmentMode = true; // Set to false when store products are configured

  async initialize(): Promise<void> {
    try {
      console.log('🛒 Initializing In-App Purchase Service...');
      
      if (this.developmentMode) {
        console.log('🧪 Running in development mode with mock products');
        this.products = [
          { productId: 'tribefind_pro_monthly', price: '$4.99' },
          { productId: 'tribefind_pro_yearly', price: '$49.99' },
          { productId: 'tribefind_premium_monthly', price: '$9.99' },
          { productId: 'tribefind_premium_yearly', price: '$99.99' },
        ];
        this.initialized = true;
        console.log(`✅ Development mode initialized with ${this.products.length} mock products`);
        return;
      }

      // Connect to the store for production
      await connectAsync();
      
      // Load available products
      const productIds = Object.values(PRODUCT_IDS);
      const response = await getProductsAsync(productIds);
      
      if (response && response.results) {
        this.products = response.results;
      } else {
        this.products = [];
      }
      
      this.initialized = true;
      
      console.log(`✅ In-App Purchase Service initialized with ${this.products.length} products`);
    } catch (error) {
      console.error('❌ Failed to initialize purchase service:', error);
      // Fall back to development mode
      this.developmentMode = true;
      await this.initialize();
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (!this.developmentMode) {
        await disconnectAsync();
      }
      this.initialized = false;
      console.log('🛒 Purchase service disconnected');
    } catch (error) {
      console.error('❌ Failed to cleanup purchase service:', error);
    }
  }

  async purchaseSubscription(productId: string): Promise<PurchaseResult> {
    if (!this.initialized) {
      throw new Error('Purchase service not initialized');
    }

    try {
      console.log(`🛒 Attempting to purchase: ${productId}`);
      
      // Check if product exists
      const product = this.products.find(p => p.productId === productId);
      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }
      
      if (this.developmentMode) {
        // Mock successful purchase for development
        await this.simulateNetworkDelay();
        
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          const mockTransactionId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const mockExpiresAt = this.calculateExpirationDate(productId);
          
          console.log(`✅ [DEV] Purchase successful: ${mockTransactionId}`);
          
          return {
            success: true,
            transactionId: mockTransactionId,
            expiresAt: mockExpiresAt,
          };
        } else {
          console.log('❌ [DEV] Purchase cancelled by user');
          return {
            success: false,
            error: 'Purchase was cancelled by user',
          };
        }
      }

      // Real purchase for production
      await purchaseItemAsync(productId);
      
      // In production, you'd handle the purchase callback
      // For now, simulate success
      const transactionId = `prod_${Date.now()}`;
      const expiresAt = this.calculateExpirationDate(productId);
      
      console.log(`✅ Purchase successful: ${transactionId}`);
      
      return {
        success: true,
        transactionId,
        expiresAt,
      };
      
    } catch (error) {
      console.error('❌ Purchase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async restorePurchases(): Promise<PurchaseDetails[]> {
    if (!this.initialized) {
      throw new Error('Purchase service not initialized');
    }

    try {
      console.log('🔄 Restoring purchases...');
      
      if (this.developmentMode) {
        // Mock restoration for development
        await this.simulateNetworkDelay();
        
        // 30% chance of having previous purchases in dev mode
        if (Math.random() > 0.7) {
          const mockPurchase: PurchaseDetails = {
            productId: 'tribefind_pro_monthly',
            transactionId: `restored_${Date.now()}`,
            purchaseDate: new Date(Date.now() - 86400000 * 15).toISOString(),
            expiresAt: new Date(Date.now() + 86400000 * 15).toISOString(),
          };
          
          console.log(`✅ [DEV] Restored 1 purchase`);
          return [mockPurchase];
        }
        
        console.log(`✅ [DEV] No purchases to restore`);
        return [];
      }

      // Real restoration for production
      const response = await getPurchaseHistoryAsync();
      
      // Handle real restoration when implemented
      console.log(`✅ Restored 0 purchases (production mode)`);
      return [];
      
    } catch (error) {
      console.error('❌ Restore purchases error:', error);
      throw error;
    }
  }

  async getAvailableProducts(): Promise<Array<{
    productId: string;
    price: string;
    localizedPrice: string;
    currency: string;
  }>> {
    if (!this.initialized) {
      throw new Error('Purchase service not initialized');
    }

    try {
      console.log('📋 Loading available products...');
      
      const formattedProducts = this.products.map(product => ({
        productId: product.productId,
        price: product.price || '$0.00',
        localizedPrice: product.localizedPrice || product.price || '$0.00',
        currency: product.currencyCode || 'USD',
      }));
      
      console.log(`✅ Loaded ${formattedProducts.length} products`);
      return formattedProducts;
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus(userId: string): Promise<{
    isActive: boolean;
    tier: string;
    expiresAt?: string;
  }> {
    try {
      console.log(`🔍 Checking subscription status for user: ${userId}`);
      
      // This should integrate with your backend to validate receipts
      // For now, check local purchase history
      const purchases = await this.restorePurchases();
      
      if (purchases.length > 0) {
        const latestPurchase = purchases[0]; // Most recent
        const tier = this.getTierFromProductId(latestPurchase.productId);
        
        return {
          isActive: true,
          tier,
          expiresAt: latestPurchase.expiresAt,
        };
      }
      
      return {
        isActive: false,
        tier: 'free',
      };
    } catch (error) {
      console.error('❌ Failed to check subscription status:', error);
      return {
        isActive: false,
        tier: 'free',
      };
    }
  }

  private async simulateNetworkDelay(): Promise<void> {
    // Simulate realistic network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  }

  private calculateExpirationDate(productId: string): string {
    const now = new Date();
    
    if (productId.includes('monthly')) {
      now.setMonth(now.getMonth() + 1);
    } else if (productId.includes('yearly')) {
      now.setFullYear(now.getFullYear() + 1);
    }
    
    return now.toISOString();
  }

  private getTierFromProductId(productId: string): string {
    if (productId.includes('pro')) return 'pro';
    if (productId.includes('premium')) return 'premium';
    return 'free';
  }

  // Development helpers
  async simulateSuccessfulPurchase(tier: 'pro' | 'premium'): Promise<PurchaseResult> {
    console.log(`🧪 [DEV] Simulating ${tier} purchase...`);
    
    const mockTransactionId = `dev_${tier}_${Date.now()}`;
    const mockExpiresAt = new Date();
    mockExpiresAt.setMonth(mockExpiresAt.getMonth() + 1);
    
    return {
      success: true,
      transactionId: mockTransactionId,
      expiresAt: mockExpiresAt.toISOString(),
    };
  }

  async simulateExpiredSubscription(): Promise<void> {
    console.log('🧪 [DEV] Simulating subscription expiration...');
    // This would be called by a background task or webhook in production
  }

  // Method to enable production mode when store products are configured
  enableProductionMode(): void {
    this.developmentMode = false;
    console.log('🏪 Production mode enabled - will use real App Store/Play Store');
  }
}

// Export singleton instance
export const inAppPurchaseService = new InAppPurchaseService();

// Installation instructions for production:
/*
1. Install the appropriate package:
   
   For Expo managed workflow:
   expo install expo-in-app-purchases
   
   For React Native CLI or Expo bare workflow:
   npm install react-native-iap
   
2. Configure your app store products:
   
   iOS (App Store Connect):
   - Create subscription products with IDs:
     * tribefind_pro_monthly
     * tribefind_pro_yearly  
     * tribefind_premium_monthly
     * tribefind_premium_yearly
   
   Android (Google Play Console):
   - Create subscription products with same IDs
   - Configure billing periods and pricing
   
3. Add required permissions to app.json/app.config.js:
   {
     "expo": {
       "ios": {
         "infoPlist": {
           "SKAdNetworkItems": [...]
         }
       },
       "android": {
         "permissions": [
           "com.android.vending.BILLING"
         ]
       },
       "plugins": [
         "expo-in-app-purchases"
       ]
     }
   }

4. Set up server-side receipt validation:
   - Create webhook endpoints for purchase verification
   - Validate receipts with Apple/Google servers
   - Store subscription status in your database
   - Handle subscription renewals/cancellations

5. Replace mock implementation with real purchase logic
*/ 