import { create } from "zustand";
import { authService, type User } from "@/lib/services";
import { syncTokenCookie } from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string, confirmPassword: string, role?: string) => Promise<void>;
  oauthLogin: (provider: "google" | "github", code: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateRole: (role: "job_seeker" | "higher_studies") => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      localStorage.setItem("accessToken", response.data.accessToken);
      syncTokenCookie(true);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({
        error: error.response?.data?.message || "Login failed. Please try again.",
        isLoading: false,
      });
      throw err;
    }
  },

  signup: async (fullName, email, password, confirmPassword, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.signup({
        fullName,
        email,
        password,
        confirmPassword,
        role,
      });
      localStorage.setItem("accessToken", response.data.accessToken);
      syncTokenCookie(true);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Array<{ msg: string }> } } };
      const message =
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        "Signup failed. Please try again.";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  oauthLogin: async (provider, code) => {
    set({ isLoading: true, error: null });
    try {
      const response = provider === "google"
        ? await authService.googleLogin(code)
        : await authService.githubLogin(code);
      localStorage.setItem("accessToken", response.data.accessToken);
      syncTokenCookie(true);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({
        error: error.response?.data?.message || `${provider} login failed. Please try again.`,
        isLoading: false,
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Logout even if API call fails
    }
    localStorage.removeItem("accessToken");
    syncTokenCookie(false);
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authService.getMe();
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem("accessToken");
      syncTokenCookie(false);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateRole: async (role: "job_seeker" | "higher_studies") => {
    try {
      // Optimistic update
      set((state) => ({
        user: state.user ? { ...state.user, role } : null,
      }));
      // Server update
      const { userService } = await import("@/lib/services");
      await userService.updateRole(role);
      // Ensure sync
      try {
        const response = await authService.getMe();
        set({ user: response.data.user });
      } catch {
        // If getMe fails, optimistic update is still in place
      }
    } catch (err: unknown) {
      console.error("Failed to update role:", err);
      // Fallback — try to re-sync with server
      try {
        const response = await authService.getMe();
        set({ user: response.data.user });
      } catch {
        // If recovery also fails, keep optimistic state
      }
    }
  },

  clearError: () => set({ error: null }),
  setUser: (user) => set({ user, isAuthenticated: true }),
}));
