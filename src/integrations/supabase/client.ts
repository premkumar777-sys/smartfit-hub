// Mock Supabase client - replace with real client later
// This allows the app to work without backend for frontend development

interface MockUser {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
}

interface MockSession {
  user: MockUser;
}

class MockSupabaseClient {
  auth = {
    getSession: async () => {
      const storedUser = localStorage.getItem('mock_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return { data: { session: { user } }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      // Simple mock - accept any email/password
      const user = {
        id: 'mock-user-id',
        email,
        username: email.split('@')[0],
      };
      localStorage.setItem('mock_user', JSON.stringify(user));
      return { data: { user }, error: null };
    },

    signUp: async ({ email, password, options }: any) => {
      // Simple mock - accept any email/password
      const user = {
        id: 'mock-user-id',
        email,
        username: options?.data?.username || email.split('@')[0],
      };
      localStorage.setItem('mock_user', JSON.stringify(user));
      return { data: { user }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('mock_user');
      return { error: null };
    },

    resetPasswordForEmail: async (email: string) => {
      // Mock password reset
      return { error: null };
    },

    updateUser: async ({ password }: { password: string }) => {
      // Mock password update
      return { data: { user: null }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: MockSession | null) => void) => {
      // Mock auth state change listener
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  };

  from = (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          // Mock profile data
          if (table === 'profiles' && column === 'user_id') {
            return {
              data: {
                id: 'mock-profile-id',
                user_id: value,
                username: 'Mock User',
                fitness_goal: 'Get fit',
                created_at: new Date().toISOString(),
              },
              error: null
            };
          }
          return { data: null, error: null };
        }
      })
    })
  });
}

// Export mock client
export const supabase = new MockSupabaseClient() as any;