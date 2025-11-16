import React from 'react';

export function LoadingCard({ message }: { message?: string }) {
    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 text-center">
                <div className="inline-block align-top w-4 h-4 mr-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                {message || 'Loading'}
            </div>
        </div>
    );
}
