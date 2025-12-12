// Pure Frontend Client - No Backend Dependencies
// Simple authentication using localStorage only

interface SimpleUser {
  id: string;
  email: string;
  username?: string;
}

interface SimpleSession {
  user: SimpleUser;
}

class PureFrontendClient {
  auth = {
    getSession: async () => {
      try {
        const storedUser = localStorage.getItem('smartfit_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          return { data: { session: { user } }, error: null };
        }
        return { data: { session: null }, error: null };
      } catch (error) {
        return { data: { session: null }, error: null };
      }
    },

    signInWithPassword: async ({ email }: { email: string }) => {
      // Accept any email - no password validation
      const user = {
        id: 'user_' + Date.now(),
        email,
        username: email.split('@')[0],
      };
      localStorage.setItem('smartfit_user', JSON.stringify(user));
      return { data: { user }, error: null };
    },

    signUp: async ({ email }: { email: string }) => {
      // Accept any email for signup
      const user = {
        id: 'user_' + Date.now(),
        email,
        username: email.split('@')[0],
      };
      localStorage.setItem('smartfit_user', JSON.stringify(user));
      return { data: { user }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('smartfit_user');
      return { error: null };
    },

    resetPasswordForEmail: async (email: string) => {
      // Mock reset email success
      console.info(`Mock reset password email sent to ${email}`);
      return { error: null };
    },

    updateUser: async ({ password }: { password: string }) => {
      // Mock password update success
      console.info(`Mock password updated (${password.length} chars)`);
      return { data: { user: null }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: SimpleSession | null) => void) => {
      // Basic listener implementation
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  };

  // Basic database mock for compatibility
  from = () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null })
      })
    })
  });
}

// Export pure frontend client
export const supabase = new PureFrontendClient() as any;