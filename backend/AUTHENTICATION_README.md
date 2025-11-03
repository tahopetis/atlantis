# Atlantis JWT Authentication System

This document describes the JWT authentication system implemented for the Atlantis backend API.

## Features

### 🔐 User Authentication
- **User Registration**: Secure user signup with password strength validation
- **User Login**: JWT-based authentication with access and refresh tokens
- **Token Refresh**: Automatic token refresh mechanism
- **Password Management**: Secure password hashing and change functionality
- **User Profile Management**: Update user information and preferences

### 🔑 Git Token Support
- **Multi-Provider Support**: GitHub, GitLab, Bitbucket tokens
- **Token Validation**: Real-time token validation with respective APIs
- **Secure Storage**: Encrypted token storage in database
- **Token Management**: Create, update, delete, and validate Git tokens

### 🛡️ Security Features
- **Rate Limiting**: Configurable rate limiting for auth endpoints
- **Security Headers**: Comprehensive security headers for all responses
- **Audit Logging**: Complete audit trail of all authentication events
- **CORS Protection**: Proper CORS configuration
- **Input Validation**: Comprehensive input validation and sanitization

## API Endpoints

### Authentication Endpoints
```
POST   /api/auth/register           # Register new user
POST   /api/auth/login              # Login user
POST   /api/auth/refresh            # Refresh access token
POST   /api/auth/logout             # Logout user
POST   /api/auth/logout-all         # Logout from all sessions
GET    /api/auth/me                 # Get current user info
PUT    /api/auth/me                 # Update user profile
POST   /api/auth/change-password    # Change password
GET    /api/auth/verify-token       # Verify token validity
```

### Git Token Endpoints
```
POST   /api/git-tokens/             # Create Git token
GET    /api/git-tokens/             # List user Git tokens
GET    /api/git-tokens/{id}         # Get specific Git token
PUT    /api/git-tokens/{id}         # Update Git token
DELETE /api/git-tokens/{id}         # Delete Git token
POST   /api/git-tokens/{id}/validate # Validate stored token
POST   /api/git-tokens/validate     # Validate new token
```

## Database Schema

### Users Table
- `id`: Primary key
- `email`: Unique email address
- `username`: Unique username
- `hashed_password`: Bcrypt hashed password
- `full_name`: User's full name
- `avatar_url`: Profile picture URL
- `is_active`: Account status
- `is_verified`: Email verification status
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp
- `last_login`: Last login timestamp

### Git Tokens Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `name`: User-friendly token name
- `provider`: Git provider (github, gitlab, bitbucket)
- `token`: Encrypted access token
- `scopes`: Token permissions/scopes
- `is_active`: Token status
- `created_at`: Token creation timestamp
- `updated_at`: Last update timestamp
- `last_used`: Last usage timestamp
- `expires_at`: Token expiration date

### Refresh Tokens Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `token`: JWT refresh token
- `is_active`: Token status
- `expires_at`: Token expiration date
- `created_at`: Token creation timestamp
- `device_info`: Device information
- `ip_address`: IP address used
- `user_agent`: Browser user agent

### Audit Logs Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `action`: Action performed (login, logout, etc.)
- `resource`: Resource type (user, git_token, etc.)
- `resource_id`: Resource identifier
- `ip_address`: IP address
- `user_agent`: Browser user agent
- `success`: Operation success status
- `error_message`: Error details if failed
- `details`: Additional information
- `created_at`: Log timestamp

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=sqlite:///./atlantis.db

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
PASSWORD_MIN_LENGTH=8

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW=300
RATE_LIMIT_REGISTER_ATTEMPTS=3
RATE_LIMIT_REGISTER_WINDOW=600

# Git Settings
GIT_BASE_PATH=./repositories
GIT_MAX_REPO_SIZE_MB=1000
GIT_MAX_FILE_SIZE_MB=10
GIT_DISABLE_PUSH=false
GIT_DISABLE_PULL=false

# Application
APP_NAME=Atlantis API
DEBUG=false
ENVIRONMENT=development

# CORS
ALLOWED_HOSTS=http://localhost:3000,http://localhost:5173
```

## Security Implementation

### Password Security
- **Hashing**: Bcrypt algorithm with salt
- **Strength Requirements**: Minimum 8 characters with uppercase, lowercase, and digits
- **Change History**: Audit trail for password changes

### Token Security
- **JWT Tokens**: RS256/HS256 algorithm with expiration
- **Access Tokens**: Short-lived (30 minutes)
- **Refresh Tokens**: Long-lived (7 days) with rotation
- **Token Blacklisting**: Invalidated tokens are blacklisted

### Git Token Security
- **Encryption**: Tokens are encrypted using AES encryption
- **Validation**: Real-time validation with provider APIs
- **Scope Management**: Token scopes are tracked and validated
- **Expiration**: Automatic handling of token expiration

### Rate Limiting
- **Login Attempts**: 5 attempts per 5 minutes
- **Registration**: 3 attempts per 10 minutes
- **Password Reset**: 3 attempts per 10 minutes
- **Default Requests**: 100 requests per hour

### Security Headers
- **Content Security Policy**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Strict-Transport-Security**: HTTPS enforcement (production)
- **Referrer Policy**: Controls referrer information
- **Permissions Policy**: Controls browser features

## Usage Examples

### User Registration
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "full_name": "Test User",
    "password": "SecurePassword123!"
  }'
```

### User Login
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePassword123!"
  }'
```

### Using Protected Endpoints
```bash
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Creating Git Token
```bash
curl -X POST "http://localhost:8000/api/git-tokens/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My GitHub Token",
    "provider": "github",
    "token": "ghp_your_github_token_here",
    "scopes": ["repo", "read:org"]
  }'
```

## Development Setup

1. **Install Dependencies**:
   ```bash
   uv sync
   ```

2. **Setup Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize Database**:
   ```bash
   python -c "from app.core.database import create_tables; create_tables()"
   ```

4. **Run Development Server**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Run Tests**:
   ```bash
   pytest tests/test_auth.py -v
   ```

## Production Deployment

### Security Checklist
- [ ] Change default SECRET_KEY
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Configure production database
- [ ] Set up proper logging
- [ ] Configure monitoring and alerting
- [ ] Set up backup procedures
- [ ] Review and update rate limits
- [ ] Configure email services for password reset
- [ ] Set up proper secret management

### Database
- Use PostgreSQL or MySQL in production
- Configure connection pooling
- Set up read replicas for scaling
- Configure automated backups

### Monitoring
- Monitor authentication success/failure rates
- Track rate limit violations
- Monitor token refresh patterns
- Alert on suspicious activity

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check DATABASE_URL configuration
   - Verify database is running
   - Check network connectivity

2. **JWT Token Errors**:
   - Verify SECRET_KEY is consistent
   - Check token expiration
   - Verify token format

3. **Rate Limiting Issues**:
   - Check rate limit configuration
   - Verify Redis/cache setup if using
   - Review rate limit headers

4. **Git Token Validation**:
   - Verify token format for provider
   - Check network connectivity to provider APIs
   - Verify token scopes

### Debug Mode
Enable debug mode in development:
```bash
DEBUG=true
```

This will provide detailed error messages and additional logging.

## License

This authentication system is part of the Atlantis project and follows the same license terms.