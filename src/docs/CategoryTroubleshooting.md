# Category Display Troubleshooting Guide

## Quick Verification Steps

1. **Verify Category Creation**
   - Check browser console (F12) for success message: "Category created successfully: {...}"
   - Look for any error messages in red
   - Confirm the success notification appears in the UI

2. **Check Real-time Connection**
   ```javascript
   // In browser console
   const status = await supabase.getChannels();
   console.log('Channel status:', status);
   ```
   - Status should show active channels
   - Look for "subscription_categories_changes" channel

## Common Issues & Solutions

### 1. Category Not Appearing Immediately

**Symptoms:**
- Category created successfully but not visible
- No error messages
- Success notification shows

**Solutions:**

a) **For Users:**
   1. Wait 5-10 seconds for sync
   2. Click outside the category modal and reopen
   3. If still not visible, try browser refresh

b) **For Administrators:**
   1. Check Supabase real-time logs
   2. Verify RLS policies
   3. Check subscription status

### 2. Network/Connection Issues

**Symptoms:**
- Console shows network errors
- Loading spinner continues indefinitely
- Operation timeouts

**Solutions:**

a) **For Users:**
   1. Check internet connection
   2. Clear browser cache:
      - Chrome: Settings → Privacy → Clear browsing data
      - Firefox: Options → Privacy → Clear Data
   3. Try incognito mode

b) **For Administrators:**
   1. Verify Supabase service status
   2. Check real-time service logs
   3. Monitor network latency

### 3. Permission Issues

**Symptoms:**
- Error message: "Failed to create category"
- Console shows permission errors
- Operation fails silently

**Solutions:**

a) **For Users:**
   1. Sign out and sign back in
   2. Clear browser cookies
   3. Contact administrator if persists

b) **For Administrators:**
   1. Verify RLS policies:
   ```sql
   -- Check policies
   SELECT * FROM pg_policies 
   WHERE tablename = 'subscription_categories';
   ```
   2. Confirm user authentication
   3. Check user roles and permissions

## Verification Methods

### 1. Database Direct Check

```sql
-- For administrators
SELECT * FROM subscription_categories 
WHERE user_id = '[user_id]' 
ORDER BY created_at DESC 
LIMIT 1;
```

### 2. Real-time Subscription Test

```javascript
// In browser console
const channel = supabase
  .channel('test')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'subscription_categories' },
    payload => console.log('Change received:', payload)
  )
  .subscribe();
```

### 3. Client-side State Verification

```javascript
// In browser console
const categories = await supabase
  .from('subscription_categories')
  .select('*');
console.log('Current categories:', categories.data);
```

## Wait Times & Timeouts

- Category creation: 2-3 seconds
- Real-time sync: 1-2 seconds
- Network timeout: 10 seconds
- Cache refresh: Immediate to 5 minutes

## Quick Resolution Steps

1. **Immediate Actions:**
   - Check console for errors
   - Verify success message
   - Wait 5-10 seconds
   - Try reopening modal

2. **If Still Not Working:**
   - Clear browser cache
   - Refresh page
   - Sign out/in
   - Contact support

## Prevention Tips

1. **For Users:**
   - Maintain stable internet connection
   - Keep browser updated
   - Clear cache periodically
   - Report persistent issues

2. **For Administrators:**
   - Monitor real-time logs
   - Check service health regularly
   - Maintain RLS policies
   - Document error patterns

## Support Information

For persistent issues:
1. Note exact time of category creation
2. Screenshot any error messages
3. Record steps to reproduce
4. Provide browser and OS details
5. Contact support with collected information

## Additional Resources

- Supabase Status: https://status.supabase.com
- Browser Cache Guide: [Browser-specific instructions]
- Error Code Reference: [Common error codes and meanings]