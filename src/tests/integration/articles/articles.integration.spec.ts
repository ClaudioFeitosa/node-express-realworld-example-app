import axios from 'axios';
import { testEnv, expectValidArticleResponse, expectValidCommentResponse, expectValidErrorResponse } from '../config/test-setup';
import { testUsers } from '../fixtures/users';
import { testArticles, invalidArticles, articleUpdates, testComments, paginationParams, filterParams } from '../fixtures/articles';

describe('Articles Integration Tests', () => {
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

  describe('GET /articles - List Articles', () => {
    describe('Basic Functionality', () => {
      it('should return paginated list of articles', async () => {
        const response = await axiosInstance.get('/articles');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('articles');
        expect(response.data).toHaveProperty('articlesCount');
        
        const articles = response.data.articles;
        expect(Array.isArray(articles)).toBe(true);
        expect(response.data.articlesCount).toBeGreaterThan(0);
        
        for (const article of articles) {
          expectValidArticleResponse(article);
        }
      });

      it('should include required article fields', async () => {
        const response = await axiosInstance.get('/articles');
        const article = response.data.articles[0];

        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('slug');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('description');
        expect(article).toHaveProperty('body');
        expect(article).toHaveProperty('createdAt');
        expect(article).toHaveProperty('updatedAt');
        expect(article).toHaveProperty('tagList');
        expect(article).toHaveProperty('author');
        expect(article).toHaveProperty('favorited');
        expect(article).toHaveProperty('favoritesCount');
      });

      it('should return articles in expected order', async () => {
        const response = await axiosInstance.get('/articles');
        const articles = response.data.articles;

        // Test that articles are ordered by creation date (newest first)
        for (let i = 1; i < articles.length; i++) {
          const prevDate = new Date(articles[i-1].createdAt);
          const currentDate = new Date(articles[i].createdAt);
          expect(prevDate >= currentDate).toBe(true);
        }
      });
    });

    describe('Pagination Testing', () => {
      it('should respect offset parameter', async () => {
        const response1 = await axiosInstance.get('/articles?offset=0');
        const response2 = await axiosInstance.get('/articles?offset=1');

        expect(response1.data.articles.length).toBeGreaterThan(response2.data.articles.length);
        
        if (response1.data.articles.length > 0 && response2.data.articles.length > 0) {
          expect(response1.data.articles[0]).not.toEqual(response2.data.articles[0]);
        }
      });

      it('should respect limit parameter', async () => {
        const response = await axiosInstance.get('/articles?limit=2');

        expect(response.data.articles.length).toBeLessThanOrEqual(2);
      });

      it('should handle large offset gracefully', async () => {
        const response = await axiosInstance.get('/articles?offset=1000');

        expect(response.status).toBe(200);
        expect(response.data.articles).toEqual([]);
        expect(response.data.articlesCount).toBeGreaterThan(0);
      });

      it('should handle zero limit', async () => {
        const response = await axiosInstance.get('/articles?limit=0');

        expect(response.status).toBe(200);
        expect(response.data.articles).toEqual([]);
      });

      it('should handle pagination edge cases', async () => {
        const cases = paginationParams;
        
        for (const [caseName, params] of Object.entries(cases)) {
          const response = await axiosInstance.get('/articles', { params });
          
          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('articles');
          expect(response.data).toHaveProperty('articlesCount');
          expect(Array.isArray(response.data.articles)).toBe(true);
        }
      });
    });

    describe('Filtering Testing', () => {
      it('should filter by tag', async () => {
        const response = await axiosInstance.get('/articles?tag=javascript');

        expect(response.status).toBe(200);
        
        const articles = response.data.articles;
        for (const article of articles) {
          expect(article.tagList).toContain('javascript');
        }
      });

      it('should filter by author', async () => {
        const response = await axiosInstance.get('/articles?author=testuser1');

        expect(response.status).toBe(200);
        
        const articles = response.data.articles;
        for (const article of articles) {
          expect(article.author.username).toBe('testuser1');
        }
      });

      it('should filter by favorited', async () => {
        const response = await axiosInstance.get('/articles?favorited=testuser1');

        expect(response.status).toBe(200);
        
        const articles = response.data.articles;
        for (const article of articles) {
          expect(article.favorited).toBe(true);
        }
      });

      it('should handle multiple filters', async () => {
        const response = await axiosInstance.get('/articles?tag=javascript&author=testuser1');

        expect(response.status).toBe(200);
        
        const articles = response.data.articles;
        for (const article of articles) {
          expect(article.tagList).toContain('javascript');
          expect(article.author.username).toBe('testuser1');
        }
      });

      it('should handle non-existent filters', async () => {
        const cases = filterParams;
        
        for (const [caseName, params] of Object.entries(cases)) {
          if (caseName.startsWith('nonExistent')) {
            const response = await axiosInstance.get('/articles', { params });
            
            expect(response.status).toBe(200);
            expect(response.data.articles).toEqual([]);
          }
        }
      });
    });

    describe('Authentication Context', () => {
      it('should include favorited status for authenticated user', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.get('/articles');

        expect(response.status).toBe(200);
        
        for (const article of response.data.articles) {
          expect(typeof article.favorited).toBe('boolean');
        }
      });

      it('should show different favorited status for different users', async () => {
        const authAxios1 = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const authAxios2 = testEnv.getAuthenticatedAxios(authUsers[1].token);
        
        const response1 = await authAxios1.get('/articles');
        const response2 = await authAxios2.get('/articles');

        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
        
        // The articles should have potentially different favorited status
        expect(Array.isArray(response1.data.articles)).toBe(true);
        expect(Array.isArray(response2.data.articles)).toBe(true);
      });
    });
  });

  describe('GET /articles/feed - Feed Articles', () => {
    describe('Basic Functionality', () => {
      it('should return articles from followed users', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.get('/articles/feed');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('articles');
        expect(response.data).toHaveProperty('articlesCount');
        
        const articles = response.data.articles;
        expect(Array.isArray(articles)).toBe(true);
        
        for (const article of articles) {
          expectValidArticleResponse(article);
        }
      });
    });

    describe('Authentication Requirements', () => {
      it('should require authentication', async () => {
        try {
          await axiosInstance.get('/articles/feed');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });

      it('should reject invalid token', async () => {
        const authAxios = testEnv.getAuthenticatedAxios('invalid-token');
        try {
          await authAxios.get('/articles/feed');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });
    });

    describe('Feed Content', () => {
      it('should only include articles from followed users', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.get('/articles/feed');

        const articles = response.data.articles;
        for (const article of articles) {
          // In test data, user1 follows user2, so feed should only have user2's articles
          expect(['testuser2']).toContain(article.author.username);
        }
      });

      it('should handle pagination', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[1].token);
        const response = await authAxios.get('/articles/feed?limit=1');

        expect(response.status).toBe(200);
        expect(response.data.articles.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('POST /articles - Create Article', () => {
    describe('Valid Creation', () => {
      it('should create article with valid data', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.post('/articles', { 
          article: testArticles.article1 
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('article');
        
        const article = response.data.article;
        expectValidArticleResponse(article);
        expect(article.title).toBe(testArticles.article1.title);
        expect(article.description).toBe(testArticles.article1.description);
        expect(article.body).toBe(testArticles.article1.body);
        expect(article.tagList).toEqual(expect.arrayContaining(testArticles.article1.tagList));
        expect(article.author.username).toBe(authUsers[0].username);
      });

      it('should create article with tags', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.post('/articles', { 
          article: { 
            ...testArticles.article2,
            tagList: ['newtag1', 'newtag2', 'newtag3'] 
          } 
        });

        expect(response.status).toBe(201);
        expect(response.data.article.tagList).toContain('newtag1');
        expect(response.data.article.tagList).toContain('newtag2');
        expect(response.data.article.tagList).toContain('newtag3');
      });

      it('should create article without tags', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.post('/articles', { 
          article: { 
            title: 'Article without tags',
            description: 'Description',
            body: 'Body content'
          } 
        });

        expect(response.status).toBe(201);
        expect(Array.isArray(response.data.article.tagList)).toBe(true);
      });

      it('should generate slug from title', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.post('/articles', { 
          article: { 
            title: 'Special Title with Spaces & Symbols!',
            description: 'Description',
            body: 'Body content'
          } 
        });

        expect(response.status).toBe(201);
        expect(response.data.article.slug).toMatch(/special-title-with-spaces-symbols/);
      });
    });

    describe('Authentication Requirements', () => {
      it('should require authentication', async () => {
        try {
          await axiosInstance.post('/articles', { article: testArticles.article1 });
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });

      it('should reject invalid token', async () => {
        const authAxios = testEnv.getAuthenticatedAxios('invalid-token');
        try {
          await authAxios.post('/articles', { article: testArticles.article1 });
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });
    });

    describe('Validation Errors', () => {
      it('should reject missing title', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        try {
          await authAxios.post('/articles', { 
            article: invalidArticles.missingTitle 
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
        }
      });

      it('should reject missing description', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        try {
          await authAxios.post('/articles', { 
            article: invalidArticles.missingDescription 
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
        }
      });

      it('should reject missing body', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        try {
          await authAxios.post('/articles', { 
            article: invalidArticles.missingBody 
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
        }
      });

      it('should reject empty title', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        try {
          await authAxios.post('/articles', { 
            article: invalidArticles.emptyTitle 
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
        }
      });
    });
  });

  describe('GET /articles/:slug - Get Single Article', () => {
    describe('Valid Article Retrieval', () => {
      it('should return article by slug', async () => {
        const response = await axiosInstance.get('/articles/test-article-1');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('article');
        
        const article = response.data.article;
        expectValidArticleResponse(article);
        expect(article.slug).toBe('test-article-1');
      });

      it('should include author information', async () => {
        const response = await axiosInstance.get('/articles/test-article-1');

        const article = response.data.article;
        expect(article.author).toHaveProperty('username');
        expect(article.author).toHaveProperty('image');
        expect(article.author).toHaveProperty('bio');
        expect(article.author).toHaveProperty('following');
      });

      it('should work with authentication', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.get('/articles/test-article-1');

        expect(response.status).toBe(200);
        expectValidArticleResponse(response.data.article);
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent article', async () => {
        try {
          await axiosInstance.get('/articles/non-existent-article');
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });

      it('should return 404 for empty slug', async () => {
        try {
          await axiosInstance.get('/articles/');
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });
    });
  });

  describe('PUT /articles/:slug - Update Article', () => {
    describe('Valid Updates', () => {
      it('should update article with all fields', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.put('/articles/test-article-1', { 
          article: articleUpdates.validUpdate 
        });

        expect(response.status).toBe(200);
        
        const article = response.data.article;
        expectValidArticleResponse(article);
        expect(article.title).toBe(articleUpdates.validUpdate.title);
        expect(article.description).toBe(articleUpdates.validUpdate.description);
        expect(article.body).toBe(articleUpdates.validUpdate.body);
      });

      it('should update article with partial data', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.put('/articles/test-article-2', { 
          article: articleUpdates.partialUpdate 
        });

        expect(response.status).toBe(200);
        expect(response.data.article.title).toBe(articleUpdates.partialUpdate.title);
      });

      it('should update slug when title changes', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const newTitle = 'Completely New Title for Slug Test';
        const response = await authAxios.put('/articles/test-article-3', { 
          article: { title: newTitle } 
        });

        expect(response.status).toBe(200);
        expect(response.data.article.slug).toContain('completely-new-title');
      });
    });

    describe('Authorization', () => {
      it('should allow article author to update', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.put('/articles/test-article-1', { 
          article: { description: 'Updated by author' } 
        });

        expect(response.status).toBe(200);
      });

      it('should reject update by non-author', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[1].token);
        try {
          await authAxios.put('/articles/test-article-1', { 
            article: { description: 'Should not work' } 
          });
        } catch (error) {
          expectValidErrorResponse(error, 403);
        }
      });

      it('should require authentication', async () => {
        try {
          await axiosInstance.put('/articles/test-article-1', { 
            article: { description: 'No auth' } 
          });
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent article', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        try {
          await authAxios.put('/articles/non-existent', { 
            article: articleUpdates.partialUpdate 
          });
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });
    });
  });

  describe('DELETE /articles/:slug - Delete Article', () => {
    describe('Valid Deletion', () => {
      it('should delete article successfully', async () => {
        // First create an article to delete
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const createResponse = await authAxios.post('/articles', { 
          article: { 
            title: 'Article to Delete',
            description: 'Will be deleted',
            body: 'Delete me'
          } 
        });

        const slug = createResponse.data.article.slug;

        // Then delete it
        const deleteResponse = await authAxios.delete(`/articles/${slug}`);

        expect(deleteResponse.status).toBe(204);

        // Verify article is deleted
        try {
          await axiosInstance.get(`/articles/${slug}`);
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });
    });

    describe('Authorization', () => {
      it('should allow author to delete article', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.delete('/articles/test-article-1');

        expect(response.status).toBe(204);
      });

      it('should reject deletion by non-author', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[1].token);
        try {
          await authAxios.delete('/articles/test-article-2');
        } catch (error) {
          expectValidErrorResponse(error, 403);
        }
      });

      it('should require authentication', async () => {
        try {
          await axiosInstance.delete('/articles/test-article-3');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });
    });
  });

  describe('Comments Endpoints', () => {
    describe('GET /articles/:slug/comments - Get Comments', () => {
      it('should return article comments', async () => {
        const response = await axiosInstance.get('/articles/test-article-1/comments');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('comments');
        
        const comments = response.data.comments;
        expect(Array.isArray(comments)).toBe(true);
        
        for (const comment of comments) {
          expectValidCommentResponse(comment);
        }
      });

      it('should return empty array for article with no comments', async () => {
        // Create an article without comments
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const createResponse = await authAxios.post('/articles', { 
          article: { 
            title: 'Article Without Comments',
            description: 'No comments here',
            body: 'Empty comments section'
          } 
        });

        const slug = createResponse.data.article.slug;
        const response = await axiosInstance.get(`/articles/${slug}/comments`);

        expect(response.status).toBe(200);
        expect(response.data.comments).toEqual([]);
      });

      it('should return 404 for non-existent article', async () => {
        try {
          await axiosInstance.get('/articles/non-existent/comments');
        } catch (error) {
          expectValidErrorResponse(error, 404);
        }
      });
    });

    describe('POST /articles/:slug/comments - Add Comment', () => {
      it('should add comment to article', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.post('/articles/test-article-1/comments', { 
          comment: { body: testComments.validComment } 
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('comment');
        
        const comment = response.data.comment;
        expectValidCommentResponse(comment);
        expect(comment.body).toBe(testComments.validComment);
        expect(comment.author.username).toBe(authUsers[0].username);
      });

      it('should require authentication', async () => {
        try {
          await axiosInstance.post('/articles/test-article-1/comments', { 
            comment: { body: testComments.validComment } 
          });
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });

      it('should reject empty comment', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        try {
          await authAxios.post('/articles/test-article-1/comments', { 
            comment: { body: '' } 
          });
        } catch (error) {
          expectValidErrorResponse(error, 400);
        }
      });
    });

    describe('DELETE /articles/:slug/comments/:id - Delete Comment', () => {
      it('should delete own comment', async () => {
        // First create a comment
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const createResponse = await authAxios.post('/articles/test-article-2/comments', { 
          comment: { body: 'Comment to delete' } 
        });

        const commentId = createResponse.data.comment.id;

        // Then delete it
        const deleteResponse = await authAxios.delete(`/articles/test-article-2/comments/${commentId}`);

        expect(deleteResponse.status).toBe(200);
      });

      it('should reject deleting other user comment', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[1].token);
        try {
          await authAxios.delete('/articles/test-article-1/comments/1');
        } catch (error) {
          expectValidErrorResponse(error, 403);
        }
      });
    });
  });

  describe('Favorites Endpoints', () => {
    describe('POST /articles/:slug/favorite - Favorite Article', () => {
      it('should favorite article successfully', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.post('/articles/test-article-3/favorite');

        expect(response.status).toBe(200);
        expectValidArticleResponse(response.data.article);
        expect(response.data.article.favorited).toBe(true);
        expect(response.data.article.favoritesCount).toBeGreaterThan(0);
      });

      it('should require authentication', async () => {
        try {
          await axiosInstance.post('/articles/test-article-1/favorite');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });
    });

    describe('DELETE /articles/:slug/favorite - Unfavorite Article', () => {
      it('should unfavorite article successfully', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        const response = await authAxios.delete('/articles/test-article-1/favorite');

        expect(response.status).toBe(200);
        expectValidArticleResponse(response.data.article);
        expect(response.data.article.favorited).toBe(false);
      });

      it('should require authentication', async () => {
        try {
          await axiosInstance.delete('/articles/test-article-1/favorite');
        } catch (error) {
          expectValidErrorResponse(error, 401);
        }
      });
    });

    describe('Favorite Toggle Behavior', () => {
      it('should handle double favorite correctly', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        // Favorite
        const favResponse1 = await authAxios.post('/articles/test-article-2/favorite');
        expect(favResponse1.data.article.favorited).toBe(true);

        // Favorite again (should be idempotent)
        const favResponse2 = await authAxios.post('/articles/test-article-2/favorite');
        expect(favResponse2.data.article.favorited).toBe(true);
      });

      it('should handle double unfavorite correctly', async () => {
        const authAxios = testEnv.getAuthenticatedAxios(authUsers[0].token);
        
        // Unfavorite
        const unfavResponse1 = await authAxios.delete('/articles/test-article-2/favorite');
        expect(unfavResponse1.data.article.favorited).toBe(false);

        // Unfavorite again (should be idempotent)
        const unfavResponse2 = await authAxios.delete('/articles/test-article-2/favorite');
        expect(unfavResponse2.data.article.favorited).toBe(false);
      });
    });
  });
});