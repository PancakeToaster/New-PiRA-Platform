'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';

interface CourseInterestButtonProps {
  courseId: string;
}

export default function CourseInterestButton({ courseId }: CourseInterestButtonProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if user has already voted
    async function checkVoteStatus() {
      try {
        const response = await fetch(`/api/courses/${courseId}/interest`);
        if (response.ok) {
          const data = await response.json();
          setHasVoted(data.hasVoted);
        }
      } catch (error) {
        console.error('Failed to check vote status:', error);
      }
    }
    checkVoteStatus();
  }, [courseId]);

  const handleVote = async () => {
    if (hasVoted || isLoading) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/courses/${courseId}/interest`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setHasVoted(true);
        setShowAnimation(true);
        setMessage('Thanks for your interest!');
        setTimeout(() => setShowAnimation(false), 1000);
      } else if (data.alreadyVoted) {
        setHasVoted(true);
        setMessage('Already registered');
      } else {
        setMessage('Error occurred');
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      setMessage('Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleVote}
        disabled={hasVoted || isLoading}
        className={`relative flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
          hasVoted
            ? 'bg-pink-100 text-pink-600 cursor-default'
            : 'bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-500'
        }`}
        title={hasVoted ? 'Thanks for your interest!' : 'Show interest in this course'}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Heart
            className={`w-5 h-5 transition-all duration-300 ${
              hasVoted ? 'fill-current' : ''
            } ${showAnimation ? 'scale-125' : ''}`}
          />
        )}
        <span className="text-sm font-medium">
          {hasVoted ? "I'm interested" : 'Show Interest'}
        </span>

        {/* Animated hearts on vote */}
        {showAnimation && (
          <>
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 animate-ping">
              <Heart className="w-3 h-3 text-pink-400 fill-current" />
            </span>
            <span className="absolute -top-1 left-1/4 animate-ping delay-75">
              <Heart className="w-2 h-2 text-pink-300 fill-current" />
            </span>
            <span className="absolute -top-1 right-1/4 animate-ping delay-150">
              <Heart className="w-2 h-2 text-pink-300 fill-current" />
            </span>
          </>
        )}
      </button>
      {message && (
        <p className={`mt-2 text-xs ${hasVoted ? 'text-pink-600' : 'text-gray-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
