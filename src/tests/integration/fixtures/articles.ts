export const testArticles = {
  article1: {
    title: 'Test Article 1',
    description: 'Description for test article 1',
    body: 'This is the body of test article 1. It contains meaningful content for testing purposes.',
    tagList: ['test', 'javascript']
  },
  article2: {
    title: 'Test Article 2',
    description: 'Description for test article 2',
    body: 'This is the body of test article 2. It contains different content for testing purposes.',
    tagList: ['javascript', 'nodejs']
  },
  article3: {
    title: 'Test Article 3',
    description: 'Description for test article 3',
    body: 'This is the body of test article 3. It contains even more content for testing purposes.',
    tagList: ['nodejs', 'express']
  },
  longTitle: {
    title: 'This is a very long title that tests how the application handles lengthy article titles with special characters and spaces',
    description: 'Description for article with long title',
    body: 'Body content for long title test',
    tagList: ['test']
  },
  specialCharacters: {
    title: 'Special Characters: @#$%^&*()_+-={}[]|\\:";\'<>?,./',
    description: 'Description with special @#$%^&*()',
    body: 'Body with special {}[]|\\:";\'<>?,./ characters',
    tagList: ['special', 'characters']
  }
};

export const invalidArticles = {
  missingTitle: {
    description: 'Description without title',
    body: 'Body content without title',
    tagList: ['test']
  },
  missingDescription: {
    title: 'Title without description',
    body: 'Body content without description',
    tagList: ['test']
  },
  missingBody: {
    title: 'Title without body',
    description: 'Description without body',
    tagList: ['test']
  },
  emptyTitle: {
    title: '',
    description: 'Description with empty title',
    body: 'Body content',
    tagList: ['test']
  },
  emptyDescription: {
    title: 'Title',
    description: '',
    body: 'Body content',
    tagList: ['test']
  },
  emptyBody: {
    title: 'Title',
    description: 'Description',
    body: '',
    tagList: ['test']
  }
};

export const articleUpdates = {
  validUpdate: {
    title: 'Updated Article Title',
    description: 'Updated description for article',
    body: 'Updated body content for article',
    tagList: ['updated', 'article']
  },
  partialUpdate: {
    title: 'Partially Updated Title'
  },
  invalidUpdate: {
    title: '',
    description: 'Updated with empty title'
  }
};

export const testComments = {
  validComment: 'This is a great article! Thanks for sharing.',
  emptyComment: '',
  longComment: 'This is a very long comment that tests how the application handles lengthy comments with detailed explanations and multiple sentences that might span across the character limits and testing boundaries for comment validation.',
  specialCharactersComment: 'Special characters test: @#$%^&*()_+-={}[]|\\:";\'<>?,./'
};

export const paginationParams = {
  offset0: { offset: 0, limit: 20 },
  offset10: { offset: 10, limit: 20 },
  limit5: { offset: 0, limit: 5 },
  limit50: { offset: 0, limit: 50 },
  negativeOffset: { offset: -1, limit: 20 },
  zeroLimit: { offset: 0, limit: 0 },
  largeOffset: { offset: 1000, limit: 20 }
};

export const filterParams = {
  tagFilter: { tag: 'javascript' },
  authorFilter: { author: 'testuser1' },
  favoritedFilter: { favorited: 'testuser1' },
  multipleFilters: { tag: 'javascript', author: 'testuser1' },
  nonExistentTag: { tag: 'nonexistent' },
  nonExistentAuthor: { author: 'nonexistentuser' },
  nonExistentFavorited: { favorited: 'nonexistentuser' }
};