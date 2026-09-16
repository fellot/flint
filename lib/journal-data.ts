import { WineValidationError } from './wine-data';
import type { Wine } from '@/types/wine';
import type { CellarPerson, WineParticipant, WineReview } from '@/types/database';

export function reviewInput(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new WineValidationError('Expected a review.');
  const { rating, comment } = body as Record<string, unknown>;
  if (rating !== null && (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 0 || rating > 100)) {
    throw new WineValidationError('Your score must be a whole number from 0 to 100, or empty.');
  }
  if (typeof comment !== 'string' || comment.length > 5000) throw new WineValidationError('Your comment must be at most 5,000 characters.');
  return { rating: rating as number | null, comment: comment.trim() };
}

export function participantInput(body: unknown) {
  const ids = (body as { personIds?: unknown } | null)?.personIds;
  if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some(id => typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    throw new WineValidationError('Choose at least one person who shared this bottle.');
  }
  return Array.from(new Set(ids)) as string[];
}

export function personInput(body: unknown) {
  if (!body || typeof body !== 'object') throw new WineValidationError('Enter a name and email.');
  const { name, email } = body as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) throw new WineValidationError('Enter a name of at most 120 characters.');
  if (typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new WineValidationError('Enter a valid email address.');
  return { name: name.trim(), email: email.trim().toLowerCase() };
}

// Scores and comments come only from the current user's review, never the
// historical wine.rating/notes fields or another participant's review.
export function attachJournal(wines: Wine[], people: CellarPerson[], participants: WineParticipant[], reviews: WineReview[], userId: string): Wine[] {
  const ownPerson = people.find(person => person.user_id === userId)?.id;
  const names = new Map(people.map(person => [person.id, person.name]));
  const ownReviews = new Map(reviews.filter(review => review.person_id === ownPerson).map(review => [review.wine_id, review]));
  const byWine = new Map<string, WineParticipant[]>();
  for (const participant of participants) byWine.set(participant.wine_id, [...(byWine.get(participant.wine_id) || []), participant]);
  return wines.map(wine => {
    const shared = byWine.get(wine.id) || [];
    const inMyJournal = wine.status === 'consumed' && shared.some(person => person.person_id === ownPerson);
    const review = inMyJournal ? ownReviews.get(wine.id) : undefined;
    return { ...wine, inMyJournal, myRating: review?.rating ?? null, myComment: review?.comment ?? '', participants: shared.map(person => ({ id: person.person_id, name: names.get(person.person_id) || 'Member' })) };
  });
}
