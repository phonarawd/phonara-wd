import { createFileRoute } from '@tanstack/react-router';

import {
  parseFeedbackPageSearch,
  resolveFeedbackPageType,
} from '@/domain/feedback-display-contract';
import { FeedbackPage } from '@/product/surfaces/marketing/feedback-page';

export const Route = createFileRoute('/feedback')({
  validateSearch: (search: Record<string, unknown>) => parseFeedbackPageSearch(search),
  component: FeedbackRoutePage,
});

function FeedbackRoutePage() {
  const search = Route.useSearch();
  return <FeedbackPage type={resolveFeedbackPageType(search)} />;
}
