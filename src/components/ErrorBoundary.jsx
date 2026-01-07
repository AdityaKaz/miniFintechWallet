import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/40 border border-red-700 text-red-100 p-4 rounded">
          <p className="font-semibold">Something went wrong.</p>
          <p className="text-sm text-red-200 mt-1">
            Please try again. If it persists, refresh the page.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-red-700 text-white rounded hover:bg-red-600"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
