import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/react';
import { ErrorBoundary } from '../ErrorBoundary';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

// Component that throws an intentional error for testing
const ErrorComponent: React.FC<{ shouldThrow?: boolean; message?: string }> = ({ shouldThrow = true, message = 'Simulated UI Error' }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="child-content">Child Content Loaded Successfully</div>;
};

describe('F-ERRB — ErrorBoundary Global Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Debe renderizar los componentes hijos cuando no existen errores', () => {
    const boundary = new ErrorBoundary({ children: <ErrorComponent shouldThrow={false} /> });
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
  });

  it('2. Debe capturar excepciones en getDerivedStateFromError y actualizar el estado', () => {
    const testError = new Error('Test Crash');
    const newState = ErrorBoundary.getDerivedStateFromError(testError);

    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(testError);
  });

  it('3. Debe ejecutar componentDidCatch, aislar el error y reportar a Sentry si VITE_SENTRY_DSN existe', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Simulate VITE_SENTRY_DSN
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@sentry.example.com/1');

    const boundary = new ErrorBoundary({ children: <ErrorComponent /> });
    
    // Simulate getDerivedStateFromError + componentDidCatch flow
    const derivedState = ErrorBoundary.getDerivedStateFromError(new Error('Critical Rendering Failure'));
    boundary.state = { ...boundary.state, ...derivedState };

    const error = new Error('Critical Rendering Failure');
    const errorInfo = { componentStack: '\n    at ErrorComponent\n    at ErrorBoundary' };

    boundary.componentDidCatch(error, errorInfo);

    expect(boundary.state.hasError).toBe(true);
    expect(boundary.state.error).toBeDefined();
    expect(consoleSpy).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(error, { extra: { componentStack: errorInfo.componentStack } });

    vi.unstubAllEnvs();
  });

  it('4. Debe reiniciar el estado al invocar handleReset() y disparar la llamada a onReset', () => {
    const onResetMock = vi.fn();
    const boundary = new ErrorBoundary({ onReset: onResetMock, children: <ErrorComponent /> });

    boundary.state = {
      hasError: true,
      error: new Error('Simulated Fail'),
      errorInfo: { componentStack: 'stack' },
    };

    boundary.setState = (newState: any) => {
      boundary.state = typeof newState === 'function' ? newState(boundary.state) : { ...boundary.state, ...newState };
    };

    // Invoke private handleReset method
    (boundary as any).handleReset();

    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
    expect(boundary.state.errorInfo).toBeNull();
    expect(onResetMock).toHaveBeenCalledTimes(1);
  });
});
