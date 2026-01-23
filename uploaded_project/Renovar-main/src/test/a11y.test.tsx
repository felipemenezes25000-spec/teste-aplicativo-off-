import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/OptimizedImage';

describe('Accessibility Tests', () => {
  it('Button should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Button with aria-label should be accessible', async () => {
    const { container } = render(
      <Button aria-label="Close dialog">
        <span aria-hidden="true">×</span>
      </Button>
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('OptimizedImage should have alt text', async () => {
    const { container } = render(
      <OptimizedImage src="/test.jpg" alt="Test image" />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
