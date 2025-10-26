import React, { useState, useEffect } from 'react';
import { FileText, Clock, Users, Target, BookOpen, CheckCircle } from 'lucide-react';

// ✅ Fixed Professional Image Component - No HTML nesting issues
export const ProfessionalImageComponent = ({ src, alt, documentId, learningArea, ...props }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState('');
  
  useEffect(() => {
    console.log('[ImageComponent] Raw src:', src);
    
    if (!src || src === '#') {
      setImageError(true);
      setImageLoading(false);
      return;
    }
    
    let finalSrc = src;
    
    if (src.startsWith('data:image')) {
      finalSrc = src;
      console.log('[ImageComponent] Using stored base64 data');
    }
    else if (src.startsWith('/api/diagrams/')) {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
      finalSrc = `${API_BASE}${src}`;
      console.log('[ImageComponent] Using file path:', finalSrc);
    }
    else if (src.startsWith('http://') || src.startsWith('https://')) {
      finalSrc = src;
      console.log('[ImageComponent] Using full URL:', finalSrc);
    }
    else if (src.includes('.png') || src.includes('.jpg') || src.includes('.jpeg')) {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
      finalSrc = `${API_BASE}/api/diagrams/${src}`;
      console.log('[ImageComponent] Constructed URL from filename:', finalSrc);
    }
    
    setImageSrc(finalSrc);
    setImageError(false);
    setImageLoading(true);
  }, [src]);
  
  const getPlaceholderContent = () => {
    const subject = (learningArea || '').toLowerCase();
    const subjects = {
      'mathematics': { text: 'Mathematical Diagram' },
      'science': { text: 'Scientific Illustration' },
      'social': { text: 'Social Studies Diagram' },
      'default': { text: 'Educational Diagram' }
    };
    const key = Object.keys(subjects).find(key => key !== 'default' && subject.includes(key)) || 'default';
    return subjects[key];
  };

  const placeholder = getPlaceholderContent();

  if (!imageSrc || imageError) {
    return (
      <span className="block my-6">
        <span className="block w-full max-w-lg mx-auto border border-gray-300 rounded-lg p-8 bg-gray-50">
          <span className="block text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <span className="block text-black font-medium text-lg">{placeholder.text}</span>
            <span className="block text-black text-sm mt-1">{alt || "Visual learning aid"}</span>
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="block my-6 text-center">
      <span className="block relative bg-white rounded-lg shadow-sm border">
        {imageLoading && (
          <span className="absolute inset-0 flex items-center justify-center bg-gray-50" style={{ minHeight: '256px' }}>
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></span>
          </span>
        )}
        <img
          className="max-w-full h-auto object-contain mx-auto"
          style={{ maxHeight: '384px', display: imageLoading ? 'none' : 'block' }}
          src={imageSrc}
          alt={alt}
          onLoad={() => {
            console.log('[ImageComponent] ✅ Image loaded:', imageSrc);
            setImageLoading(false);
          }}
          onError={() => {
            console.error('[ImageComponent] ❌ Failed to load:', imageSrc);
            setImageError(true);
            setImageLoading(false);
          }}
        />
      </span>
      {alt && !imageError && (
        <span className="block text-sm text-black mt-3 italic">{alt}</span>
      )}
    </span>
  );
};

// ✅ Fixed markdown components - no nesting issues
const professionalMarkdownComponents = {
  h1: ({ node, children, ...props }) => (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-center text-black" {...props}>{children}</h1>
    </div>
  ),
  
  h2: ({ node, children, ...props }) => (
    <h2 className="text-2xl font-bold text-black mt-8 mb-6" {...props}>{children}</h2>
  ),
  
  h3: ({ node, children, ...props }) => (
    <h3 className="text-xl font-bold text-black mt-6 mb-3" {...props}>{children}</h3>
  ),
  
  h4: ({ node, ...props }) => (
    <h4 className="text-lg font-bold text-black mt-4 mb-2" {...props} />
  ),
  
  // ✅ CRITICAL FIX: Don't wrap images in <p> tags
  p: ({ node, children, ...props }) => {
    // Check if this paragraph contains an image
    const hasImage = node?.children?.some(child => child.tagName === 'img');
    
    // If it contains an image, render children directly without <p> wrapper
    if (hasImage) {
      return <>{children}</>;
    }
    
    return <p className="text-black leading-relaxed mb-4" {...props}>{children}</p>;
  },
  
  ul: ({ node, ...props }) => (
    <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />
  ),
  
  ol: ({ node, ...props }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />
  ),
  
  li: ({ node, ...props }) => <li className="text-black" {...props} />,
  
  strong: ({ node, ...props }) => <strong className="font-bold text-black" {...props} />,
  
  em: ({ node, ...props }) => <em className="italic text-black" {...props} />,
  
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-4 border-blue-400 pl-6 py-4 my-6 text-black" {...props} />
  ),
  
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 shadow-lg rounded-lg">
      <table className="min-w-full border border-gray-300 rounded-lg bg-white" {...props} />
    </div>
  ),
  
  th: ({ node, ...props }) => (
    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-black" {...props} />
  ),
  
  td: ({ node, ...props }) => (
    <td className="border border-gray-300 px-4 py-3 text-black" {...props} />
  ),
  
  code: ({ node, inline, ...props }) => 
    inline ? (
      <code className="bg-gray-100 text-black px-2 py-1 rounded font-mono text-sm" {...props} />
    ) : (
      <pre className="bg-gray-100 text-black p-4 rounded-lg text-sm font-mono overflow-x-auto my-4">
        <code {...props} />
      </pre>
    ),
  
  hr: ({ node, ...props }) => (
    <div className="my-8 flex items-center">
      <div className="flex-grow h-px bg-gray-300"></div>
      <div className="px-4"><div className="w-3 h-3 bg-gray-400 rounded-full"></div></div>
      <div className="flex-grow h-px bg-gray-300"></div>
    </div>
  )
};

export const getProfessionalMarkdownComponents = () => professionalMarkdownComponents;
export const professionalMarkdownComponentsExport = professionalMarkdownComponents;