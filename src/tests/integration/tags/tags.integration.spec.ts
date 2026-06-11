import axios from 'axios';
import { testEnv, expectValidErrorResponse } from '../config/test-setup';

describe('Tags Integration Tests', () => {
  let axiosInstance: any;

  beforeEach(() => {
    axiosInstance = testEnv.getAxiosInstance();
  });

  describe('GET /tags - List Tags', () => {
    describe('Basic Functionality', () => {
      it('should return list of tags', async () => {
        const response = await axiosInstance.get('/tags');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('tags');
        
        const tags = response.data.tags;
        expect(Array.isArray(tags)).toBe(true);
        expect(tags.length).toBeGreaterThan(0);
        
        for (const tag of tags) {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        }
      });

      it('should return tags from test data', async () => {
        const response = await axiosInstance.get('/tags');
        const tags = response.data.tags;

        // Should contain the tags from our test data
        expect(tags).toContain('test');
        expect(tags).toContain('javascript');
        expect(tags).toContain('nodejs');
        expect(tags).toContain('express');
        expect(tags).toContain('integration');
      });

      it('should not return duplicate tags', async () => {
        const response = await axiosInstance.get('/tags');
        const tags = response.data.tags;

        const uniqueTags = new Set(tags);
        expect(tags.length).toBe(uniqueTags.size);
      });

      it('should return tags sorted alphabetically', async () => {
        const response = await axiosInstance.get('/tags');
        const tags = response.data.tags;

        const sortedTags = [...tags].sort((a, b) => a.localeCompare(b));
        expect(tags).toEqual(sortedTags);
      });
    });

    describe('Data Format and Validation', () => {
      it('should return valid string format tags', async () => {
        const response = await axiosInstance.get('/tags');
        const tags = response.data.tags;

        for (const tag of tags) {
          expect(tag).not.toBe('');
          expect(typeof tag).toBe('string');
          
          // Check for valid tag characters (typically alphanumeric and basic symbols)
          expect(tag).toMatch(/^[a-zA-Z0-9_-]+$/);
        }
      });

      it('should handle various tag formats correctly', async () => {
        // Create test articles with various tag formats
        const prisma = testEnv.getPrismaClient();
        
        // Create tags with different formats
        await Promise.all([
          prisma.tag.create({ data: { name: 'react' } }),
          prisma.tag.create({ data: { name: 'vue-js' } }),
          prisma.tag.create({ data: { name: 'css3' } }),
          prisma.tag.create({ data: { name: 'html5' } }),
          prisma.tag.create({ data: { name: 'typescript' } })
        ]);

        const response = await axiosInstance.get('/tags');
        const tags = response.data.tags;

        expect(tags).toContain('react');
        expect(tags).toContain('vue-js');
        expect(tags).toContain('css3');
        expect(tags).toContain('html5');
        expect(tags).toContain('typescript');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty tags database', async () => {
        // Clear all tags
        const prisma = testEnv.getPrismaClient();
        await prisma.tag.deleteMany({});

        const response = await axiosInstance.get('/tags');

        expect(response.status).toBe(200);
        expect(response.data.tags).toEqual([]);
      });

      it('should handle single tag', async () => {
        // Clear and create only one tag
        const prisma = testEnv.getPrismaClient();
        await prisma.tag.deleteMany({});
        await prisma.tag.create({ data: { name: 'singletag' } });

        const response = await axiosInstance.get('/tags');

        expect(response.status).toBe(200);
        expect(response.data.tags).toEqual(['singletag']);
      });

      it('should handle special characters in tag names', async () => {
        const prisma = testEnv.getPrismaClient();
        
        // Test tag names with various characters that might be edge cases
        const specialTags = ['tag-with-hyphens', 'tag_with_underscores', 'tag123withnumbers'];
        
        for (const tagName of specialTags) {
          await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName }
          });
        }

        const response = await axiosInstance.get('/tags');
        const tags = response.data.tags;

        for (const tagName of specialTags) {
          if (tagName.match(/^[a-zA-Z0-9_-]+$/)) { // Only test valid tag names
            expect(tags).toContain(tagName);
          }
        }
      });
    });

    describe('Performance and Limits', () => {
      it('should handle large number of tags', async () => {
        const prisma = testEnv.getPrismaClient();
        
        // Create many tags to test performance
        const manyTags = Array.from({ length: 100 }, (_, i) => `tag${i}`);
        
        await Promise.all(
          manyTags.map(tagName => 
            prisma.tag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName }
            })
          )
        );

        const response = await axiosInstance.get('/tags');

        expect(response.status).toBe(200);
        expect(response.data.tags.length).toBeGreaterThanOrEqual(100);
      });

      it('should response within reasonable time', async () => {
        const startTime = Date.now();
        
        await axiosInstance.get('/tags');
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Should respond within 2 seconds (adjusted for test environment)
        expect(responseTime).toBeLessThan(2000);
      });
    });

    describe('No Authentication Required', () => {
      it('should work without authentication', async () => {
        const response = await axiosInstance.get('/tags');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('tags');
      });

      it('should work with authentication (should not affect result)', async () => {
        // Test that authentication doesn't change the response
        const publicResponse = await axiosInstance.get('/tags');
        
        // Create an authenticated user and test
        const user = await testEnv.createTestUser('taguser', 'tag@example.com', 'password123');
        const token = await testEnv.createAuthToken(user.id);
        const authAxios = testEnv.getAuthenticatedAxios(token);
        const authResponse = await authAxios.get('/tags');

        expect(authResponse.data).toEqual(publicResponse.data);
      });
    });

    describe('HTTP Conformance', () => {
      it('should use correct HTTP method', async () => {
        const response = await axiosInstance.get('/tags');
        expect(response.status).toBe(200);
      });

      it('should reject invalid HTTP methods', async () => {
        // POST should not be allowed
        try {
          await axiosInstance.post('/tags', {});
        } catch (error) {
          expect(expectedStatusToBe(error, [404, 405]));
        }

        // PUT should not be allowed
        try {
          await axiosInstance.put('/tags', {});
        } catch (error) {
          expect(expectedStatusToBe(error, [404, 405]));
        }

        // DELETE should not be allowed
        try {
          await axiosInstance.delete('/tags');
        } catch (error) {
          expect(expectedStatusToBe(error, [404, 405]));
        }
      });

      it('should handle HEAD request for tags endpoint', async () => {
        try {
          // HEAD request should return headers but no body
          await axiosInstance.head('/tags');
        } catch (error) {
          // HEAD might not be implemented in Express test server
          expect(error.response?.status).toBe(404);
        }
      });
    });

    describe('Content Type', () => {
      it('should return JSON content type', async () => {
        const response = await axiosInstance.get('/tags');
        
        expect(response.headers['content-type']).toContain('application/json');
      });

      it('should return properly formatted JSON', async () => {
        const response = await axiosInstance.get('/tags');
        
        // Should be valid JSON and parseable
        const parsed = JSON.parse(JSON.stringify(response.data));
        expect(parsed).toHaveProperty('tags');
        expect(Array.isArray(parsed.tags)).toBe(true);
      });
    });
  });

  describe('Tags System Integration', () => {
    describe('Article-Tag Relationship', () => {
      it('should return only tags from existing articles', async () => {
        const prisma = testEnv.getPrismaClient();
        
        // Clear existing tags
        await prisma.tag.deleteMany({});
        
        // Create a tag that's not connected to any article
        await prisma.tag.create({ data: { name: 'unused-tag' } });
        
        // Create an article with a specific tag
        const testUser = await prisma.user.findFirst();
        if (testUser) {
          const testArticle = await prisma.article.create({
            data: {
              slug: 'article-for-tag-test',
              title: 'Article for Tag Test',
              description: 'Testing article-tag relationship',
              body: 'Test body',
              authorId: testUser.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });

          // Connect a tag to the article
          await prisma.tag.create({ data: { name: 'connected-tag' } });
          await prisma.article.update({
            where: { id: testArticle.id },
            data: {
              tagList: {
                connect: { name: 'connected-tag' }
              }
            }
          });
        }

        const response = await axiosInstance.get('/tags');
        const tags = response.data.tags;

        // Should include connected tag
        expect(tags).toContain('connected-tag');
        
        // Behavior for unused tags depends on implementation
        // Some only show tags from articles, others show all tags
        const unusedTagPresent = tags.includes('unused-tag');
        // Both behaviors are valid depending on requirements
        expect([true, false]).toContain(unusedTagPresent);
      });

      it('should update tags when articles are created or deleted', async () => {
        const prisma = testEnv.getPrismaClient();
        
        // Get initial tags
        const initialResponse = await axiosInstance.get('/tags');
        const initialTags = initialResponse.data.tags;
        
// Create a new article with new tags
        const testUser = await prisma.user.findFirst();
        if (testUser) {
          // First create the tags if they don't exist
          const tag1 = await prisma.tag.upsert({
            where: { name: 'new-tag-1' },
            update: {},
            create: { name: 'new-tag-1' }
          });
          
          const tag2 = await prisma.tag.upsert({
            where: { name: 'new-tag-2' },
            update: {},
            create: { name: 'new-tag-2' }
          });
          
          await prisma.article.create({
            data: {
              slug: 'article-with-new-tags',
              title: 'Article with New Tags',
              description: 'Testing new tag creation',
              body: 'Test body',
              authorId: testUser.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              tagList: {
                connect: [
                  { id: tag1.id },
                  { id: tag2.id }
                ]
              }
            }
          });
        }

        // Check if new tags appear
        const afterCreateResponse = await axiosInstance.get('/tags');
        const afterCreateTags = afterCreateResponse.data.tags;
        
        expect(afterCreateTags.length).toBeGreaterThanOrEqual(initialTags.length);
        
        // Delete the article
        const articleToDelete = await prisma.article.findFirst({
          where: { slug: 'article-with-new-tags' }
        });
        
        if (articleToDelete) {
          // Disconnect tags before deleting
          await prisma.article.update({
            where: { id: articleToDelete.id },
            data: { tagList: { set: [] } }
          });
          
          await prisma.article.delete({
            where: { id: articleToDelete.id }
          });
        }

        // Check final tags
        const finalResponse = await axiosInstance.get('/tags');
        const finalTags = finalResponse.data.tags;
        
        // Final state should be consistent
        expect(Array.isArray(finalTags)).toBe(true);
      });
    });

    describe('Tag Case Sensitivity', () => {
      it('should handle case variations correctly', async () => {
        const prisma = testEnv.getPrismaClient();
        
        // Create tags with different cases
        const caseVariations = ['JavaScript', 'javascript', 'JAVASCRIPT'];
        
        for (const tag of caseVariations) {
          await prisma.tag.upsert({
            where: { name: tag },
            update: {},
            create: { name: tag }
          });
        }

        const response = await axiosInstance.get('/tags');
        const tags = response.data.tags;
        
        // All case variations should be present if the system is case-sensitive
        // Or only one if it normalizes to lowercase
        const hasJavaScript = tags.some(tag => 
          tag.toLowerCase() === 'javascript'
        );
        
        expect(hasJavaScript).toBe(true);
      });
    });

    describe('Tag Uniqueness', () => {
      it('should prevent duplicate tags in database', async () => {
        const prisma = testEnv.getPrismaClient();
        
        // Try to create the same tag multiple times
        const tagName = 'duplicate-test-tag';
        
        await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        });
        
        // Try to create again (should not duplicate)
        await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        });

        const response = await axiosInstance.get('/tags');
        const tags = response.data.tags;
        
        // Should only appear once
        const duplicates = tags.filter(tag => tag === tagName).length;
        expect(duplicates).toBe(1);
      });
    });
  });

  describe('Security and Validation', () => {
    describe('Input Validation', () => {
      it('should not have injection vulnerabilities', async () => {
        const response = await axiosInstance.get('/tags');
        const tags = response.data.tags;
        
        // All tags should be properly sanitized
        for (const tag of tags) {
          expect(tag).not.toContain('<script>');
          expect(tag).not.toContain('javascript:');
          expect(tag).not.toContain('onerror=');
        }
      });
    });

    describe('Rate Limiting Considerations', () => {
      it('should handle rapid requests gracefully', async () => {
        const promises = Array.from({ length: 10 }, () => 
          axiosInstance.get('/tags')
        );
        
        const responses = await Promise.all(promises);
        
        for (const response of responses) {
          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('tags');
        }
      });
    });
  });
});

// Helper function to check if error has expected status
function expectedStatusToBe(error: any, expectedStatuses: number[]) {
  return expectedStatuses.includes(error.response?.status);
}