"use client";

import { useEffect, useRef, useState } from "react";
import { FaStar } from "react-icons/fa";
import { RiDoubleQuotesL, RiDoubleQuotesR } from "react-icons/ri";

type Testimonial = {
  id: string;
  rating: number; // 1-5
  comment: string;
  customerName: string;
};

interface ReviewSliderProps {
  items?: Testimonial[]; // If provided, use these instead of fetching
}

const ReviewSlider = ({ items }: ReviewSliderProps) => {
  const [reviews, setReviews] = useState<Testimonial[]>(items ?? []);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch from API if no items provided
  useEffect(() => {
    if (items && items.length > 0) return; // using provided testimonials
    const fetchReviews = async () => {
      try {
        const { getAllReviews } = await import("@/lib/server/fetchUsers");
        const data = await getAllReviews();
        const mapped: Testimonial[] = (data || []).map((r: any) => ({
          id: r.id,
          comment: r.comment,
          rating: Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0))),
          customerName: r?.customer?.name || "Anónimo",
        }));
        setReviews(mapped);
        setCurrent(0);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };
    fetchReviews();
  }, [items]);

  // Sync when items prop changes
  useEffect(() => {
    if (items && items.length > 0) {
      setReviews(items);
      setCurrent(0);
    }
  }, [items]);

  // Autoplay
  useEffect(() => {
    if (!reviews || reviews.length <= 1) return;
    if (paused) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 3000);
    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
  }, [reviews, paused]);

  if (!reviews || reviews.length === 0) return null;

  const goTo = (index: number) => setCurrent(index);
  const prev = () => setCurrent((c) => (c - 1 + reviews.length) % reviews.length);
  const next = () => setCurrent((c) => (c + 1) % reviews.length);

  return (
    <div
      className="w-full max-w-full text-white p-4 m-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden max-w-3xl mx-auto">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {reviews.map((review) => (
            <div key={review.id} className="min-w-full flex justify-center items-center">
              <div className="p-10 bg-white text-black rounded-lg w-full max-w-lg mx-auto">
                <div className="flex justify-between">
                  <RiDoubleQuotesL color="black" />
                  <RiDoubleQuotesR />
                </div>
                <div className="flex justify-center mb-2 space-x-1">
                  {Array.from({ length: review.rating }, (_, i) => (
                    <FaStar key={i} color="#FBC02D" />
                  ))}
                </div>
                <p>{review.comment}</p>
                <p className="text-center p-4">- {review.customerName}</p>
              </div>
            </div>
          ))}
        </div>

        {reviews.length > 1 && (
          <>
            <button
              aria-label="Anterior"
              onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[#f8263a] px-3 py-2"
            >
              ‹
            </button>
            <button
              aria-label="Siguiente"
              onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[#f8263a] px-3 py-2"
            >
              ›
            </button>
          </>
        )}
      </div>

      {reviews.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`h-2 w-2 rounded-full ${
                current === i ? "bg-[#f8263a]" : "bg-[#f8263a]/40"
              }`}
            />)
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewSlider;
