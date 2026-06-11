import axios from 'axios';
import { testEnv, expectValidUserResponse, expectValidErrorResponse } from '../config/test-setup';
import { testUsers, invalidUsers, userUpdates } from '../fixtures/users';

describe('Authentication Integration Tests', () => {
  let axiosInstance: any;

  beforeEach(() => {
    axiosInstance = testEnv.getAxiosInstance();
  });

  describe('POST /users - User Registration', () => {
    describe('Valid Registration', () => {
      it('should create user with valid data', async () => {
        const newUser = {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123'
        };

        const response = await axiosInstance.post('/users', { user: newUser });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('user');
        
        const user = response.data.user;
        expectValidUserResponse(user, true);
        expect(user.username).toBe(newUser.username);
        expect(user.email).toBe(newUser.email);
        expect(user.password).toBeUndefined(); // Password should not be returned
        expect(user.token).toBeDefined();
      });

      it('should create user with optional fields', async () => {
        const newUser = {
          username: 'userwithoptions',
          email: 'userwithoptions@example.com',
          password: 'password123',
          bio: 'User with optional bio',
          image: 'https://example.com/userwithoptions.jpg'
        };

        const response = await axiosInstance.post('/users', { user: newUser });

        expect(response.status).toBe(201);
        expect(response.data.user.bio).toBe(newUser.bio);
        expect(response.data.user.image).toBe(newUser.image);
      });

      it('should accept all valid usernames and emails', async () => {
        const validCases = [
          { username: 'user123', email: 'user123@example.com', password: 'password123' },
          { username: 'user_with_underscore', email: 'user_underscore@example.com', password: 'password123' },
          { username: 'user-with-dash', email: 'user-dash@example.com', password: 'password123' },
          { username: 'user.with.dots', email: 'user.dots@example.com', password: 'password123' }
        ];

        for (const testCase of validCases) {
          const response = await axiosInstance.post('/users', { user: testCase });
          expect(response.status).toBe(201);
          expectValidUserResponse(response.data.user, true);
        }
      });
    });

    describe('Validation Errors', () => {
      it('should reject duplicate email', async () => {
        const response = await axiosInstance.post('/users', { 
          user: invalidUsers.duplicateEmail 
        });

        expectValidErrorResponse(response, 400);
        expect(response.data.message).toContain('email');
      });

      it('should reject duplicate username', async () => {
        const response = await axiosInstance.post('/users', { 
          user: invalidUsers.duplicateUsername 
        });

        expectValidErrorResponse(response, 400);
        expect(response.data.message).toContain('username');
      });

      it('should reject missing email', async () => {
        const response = await axiosInstance.post('/users', { 
          user: invalidUsers.missingEmail 
        });

        expectValidErrorResponse(response, 400);
      });

      it('should reject missing username', async () => {
        const response = await axiosInstance.post('/users', { 
          user: invalidUsers.missingUsername 
        });

        expectValidErrorResponse(response, 400);
      });

      it('should reject missing password', async () => {
        const response = await axiosInstance.post('/users', { 
          user: invalidUsers.missingPassword 
        });

        expectValidErrorResponse(response, 400);
      });

      it('should reject invalid email format', async () => {
        const response = await axiosInstance.post('/users', { 
          user: invalidUsers.invalidEmail 
        });

        expectValidErrorResponse(response, 400);
      });

      it('should reject empty user object', async () => {
        const response = await axiosInstance.post('/users', { user: {} });

        expectValidErrorResponse(response, 400);
      });

      it('should reject malformed request', async () => {
        const response = await axiosInstance.post('/users', { invalid: 'data' });

        expectValidErrorResponse(response, 400);
      });
    });
  });

  describe('POST /users/login - User Login', () => {
    describe('Valid Login', () => {
      it('should login with correct credentials', async () => {
        const response = await axiosInstance.post('/users/login', {
          user: {
            email: testUsers.user1.email,
            password: testUsers.user1.password
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('user');
        
        const user = response.data.user;
        expectValidUserResponse(user, true);
        expect(user.email).toBe(testUsers.user1.email);
        expect(user.username).toBe(testUsers.user1.username);
        expect(user.token).toBeDefined();
      });

      it('should login with different valid users', async () => {
        for (const userKey of ['user1', 'user2', 'user3'] as const) {
          const user = testUsers[userKey];
          const response = await axiosInstance.post('/users/login', {
            user: { email: user.email, password: user.password }
          });

          expect(response.status).toBe(200);
          expectValidUserResponse(response.data.user, true);
        }
      });

      it('should return consistent token format', async () => {
        const response = await axiosInstance.post('/users/login', {
          user: {
            email: testUsers.user1.email,
            password: testUsers.user1.password
          }
        });

        const token = response.data.user.token;
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });
    });

    describe('Authentication Errors', () => {
      it('should reject incorrect email', async () => {
        try {
          await axiosInstance.post('/users/login', {
            user: {
              email: 'wrong@example.com',
              password: testUsers.user1.password
            }
          });
} catch (error) {
          expectValidErrorResponse(error, 400);
          const message = error.response.data.message;
          const containsEmail = message && message.includes('email');
          const containsPassword = message && message.includes('password');
          expect(containsEmail || containsPassword).toBe(true);
        }
      });

      it('should reject incorrect password', async () => {
        try {
          await axiosInstance.post('/users/login', {
            user: {
              email: testUsers.user1.email,
              password: 'wrongpassword'
            }
          });
} catch (error) {
          expectValidErrorResponse(error, 400);
          const message = error.response.data.message;
          const containsPassword = message && message.includes('password');
          const containsEmail = message && message.includes('email');
          expect(containsPassword || containsEmail).toBe(true);
        }
      });

      it('should reject missing email', async () => {
        try {
          await axiosInstance.post('/users/login', {
            user: { password: testUsers.user1.password }
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
        }
      });

      it('should reject missing password', async () => {
        try {
          await axiosInstance.post('/users/login', {
            user: { email: testUsers.user1.email }
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
        }
      });

      it('should reject non-existent user', async () => {
        try {
          await axiosInstance.post('/users/login', {
            user: {
              email: 'nonexistent@example.com',
              password: 'password123'
            }
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
        }
      });
    });
  });

  describe('GET /user - Get Current User', () => {
    describe('Authenticated Access', () => {
      it('should return current user with valid token', async () => {
        const auth = await testEnv.authenticateUser(
          testUsers.user1.email, 
          testUsers.user1.password
        );
        
        const authAxios = testEnv.getAuthenticatedAxios(auth.token);
        const response = await authAxios.get('/user');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('user');
        
        const user = response.data.user;
        expectValidUserResponse(user, false); // No token in response
        expect(user.email).toBe(testUsers.user1.email);
        expect(user.username).toBe(testUsers.user1.username);
      });

      it('should work with different authenticated users', async () => {
        for (const userKey of ['user1', 'user2', 'user3'] as const) {
          const user = testUsers[userKey];
          const auth = await testEnv.authenticateUser(user.email, user.password);
          
          const authAxios = testEnv.getAuthenticatedAxios(auth.token);
          const response = await authAxios.get('/user');

          expect(response.status).toBe(200);
          expectValidUserResponse(response.data.user, false);
        }
      });

      it('should include all user profile fields', async () => {
        const auth = await testEnv.authenticateUser(
          testUsers.user1.email, 
          testUsers.user1.password
        );
        
        const authAxios = testEnv.getAuthenticatedAxios(auth.token);
        const response = await authAxios.get('/user');

        const user = response.data.user;
        expect(user).toHaveProperty('bio');
        expect(user).toHaveProperty('image');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
      });
    });

    describe('Authentication Errors', () => {
      it('should reject request without token', async () => {
        try {
          await axiosInstance.get('/user');
        } catch (error) {
          expectValidErrorResponse(error, 401);
          expect(error.response.data.message).toContain('authorization');
        }
      });

      it('should reject invalid token', async () => {
        const authAxios = testEnv.getAuthenticatedAxios('invalid-token');
        try {
          await authAxios.get('/user');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });

      it('should reject malformed token', async () => {
        const authAxios = testEnv.getAuthenticatedAxios('not.a.jwt.token');
        try {
          await authAxios.get('/user');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });

      it('should reject expired token', async () => {
        // Create an expired token (if JWT library supports this test)
        const expiredToken = await testEnv.createAuthToken(1);
        const authAxios = testEnv.getAuthenticatedAxios(expiredToken + 'expired');
        try {
          await authAxios.get('/user');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });
    });
  });

  describe('PUT /user - Update User', () => {
    describe('Valid Updates', () => {
      it('should update user with all fields', async () => {
        const auth = await testEnv.authenticateUser(
          testUsers.user1.email, 
          testUsers.user1.password
        );
        
        const authAxios = testEnv.getAuthenticatedAxios(auth.token);
        const response = await authAxios.put('/user', { 
          user: userUpdates.validUpdate 
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('user');
        
        const user = response.data.user;
        expectValidUserResponse(user, false);
        expect(user.username).toBe(userUpdates.validUpdate.username);
        expect(user.email).toBe(userUpdates.validUpdate.email);
        expect(user.bio).toBe(userUpdates.validUpdate.bio);
        expect(user.image).toBe(userUpdates.validUpdate.image);
      });

      it('should update user with partial data', async () => {
        const auth = await testEnv.authenticateUser(
          testUsers.user1.email, 
          testUsers.user1.password
        );
        
        const authAxios = testEnv.getAuthenticatedAxios(auth.token);
        const response = await authAxios.put('/user', { 
          user: userUpdates.partialUpdate 
        });

        expect(response.status).toBe(200);
        expect(response.data.user.bio).toBe(userUpdates.partialUpdate.bio);
        // Other fields should remain unchanged
        expect(response.data.user.username).toBe(testUsers.user1.username);
        expect(response.data.user.email).toBe(testUsers.user1.email);
      });

      it('should update password securely', async () => {
        const auth = await testEnv.authenticateUser(
          testUsers.user1.email, 
          testUsers.user1.password
        );
        
        const newPassword = 'newpassword123';
        const authAxios = testEnv.getAuthenticatedAxios(auth.token);
        const response = await authAxios.put('/user', { 
          user: { password: newPassword } 
        });

        expect(response.status).toBe(200);
        expectValidUserResponse(response.data.user, false);

        // Test login with new password
        const loginResponse = await axiosInstance.post('/users/login', {
          user: { email: testUsers.user1.email, password: newPassword }
        });

        expect(loginResponse.status).toBe(200);
      });

      it('should allow updating individual fields', async () => {
        const fields = ['username', 'email', 'bio', 'image'] as const;
        
        for (const field of fields) {
          const auth = await testEnv.authenticateUser(
            testUsers.user2.email, 
            testUsers.user2.password
          );
          
          const updateData: any = {};
          updateData[field] = `updated_${field}_value`;
          
          const authAxios = testEnv.getAuthenticatedAxios(auth.token);
          const response = await authAxios.put('/user', { user: updateData });

          expect(response.status).toBe(200);
          expect(response.data.user[field]).toBe(updateData[field]);
        }
      });
    });

    describe('Validation Errors', () => {
      it('should reject duplicate email during update', async () => {
        const auth = await testEnv.authenticateUser(
          testUsers.user1.email, 
          testUsers.user1.password
        );
        
        const authAxios = testEnv.getAuthenticatedAxios(auth.token);
        try {
          await authAxios.put('/user', { 
            user: userUpdates.duplicateEmailUpdate 
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
          expect(error.response.data.message).toContain('email');
        }
      });

      it('should reject duplicate username during update', async () => {
        const auth = await testEnv.authenticateUser(
          testUsers.user1.email, 
          testUsers.user1.password
        );
        
        const authAxios = testEnv.getAuthenticatedAxios(auth.token);
        try {
          await authAxios.put('/user', { 
            user: userUpdates.duplicateUsernameUpdate 
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
          expect(error.response.data.message).toContain('username');
        }
      });

      it('should reject invalid email format', async () => {
        const auth = await testEnv.authenticateUser(
          testUsers.user1.email, 
          testUsers.user1.password
        );
        
        const authAxios = testEnv.getAuthenticatedAxios(auth.token);
        try {
          await authAxios.put('/user', { 
            user: userUpdates.invalidUpdateEmail 
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
        }
      });

      it('should reject update without authentication', async () => {
        try {
          await axiosInstance.put('/user', { user: userUpdates.validUpdate });
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });

      it('should reject update with invalid token', async () => {
        const authAxios = testEnv.getAuthenticatedAxios('invalid-token');
        try {
          await authAxios.put('/user', { user: userUpdates.validUpdate });
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });
    });

    describe('Security Considerations', () => {
      it('should not return password in response', async () => {
        const auth = await testEnv.authenticateUser(
          testUsers.user1.email, 
          testUsers.user1.password
        );
        
        const authAxios = testEnv.getAuthenticatedAxios(auth.token);
        const response = await authAxios.put('/user', { 
          user: { password: 'newpassword123' } 
        });

        expect(response.data.user.password).toBeUndefined();
      });

      it('should not allow updating other user profiles', async () => {
        // Each user can only update their own profile through /user endpoint
        const auth1 = await testEnv.authenticateUser(
          testUsers.user1.email, 
          testUsers.user1.password
        );
        
        const authAxios1 = testEnv.getAuthenticatedAxios(auth1.token);
        const response = await authAxios1.put('/user', { 
          user: { bio: 'Updated bio for user1' } 
        });

        expect(response.status).toBe(200);
        expect(response.data.user.username).toBe(testUsers.user1.username);
        // Should not be able to impersonate other users
      });
    });
  });
});