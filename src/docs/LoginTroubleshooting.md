# Login Troubleshooting Guide

## Common Causes
1. Browser session not properly terminated
2. Corrupted local storage data
3. Cached authentication tokens
4. Multiple tabs with different auth states
5. Network connectivity issues during last session

## Browser-Specific Solutions

### Google Chrome
1. Clear Browser Data:
   - Click the three dots menu (⋮) → Settings
   - Go to Privacy and security → Clear browsing data
   - Select time range: "Last hour" or "Last 24 hours"
   - Check only:
     - [x] Cookies and other site data
     - [x] Cached images and files
   - Click "Clear data"

2. Force Application Reset:
   - Open Developer Tools (F12 or Ctrl+Shift+I)
   - Go to Application tab
   - Select "Local Storage" → Your domain
   - Click the clear button (🗑️)
   - Refresh the page

### Firefox
1. Clear Browser Data:
   - Click menu (≡) → Settings
   - Privacy & Security → Clear Data
   - Check:
     - [x] Cookies and Site Data
     - [x] Cached Web Content
   - Click "Clear"

2. Force Application Reset:
   - Open Developer Tools (F12 or Ctrl+Shift+I)
   - Go to Storage tab
   - Expand Local Storage
   - Right-click your domain → Clear

### Safari
1. Clear Browser Data:
   - Click Safari → Preferences
   - Privacy tab → Manage Website Data
   - Search for your domain
   - Select and click "Remove" or "Remove All"
   - Click "Clear History" in Safari menu
   - Choose time range and click "Clear History"

2. Force Application Reset:
   - Open Developer Tools (Option + ⌘ + I)
   - Storage tab → Local Storage
   - Select your domain and clear data

## Manual Force Logout Steps

1. **Quick Logout Method**
   ```javascript
   // In browser console
   localStorage.removeItem('supabase.auth.token');
   window.location.reload();
   ```

2. **Complete Reset Method**
   - Open browser console (F12)
   - Run these commands:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   window.location.href = '/';
   ```

## Preventive Measures

1. **Always Use Proper Logout**
   - Click the logout button instead of closing the tab
   - Wait for logout confirmation before closing

2. **Single Tab Usage**
   - Avoid opening the application in multiple tabs
   - Close other instances before logging in

3. **Regular Cache Clearing**
   - Clear browser cache weekly
   - Use private/incognito mode for temporary sessions

4. **Browser Updates**
   - Keep your browser updated
   - Enable automatic updates

## If Solutions Don't Work

1. **Alternative Browser**
   - Try logging in using a different browser
   - Use private/incognito mode

2. **Device Check**
   - Try logging in from a different device
   - Compare behavior across devices

3. **Network Test**
   - Try using a different network connection
   - Disable VPN if using one

4. **Contact Support**
   Provide the following information:
   - Browser name and version
   - Steps already attempted
   - Error messages (if any)
   - Time and date of the issue
   - Screenshots of the problem

## Technical Details for Developers

### Session Storage Location
The application uses local storage with the key `supabase.auth.token` for session management.

### Authentication Flow
1. User signs in
2. Token stored in local storage
3. Token refreshed automatically
4. Session maintained until explicit logout

### Security Measures
- PKCE flow enabled for auth
- Automatic token refresh
- Secure session storage
- Real-time session validation

### Debug Information
When contacting support, run this in console:
```javascript
const debugInfo = {
  localStorage: localStorage.getItem('supabase.auth.token'),
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
};
console.log('Debug Info:', debugInfo);
```

## Quick Reference

### Common Error Messages
- "Session expired"
- "Invalid session"
- "Authentication required"
- "Token expired"

### Resolution Time Expectations
- Cache clearing: Immediate
- Session reset: Immediate
- Browser restart: 1-2 minutes
- Complete data clear: 2-3 minutes

### Success Indicators
- Clean login page
- No error messages
- Proper session initialization
- Access to protected routes