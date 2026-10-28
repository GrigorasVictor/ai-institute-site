import { errors } from '@strapi/utils';

export default {
  beforeCreate(event) {
    const { data } = event.params;

    // Strapi publishes and republishes by creating a published row.
    // Draft rows have no publishedAt and may still contain incomplete text.
    if (!data.publishedAt) return;

    const invalidFields = ['title', 'summary'].filter(
      (field) => typeof data[field] !== 'string' || data[field].trim().length === 0,
    );

    if (invalidFields.length > 0) {
      throw new errors.ValidationError('News title and summary must contain non-whitespace text.', {
        errors: invalidFields.map((field) => ({
          path: [field],
          message: `${field} must contain non-whitespace text.`,
          name: 'ValidationError',
        })),
      });
    }
  },
};
