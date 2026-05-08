'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export default function TestConnectionPage() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function testDB() {
      try {
        console.log('Testing Firestore connection...');
        
        // Attempt to fetch 1 document from 'products' collection
        const q = query(collection(db, 'products'), limit(1));
        const snapshot = await getDocs(q);
        
        const fetchedData: any[] = [];
        snapshot.forEach(doc => {
          fetchedData.push({ id: doc.id, ...doc.data() });
        });

        setData(fetchedData);
        setStatus('success');
        console.log('✅ Firestore Connection Successful!', fetchedData);
      } catch (err: any) {
        console.error('❌ Firestore Connection Error:', err);
        setStatus('error');
        
        if (err.code === 'permission-denied') {
          setErrorDetails('Permission Denied: Check your firestore.rules. Are you allowing read access?');
        } else if (err.code === 'unavailable' || err.message?.includes('offline')) {
          setErrorDetails('Unavailable: Could not reach Firestore. Check your network or API keys in .env.local.');
        } else {
          setErrorDetails(err.message || 'An unknown error occurred.');
        }
      }
    }

    testDB();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-xl w-full bg-sand p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Firebase Database Connection Test
        </h1>

        <div className="flex flex-col items-center justify-center space-y-4">
          {status === 'testing' && (
            <>
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium tracking-wide animate-pulse">Connecting to Firestore...</p>
            </>
          )}

          {status === 'success' && (
            <div className="w-full text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-green-700">Connection Successful!</h2>
              <p className="text-gray-600 text-sm">Your application is successfully reading from the live database.</p>
              
              <div className="mt-6 text-left bg-gray-50 p-4 rounded-xl border border-gray-200 overflow-hidden">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Sample Data Fetched (1 Product):</p>
                <pre className="text-[11px] text-gray-700 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="w-full text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-red-700">Connection Failed</h2>
              
              <div className="mt-6 text-left bg-red-50 p-4 rounded-xl border border-red-200 overflow-hidden">
                <p className="text-xs font-bold text-red-800 uppercase mb-2">Error Details:</p>
                <p className="text-sm font-medium text-red-900">{errorDetails}</p>
                
                <div className="mt-4 text-xs text-red-700 border-t border-red-200 pt-3 space-y-2">
                  <p><strong>Troubleshooting Steps:</strong></p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Verify that <code>.env.local</code> contains the correct Firebase keys.</li>
                    <li>Ensure you have restarted the Next.js dev server after modifying <code>.env.local</code>.</li>
                    <li>Check if <code>firestore.rules</code> is blocking the read access.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
