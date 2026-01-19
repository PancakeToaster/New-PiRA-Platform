'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { clientHasRole } from '@/lib/permissions-client';

export default function Navbar() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isJoinDropdownOpen, setIsJoinDropdownOpen] = useState(false);
  const [isJoinDropdownVisible, setIsJoinDropdownVisible] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const joinCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const user = session?.user;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
        return;
      }

      const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
      for (const container of scrollContainers) {
        if (container.scrollTop > 50) {
          setIsScrolled(true);
          return;
        }
      }

      setIsScrolled(false);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new MutationObserver(() => {
      const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
        container.addEventListener('scroll', handleScroll, { passive: true });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
    scrollContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll, { passive: true });
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
    };
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Handle dropdown open with immediate show
  const handleDropdownOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsDropdownOpen(true);
    // Small delay to trigger CSS transition
    setTimeout(() => setIsDropdownVisible(true), 10);
  };

  // Handle dropdown close with delay
  const handleDropdownClose = () => {
    setIsDropdownVisible(false);
    closeTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300); // Wait for fade out animation to complete
  };

  // Handle join dropdown open
  const handleJoinDropdownOpen = () => {
    if (joinCloseTimeoutRef.current) {
      clearTimeout(joinCloseTimeoutRef.current);
      joinCloseTimeoutRef.current = null;
    }
    setIsJoinDropdownOpen(true);
    setTimeout(() => setIsJoinDropdownVisible(true), 10);
  };

  // Handle join dropdown close with delay
  const handleJoinDropdownClose = () => {
    setIsJoinDropdownVisible(false);
    joinCloseTimeoutRef.current = setTimeout(() => {
      setIsJoinDropdownOpen(false);
    }, 300);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (joinCloseTimeoutRef.current) {
        clearTimeout(joinCloseTimeoutRef.current);
      }
    };
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (clientHasRole(user, 'Admin')) return '/admin';
    if (clientHasRole(user, 'Teacher')) return '/lms';
    if (clientHasRole(user, 'Student')) return '/lms';
    if (clientHasRole(user, 'Parent')) return '/parent';
    return '/dashboard';
  };

  // Collapsed state when scrolled
  const isCollapsed = isScrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isCollapsed
        ? 'bg-transparent'
        : isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
        }`}
    >
      {/* Full navbar - shown when not scrolled */}
      {!isCollapsed && (
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="relative h-16 w-60">
                <Image
                  src="/images/logo.png"
                  alt="Robotics Academy Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link
                href="/about"
                className="text-sm font-medium text-gray-700 hover:text-sky-500 transition-colors"
              >
                About
              </Link>
              <Link
                href="/courses"
                className="text-sm font-medium text-gray-700 hover:text-sky-500 transition-colors"
              >
                Courses
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-gray-700 hover:text-sky-500 transition-colors"
              >
                Blog
              </Link>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-sky-500 focus:outline-none"
                  >
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                      <Link
                        href={getDashboardLink()}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-sky-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/contact"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-sky-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Contact Us
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-sky-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="relative"
                  onMouseEnter={handleJoinDropdownOpen}
                  onMouseLeave={handleJoinDropdownClose}
                >
                  <Link
                    href="/join"
                    className="flex items-center space-x-1 bg-sky-500 text-white px-5 py-2 rounded-full hover:bg-sky-600 transition-colors text-sm font-medium"
                  >
                    <span>Join Now</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isJoinDropdownOpen ? 'rotate-180' : ''}`} />
                  </Link>
                  {isJoinDropdownOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl py-2 border border-gray-100 transition-all duration-300 ${isJoinDropdownVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 -translate-y-2'
                        }`}
                    >
                      <Link
                        href="/join"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 font-medium"
                        onClick={() => setIsJoinDropdownOpen(false)}
                      >
                        Create Account
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <Link
                        href="/login"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600"
                        onClick={() => setIsJoinDropdownOpen(false)}
                      >
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-700 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )}

      {/* Collapsed navbar - floating dropdown trigger */}
      {isCollapsed && (
        <div className="flex justify-end p-4">
          <div
            className="relative"
            onMouseEnter={handleDropdownOpen}
            onMouseLeave={handleDropdownClose}
          >
            {user ? (
              <button className="flex items-center space-x-1 text-gray-800 hover:text-sky-500 font-medium text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm transition-all hover:shadow-md">
                <span>{user.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button className="flex items-center space-x-1 bg-sky-500 text-white px-5 py-2 rounded-full hover:bg-sky-600 transition-all text-sm font-medium shadow-sm hover:shadow-md">
                <span>Join Now</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div
                className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-100 transition-all duration-300 ${isDropdownVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-2'
                  }`}
              >
                {user && (
                  <>
                    <Link
                      href={getDashboardLink()}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 font-medium"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <hr className="my-1 border-gray-100" />
                  </>
                )}
                <Link
                  href="/about"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/courses"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Courses
                </Link>
                <Link
                  href="/blog"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Blog
                </Link>
                <Link
                  href="/join"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Join Us
                </Link>
                <hr className="my-1 border-gray-100" />
                <Link
                  href="/contact"
                  className="block px-4 py-2.5 text-sm text-gray-500 hover:bg-sky-50 hover:text-sky-600"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Contact Us
                </Link>
                {user ? (
                  <>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <hr className="my-1 border-gray-100" />
                    <Link
                      href="/login"
                      className="block px-4 py-2.5 text-sm text-sky-600 hover:bg-sky-50 font-medium"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu - only shown when not collapsed */}
      {isMobileMenuOpen && !isCollapsed && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link
              href="/about"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-sky-500 hover:bg-sky-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/courses"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-sky-500 hover:bg-sky-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Courses
            </Link>
            <Link
              href="/blog"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-sky-500 hover:bg-sky-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/join"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-sky-500 hover:bg-sky-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Join Us
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-sky-500 hover:bg-sky-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact Us
            </Link>
            {user ? (
              <>
                <hr className="my-2 border-gray-200" />
                <Link
                  href={getDashboardLink()}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-sky-500 hover:bg-sky-50 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-3 py-2 text-base font-medium text-sky-500 hover:bg-sky-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}