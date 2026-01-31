import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingIndicator } from './LoadingIndicator';

describe('LoadingIndicator', () => {
  test('renders when visible is true', () => {
    render(<LoadingIndicator visible={true} progress={{ text: 'Loading...', progress: 50 }} />);
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('does not render when visible is false', () => {
    render(<LoadingIndicator visible={false} progress={{ text: 'Loading...', progress: 50 }} />);
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });

  test('displays progress text', () => {
    render(
      <LoadingIndicator visible={true} progress={{ text: 'Downloading model...', progress: 30 }} />
    );
    expect(screen.getByText('Downloading model...')).toBeInTheDocument();
  });

  test('displays progress percentage', () => {
    render(<LoadingIndicator visible={true} progress={{ text: 'Loading...', progress: 75 }} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  test('shows default text when progress text is empty', () => {
    render(<LoadingIndicator visible={true} progress={{ text: '', progress: 0 }} />);
    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });

  test('renders progress bar with correct width', () => {
    render(<LoadingIndicator visible={true} progress={{ text: 'Loading...', progress: 60 }} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '60%' });
  });

  test('progress bar has correct aria attributes', () => {
    render(<LoadingIndicator visible={true} progress={{ text: 'Loading...', progress: 80 }} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '80');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });
});
