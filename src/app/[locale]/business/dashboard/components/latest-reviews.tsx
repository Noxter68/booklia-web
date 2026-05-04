'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, MessageCircle, Reply } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { Review } from '@/types';
import { ReviewReplyModal } from '@/components/reviews/review-reply-modal';

interface LatestReviewsProps {
  businessId: string;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= score ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

export function LatestReviews({ businessId }: LatestReviewsProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [replyReview, setReplyReview] = useState<Review | null>(null);

  const { data: reviews } = useQuery({
    queryKey: ['business-reviews', businessId],
    queryFn: () => api.getBusinessReviews(businessId),
    enabled: !!businessId,
  });

  if (!reviews || reviews.length === 0) return null;

  const latestReviews = reviews.slice(0, 6);

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mt-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5" />
          {t('latestReviews')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {latestReviews.map((review) => {
            const authorName = review.author?.name || 'Client';
            const serviceName = review.booking?.businessService?.name;
            const date = new Date(review.createdAt).toLocaleDateString(locale, {
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={review.id}
                className="border border-border rounded-xl p-4 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-primary">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium truncate">{authorName}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{date}</span>
                </div>

                {/* Stars + service */}
                <div className="flex items-center gap-2 mb-2">
                  <StarRating score={review.score} />
                  {serviceName && (
                    <span className="text-[11px] text-muted-foreground truncate">{serviceName}</span>
                  )}
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 flex-1">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}

                {/* Reply or reply button */}
                {review.reply ? (
                  <div className="mt-3 bg-muted/30 rounded-lg px-3 py-2">
                    <p className="text-[11px] text-muted-foreground mb-0.5 font-medium">{t('reviewReply')}</p>
                    <p className="text-xs text-foreground/80 line-clamp-2">{review.reply}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyReview(review)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors cursor-pointer self-start"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    {t('reviewRespond')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ReviewReplyModal
        review={replyReview}
        onClose={() => setReplyReview(null)}
      />
    </>
  );
}
