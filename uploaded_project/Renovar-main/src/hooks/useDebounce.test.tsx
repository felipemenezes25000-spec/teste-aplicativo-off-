import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));

    expect(result.current).toBe('test');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    vi.advanceTimersByTime(500);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should clear timeout on value change', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 'first' },
      }
    );

    rerender({ value: 'second' });
    vi.advanceTimersByTime(250);

    rerender({ value: 'third' });
    vi.advanceTimersByTime(250);

    expect(result.current).toBe('first');

    vi.advanceTimersByTime(250);
    await waitFor(() => {
      expect(result.current).toBe('third');
    });
  });

  it('should use default delay from constants', () => {
    const { result } = renderHook(() => useDebounce('test'));

    expect(result.current).toBe('test');
  });

  it('should handle custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    );

    rerender({ value: 'updated', delay: 1000 });
    vi.advanceTimersByTime(500);
    expect(result.current).toBe('initial');

    vi.advanceTimersByTime(500);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should handle number values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 0 },
      }
    );

    rerender({ value: 100 });
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toBe(100);
    });
  });

  it('should handle object values', async () => {
    const initial = { name: 'John' };
    const updated = { name: 'Jane' };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: initial },
      }
    );

    rerender({ value: updated });
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toEqual(updated);
    });
  });
});
