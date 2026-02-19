import React, { useState, useEffect } from "react";
import { Tag } from "lucide-react";
import LabelLibrary from "./components/LabelLibrary";
import {
  AppHeader,
} from "./components/HeaderActions";
import LabelDesigner from "./components/LabelDesign";
import Signup from "./components/admin/Signup";
import Login from "./components/admin/Login";
import { useTheme } from "./ThemeContext";
import { authService, API_ENDPOINTS, apiCall } from "./config/apiConfig";

const App = () => {
  const { theme } = useTheme();
  const [labels, setLabels] = useState([]);
  const [currentView, setCurrentView] = useState("login"); // Default to login
  const [currentLabel, setCurrentLabel] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for active session on mount
    const checkSession = () => {
      const isAuth = authService.isAuthenticated();

      // Handle invitation/profile completion route
      const isCompleteProfile = window.location.pathname === "/complete-profile";

      if (isCompleteProfile) {
        setCurrentView("signup");
        setIsAuthenticated(isAuth);
      } else if (isAuth) {
        setIsAuthenticated(true);
        setCurrentView("library");
      } else {
        setIsAuthenticated(false);
        setCurrentView("login"); // Default to login for new visitors
      }
      setIsLoading(false);
    };

    checkSession();

    const handleAuthError = () => {
      authService.logout();
      setIsAuthenticated(false);
      setCurrentView("login");
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  // Fetch labels from backend
  const fetchLabels = async () => {
    try {
      if (!isAuthenticated) return;

      const data = await apiCall(API_ENDPOINTS.TEMPLATES);
      if (data.success) {
        const mappedLabels = data.templates.map(t => ({
          ...t,
          id: t._id,
          labelSize: t.dimensions,
          lastModified: new Date(t.updatedAt).toLocaleDateString() + ' ' + new Date(t.updatedAt).toLocaleTimeString(),
          elements: t.elements || t.fields || []
        }));
        setLabels(mappedLabels);
        // Auto-select first label if none selected
        if (!currentLabel && mappedLabels.length > 0) {
          setCurrentLabel(mappedLabels[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch labels", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (currentView === "library" || currentView === "designer")) {
      fetchLabels();
    }
  }, [isAuthenticated, currentView]);

  // Manage navigation
  const navigateTo = (view) => {
    if (view === "logout") {
      authService.logout();
      setIsAuthenticated(false);
      setCurrentView("login");
      return;
    }
    setCurrentView(view);
  };

  const handleSignup = (user) => {
    console.log("Signup successful:", user);
    setIsAuthenticated(true);
    setCurrentView("designer");
  };

  const handleLogin = (user) => {
    console.log("Login successful:", user);
    setIsAuthenticated(true);
    setCurrentView("library");
  };

  const handleCreateLabel = async (labelData) => {
    try {
      const payload = {
        name: labelData.name,
        description: labelData.description || "",
        category: "custom",
        dimensions: labelData.labelSize || { width: 100, height: 80, unit: "mm" },
        elements: labelData.elements || [],
        isPublic: true
      };

      const response = await apiCall(API_ENDPOINTS.TEMPLATES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.success) {
        const newLabel = {
          ...response.template,
          id: response.template._id,
          labelSize: response.template.dimensions,
          lastModified: new Date().toLocaleString(),
          elements: response.template.elements || []
        };
        setLabels([newLabel, ...labels]);
        setCurrentLabel(newLabel);
        setCurrentView("designer");
      }
    } catch (error) {
      console.error("Failed to create label:", error);
    }
  };

  const handleEditLabel = (label) => {
    setCurrentLabel(label);
    setCurrentView("designer");
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      await apiCall(API_ENDPOINTS.TEMPLATE_BY_ID(labelId), { method: 'DELETE' });
      setLabels(labels.filter((label) => label.id !== labelId));
    } catch (error) {
      console.error("Failed to delete label:", error);
    }
  };

  const handleSaveLabel = async (labelData) => {
    try {
      const payload = {
        elements: labelData.elements,
        dimensions: labelData.labelSize,
        name: currentLabel.name
      };

      const response = await apiCall(API_ENDPOINTS.TEMPLATE_BY_ID(currentLabel.id || currentLabel._id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.success) {
        const updatedLabel = {
          ...currentLabel,
          ...labelData,
          lastModified: new Date().toLocaleString()
        };

        setLabels(labels.map(l => l.id === updatedLabel.id ? updatedLabel : l));
        setCurrentLabel(updatedLabel);
        setCurrentView("library"); // Auto-navigate after save
      }
    } catch (error) {
      console.error("Failed to save label:", error);
    }
  };

  const handleBackToLibrary = () => {
    setCurrentView("library");
    setCurrentLabel(null);
  };

  // ✅ Contextual Header 
  // We might want to show different headers based on authentication
  const showMainApp = isAuthenticated && (currentView === "library" || currentView === "designer");

  return (
    <div
      className="min-h-screen transition-colors duration-300 flex flex-col bg-[var(--color-bg-main)] text-[var(--color-text-main)]"
    >
      {/* Navigation / Header - Only show for main app functionality */}
      {(isAuthenticated || currentView === "designer" || currentView === "library") && !isLoading && (
        <AppHeader onNavigate={navigateTo} currentView={currentView} />
      )}

      <main className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {currentView === "signup" && (
              <Signup
                onSignup={handleSignup}
                onSwitchToLogin={() => setCurrentView("login")}
              />
            )}

            {currentView === "login" && (
              <Login
                onLogin={handleLogin}
                onSwitchToSignup={() => setCurrentView("signup")}
              />
            )}

            {/* Only show designer once authenticated */}
            {(currentView === "library") && (
              <LabelLibrary
                labels={labels}
                onCreateLabel={handleCreateLabel}
                onEditLabel={handleEditLabel}
                onDeleteLabel={handleDeleteLabel}
              />
            )}

            {(currentView === "designer") && (
              <LabelDesigner
                label={currentLabel}
                labels={labels}
                onSave={handleSaveLabel}
                onSelectLabel={handleEditLabel}
                onCreateLabel={handleCreateLabel}
                onDeleteLabel={handleDeleteLabel}
                onNavigateToLibrary={() => setCurrentView("library")}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;

