import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="text-7xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
