import { PrismaClient } from '@prisma/client';
import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import routes from '../../../app/routes/routes';
import HttpException from '../../../app/models/http-exception.model';

let testServer: express.Application;
let serverInstance: any;
let prisma: PrismaClient;

export interface TestUser {
  id: number;
  username: string;
  email: string;
  password: string;
  bio: string | null;
  image: string | null;
  token: string;
}

export interface TestArticle {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class TestEnvironment {
  private baseURL: string;
  private axiosInstance: any;

  constructor() {
    this.baseURL = 'http://localhost:3000/api';
  }

async setupTestDatabase(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for tests');
    }
    
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });

    // Clean database before tests
    await this.cleanupDatabase();
    
    // Seed test data
    await this.seedTestData();
  }

async cleanupDatabase(): Promise<void> {
    // Delete in correct order respecting foreign key constraints
    await prisma.comment.deleteMany({});
    await prisma.article.deleteMany({});
    await prisma.tag.deleteMany({});
    
    // Handle follows by explicitly removing relationships
    await prisma.$executeRaw`DELETE FROM "_UserFollows"`;
    await prisma.user.deleteMany({});
  }

  async seedTestData(): Promise<void> {
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await Promise.all([
      prisma.user.create({
        data: {
          username: 'testuser1',
          email: 'test1@example.com',
          password: hashedPassword,
          bio: 'Test user 1 bio',
          image: 'https://example.com/user1.jpg',
          demo: false
        }
      }),
      prisma.user.create({
        data: {
          username: 'testuser2',
          email: 'test2@example.com',
          password: hashedPassword,
          bio: 'Test user 2 bio',
          image: 'https://example.com/user2.jpg',
          demo: false
        }
      }),
      prisma.user.create({
        data: {
          username: 'testuser3',
          email: 'test3@example.com',
          password: hashedPassword,
          bio: 'Test user 3 bio',
          image: 'https://example.com/user3.jpg',
          demo: false
        }
      })
    ]);

    // Create test tags
    const tags = await Promise.all([
      prisma.tag.create({ data: { name: 'test' } }),
      prisma.tag.create({ data: { name: 'javascript' } }),
      prisma.tag.create({ data: { name: 'nodejs' } }),
      prisma.tag.create({ data: { name: 'express' } }),
      prisma.tag.create({ data: { name: 'integration' } })
    ]);

// Create test articles
    const articles = await Promise.all([
      prisma.article.create({
        data: {
          slug: 'test-article-1',
          title: 'Test Article 1',
          description: 'Description for test article 1',
          body: 'This is the body of test article 1. It contains meaningful content for testing purposes.',
          authorId: users[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
          tagList: {
            connect: [{ id: tags[0].id }, { id: tags[1].id }]
          }
        }
      }),
      prisma.article.create({
        data: {
          slug: 'test-article-2',
          title: 'Test Article 2',
          description: 'Description for test article 2',
          body: 'This is the body of test article 2. It contains different content for testing purposes.',
          authorId: users[1].id,
          createdAt: new Date(),
          updatedAt: new Date(),
          tagList: {
            connect: [{ id: tags[1].id }, { id: tags[2].id }]
          }
        }
      }),
      prisma.article.create({
        data: {
          slug: 'test-article-3',
          title: 'Test Article 3',
          description: 'Description for test article 3',
          body: 'This is the body of test article 3. It contains even more content for testing purposes.',
          authorId: users[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
          tagList: {
            connect: [{ id: tags[2].id }, { id: tags[3].id }]
          }
        }
      })
    ]);

    // Create test comments
    await Promise.all([
      prisma.comment.create({
        data: {
          body: 'Great article! Very informative.',
          articleId: articles[0].id,
          authorId: users[1].id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }),
      prisma.comment.create({
        data: {
          body: 'Thanks for sharing! This helped me understand the concept better.',
          articleId: articles[0].id,
          authorId: users[2].id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }),
      prisma.comment.create({
        data: {
          body: 'I have a question about the implementation details.',
          articleId: articles[1].id,
          authorId: users[0].id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    ]);

// Create follows: user1 follows user2, user2 follows user3
    await prisma.$executeRaw`
      INSERT INTO "_UserFollows" ("A", "B") VALUES 
      (${users[0].id}, ${users[1].id}),
      (${users[1].id}, ${users[2].id})
    `;
  }

async startTestServer(): Promise<void> {
    testServer = express();
    
    // Match main application configuration
    testServer.use(cors());
    testServer.use(bodyParser.json());
    testServer.use(bodyParser.urlencoded({ extended: true }));
    testServer.use(routes);
    
    // Add a fallback for health check
    testServer.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Add error handling middleware similar to main app
    testServer.use(
      (
        err: Error | HttpException,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        // @ts-ignore
        if (err && err.name === 'UnauthorizedError') {
          return res.status(401).json({
            status: 'error',
            message: 'missing authorization credentials',
          });
          // @ts-ignore
        } else if (err && err.errorCode) {
          // @ts-ignore
          res.status(err.errorCode).json(err.message);
        } else if (err) {
          res.status(500).json(err.message);
        }
      },
    );
    
    return new Promise((resolve, reject) => {
      serverInstance = testServer.listen(0, () => {
        const port = (serverInstance.address() as any).port;
        this.baseURL = `http://localhost:${port}/api`;
        this.axiosInstance = axios.create({
          baseURL: this.baseURL,
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        resolve(port);
      });
      
      serverInstance.on('error', reject);
    });
  }

  async stopTestServer(): Promise<void> {
    if (serverInstance) {
      return new Promise((resolve) => {
        serverInstance.close(() => {
          resolve(undefined);
        });
      });
    }
  }

  async disconnectDatabase(): Promise<void> {
    if (prisma) {
      await prisma.$disconnect();
    }
  }

  getAxiosInstance() {
    if (!this.axiosInstance) {
      throw new Error('Test server not started. Call startTestServer() first.');
    }
    return this.axiosInstance;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  getPrismaClient(): PrismaClient {
    if (!prisma) {
      throw new Error('Test database not initialized. Call setupTestDatabase() first.');
    }
    return prisma;
  }

  async createTestUser(username: string, email: string, password: string): Promise<TestUser> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        bio: `${username}'s bio`,
        image: `https://example.com/${username}.jpg`,
        demo: false
      }
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'test-secret');
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password,
      bio: user.bio,
      image: user.image,
      token
    };
  }

async createTestArticle(authorId: number, title: string, description: string, body: string, tagList: string[] = []): Promise<TestArticle> {
    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // Connect tags if they exist, create them if they don't
    const tagConnections = [];
    for (const tagName of tagList) {
      let tag = await prisma.tag.findUnique({ where: { name: tagName } });
      if (!tag) {
        tag = await prisma.tag.create({ data: { name: tagName } });
      }
      tagConnections.push({ id: tag.id });
    }

    const article = await prisma.article.create({
      data: {
        slug,
        title,
        description,
        body,
        authorId,
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: {
          connect: tagConnections
        }
      }
    });

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      authorId: article.authorId,
      tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt
    };
  }

  async authenticateUser(email: string, password: string): Promise<{ user: any; token: string }> {
    const axios = this.getAxiosInstance();
    
    const response = await axios.post('/users/login', {
      user: { email, password }
    });
    
    return {
      user: response.data.user,
      token: response.data.user.token
    };
  }

  async createAuthToken(userId: number): Promise<string> {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
  }

  getAuthenticatedAxios(token: string) {
    const axios = this.getAxiosInstance();
    const authAxios = axios.create();
    authAxios.defaults = axios.defaults;
    authAxios.defaults.headers['Authorization'] = `Bearer ${token}`;
    return authAxios;
  }
}

// Global test environment instance
export const testEnv = new TestEnvironment();

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  // Initialize test environment
  await testEnv.setupTestDatabase();
  const port = await testEnv.startTestServer();
  console.log(`Test server started on port ${port}`);
});

afterAll(async () => {
  // Cleanup test environment
  await testEnv.stopTestServer();
  await testEnv.disconnectDatabase();
});

beforeEach(async () => {
  // Reset database state before each test
  await testEnv.cleanupDatabase();
  await testEnv.seedTestData();
});

afterEach(async () => {
  // Additional cleanup if needed
});

// Export utility functions for tests
export function expectValidUserResponse(user: any, includeToken: boolean = true) {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('username');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('bio');
  expect(user).toHaveProperty('image');
  if (includeToken) {
    expect(user).toHaveProperty('token');
  }
  expect(typeof user.id).toBe('number');
  expect(typeof user.username).toBe('string');
  expect(typeof user.email).toBe('string');
}

export function expectValidArticleResponse(article: any) {
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
  
  expectValidProfileResponse(article.author);
  expect(Array.isArray(article.tagList)).toBe(true);
  expect(typeof article.favorited).toBe('boolean');
  expect(typeof article.favoritesCount).toBe('number');
}

export function expectValidProfileResponse(profile: any) {
  expect(profile).toHaveProperty('username');
  expect(profile).toHaveProperty('image');
  expect(profile).toHaveProperty('bio');
  expect(profile).toHaveProperty('following');
  
  expect(typeof profile.username).toBe('string');
  expect(typeof profile.following).toBe('boolean');
}

export function expectValidCommentResponse(comment: any) {
  expect(comment).toHaveProperty('id');
  expect(comment).toHaveProperty('body');
  expect(comment).toHaveProperty('createdAt');
  expect(comment).toHaveProperty('updatedAt');
  expect(comment).toHaveProperty('author');
  
  expectValidProfileResponse(comment.author);
  expect(typeof comment.id).toBe('number');
  expect(typeof comment.body).toBe('string');
}

export function expectValidErrorResponse(error: any, expectedStatus?: number) {
  expect(error).toHaveProperty('response');
  if (expectedStatus) {
    expect(error.response.status).toBe(expectedStatus);
  }
  expect(error.response.data).toHaveProperty('message');
}