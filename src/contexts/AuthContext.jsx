import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../services/supabase';


const AuthContext = createContext({});


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);


  // Fetch user profile
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();


      if (import.meta.env.DEV) {
        console.log('fetchUserProfile:', { userId, data, error });
      }

      if (error) {
        // Table might not exist yet or no profile found - return null silently
        if (import.meta.env.DEV) console.log('No profile found, using default');
        return null;
      }


      return data;
    } catch (error) {
      // Silently handle errors and return null
      console.log('Profile fetch error, using default');
      return null;
    }
  };


  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (import.meta.env.DEV) console.log('supabase.getSession:', session);
        setUser(session?.user ?? null);
        setLoading(false); // Set loading false immediately

        // Fetch profile in background without blocking
        if (session?.user) {
          fetchUserProfile(session.user.id)
            .then(setUserProfile)
            .catch(() => setUserProfile(null));
        }
      })
      .catch((err) => {
        console.error('supabase.auth.getSession() failed:', err);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      });

    // Listen for auth changes
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (import.meta.env.DEV) console.log('onAuthStateChange:', { event, session });
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id)
          .then(setUserProfile)
          .catch(() => setUserProfile(null));
      } else {
        setUserProfile(null);
      }
    });

    // Safely unsubscribe if available
    const subscription = authListener?.data?.subscription;
    return () => {
      try {
        subscription?.unsubscribe?.();
      } catch (e) {
        // ignore unsubscribe errors
      }
    };
  }, []);


  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };


  const signIn = async (email, password) => {
    try {
      console.log('SignIn attempt starting...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('SignIn response:', { data, error });
      return { data, error };
    } catch (err) {
      console.error('SignIn exception:', err);
      return { data: null, error: err };
    }
  };


  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };


  const value = useMemo(() => ({
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin: userProfile?.role === 'admin',
  }), [user, userProfile, loading]);


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};



