import { LIMITS, IMAGE_TYPES, CONTROL_CHARS } from './constants';

export function validatePost(values) {
  const errors = {};
  const title = (values.title || '').trim();
  const content = (values.content || '').trim();
  const contentText = content.replace(/<[^>]*>/g, '').trim();

  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length > LIMITS.title) {
    errors.title = `Title must be ${LIMITS.title} characters or fewer.`;
  } else if (CONTROL_CHARS.test(title)) {
    errors.title = 'Title contains invalid characters.';
  }

  if (!contentText) {
    errors.content = 'Content is required.';
  } else if (content.length > LIMITS.content) {
    errors.content = 'Content is too long.';
  }

  if (values.excerpt && values.excerpt.length > LIMITS.excerpt) {
    errors.excerpt = `Excerpt must be ${LIMITS.excerpt} characters or fewer.`;
  }

  if (values.imageFile) {
    if (!IMAGE_TYPES.includes(values.imageFile.type)) {
      errors.image = 'Only JPEG, PNG, GIF and WebP images are supported.';
    } else if (values.imageFile.size > LIMITS.imageBytes) {
      errors.image = 'Image must be 5 MB or smaller.';
    }
  }

  return errors;
}
