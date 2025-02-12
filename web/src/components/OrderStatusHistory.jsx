import React from 'react';
import { format } from 'date-fns';

const OrderStatusHistory = ({ history }) => {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Status History</h3>
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white pointer-events-none z-10"></div>
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white pointer-events-none z-10"></div>
        <div className="flow-root max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <ul role="list" className="-mb-8 px-2">
            {history.map((entry, idx) => (
              <li key={entry.id}>
                <div className="relative pb-8">
                  {idx !== history.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-500">
                          Changed from <span className="font-medium">{entry.from_status}</span>{' '}
                          to <span className="font-medium">{entry.to_status}</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          By {entry.changedByUser?.user_name || 'Unknown'} •{' '}
                          {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                        {entry.notes && (
                          <p className="mt-1 text-sm text-gray-600">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusHistory;