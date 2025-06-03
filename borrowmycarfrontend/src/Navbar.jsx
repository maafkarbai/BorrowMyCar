import { useState, useEffect } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  const [scrolled, setScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    if (token) {
      setUserProfile({
        name: "John Doe",
        email: "john@example.com",
        avatar: null,
        initials: "JD",
      });
    } else {
      setUserProfile(null);
    }
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  const handleNavigation = (path) => {
    setCurrentPath(path);
    window.location.href = path;
    closeMenu();
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserProfile(null);
    setCurrentPath("/");
    window.location.href = "/";
    closeMenu();
  };

  const isActive = (path) => currentPath === path;

  return (
    <nav
      className={`sticky top-0 z-50  shadow-sm transition duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigation("/")}
            className="text-green-600 text-2xl font-bold"
          >
            🚗 BorrowMyCar
          </button>
        </div>

        <div className="hidden md:flex gap-6 items-center">
          {[
            { path: "/", label: "Home" },
            { path: "/browse", label: "Browse" },
            { path: "/how-it-works", label: "How It Works" },
          ].map(({ path, label }) => (
            <button
              key={path}
              onClick={() => handleNavigation(path)}
              className={`text-sm ${
                isActive(path)
                  ? "text-green-600 font-semibold"
                  : "text-gray-700 hover:text-green-600"
              }`}
            >
              {label}
            </button>
          ))}
          {isLoggedIn && (
            <>
              <button
                onClick={() => handleNavigation("/dashboard")}
                className="text-sm text-gray-700 hover:text-green-600"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigation("/my-bookings")}
                className="text-sm text-gray-700 hover:text-green-600"
              >
                My Trips
              </button>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {!isLoggedIn ? (
            <>
              <button
                onClick={() => handleNavigation("/login")}
                className="text-sm text-gray-700 hover:text-green-600"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavigation("/signup")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm"
              >
                Get Started
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-500 rounded-full text-white flex items-center justify-center text-sm font-bold">
                {userProfile?.initials || "U"}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:underline"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        <button onClick={toggleMenu} className="md:hidden text-gray-600">
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-3">
          {[
            { path: "/", label: "Home" },
            { path: "/browse", label: "Browse" },
            { path: "/how-it-works", label: "How It Works" },
          ].map(({ path, label }) => (
            <button
              key={path}
              onClick={() => handleNavigation(path)}
              className={`block text-left w-full text-sm ${
                isActive(path)
                  ? "text-green-600 font-semibold"
                  : "text-gray-700 hover:text-green-600"
              }`}
            >
              {label}
            </button>
          ))}
          {isLoggedIn ? (
            <>
              <button
                onClick={() => handleNavigation("/dashboard")}
                className="block w-full text-left text-sm text-gray-700 hover:text-green-600"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigation("/my-bookings")}
                className="block w-full text-left text-sm text-gray-700 hover:text-green-600"
              >
                My Trips
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left text-sm text-red-500 hover:underline"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavigation("/login")}
                className="block w-full text-left text-sm text-gray-700 hover:text-green-600"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavigation("/signup")}
                className="block w-full text-left text-sm text-green-600 font-semibold"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
