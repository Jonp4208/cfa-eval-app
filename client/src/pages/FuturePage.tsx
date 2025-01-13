import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FutureProduct() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <Card>
          <div className="p-8 text-center">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Coming Soon</h1>
              <p className="text-gray-500">
                This feature is currently under development
              </p>
            </div>

            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                We're working hard to bring you new features and improvements.
                Check back soon!
              </p>
            </div>

            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full md:w-auto"
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}