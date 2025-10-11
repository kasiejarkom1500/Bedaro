# Contributing to BEDARO

🎉 Terima kasih atas minat Anda untuk berkontribusi pada BEDARO! Setiap kontribusi sangat berharga untuk pengembangan sistem manajemen data statistik BPS.

## 📋 Daftar Isi

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

Project ini mengikuti [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Dengan berpartisipasi, Anda diharapkan untuk menjaga kode etik ini.

### Our Pledge
- Menggunakan bahasa yang ramah dan inklusif
- Menghormati sudut pandang dan pengalaman yang berbeda
- Menerima kritik konstruktif dengan baik
- Fokus pada apa yang terbaik untuk komunitas

## Getting Started

### Prerequisites
- Node.js 18.0+
- MySQL 8.0+
- Git
- Text editor (VS Code recommended)

### First Time Setup
```bash
# 1. Fork repository di GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/bedaro.git
cd bedaro

# 3. Add upstream remote
git remote add upstream https://github.com/BPS/bedaro.git

# 4. Install dependencies
npm install

# 5. Setup environment
cp .env.production.example .env.local
# Edit .env.local dengan konfigurasi lokal Anda

# 6. Setup database
mysql -u root -p < database/schema.sql

# 7. Run development server
npm run dev
```

## Development Setup

### Environment Configuration
```env
# Development settings
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bps_bungo_db_dev
JWT_SECRET=dev-secret-key
```

### Branch Strategy
```
main        → Production-ready code
develop     → Development branch
feature/*   → New features
bugfix/*    → Bug fixes
hotfix/*    → Critical fixes
```

## Contributing Guidelines

### Types of Contributions

#### 🐛 Bug Reports
- Use GitHub Issues
- Provide clear description
- Include reproduction steps
- Add relevant labels

#### ✨ Feature Requests
- Use GitHub Issues with "enhancement" label
- Describe the problem it solves
- Provide implementation suggestions
- Consider breaking changes

#### 📝 Documentation
- Fix typos and grammar
- Improve clarity
- Add missing information
- Update outdated content

#### 🔧 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Code refactoring

### Before Contributing

1. **Check existing issues** - Pastikan issue belum ada
2. **Discuss first** - Untuk perubahan besar, diskusikan dulu di issue
3. **Start small** - Mulai dengan kontribusi kecil untuk memahami workflow
4. **Read the code** - Pahami struktur dan patterns yang ada

## Pull Request Process

### 1. Preparation
```bash
# Sync with upstream
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/amazing-feature
```

### 2. Development
```bash
# Make your changes
# Write tests
# Update documentation

# Commit your changes
git add .
git commit -m "feat: add amazing feature"
```

### 3. Testing
```bash
# Run tests
npm test

# Check linting
npm run lint

# Check TypeScript
npm run type-check

# Build test
npm run build
```

### 4. Submit PR
```bash
# Push to your fork
git push origin feature/amazing-feature

# Create Pull Request on GitHub
```

### PR Requirements
- ✅ Clear title and description
- ✅ Link to related issue
- ✅ All tests passing
- ✅ Code review approved
- ✅ Documentation updated
- ✅ No merge conflicts

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Coding Standards

### TypeScript Guidelines
```typescript
// Use explicit types
interface User {
  id: string;
  email: string;
  role: UserRole;
}

// Use const assertions
const roles = ['admin', 'user'] as const;
type Role = typeof roles[number];

// Use proper error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  logger.error('API call failed:', error);
  throw new ApiError('Failed to fetch data');
}
```

### React Guidelines
```tsx
// Use functional components with hooks
const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (!user) return <ErrorMessage />;

  return <UserCard user={user} />;
};
```

### API Guidelines
```typescript
// Consistent response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  pagination?: PaginationInfo;
}

// Proper error handling
export async function handleApiError(error: unknown): Promise<never> {
  if (error instanceof ValidationError) {
    throw new ApiError(400, error.message);
  }
  if (error instanceof DatabaseError) {
    throw new ApiError(500, 'Database operation failed');
  }
  throw new ApiError(500, 'Internal server error');
}
```

### Naming Conventions
```typescript
// Files: kebab-case
user-profile.tsx
api-helpers.ts

// Components: PascalCase
UserProfile
DataTable

// Functions: camelCase
getUserById
calculateTotal

// Constants: SCREAMING_SNAKE_CASE
MAX_UPLOAD_SIZE
DEFAULT_PAGE_SIZE

// Types/Interfaces: PascalCase
interface UserData {}
type ApiResponse<T> = {}
```

### CSS/Styling Guidelines
```tsx
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <Button variant="primary" size="sm">Action</Button>
</div>

// Use CSS modules for custom styles
import styles from './Component.module.css';

// Use CSS variables for theming
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
}
```

## Testing

### Test Types
```typescript
// Unit Tests
describe('UserService', () => {
  test('should create user with valid data', async () => {
    const userData = { email: 'test@bps.go.id', role: 'admin' };
    const user = await UserService.create(userData);
    expect(user.email).toBe(userData.email);
  });
});

// Integration Tests
describe('Auth API', () => {
  test('POST /api/auth/login should return token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bps.go.id', password: 'password' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });
});

// E2E Tests
test('User can login and access dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'admin@bps.go.id');
  await page.fill('[data-testid=password]', 'password');
  await page.click('[data-testid=login-button]');
  await expect(page).toHaveURL('/dashboard');
});
```

### Test Requirements
- ✅ Write tests for new features
- ✅ Update tests for modified code
- ✅ Maintain >80% code coverage
- ✅ Include edge cases
- ✅ Mock external dependencies

## Documentation

### Code Documentation
```typescript
/**
 * Fetches user data by ID with caching
 * @param userId - Unique user identifier
 * @param options - Fetch options
 * @returns Promise resolving to user data
 * @throws {NotFoundError} When user doesn't exist
 * @throws {DatabaseError} When database operation fails
 * 
 * @example
 * ```typescript
 * const user = await getUserById('123', { cache: true });
 * console.log(user.email);
 * ```
 */
export async function getUserById(
  userId: string,
  options: FetchOptions = {}
): Promise<User> {
  // Implementation
}
```

### README Updates
- Keep README.md up to date
- Update installation instructions
- Document new environment variables
- Add examples for new features

### API Documentation
- Document all endpoints
- Include request/response examples
- Document authentication requirements
- Update OpenAPI/Swagger specs

## Issue Reporting

### Bug Reports
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 95]
- Version: [e.g. 1.0.0]

## Additional Context
Screenshots, logs, etc.
```

### Feature Requests
```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How would you like it to work?

## Alternatives Considered
Other solutions you've considered

## Additional Context
Mockups, examples, etc.
```

## Release Process

### Version Numbering
- **Major (1.0.0)**: Breaking changes
- **Minor (1.1.0)**: New features, backward compatible
- **Patch (1.1.1)**: Bug fixes, backward compatible

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Security review completed
- [ ] Performance testing done

## Community

### Communication Channels
- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General questions, ideas
- **Email**: development@bps.go.id

### Getting Help
1. Check existing documentation
2. Search GitHub issues
3. Ask in GitHub Discussions
4. Contact maintainers

## Recognition

Contributors akan diakui melalui:
- GitHub contributors list
- CHANGELOG.md mentions
- Project documentation credits

## Questions?

Jika Anda memiliki pertanyaan yang tidak terjawab dalam dokumentasi ini, jangan ragu untuk:
- Membuka GitHub Discussion
- Menghubungi maintainers
- Mencari di existing issues

Terima kasih telah berkontribusi pada BEDARO! 🚀