import { SITE } from '../config/site.config';

export const formatDate = (d: Date) =>
  d.toLocaleDateString(SITE.locale.replace('_', '-'), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
