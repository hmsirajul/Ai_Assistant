import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  declare readonly props: Readonly<Props>;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || "Unexpected application error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App ErrorBoundary caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendlyMsg = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed.error) {
          friendlyMsg = `${parsed.error} (Operation: ${parsed.operationType} on ${parsed.path})`;
        }
      } catch {
        // Keep raw message
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-red-200 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E31B23] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">Something went wrong</h2>
            <p className="text-xs text-gray-600 leading-relaxed break-words">{friendlyMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
