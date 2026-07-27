'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SectionCardSkeleton } from '@/components/design/SectionCard';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <SectionCardSkeleton />;
    }
    return this.props.children;
  }
}
