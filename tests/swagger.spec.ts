import { generateSwaggerSpec } from '@/swagger';

describe('generateSwaggerSpec', () => {
  const expected = {
    components: {},
    definitions: {},
    parameters: {},
    paths: {},
    responses: {},
    securityDefinitions: {},
    swagger: '2.0',
    tags: [],
  };

  describe.each([{}, { swaggerDefinition: {} }, undefined, null])(
    'Given an invalid swagger spec',
    (config: any) => {
      it('Then it should return a swagger definition', () => {
        expect(generateSwaggerSpec(config)).toEqual(expected);
      });
    }
  );
  describe.each([{ definition: {} }])(
    'Given an valid swagger spec',
    (config: any) => {
      it('Then it return a swagger definition', () => {
        expect(generateSwaggerSpec(config)).toEqual(expected);
      });
    }
  );
});
