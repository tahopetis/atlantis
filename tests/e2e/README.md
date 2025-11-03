# Atlantis E2E Test Suite

This directory contains comprehensive end-to-end tests for the Atlantis diagramming application using Playwright.

## Test Structure

### 📁 Directory Organization

```
tests/e2e/
├── pages/                 # Page Object Models
│   ├── BasePage.ts       # Base page functionality
│   ├── HomePage.ts       # Home page interactions
│   ├── EditorPage.ts     # Editor page orchestrator
│   ├── CodeEditor.ts     # Code editor specific methods
│   ├── DiagramCanvas.ts  # Mermaid diagram canvas methods
│   └── ReactFlowCanvas.ts # Visual editor methods
├── fixtures/             # Test data and utilities
│   ├── test-data.ts      # Test constants and examples
│   ├── test-helpers.ts   # Helper functions and utilities
│   └── custom-fixtures.ts # Playwright fixtures and extensions
├── mermaid/              # Mermaid.js specific tests
│   ├── basic-rendering.spec.ts
│   ├── zoom-controls.spec.ts
│   └── examples-templates.spec.ts
├── react-flow/           # React Flow canvas tests
│   ├── basic-operations.spec.ts
│   ├── mode-switching.spec.ts
│   └── node-manipulation.spec.ts
├── code-editor/          # Code editor functionality tests
│   ├── basic-functionality.spec.ts
│   └── toolbar-actions.spec.ts
├── ui/                   # UI/UX feature tests
│   ├── responsive-design.spec.ts
│   └── accessibility.spec.ts
├── cross-browser/        # Cross-browser compatibility
│   └── browser-compatibility.spec.ts
├── error-handling/       # Error scenarios
│   ├── error-boundaries.spec.ts
│   └── network-resilience.spec.ts
├── smoke/                # Critical path smoke tests
│   └── smoke.spec.ts
├── global-setup.ts       # Global test setup
├── global-teardown.ts    # Global test cleanup
└── README.md             # This file
```

## 🎯 Test Coverage Areas

### Core Functionality
- **Mermaid.js Integration**: Live diagram rendering, validation, error handling
- **React Flow Canvas**: Visual editing, node manipulation, connections
- **Code Editor**: Syntax highlighting, validation, examples, copy/download
- **Mode Switching**: Seamless transitions between code and visual modes

### User Experience
- **Responsive Design**: Desktop, tablet, mobile compatibility
- **Accessibility**: WCAG compliance, keyboard navigation, screen readers
- **Performance**: Rendering times, memory usage, large diagram handling
- **Error Handling**: Graceful degradation, user feedback, recovery

### Cross-Platform
- **Browser Compatibility**: Chrome, Firefox, Safari consistency
- **Network Resilience**: Offline functionality, slow connections, failures
- **Device Testing**: Various viewports, touch interactions

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Basic Commands

```bash
# Run all tests
npm run test:e2e

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests with UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright tests/e2e/mermaid/basic-rendering.spec.ts

# Run tests matching pattern
npx playwright tests/e2e/smoke/
```

### Advanced Options

```bash
# Run with debugging
npx playwright test --debug

# Run with specific test tags (if implemented)
npx playwright test --grep "@smoke"

# Generate test report
npx playwright test --reporter=html

# Run tests in parallel
npx playwright test --workers=4

# Run with custom timeout
npx playwright test --timeout=60000
```

## 📊 Test Reports

After running tests, reports are generated in:

- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results.json`
- **JUnit Report**: `test-results.xml`
- **Screenshots**: `test-results/screenshots/`
- **Videos**: `test-results/videos/`
- **Traces**: `test-results/traces/`

## 🛠️ Page Object Model

The test suite uses a robust Page Object Model pattern:

### BasePage
- Common functionality like navigation, element interactions
- Utility methods for waiting, assertions, and error handling

### Specialized Pages
- **HomePage**: Landing page functionality
- **EditorPage**: Main editor orchestration
- **CodeEditor**: Code-specific interactions
- **DiagramCanvas**: Mermaid diagram methods
- **ReactFlowCanvas**: Visual editor methods

### Example Usage
```typescript
import { test } from '../fixtures/custom-fixtures'

test('should create a diagram', async ({ editorPage }) => {
  await editorPage.goto()
  await editorPage.codeEditor.setCode('graph TD\n    A[Start] --> B[End]')

  const status = await editorPage.codeEditor.getValidationStatus()
  expect(status).toBe('valid')

  const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
  expect(isRendered).toBe(true)
})
```

## 🎨 Test Data and Fixtures

### Test Data (`fixtures/test-data.ts`)
- Mermaid diagram examples (valid and invalid)
- Viewport configurations
- Performance thresholds
- Error messages and expectations

### Test Helpers (`fixtures/test-helpers.ts`)
- Network simulation
- Performance measurement
- Accessibility testing
- Mock API responses

### Custom Fixtures (`fixtures/custom-fixtures.ts`)
- Extended Playwright test context
- Pre-configured page objects
- Custom assertions and helpers
- Test hooks and cleanup

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
- Browser configurations (Chrome, Firefox, Safari)
- Mobile and tablet viewports
- Reporting setup
- Development server configuration
- Global timeouts and retries

### Environment Variables
- `CI`: Detects continuous integration environment
- `TEST_STARTED_AT`: Test run timestamp
- `TEST_RUN_ID`: Unique test run identifier

## 📱 Cross-Device Testing

Tests run across multiple device configurations:

- **Desktop**: 1280x720 (Chrome, Firefox, Safari)
- **Laptop**: 1024x768
- **Tablet**: 768x1024 (iPad)
- **Mobile**: 414x896 (iPhone), 375x667 (iPhone)

## ♿ Accessibility Testing

Comprehensive accessibility checks including:

- Semantic HTML structure
- ARIA attributes and roles
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Focus management
- Reduced motion support

## 🚨 Error Scenarios

Test suite covers various error conditions:

- Invalid Mermaid syntax
- Network failures and timeouts
- Memory pressure
- Concurrent operations
- Browser tab switching
- Storage quota exceeded
- Corrupted responses

## 📈 Performance Testing

Built-in performance monitoring:

- Diagram rendering times
- Mode switching performance
- Memory usage tracking
- Large diagram handling
- Network resilience metrics

## 🔄 Continuous Integration

The test suite is designed for CI/CD pipelines:

- Parallel test execution
- Headless browser operation
- Artifact collection (screenshots, videos)
- JUnit report generation
- Failed test debugging

## 🐛 Debugging

### Debugging Failed Tests
```bash
# Run with debugging
npx playwright test --debug

# Run specific failing test
npx playwright tests/e2e/mermaid/basic-rendering.spec.ts:15

# Run with trace viewer
npx playwright test --trace on

# View trace after test run
npx playwright show-trace test-results/trace.zip
```

### Common Issues
1. **Test timeouts**: Increase timeout in config or individual test
2. **Element not found**: Check selectors and waiting strategies
3. **Network failures**: Verify dev server is running
4. **Browser differences**: Use cross-browser compatible selectors

## 📝 Best Practices

### Test Writing
- Use descriptive test names
- Follow Page Object Model pattern
- Include assertions for both positive and negative cases
- Use proper waiting strategies
- Clean up after each test

### Maintenance
- Keep selectors simple and robust
- Regular review and update of test data
- Monitor test execution times
- Update tests when UI changes

### Performance
- Use parallel execution where possible
- Optimize test data size
- Reuse page objects and fixtures
- Minimize unnecessary waits

## 🤝 Contributing

When adding new tests:

1. Follow existing patterns and structure
2. Use appropriate page objects
3. Include comprehensive assertions
4. Add test data to fixtures if needed
5. Update documentation
6. Test across browsers
7. Ensure accessibility compliance

## 📞 Support

For test-related issues:

1. Check Playwright documentation
2. Review existing test patterns
3. Examine error logs and traces
4. Verify application state
5. Check network conditions
6. Validate test data

---

**Note**: This test suite is designed to grow with the application. Regular updates and maintenance ensure continued reliability and comprehensive coverage of the Atlantis diagramming platform.