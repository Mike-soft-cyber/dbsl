import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText } from 'lucide-react';

export default function RecentDocuments({ userId }) {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const fetchRecent = async () => {
      try {
        const res = await axios.get(`/api/documents/recent/${userId}`);
        console.log("Fetched documents:", res.data);

        // Defensive handling
        if (Array.isArray(res.data)) {
          setDocuments(res.data);
        } else if (Array.isArray(res.data.documents)) {
          setDocuments(res.data.documents);
        } else {
          setDocuments([]);
        }

      } catch (err) {
        console.error("Error fetching recent documents:", err);
        setDocuments([]); // fallback on error
      }
    };

    fetchRecent();
  }, [userId]);

  return (
    <div>
      <div className='flex flex-column gap-2'>
        <FileText />
        <h2>Recent Documents</h2>
      </div>
      {documents.length === 0 ? (
        <p>No recent documents</p>
      ) : (
        documents.map(doc => (
          <div key={doc._id}>
            <h3>{doc.type}</h3>
          </div>
        ))
      )}
    </div>
  );
}
