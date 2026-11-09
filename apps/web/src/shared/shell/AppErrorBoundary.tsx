import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "App-level uncaught exception caught by AppErrorBoundary:",
      error,
      errorInfo,
    );
  }

  handleReload = () => {
    window.location.hash = "";
    window.location.reload();
  };

  handleHome = () => {
    window.location.hash = "";
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            width: "100vw",
            background:
              "radial-gradient(ellipse at 50% 30%, #1a103c 0%, #080417 100%)",
            color: "#fff6e5",
            fontFamily: "'Outfit', sans-serif",
            padding: "24px",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              background: "rgba(30, 20, 56, 0.75)",
              border: "1px solid rgba(220, 190, 255, 0.25)",
              borderRadius: "24px",
              padding: "36px 28px",
              backdropFilter: "blur(16px)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(245, 120, 100, 0.15)",
                border: "1px solid rgba(245, 120, 100, 0.4)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
                color: "#ff8a7a",
              }}
            >
              <AlertTriangle size={32} />
            </div>
            <h1
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: "28px",
                fontWeight: 600,
                margin: "0 0 12px",
                color: "#fff6e5",
              }}
            >
              Telemetry Anomaly Detected
            </h1>
            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                color: "rgba(255, 246, 229, 0.8)",
                margin: "0 0 24px",
              }}
            >
              The flight system encountered an unexpected telemetry hitch while
              launching the mission deck. Your local progress and manifests are
              safeguarded.
            </p>
            <div
              style={{
                display: "flex",
                gap: "14px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#f5cf77",
                  color: "#46344a",
                  fontWeight: 600,
                  fontSize: "14px",
                  padding: "12px 20px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 0 #dbb361",
                }}
              >
                <RefreshCw size={16} />
                Reload Mission
              </button>
              <button
                type="button"
                onClick={this.handleHome}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#fff6e5",
                  fontWeight: 600,
                  fontSize: "14px",
                  padding: "12px 20px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  cursor: "pointer",
                }}
              >
                <Home size={16} />
                Return to Hub
              </button>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
