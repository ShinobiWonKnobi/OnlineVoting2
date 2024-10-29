import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function Auth() {
  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <SupabaseAuth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#4f46e5',
                brandAccent: '#4338ca',
              },
            },
          },
        }}
        providers={['google', 'github']}
        redirectTo={window.location.origin}
        onError={(error) => {
          console.error('Auth error:', error);
          toast.error(error.message || 'Authentication failed');
        }}
      />
    </div>
  );
}