import type { SwaggerDefinition } from 'swagger-jsdoc';
import swaggerJsDoc from 'swagger-jsdoc';

interface SwaggerConfig {
  apis?: ReadonlyArray<string>;
  definition: SwaggerDefinition;
}

export function generateSwaggerSpec(config: SwaggerConfig) {
  const { apis = ['./src/routes/*'], definition } = config || {};
  const _definition = Object.assign({ components: {} }, definition);
  return swaggerJsDoc({
    failOnErrors: true,
    definition: _definition,
    apis,
  });
}
