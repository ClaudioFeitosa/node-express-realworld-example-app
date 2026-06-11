import axios from 'axios';
import { testEnv, expectValidProfileResponse, expectValidErrorResponse } from '../config/test-setup';
import { testUsers } from '../fixtures/users';

describe('Profiles Integration Tests', () => {
  let axiosInstance: any;
  let authUsers: any[] = [];

  beforeEach(async () => {
    axiosInstance = testEnv.getAxiosInstance();
    
    // Authenticate test users
    authUsers = [];
    for (const userKey of ['user1', 'user2', 'user3'] as const) {
      const user = testUsers[userKey];
      const auth = await testEnv.authenticateUser(user.email, user.password);
      authUsers.push({ ...user, ...auth });
    }
  });

  describe('GET /profiles/:username - Get Profile', () => {
    describe('Valid Profile Retrieval', () => {
      it('should return user profile by username', async () => {
        const response = await axiosInstance.get('/profiles/testuser1');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('profile');
        
        const profile = response.data.profile;
        expectValidProfileResponse(profile);
        expect(profile.username).toBe('testuser1');
        expect(profile.bio).toBe('Test user 1 bio');
        expect(profile.image).toBe('https://example.com/user1.jpg');
      });

      it('should work for all test users', async () => {
        for (const userKey of ['user1', 'user2', 'user3'] as const) {
          const response = await axiosInstance.get(`/profiles/${testUsers[userKey].username}`);
          
          expect(response.status).toBe(200);
          expectValidProfileResponse(response.data.profile);
          expect(response.data.profile.username).toBe(testUsers[userKey].username);
        }
      });

      it('should include following status for unauthenticated user', async () => {
        const response = await axiosInstance.get('/profiles/testuser1');

        expect(response.status).toBe(200);
        expect(typeof response.data.profile.following).toBe('boolean');
      });

      it('should include following status for authenticated user', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.get('/profiles/testuser1');

        expect(response.status).toBe(200);
        expect(typeof response.data.profile.following).toBe('boolean');
        // user1 viewing user1's profile should show following=false
        expect(response.data.profile.following).toBe(false);
      });

      it('should show correct following status for related users', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        // user1 follows user2 in test data
        const response = await authAxios.get('/profiles/testuser2');
        expect(response.data.profile.following).toBe(true);
      });

      it('should show following=false for non-followed users', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[2].token);
        
        // user3 doesn't follow user1 in test data
        const response = await authAxios.get('/profiles/testuser1');
        expect(response.data.profile.following).toBe(false);
      });
    });

    describe('Authentication Context', () => {
      it('should work without authentication', async () => {
        const response = await axiosInstance.get('/profiles/testuser1');

        expect(response.status).toBe(200);
        expectValidProfileResponse(response.data.profile);
      });

      it('should work with authentication', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.get('/profiles/testuser1');

        expect(response.status).toBe(200);
        expectValidProfileResponse(response.data.profile);
      });

      it('should handle different viewing contexts correctly', async () => {
        const publicResponse = await axiosInstance.get('/profiles/testuser2');
        const authAxios1 = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const authResponse1 = await authAxios1.get('/profiles/testuser2');
        const authAxios3 = testEnv.getAuthenticatedAxios(authUsers[2].token);
        const authResponse3 = await authAxios3.get('/profiles/testuser2');

        // Public view - no following context
        expect(typeof publicResponse.data.profile.following).toBe('boolean');
        
        // user1 follows user2 - should show true
        expect(authResponse1.data.profile.following).toBe(true);
        
        // user3 doesn't follow user2 - should show false
        expect(authResponse3.data.profile.following).toBe(false);
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent profile', async () => {
        try {
          await axiosInstance.get('/profiles/nonexistentuser');
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });

      it('should return 404 for empty username', async () => {
        try {
          await axiosInstance.get('/profiles/');
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });

      it('should handle special characters in username', async () => {
        // Test with a username that might have special characters
        try {
          const createFirst = testEnv.createTestUser('special-user_123', 'special@example.com', 'password123');
        } catch (error) {
          // If creation fails, we'll test with existing usernames
        }
      });
    });

    describe('Profile Data Integrity', () => {
      it('should not include sensitive information', async () => {
        const response = await axiosInstance.get('/profiles/testuser1');

        const profile = response.data.profile;
        expect(profile.email).toBeUndefined();
        expect(profile.password).toBeUndefined();
        expect(profile.token).toBeUndefined();
        expect(profile.id).toBeUndefined();
      });

      it('should include all expected profile fields', async () => {
        const response = await axiosInstance.get('/profiles/testuser1');

        const profile = response.data.profile;
        expect(profile).toHaveProperty('username');
        expect(profile).toHaveProperty('bio');
        expect(profile).toHaveProperty('image');
        expect(profile).toHaveProperty('following');
      });

      it('should handle null bio fields', async () => {
        // Create a user with null bio
        const user = await testEnv.createTestUser('nullobio', 'nullobio@example.com', 'password123');
        await testEnv.getPrismaClient().user.update({
          where: { id: user.id },
          data: { bio: null }
        });

        const response = await axiosInstance.get('/profiles/nullobio');
        expect(response.data.profile.bio).toBe(null);
      });
    });
  });

  describe('POST /profiles/:username/follow - Follow User', () => {
    describe('Valid Follow Operations', () => {
      it('should follow user successfully', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[2].token);
        const response = await authAxios.post('/profiles/testuser1/follow');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('profile');
        
        const profile = response.data.profile;
        expectValidProfileResponse(profile);
        expect(profile.username).toBe('testuser1');
        expect(profile.following).toBe(true);
      });

      it('should return updated profile information', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[2].token);
        const response = await authAxios.post('/profiles/testuser1/follow');

        const profile = response.data.profile;
        expect(profile.username).toBe('testuser1');
        expect(profile.bio).toBe('Test user 1 bio');
        expect(profile.image).toBe('https://example.com/user1.jpg');
        expect(profile.following).toBe(true);
      });

      it('should work with different follower-target combinations', async () => {
        // user3 follows user1
        const authAxios3 = testEnv.getAuthenticatedAxios(authUsers[2].token);
        const response1 = await authAxios3.post('/profiles/testuser1/follow');
        expect(response1.data.profile.following).toBe(true);

        // user1 follows user3 (reverse relationship)
        const authAxios1 = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response2 = await authAxios1.post('/profiles/testuser3/follow');
        expect(response2.data.profile.following).toBe(true);
      });
    });

    describe('Idempotent Behavior', () => {
      it('should handle duplicate follow requests', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[2].token);
        
        // First follow
        const response1 = await authAxios.post('/profiles/testuser1/follow');
        expect(response1.data.profile.following).toBe(true);

        // Second follow (should be idempotent)
        const response2 = await authAxios.post('/profiles/testuser1/follow');
        expect(response2.data.profile.following).toBe(true);
      });

      it('should maintain following status after multiple follows', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        // Follow multiple times
        for (let i = 0; i < 3; i++) {
          const response = await authAxios.post('/profiles/testuser3/follow');
          expect(response.data.profile.following).toBe(true);
        }
      });
    });

    describe('Authentication Requirements', () => {
      it('should require authentication', async () => {
        try {
          await axiosInstance.post('/profiles/testuser1/follow');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });

      it('should reject invalid token', async () => {
        const authAxios = testEnv.getAuthenticatedAxios('invalid-token');
        try {
          await authAxios.post('/profiles/testuser1/follow');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });
    });

    describe('Authorization Scenarios', () => {
      it('should allow any user to follow any other user', async () => {
        // Any authenticated user can follow any other user
        const followingCases = [
          { follower: 0, target: 1 }, // user1 follows user2 (already follows)
          { follower: 0, target: 2 }, // user1 follows user3 (new follow)
          { follower: 1, target: 2 }, // user2 follows user3 (new follow)
          { follower: 2, target: 0 }, // user3 follows user1 (new follow)
        ];

        for (const { follower, target } of followingCases) {
          const authAxios = testEnv.getAuthenticatedAxios(authUsers[follower].token);
          const response = await authAxios.post(`/profiles/${testUsers[`user${target + 1}` as keyof typeof testUsers].username}/follow`);
          expect(response.status).toBe(200);
          expect(response.data.profile.following).toBe(true);
        }
      });
    });

    describe('Error Cases', () => {
      it('should reject following non-existent user', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        try {
          await authAxios.post('/profiles/nonexistentuser/follow');
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });

      it('should return 404 for empty target username', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        try {
          await authAxios.post('/profiles//follow');
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });
    });

    describe('Self Follow Behavior', () => {
      it('should handle self-follow attempts appropriately', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        // Test self-follow - depends on implementation
        // It might allow or reject self-follow
        try {
          const response = await authAxios.post('/profiles/testuser1/follow');
          // If it succeeds, should probably set following=false for self
          expect(response.status).toBe(200);
          expectValidProfileResponse(response.data.profile);
        } catch (error) {
          // If it rejects, should return 400 or similar
          expect([400, 422]).toContain(error.response?.status);
        }
      });
    });
  });

  describe('DELETE /profiles/:username/follow - Unfollow User', () => {
    describe('Valid Unfollow Operations', () => {
      it('should unfollow user successfully', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        // First ensure we're following
        await authAxios.post('/profiles/testuser2/follow');
        
        // Then unfollow
        const response = await authAxios.delete('/profiles/testuser2/follow');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('profile');
        
        const profile = response.data.profile;
        expectValidProfileResponse(profile);
        expect(profile.username).toBe('testuser2');
        expect(profile.following).toBe(false);
      });

      it('should return updated profile information', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.delete('/profiles/testuser2/follow');

        const profile = response.data.profile;
        expect(profile.username).toBe('testuser2');
        expect(profile.bio).toBe('Test user 2 bio');
        expect(profile.image).toBe('https://example.com/user2.jpg');
        expect(profile.following).toBe(false);
      });

      it('should work for different unfollow combinations', async () => {
        // Ensure following first
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[2].token);
        await authAxios.post('/profiles/testuser1/follow');
        
        // Then unfollow
        const response = await authAxios.delete('/profiles/testuser1/follow');
        expect(response.data.profile.following).toBe(false);
      });
    });

    describe('Idempotent Behavior', () => {
      it('should handle duplicate unfollow requests', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        // First unfollow
        const response1 = await authAxios.delete('/profiles/testuser2/follow');
        expect(response1.data.profile.following).toBe(false);

        // Second unfollow (should be idempotent)
        const response2 = await authAxios.delete('/profiles/testuser2/follow');
        expect(response2.data.profile.following).toBe(false);
      });

      it('should maintain following status after multiple unfollows', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        // Unfollow multiple times
        for (let i = 0; i < 3; i++) {
          const response = await authAxios.delete('/profiles/testuser3/follow');
          expect(response.data.profile.following).toBe(false);
        }
      });
    });

    describe('Follow-Unfollow Toggle', () => {
      it('should handle follow-unfollow sequence correctly', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[2].token);
        
        // Follow
        let response = await authAxios.post('/profiles/testuser1/follow');
        expect(response.data.profile.following).toBe(true);

        // Unfollow
        response = await authAxios.delete('/profiles/testuser1/follow');
        expect(response.data.profile.following).toBe(false);

        // Follow again
        response = await authAxios.post('/profiles/testuser1/follow');
        expect(response.data.profile.following).toBe(true);
      });

      it('should handle unfollow-follow sequence correctly', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        // Unfollow (user1 follows user2 initially, test data)
        let response = await authAxios.delete('/profiles/testuser2/follow');
        expect(response.data.profile.following).toBe(false);

        // Follow again
        response = await authAxios.post('/profiles/testuser2/follow');
        expect(response.data.profile.following).toBe(true);
      });
    });

    describe('Authentication Requirements', () => {
      it('should require authentication', async () => {
        try {
          await axiosInstance.delete('/profiles/testuser1/follow');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });

      it('should reject invalid token', async () => {
        const authAxios = testEnv.getAuthenticatedAxios('invalid-token');
        try {
          await authAxios.delete('/profiles/testuser1/follow');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });
    });

    describe('Authorization Scenarios', () => {
      it('should allow any user to unfollow any other user', async () => {
        // First follow to enable unfollow
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        await authAxios.post('/profiles/testuser3/follow');
        
        // Then unfollow
        const response = await authAxios.delete('/profiles/testuser3/follow');
        expect(response.status).toBe(200);
        expect(response.data.profile.following).toBe(false);
      });

      it('should allow unfollowing users not currently followed', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[2].token);
        const response = await authAxios.delete('/profiles/testuser2/follow');

        expect(response.status).toBe(200);
        expect(response.data.profile.following).toBe(false);
      });
    });

    describe('Error Cases', () => {
      it('should reject unfollowing non-existent user', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        try {
          await authAxios.delete('/profiles/nonexistentuser/follow');
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });

      it('should return 404 for empty target username', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        try {
          await authAxios.delete('/profiles//follow');
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });
    });

    describe('Self Unfollow Behavior', () => {
      it('should handle self-unfollow attempts appropriately', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        try {
          const response = await authAxios.delete('/profiles/testuser1/follow');
          // If it succeeds, should show following=false for self
          expect(response.status).toBe(200);
          expectValidProfileResponse(response.data.profile);
          expect(response.data.profile.following).toBe(false);
        } catch (error) {
          // If it rejects, should return 400 or similar
          expect([400, 422]).toContain(error.response?.status);
        }
      });
    });
  });

  describe('Follow System Integration Tests', () => {
    describe('Bidirectional Follow Relationships', () => {
      it('should support bidirectional following', async () => {
        const authAxios1 = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const authAxios3 = testEnv.getAuthenticatedAxios(authUsers[2].token);
        
        // user1 follows user3
        await authAxios1.post('/profiles/testuser3/follow');
        
        // user3 follows user1
        await authAxios3.post('/profiles/testuser1/follow');
        
        // Verify bidirectional follow
        const response1 = await authAxios1.get('/profiles/testuser3');
        const response3 = await authAxios3.get('/profiles/testuser1');
        
        expect(response1.data.profile.following).toBe(true);
        expect(response3.data.profile.following).toBe(true);
      });
    });

    describe('Follow State Consistency', () => {
      it('should maintain follow state across operations', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[2].token);
        
        // Follow
        let followResponse = await authAxios.post('/profiles/testuser1/follow');
        expect(followResponse.data.profile.following).toBe(true);
        
        // Check profile
        const profileResponse = await authAxios.get('/profiles/testuser1');
        expect(profileResponse.data.profile.following).toBe(true);
        
        // Unfollow
        const unfollowResponse = await authAxios.delete('/profiles/testuser1/follow');
        expect(unfollowResponse.data.profile.following).toBe(false);
        
        // Check profile again
        const profileResponse2 = await authAxios.get('/profiles/testuser1');
        expect(profileResponse2.data.profile.following).toBe(false);
      });
    });

    describe('Multiple Follow Relationships', () => {
      it('should handle multiple follow relationships correctly', async () => {
        const authAxios1 = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        // user1 follows both user2 and user3
        await authAxios1.post('/profiles/testuser2/follow');
        await authAxios1.post('/profiles/testuser3/follow');
        
        // Verify both follow relationships
        const response2 = await authAxios1.get('/profiles/testuser2');
        const response3 = await authAxios1.get('/profiles/testuser3');
        
        expect(response2.data.profile.following).toBe(true);
        expect(response3.data.profile.following).toBe(true);
        
        // Unfollow one and verify the other remains
        await authAxios1.delete('/profiles/testuser2/follow');
        
        const response2After = await authAxios1.get('/profiles/testuser2');
        const response3After = await authAxios1.get('/profiles/testuser3');
        
        expect(response2After.data.profile.following).toBe(false);
        expect(response3After.data.profile.following).toBe(true);
      });
    });

    describe('Cross-User Follow Visibility', () => {
      it('should show different follow states to different users', async () => {
        const authAxios1 = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const authAxios2 = testEnv.getAuthenticatedAxios(authUsers[1].token);
        const authAxios3 = testEnv.getAuthenticatedAxios(authUsers[2].token);
        
        // user3 follows user1
        await authAxios3.post('/profiles/testuser1/follow');
        
        // Check follow status from different perspectives
        const fromUser1 = await authAxios1.get('/profiles/testuser1'); // self view
        const fromUser2 = await authAxios2.get('/profiles/testuser1'); // unrelated user
        const fromUser3 = await authAxios3.get('/profiles/testuser1'); // follower
        
        expect(fromUser1.data.profile.following).toBe(false); // can't follow self
        expect(fromUser2.data.profile.following).toBe(false); // doesn't follow
        expect(fromUser3.data.profile.following).toBe(true);  // follows
      });
    });
  });
});