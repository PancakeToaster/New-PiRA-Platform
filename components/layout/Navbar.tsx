'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { clientHasRole } from '@/lib/permissions-client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // User Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Join Dropdown
  const [isJoinDropdownOpen, setIsJoinDropdownOpen] = useState(false);
  const [isJoinDropdownVisible, setIsJoinDropdownVisible] = useState(false);

  // About Dropdown
  const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false);
  const [isAboutDropdownVisible, setIsAboutDropdownVisible] = useState(false);

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const joinCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aboutCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const user = session?.user;

  const pathname = usePathname();

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

    // Check for scroll containers on mount and AFTER navigation (pathname change)
    // We utilize a small timeout to ensure the new page DOM is mounted
    const timeoutId = setTimeout(() => {
      const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
        container.addEventListener('scroll', handleScroll, { passive: true });
      });
      handleScroll(); // Initial check on new page
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
      const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
    };
  }, [pathname]);

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
    setTimeout(() => setIsDropdownVisible(true), 10);
  };

  // Handle dropdown close with delay
  const handleDropdownClose = () => {
    setIsDropdownVisible(false);
    closeTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300);
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

  // Handle about dropdown open
  const handleAboutDropdownOpen = () => {
    if (aboutCloseTimeoutRef.current) {
      clearTimeout(aboutCloseTimeoutRef.current);
      aboutCloseTimeoutRef.current = null;
    }
    setIsAboutDropdownOpen(true);
    setTimeout(() => setIsAboutDropdownVisible(true), 10);
  };

  // Handle about dropdown close with delay
  const handleAboutDropdownClose = () => {
    setIsAboutDropdownVisible(false);
    aboutCloseTimeoutRef.current = setTimeout(() => {
      setIsAboutDropdownOpen(false);
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
      if (aboutCloseTimeoutRef.current) {
        clearTimeout(aboutCloseTimeoutRef.current);
      }
    };
  }, []);

  const getDashboardLink = () => {
    return user ? '/portal' : '/login';
  };

  // Collapsed state when scrolled
  const isCollapsed = isScrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isCollapsed
        ? 'bg-transparent'
        : isScrolled
          ? 'bg-background/90 backdrop-blur-md shadow-sm'
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
                  alt="PiRA Logo"
                  fill
                  sizes="(max-width: 768px) 100vw, 240px"
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {/* About Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleAboutDropdownOpen}
                onMouseLeave={handleAboutDropdownClose}
              >
                <Link
                  href="/about"
                  className="flex items-center space-x-1 text-sm font-medium text-foreground/80 hover:text-primary transition-colors focus:outline-none"
                  onClick={() => setIsAboutDropdownOpen(false)}
                >
                  <span>About</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAboutDropdownOpen ? 'rotate-180' : ''}`} />
                </Link>

                {isAboutDropdownOpen && (
                  <div
                    className={`absolute left-0 mt-2 w-48 bg-popover text-popover-foreground rounded-lg shadow-xl py-2 border border-border transition-all duration-300 ${isAboutDropdownVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-2'
                      }`}
                  >
                    <Link
                      href="/about"
                      className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary"
                      onClick={() => setIsAboutDropdownOpen(false)}
                    >
                      About Us
                    </Link>
                    <Link
                      href="/history"
                      className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary"
                      onClick={() => setIsAboutDropdownOpen(false)}
                    >
                      Our History
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/courses"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                Courses
              </Link>
              <Link
                href="/events"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                Events
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                Blog
              </Link>
              <ThemeToggle />
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-1 text-foreground/80 hover:text-primary focus:outline-none"
                  >
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-lg shadow-lg py-2 border border-border">
                      <Link
                        href="/portal"
                        className="block px-4 py-2 text-sm text-foreground/80 hover:bg-accent"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Portal
                      </Link>
                      <Link
                        href="/contact"
                        className="block px-4 py-2 text-sm text-foreground/80 hover:bg-accent"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Contact Us
                      </Link>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-accent"
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
                    className="flex items-center space-x-1 bg-primary text-primary-foreground px-5 py-2 rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <span>Join Now</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isJoinDropdownOpen ? 'rotate-180' : ''}`} />
                  </Link>
                  {isJoinDropdownOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-40 bg-popover text-popover-foreground rounded-lg shadow-xl py-2 border border-border transition-all duration-300 ${isJoinDropdownVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 -translate-y-2'
                        }`}
                    >
                      <Link
                        href="/join"
                        className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary font-medium"
                        onClick={() => setIsJoinDropdownOpen(false)}
                      >
                        Create Account
                      </Link>
                      <hr className="my-1 border-border" />
                      <Link
                        href="/login"
                        className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary"
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
              className="md:hidden text-foreground/80 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )}

      {/* Collapsed navbar - floating dropdown trigger */}
      {isCollapsed && (
        <div className="flex justify-end items-center gap-2 p-4">
          <ThemeToggle />
          <div
            className="relative"
            onMouseEnter={handleDropdownOpen}
            onMouseLeave={handleDropdownClose}
          >
            {user ? (
              <button className="flex items-center space-x-1 text-foreground hover:text-primary font-medium text-sm bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm transition-all hover:shadow-md">
                <span>{user.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button className="flex items-center space-x-1 bg-primary text-primary-foreground px-5 py-2 rounded-full hover:bg-primary/90 transition-all text-sm font-medium shadow-sm hover:shadow-md">
                <span>Join Now</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div
                className={`absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-lg shadow-xl py-2 border border-border transition-all duration-300 ${isDropdownVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-2'
                  }`}
              >
                {user && (
                  <>
                    <Link
                      href={getDashboardLink()}
                      className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary font-medium"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <hr className="my-1 border-border" />
                  </>
                )}
                <Link
                  href="/about"
                  className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/courses"
                  className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Courses
                </Link>
                <Link
                  href="/history"
                  className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  History
                </Link>
                <Link
                  href="/events"
                  className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Events
                </Link>
                <Link
                  href="/blog"
                  className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Blog
                </Link>
                <Link
                  href="/join"
                  className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-primary"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Join Us
                </Link>
                <hr className="my-1 border-border" />
                <Link
                  href="/contact"
                  className="block px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-primary"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Contact Us
                </Link>
                {user ? (
                  <>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-destructive/10"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <hr className="my-1 border-border" />
                    <Link
                      href="/login"
                      className="block px-4 py-2.5 text-sm text-primary hover:bg-accent font-medium"
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
        <div className="md:hidden bg-popover border-t border-border">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link
              href="/about"
              className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/history"
              className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent rounded-md pl-6"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Our History
            </Link>
            <Link
              href="/courses"
              className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Courses
            </Link>
            <Link
              href="/events"
              className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/blog"
              className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/join"
              className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Join Us
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact Us
            </Link>
            {user ? (
              <>
                <hr className="my-2 border-border" />
                <Link
                  href={getDashboardLink()}
                  className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-destructive/10 rounded-md"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-3 py-2 text-base font-medium text-primary hover:bg-accent rounded-md"
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