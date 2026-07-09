import { Star } from 'lucide-react';

import { type LandingTestimonialEntry } from '@/domain/landing-display-contract';
import { useT } from '@/product/i18n';
import { Card, CardBody } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

export type LandingTestimonialsProps = {
  entries: readonly LandingTestimonialEntry[];
  className?: string;
};

function TestimonialStars({ rating }: { rating: LandingTestimonialEntry['rating'] }) {
  const t = useT();

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={t('landing.testimonial.ratingAria', { count: String(rating) })}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            'size-3.5',
            index < rating ? 'fill-accent text-accent' : 'text-foreground-muted/40',
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

/** L5 operator-verified quotes — hidden when pool empty (CVR §3.5). */
export function LandingTestimonials({ entries, className }: LandingTestimonialsProps) {
  const t = useT();

  if (entries.length === 0) return null;

  return (
    <section className={cn('flex flex-col gap-4', className)} data-testid="landing-testimonials">
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground m-0 text-2xl font-semibold">
          {t('landing.testimonial.title')}
        </h2>
        <p className="text-foreground-muted m-0 text-sm">{t('landing.testimonial.subtitle')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {entries.map((entry) => (
          <Card key={entry.id} data-testid={`landing-testimonial-${entry.id}`}>
            <CardBody className="flex flex-col gap-3">
              <TestimonialStars rating={entry.rating} />
              <blockquote className="text-foreground m-0 text-sm leading-relaxed">
                “{t(entry.quoteKey)}”
              </blockquote>
              <p className="text-foreground-muted m-0 text-xs font-medium">{t(entry.nameKey)}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
