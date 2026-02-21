import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || "Error desconocido" };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);

    // Auto-recover from chunk loading errors (common on mobile)
    const msg = error?.message || "";
    if (
      msg.includes("Loading chunk") ||
      msg.includes("Failed to fetch") ||
      msg.includes("dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("NetworkError") ||
      msg.includes("Load failed")
    ) {
      // Clear the error and reload the page once
      const reloadKey = "brillarte_chunk_reload";
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      // Only auto-reload once per 30 seconds to avoid loops
      if (!lastReload || now - parseInt(lastReload) > 30000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
        return;
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-2xl font-bold">Algo salio mal</h1>
            <p className="text-muted-foreground">
              Ocurrio un error inesperado. Por favor intenta de nuevo.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2 bg-foreground text-background rounded-lg"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 border border-foreground rounded-lg"
              >
                Recargar pagina
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;