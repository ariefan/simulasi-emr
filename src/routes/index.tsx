import { Navigate, createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return <Navigate to="/login" />;
}
