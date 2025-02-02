import { supabase } from './supabase';

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        last_sign_in: new Date().toISOString(),
      }
    }
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      data: {
        last_sign_in: new Date().toISOString(),
      }
    }
  });
  
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });
};

export const signOut = async () => {
  try {
    // Clear all auth-related storage first
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('lastSignIn');
    sessionStorage.clear();
    
    // Then sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear any other auth-related items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error during sign out:', error);
    // Force clear storage even if sign out fails
    localStorage.clear();
    sessionStorage.clear();
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      if (error.message.includes('rate limit')) {
        throw new Error('Too many reset attempts. Please try again in a few minutes.');
      }
      throw error;
    }

    // Call our Edge Function to send the custom email
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/auth-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        type: 'reset_password',
        email,
        data: {
          redirectUrl: `${window.location.origin}/auth/callback?type=recovery`
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reset email');
    }
  } catch (err) {
    console.error('Reset password error:', err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Unable to send reset email. Please try again later.');
  }
};

export const updatePasswordWithToken = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    if (error.message.includes('auth')) {
      throw new Error('Your session has expired. Please request a new password reset link.');
    }
    throw error;
  }
};

export const verifyAndSetSession = async (accessToken: string, refreshToken: string) => {
  try {
    // Clear any existing session first
    await signOut();

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (error) throw error;
    return data;
  } catch (error) {
    // Clear any invalid session data
    await signOut();
    throw error;
  }
};