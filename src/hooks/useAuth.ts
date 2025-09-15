import { useAuth as useAuthContext } from '../contexts/AuthContext.tsx';

// Re-export the useAuth hook from context for convenience
export const useAuth = useAuthContext;
