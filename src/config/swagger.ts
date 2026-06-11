import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Node.js Express RealWorld Example App',
      version: '1.0.0',
      description: 'A fully functional Node.js Express API following the RealWorld specification',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token'
        }
      }
    }
  },
  apis: [
    path.join(__dirname, '../app/routes/**/*.ts'),
    path.join(__dirname, '../app/routes/**/*.js')
  ]
};

export const specs = swaggerJsdoc(options);
export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b4151 }
  `,
  customSiteTitle: 'RealWorld API Documentation',
  customfavIcon: '/assets/favicon.ico'
};

// Setup swagger middleware
export const setupSwagger = (app: any) => {
  // Swagger UI endpoint
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(specs, swaggerUiOptions));

  // JSON spec endpoint
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Health check
  app.get('/api-docs/health', (req: any, res: any) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      swagger: 'available',
      endpoints: {
        ui: '/api-docs',
        json: '/api-docs.json'
      }
    });
  });
};