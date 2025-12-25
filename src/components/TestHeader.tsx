import { Link } from "react-router-dom";

export function TestHeader() {
  return (
    <header className="bg-gray-900 border-b border-gray-800 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-white text-xl font-bold">
          SmartFit AI
        </Link>
        <nav className="flex items-center space-x-6">
          <Link to="/" className="text-gray-300 hover:text-white">
            Home
          </Link>
          <Link to="/nutrition" className="text-gray-300 hover:text-white">
            Nutrition
          </Link>
          <Link to="/guides" className="text-gray-300 hover:text-white">
            Guides
          </Link>
          <Link to="/auth" className="bg-blue-600 text-white px-4 py-2 rounded">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}




