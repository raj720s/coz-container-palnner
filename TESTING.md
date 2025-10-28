# Testing & Storybook Documentation

This project uses **Storybook** for visual component development and **Jest + React Testing Library** for unit and integration testing.

## 🎨 Storybook

Storybook provides an isolated environment for developing and documenting UI components.

### Running Storybook

```bash
# Start Storybook development server
npm run storybook

# Build static Storybook for deployment
npm run build-storybook
```

Storybook will be available at: `http://localhost:6006`

### Creating Stories

Stories are created alongside components with the `.stories.tsx` extension:

```tsx
// src/components/ui/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import MyComponent from './MyComponent';

const meta = {
  title: 'UI/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Component props
  },
};
```

### Story Organization

Stories are organized by category:
- `UI/*` - Basic UI components (Button, Input, Card, etc.)
- `Forms/*` - Form components
- `Layout/*` - Layout components
- `Features/*` - Feature-specific components

### Storybook Addons

The following addons are installed:

- **@storybook/addon-docs** - Automatic documentation generation
- **@storybook/addon-a11y** - Accessibility testing
- **@storybook/addon-vitest** - Integration with Vitest for component tests
- **@storybook/addon-essentials** - Essential Storybook addons (controls, actions, etc.)
- **@storybook/addon-interactions** - Test user interactions

## 🧪 Jest & React Testing Library

Jest and React Testing Library are used for unit and integration testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Writing Tests

Tests are created in `__tests__` directories or alongside components with `.test.tsx` or `.spec.tsx` extensions:

```tsx
// src/components/ui/__tests__/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Best Practices

1. **Query Priority** (in order of preference):
   - `getByRole` - Most accessible way to query
   - `getByLabelText` - For form elements
   - `getByPlaceholderText` - For inputs
   - `getByText` - For non-interactive elements
   - `getByTestId` - Last resort

2. **User Interactions**:
   ```tsx
   import userEvent from '@testing-library/user-event';
   
   const user = userEvent.setup();
   await user.click(button);
   await user.type(input, 'Hello');
   ```

3. **Async Testing**:
   ```tsx
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

4. **Mocking**:
   - Next.js Router is automatically mocked (see `jest.setup.js`)
   - Use `jest.fn()` for function mocks
   - Use `jest.mock()` for module mocks

### Test Coverage

Coverage reports are generated in the `coverage/` directory when running:

```bash
npm run test:coverage
```

Target coverage thresholds:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## 📁 File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx    # Storybook stories
│   │   │   └── __tests__/
│   │   │       └── Button.test.tsx   # Jest tests
│   │   └── ...
│   └── forms/
│       ├── CarrierForm.tsx
│       ├── CarrierForm.stories.tsx
│       └── __tests__/
│           └── CarrierForm.test.tsx
```

## 🔧 Configuration Files

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup and global mocks
- `.storybook/main.js` - Storybook configuration
- `.storybook/preview.js` - Storybook preview settings

## 🎯 Testing Strategy

### What to Test

✅ **Do test:**
- Component rendering with different props
- User interactions (clicks, typing, form submission)
- Conditional rendering
- Error states
- Accessibility (a11y)
- Form validation
- API integration (with mocks)

❌ **Don't test:**
- Implementation details
- Third-party library internals
- CSS styling (use visual regression tools if needed)
- Static content that doesn't change

### Component Testing Checklist

- [ ] Renders correctly with default props
- [ ] Renders correctly with all prop combinations
- [ ] Handles user interactions properly
- [ ] Shows loading states
- [ ] Shows error states
- [ ] Form validation works
- [ ] Callbacks are called correctly
- [ ] Accessibility requirements met

## 🚀 CI/CD Integration

Tests and Storybook can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm test -- --coverage --maxWorkers=2

- name: Build Storybook
  run: npm run build-storybook
```

## 📚 Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🐛 Troubleshooting

### Storybook Issues

**Problem**: Tailwind classes not working in Storybook
- **Solution**: Ensure `import '../src/app/globals.css'` is in `.storybook/preview.js`

**Problem**: Path aliases not resolving
- **Solution**: Check `webpackFinal` configuration in `.storybook/main.js`

### Jest Issues

**Problem**: Module not found errors
- **Solution**: Check `moduleNameMapper` in `jest.config.js`

**Problem**: Async errors in tests
- **Solution**: Use `waitFor()` from `@testing-library/react` for async operations

**Problem**: Tests pass locally but fail in CI
- **Solution**: Check for timezone/locale differences, use `--maxWorkers=2` flag

## 📊 Example Test Output

```bash
$ npm test

PASS  src/components/ui/button/__tests__/Button.test.tsx
  Button Component
    Rendering
      ✓ renders with children text (25ms)
      ✓ applies custom className (8ms)
    Variants
      ✓ applies primary variant classes (7ms)
      ✓ applies outline variant classes (6ms)
    Interactions
      ✓ calls onClick handler when clicked (12ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        2.5s
```

## 🎨 Example Storybook

Visit your Storybook at `http://localhost:6006` to see:

- Interactive component playground
- Automatic documentation
- Accessibility testing panel
- Responsive viewport testing
- Dark mode toggle
- Source code viewer

---

**Happy Testing! 🧪✨**

