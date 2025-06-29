# Upgrade to Pro Tier for AI Testing

## Quick Test: Enable OpenAI for your user

The issue is you're likely on the **FREE tier** which only gets philosophical responses. To test OpenAI AI chat:

### Option 1: Upgrade via App (Recommended)
1. Go to **Settings/Profile** in your app
2. Look for **Subscription** or **Upgrade** button
3. Select **Pro** or **Premium** tier
4. Test AI chat

### Option 2: Direct Database Update (Dev Only)
If you have database access, update your user's subscription:

```sql
-- Find your user ID first
SELECT id, email, display_name FROM users WHERE email = 'testuser1@gmail.com';

-- Update to Pro tier (if you have a subscriptions table)
UPDATE subscriptions 
SET plan = 'pro', status = 'active' 
WHERE user_id = '0dec0d4d-b46c-4268-89be-ad9631661f54';
```

### Option 3: Redux Dev Tools (Browser)
1. Open **Web version** of app (`w` in terminal)
2. Open **Redux DevTools**
3. Dispatch action:
```javascript
store.dispatch({
  type: 'subscription/setSubscriptionTier',
  payload: { tier: 'pro', expiresAt: '2025-12-31' }
});
```

### Expected Logs After Upgrade:
```
💳 Subscription check: { canSendMessage: true, currentPlanId: 'pro', tierName: 'TribeFind Pro' }
🎖️ PRO user detected, attempting OpenAI call...
🤖 Making OpenAI API call...
✅ OpenAI API success: Response received
```

### Currently You're Seeing:
```
💳 Subscription check: { canSendMessage: true, currentPlanId: 'free', tierName: 'Free' }
📱 FREE user - skipping OpenAI, using fallback
🔄 Using philosophical fallback response
``` 