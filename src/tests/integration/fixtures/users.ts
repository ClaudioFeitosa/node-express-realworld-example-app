export const testUsers = {
  user1: {
    username: 'testuser1',
    email: 'test1@example.com',
    password: 'password123',
    bio: 'Test user 1 bio',
    image: 'https://example.com/user1.jpg'
  },
  user2: {
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'password123',
    bio: 'Test user 2 bio',
    image: 'https://example.com/user2.jpg'
  },
  user3: {
    username: 'testuser3',
    email: 'test3@example.com',
    password: 'password123',
    bio: 'Test user 3 bio',
    image: 'https://example.com/user3.jpg'
  }
};

export const invalidUsers = {
  duplicateEmail: {
    username: 'differentuser',
    email: 'test1@example.com', // Same as user1
    password: 'password123',
    bio: 'Different user bio'
  },
  duplicateUsername: {
    username: 'testuser1', // Same as user1
    email: 'different@example.com',
    password: 'password123',
    bio: 'Different user bio'
  },
  missingEmail: {
    username: 'testuser4',
    password: 'password123',
    bio: 'Test user 4 bio'
  },
  missingUsername: {
    email: 'test4@example.com',
    password: 'password123',
    bio: 'Test user 4 bio'
  },
  missingPassword: {
    username: 'testuser4',
    email: 'test4@example.com',
    bio: 'Test user 4 bio'
  },
  invalidEmail: {
    username: 'testuser4',
    email: 'invalid-email',
    password: 'password123',
    bio: 'Test user 4 bio'
  },
  shortPassword: {
    username: 'testuser4',
    email: 'test4@example.com',
    password: '123',
    bio: 'Test user 4 bio'
  }
};

export const userUpdates = {
  validUpdate: {
    username: 'updateduser1',
    email: 'updated1@example.com',
    bio: 'Updated bio for user 1',
    image: 'https://example.com/updated-user1.jpg'
  },
  partialUpdate: {
    bio: 'Partially updated bio'
  },
  invalidUpdateEmail: {
    email: 'invalid-email'
  },
  duplicateEmailUpdate: {
    email: 'test2@example.com' // Already exists
  },
  duplicateUsernameUpdate: {
    username: 'testuser2' // Already exists
  }
};