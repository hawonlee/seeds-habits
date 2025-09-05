# Disable Email Confirmation in Supabase

To remove the email confirmation requirement for new user accounts, you need to configure this in your Supabase project settings.

## Steps to Disable Email Confirmation:

### 1. Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard/project/qqnidhikbczcudesoisc
2. Click on **Authentication** in the left sidebar
3. Click on **Settings** tab

### 2. Disable Email Confirmation
1. Scroll down to **Email Auth** section
2. Find **Enable email confirmations**
3. **Uncheck** this option
4. Click **Save** to apply the changes

### 3. Alternative: Enable Auto-confirm
If you want to keep email confirmations but auto-confirm users:
1. In the same **Email Auth** section
2. Check **Enable email confirmations**
3. Check **Enable auto-confirm**
4. Click **Save**

## What This Does:

- **Disable email confirmations**: Users can sign up and immediately use the app
- **Auto-confirm**: Users are automatically confirmed when they sign up
- **No email required**: Users don't need to check their email to start using the app

## After Making Changes:

1. **Test signup**: Try creating a new account
2. **Check users table**: Go to Authentication > Users to see the new user
3. **Verify functionality**: The user should be able to add habits immediately

## Current Behavior:

With email confirmation enabled:
- User signs up → Email sent → User must click link → Account activated

With email confirmation disabled:
- User signs up → Account immediately active → User can use app

## Security Considerations:

- Disabling email confirmation means anyone with a valid email can create an account
- Consider implementing additional verification methods if needed
- Monitor for spam accounts if this becomes an issue

## Testing:

After disabling email confirmation:
1. Create a new account
2. Check that the user appears in Supabase Authentication > Users
3. Verify the user can immediately add habits
4. Check that the profile is automatically created
