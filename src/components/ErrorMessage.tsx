import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorMessage({ message, action }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-800">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}