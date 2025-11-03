# Bug Report - E2E Testing Issues

## Environment Information
- **Project:** Atlantis Interactive Diagramming
- **Test Date:** November 3, 2025
- **Docker Environment:** Frontend (port 3000), Backend (port 8000)
- **Testing Framework:** Playwright

---

## Critical Bug #1: Backend Service Failure

### Bug Description
Backend container fails to start due to SQLAlchemy configuration error.

### Severity
🔴 **CRITICAL** - Blocks all backend-dependent functionality

### Error Details
```
sqlalchemy.exc.InvalidRequestError: Attribute name 'metadata' is reserved
when using the Declarative API.
```

### Stack Trace
```
File "/app/app/models/file.py", line 19, in <module>
  class DiagramFile(Base):
File "/app/.venv/lib/python3.11/site-packages/sqlalchemy/orm/decl_api.py", line 199, in __init__
  _as_declarative(reg, cls, dict_)
File "/app/.venv/lib/python3.11/site-packages/sqlalchemy/orm/decl_base.py", line 245, in setup_mapping
  return _MapperConfig.setup_mapping(registry, cls, dict_, None, {})
File "/app/.venv/lib/python3.11/site-packages/sqlalchemy/orm/decl_base.py", line 573, in __init__
  self._extract_mappable_attributes()
File "/app/.venv/lib/python3.11/site-packages/sqlalchemy/orm/decl_base.py", line 1530, in _extract_mappable_attributes
  raise exc.InvalidRequestError(
```

### Affected Components
- All API endpoints
- Authentication system
- Git operations
- File storage system

### Steps to Reproduce
1. Start Docker containers with `docker-compose up`
2. Observe backend container logs
3. Container exits with SQLAlchemy error

### Expected Behavior
Backend container should start successfully and provide API endpoints on port 8000.

### Actual Behavior
Backend container fails to start, preventing all backend functionality.

### Recommended Fix
Review `/app/app/models/file.py` and remove or rename any `metadata` attribute in the `DiagramFile` class, as it conflicts with SQLAlchemy's reserved `metadata` attribute.

---

## Critical Bug #2: Missing UI Components in Tests

### Bug Description
E2E tests cannot find expected UI components using defined selectors.

### Severity
🔴 **CRITICAL** - Prevents all E2E test execution

### Missing Selectors
- `.code-editor` or `[data-testid="code-editor"]`
- `.diagram-canvas` or `[data-testid="diagram-canvas"]`
- `.examples-dropdown` or `[data-testid="examples-dropdown"]`
- `#mermaid svg` or `.mermaid svg`

### Test Failures
```
Error: expect(locator).toBeVisible() failed
Locator: locator('.code-editor, [data-testid="code-editor"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

### Affected Test Files
- `smoke/smoke.spec.ts` - 4/7 tests failed
- `mermaid/basic-rendering.spec.ts` - 11/11 tests failed
- `react-flow/mode-switching.spec.ts` - 12/12 tests failed
- `ui/responsive-design.spec.ts` - 11/14 tests failed

### Expected Behavior
Tests should be able to locate and interact with UI components using defined selectors.

### Actual Behavior
Tests fail because UI components cannot be found with current selectors.

### Investigation Required
1. Inspect actual DOM structure of the running application
2. Verify component class names and data-testid attributes
3. Update test selectors to match application reality

---

## Medium Bug #3: ES Module Configuration Issues

### Bug Description
Playwright configuration files have ES module compatibility issues.

### Severity
🟡 **MEDIUM** - Causes configuration errors

### Issues Identified
1. `__dirname` not defined in ES module scope
2. `require()` usage in ES modules
3. Missing module exports

### Error Messages
```
ReferenceError: __dirname is not defined in ES module scope
ReferenceError: require is not defined
Error: Cannot find module '/home/syam/dev/atlantis/tests/fixtures/custom-fixtures'
```

### Files Affected
- `playwright.config.ts`
- `tests/e2e/global-setup.ts`
- `tests/e2e/fixtures/custom-fixtures.ts`

### Fixes Applied
1. Added proper ES module imports:
   ```typescript
   import { fileURLToPath } from 'url'
   const __filename = fileURLToPath(import.meta.url)
   const __dirname = path.dirname(__filename)
   ```

2. Converted `require()` to ES imports:
   ```typescript
   import fs from 'fs' // instead of const fs = require('fs')
   ```

3. Added missing exports:
   ```typescript
   export const ACCESSIBILITY_SELECTORS = { ... }
   ```

---

## Medium Bug #4: Test Configuration Mismatches

### Bug Description
Playwright configuration points to wrong development server URL.

### Severity
🟡 **MEDIUM** - Tests connect to wrong port

### Configuration Issues
1. `baseURL` set to `http://localhost:5174` (Vite default)
2. Application actually running on `http://localhost:3000` (Docker)
3. `webServer` configuration tries to start Vite server unnecessarily

### Fixes Applied
1. Updated baseURL to `http://localhost:3000`
2. Disabled webServer configuration since Docker containers are already running

---

## Test Coverage Analysis

### Overall Test Statistics
- **Total Test Files:** 22
- **Test Categories:** Smoke, Mermaid, React Flow, UI, Cross-browser, Error Handling
- **Browser Coverage:** Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari, iPad

### Test Results Summary
| Test Category | Total Tests | Passed | Failed | Success Rate |
|---------------|-------------|--------|--------|--------------|
| Smoke Tests | 7 | 3 | 4 | 43% |
| Mermaid Tests | 11 | 0 | 11 | 0% |
| React Flow Tests | 12 | 0 | 12 | 0% |
| Responsive Design | 14 | 3 | 11 | 21% |
| **Overall** | **44** | **6** | **38** | **14%** |

### Successful Tests
The few tests that passed were primarily:
- Basic page navigation tests
- Simple UI element presence checks
- Network resilience tests that don't require specific UI components

---

## Performance Issues

### Timeout Problems
- **Default Test Timeout:** 120 seconds
- **Average Test Duration:** 2-12 seconds
- **Frequent Timeout Issues:** Tests hitting 10-second element wait timeouts

### Resource Utilization
- **Screenshot Generation:** Disabled due to framework issues
- **Video Recording:** Not functioning properly
- **Trace Files:** Not being generated

---

## Environment Configuration Issues

### Docker Container Status
```
CONTAINER ID   IMAGE                         STATUS                    PORTS
62d76834f184   atlantis-frontend             Up 6 minutes              0.0.0.0:3000->3000/tcp
c10d4cf193b8   mermaid-live-editor-mermaid   Up About an hour          0.0.0.0:24678->24678/tcp, 0.0.0.0:3030->3000/tcp
db3b76e6920a   atlantis-backend              Exited (1) 52 seconds ago  ---
```

### Port Configuration
- ✅ **Frontend:** http://localhost:3000 - Working
- ❌ **Backend:** http://localhost:8000 - Not accessible
- ✅ **Mermaid Service:** http://localhost:3030 - Working

---

## Recommendations for Resolution

### Immediate Actions (Within 1 Day)
1. **Fix Backend Database Model**
   - Review `/app/app/models/file.py`
   - Remove/renaming `metadata` attribute
   - Test backend container startup

2. **Audit Application UI Structure**
   - Use browser dev tools to inspect actual DOM
   - Document current component class names and IDs
   - Update test selectors accordingly

### Short-term Actions (Within 1 Week)
1. **Update Test Infrastructure**
   - Fix all selector mismatches
   - Verify data-testid attributes in application
   - Test all browser configurations

2. **Implement Test Data Strategy**
   - Create mock data for frontend-only testing
   - Set up test database with proper schema
   - Implement test isolation mechanisms

### Long-term Improvements (Within 1 Month)
1. **Enhance Testing Framework**
   - Add visual regression testing
   - Implement API testing separate from UI testing
   - Set up CI/CD test automation

2. **Improve Error Handling**
   - Better error messages for missing elements
   - Implement retry mechanisms for async operations
   - Enhanced debugging capabilities

---

## Impact Assessment

### Development Impact
- **High:** Cannot validate new features through automated testing
- **Medium:** Manual testing required for all changes
- **Low:** Basic application functionality appears to work

### Deployment Impact
- **Critical:** Cannot ensure deployment safety without working tests
- **High:** Risk of regressions in production
- **Medium:** No automated quality gates

### User Impact
- **Current:** Application frontend appears functional for basic use
- **Potential:** Backend features (auth, git, file storage) completely unavailable
- **Risk:** Unknown stability without comprehensive testing

---

## Next Steps Checklist

- [ ] Fix SQLAlchemy metadata attribute conflict in backend
- [ ] Audit and document actual UI component structure
- [ ] Update all test selectors to match application reality
- [ ] Verify backend API endpoints are accessible
- [ ] Re-run full test suite to validate fixes
- [ ] Implement ongoing test maintenance processes
- [ ] Set up automated test execution in CI/CD pipeline

---

**Report Status:** Ready for Development Team Review
**Priority:** Critical Issues Require Immediate Attention
**Estimated Fix Time:** 2-5 business days for critical issues