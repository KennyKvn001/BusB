// src/hooks/useAuth.ts

import { useAuth as useAuthFromContext } from '../context/AuthContext';

/**
 * Custom hook to access the auth context
 * @returns Auth context values and methods
 */
const useAuth = useAuthFromContext;

export default useAuth;