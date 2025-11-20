// ✅ markdownComponents.jsx – Enhanced for web references and thumbnail cards
import React, { useState, useEffect } from "react";
import { FileText, ExternalLink, Globe, Image as ImageIcon } from "lucide-react";

// ✅ Professional Image Component (fallback for any remaining images)
export const ProfessionalImageComponent = ({
  src,
  alt,
  documentId,
  learningArea,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    console.log("[ImageComponent] Raw src:", src);

    if (!src || src === "#") {
      setImageError(true);
      setImageLoading(false);
      return;
    }

    let finalSrc = src || "";
    const API_BASE = (
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
    ).replace(/\/api.*$/, "");

    console.log("[ImageComponent] API_BASE:", API_BASE);

    // ✅ Handle different formats safely
    if (src.startsWith("data:image")) {
      finalSrc = src;
      console.log("[ImageComponent] Type: base64");
    } else if (src.startsWith("http://") || src.startsWith("https://")) {
      finalSrc = src;
      console.log("[ImageComponent] Type: full URL");
    } else {
      // ✅ Clean markdown and unsafe characters only for file/relative paths
      finalSrc = (src || "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/__/g, "")
        .replace(/_/g, "")
        .replace(/\s+/g, "-")
        .replace(/[`~!@#$%^&*()+={}|[\]\\:";'<>?,]/g, "")
        .trim();

      if (src.startsWith("/")) {
        finalSrc = `${API_BASE}${finalSrc}`;
        console.log("[ImageComponent] Type: absolute path");
      } else {
        finalSrc = `${API_BASE}/api/diagrams/${finalSrc}`;
        console.log("[ImageComponent] Type: filename only");
      }
    }

    console.log("[ImageComponent] ✅ Final URL:", finalSrc);
    setImageSrc(finalSrc);
    setImageError(false);
    setImageLoading(true);
  }, [src, documentId]);

  const getPlaceholderContent = () => {
    const subject = (learningArea || "").toLowerCase();
    const subjects = {
      mathematics: { text: "Mathematical Diagram", icon: "🧮" },
      science: { text: "Scientific Illustration", icon: "🔬" },
      social: { text: "Social Studies Diagram", icon: "🌍" },
      agriculture: { text: "Agricultural Diagram", icon: "🌾" },
      business: { text: "Business Studies Diagram", icon: "💼" },
      default: { text: "Educational Diagram", icon: "📊" },
    };
    const key =
      Object.keys(subjects).find(
        (key) => key !== "default" && subject.includes(key)
      ) || "default";
    return subjects[key];
  };

  const placeholder = getPlaceholderContent();

  const handleImageError = (e) => {
    console.warn("[ImageComponent] ❌ Failed to load:", imageSrc);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = (e) => {
    console.log("[ImageComponent] ✅ Loaded:", imageSrc);
    console.log(
      "[ImageComponent] Dimensions:",
      e.target?.naturalWidth,
      "x",
      e.target?.naturalHeight
    );
    setImageLoading(false);
  };

  if (!imageSrc || imageError) {
    return (
      <div className="block my-6">
        <div className="w-full max-w-lg mx-auto border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
          <div className="text-4xl mb-3">{placeholder.icon}</div>
          <div className="text-gray-700 font-medium text-lg mb-1">
            {placeholder.text}
          </div>
          <div className="text-gray-600 text-sm">
            {alt || "Visual learning aid"}
          </div>
          <div className="text-gray-500 text-xs mt-2">Refer to external web resources</div>
        </div>
      </div>
    );
  }

  return (
    <div className="block my-6 text-center">
      <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 inline-block max-w-full">
        {imageLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg"
            style={{ minHeight: "200px", minWidth: "200px" }}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-600 text-sm">Loading diagram...</div>
            </div>
          </div>
        )}
        <img
          className="max-w-full h-auto object-contain mx-auto rounded-lg"
          style={{
            maxHeight: "400px",
            display: imageLoading ? "none" : "block",
            minHeight: "200px",
          }}
          src={imageSrc}
          alt={alt || "Educational diagram"}
          onLoad={handleImageLoad}
          onError={handleImageError}
          {...props}
        />
      </div>
      {alt && !imageError && (
        <div className="text-sm text-gray-600 mt-3 italic px-4">{alt}</div>
      )}
    </div>
  );
};

// ✅ Professional Markdown Render Components (Enhanced for Web References & Thumbnail Cards)
const professionalMarkdownComponents = {
  h1: ({ children, ...props }) => (
    <h1
      className="text-3xl font-bold text-center text-gray-900 mb-8 mt-6"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, node, ...props }) => {
    // ✅ Special styling for web reference sections
    const text = children?.toString() || '';
    if (text.includes('📊 Visual Learning Resources')) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 rounded-r-lg p-6 my-8 shadow-sm">
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-3 mt-0 mb-4" {...props}>
            <span className="text-3xl">📊</span>
            {children}
          </h3>
        </div>
      );
    }
    return (
      <h3
        className="text-xl font-semibold text-gray-900 mt-6 mb-3"
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }) => (
    <h4
      className="text-lg font-semibold text-gray-900 mt-4 mb-2"
      {...props}
    >
      {children}
    </h4>
  ),

  // ✅ ENHANCED: Support for HTML div elements (for thumbnail cards)
  div: ({ node, className, children, style, ...props }) => {
    // Check if it's a reference card
    if (className === 'web-reference-card') {
      return (
        <div 
          className="flex gap-4 mb-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
          {...props}
        >
          {children}
        </div>
      );
    }

    // Check if it's inline styled reference
    if (style && typeof style === 'string' && style.includes('display: flex')) {
      return (
        <div 
          className="flex gap-4 mb-4 p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          {...props}
        >
          {children}
        </div>
      );
    }

    // Default div
    return <div className={className} style={style} {...props}>{children}</div>;
  },

  // ✅ ENHANCED: Paragraphs and images handling with reference support
  p: ({ node, children, className, ...props }) => {
    // Check if inside reference card
    if (className === 'reference-snippet') {
      return (
        <p className="text-sm text-gray-600 mt-1 line-clamp-2" {...props}>
          {children}
        </p>
      );
    }

    const hasOnlyImage = node?.children?.length === 1 && node.children[0].tagName === "img";
    if (hasOnlyImage) return <>{children}</>;

    const hasImage = node?.children?.some((c) => c.tagName === "img");
    if (hasImage) return <div className="my-4">{children}</div>;

    return (
      <p className="text-gray-800 leading-relaxed mb-4 text-base" {...props}>
        {children}
      </p>
    );
  },

  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-800" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-800" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-gray-800 leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => {
    // ✅ Special styling for reference labels
    const text = children?.toString() || '';
    if (text.startsWith('Reference ') || text === 'Source:' || text === 'Description:' || text === 'Educational Use:' || text === 'License:') {
      return (
        <strong className="font-bold text-blue-800" {...props}>
          {children}
        </strong>
      );
    }
    return (
      <strong className="font-bold text-gray-900" {...props}>
        {children}
      </strong>
    );
  },
  em: ({ children, ...props }) => {
    // ✅ Special styling for reference notes
    const text = children?.toString() || '';
    if (text.includes('external resources') || text.includes('verify content') || text.includes('External links provided')) {
      return (
        <em className="italic text-blue-700 text-sm" {...props}>
          {children}
        </em>
      );
    }
    return (
      <em className="italic text-gray-800" {...props}>
        {children}
      </em>
    );
  },
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 rounded-r-lg text-gray-700 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-6 shadow-sm border border-gray-200 rounded-lg">
      <table className="min-w-full border-collapse bg-white" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-gray-50 border-b border-gray-200" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-gray-200" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-gray-50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-gray-200 px-4 py-3 text-left font-bold text-gray-900 bg-gray-100 text-sm uppercase tracking-wide"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="border border-gray-200 px-4 py-3 text-gray-800 text-sm align-top"
      {...props}
    >
      {children}
    </td>
  ),
  code: ({ inline, children, ...props }) =>
    inline ? (
      <code
        className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-sm border border-gray-200"
        {...props}
      >
        {children}
      </code>
    ) : (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4 border border-gray-700">
        <code {...props}>{children}</code>
      </pre>
    ),
  hr: (props) => <hr className="my-8 border-t-2 border-gray-300" {...props} />,

  // ✅ Enhanced link styling for external references
  a: ({ node, href, children, ...props }) => {
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors group"
          {...props}
        >
          <Globe className="w-4 h-4 flex-shrink-0" />
          <span className="underline decoration-blue-300 group-hover:decoration-blue-600">{children}</span>
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
        </a>
      );
    }
    return (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline"
        {...props}
      >
        {children}
      </a>
    );
  },

  // ✅ ENHANCED: Better image handling for thumbnails
  img: ({ src, alt, className, style, loading, ...props }) => {
    // Reference thumbnail
    if (className === 'reference-thumbnail') {
      return (
        <div className="flex-shrink-0 w-32 h-24 overflow-hidden rounded-lg border border-gray-200">
          <img
            src={src}
            alt={alt || 'Diagram preview'}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
            loading="lazy"
            onError={(e) => {
              // Fallback to icon if image fails
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gray-100">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              `;
            }}
            {...props}
          />
        </div>
      );
    }

    // Inline thumbnail with style
    if (style && typeof style === 'string' && style.includes('width: 120px')) {
      return (
        <div className="flex-shrink-0 w-32 h-24 overflow-hidden rounded border border-gray-200">
          <img
            src={src}
            alt={alt || 'Diagram preview'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="12">No preview</text></svg>';
            }}
            {...props}
          />
        </div>
      );
    }

    // Regular diagram image (fallback to your existing component)
    return (
      <ProfessionalImageComponent 
        src={src} 
        alt={alt}
        className={className}
        {...props} 
      />
    );
  },

  // ✅ ENHANCED: Small element handling for styled text
  small: ({ children, style, ...props }) => {
    // Check if it's a color-styled small element
    if (style && typeof style === 'string' && style.includes('color')) {
      const colorMatch = style.match(/color:\s*([^;]+)/);
      const color = colorMatch ? colorMatch[1] : 'inherit';
      
      return (
        <small className="text-sm" style={{ color }} {...props}>
          {children}
        </small>
      );
    }
    
    return (
      <small className="text-sm text-gray-600" {...props}>
        {children}
      </small>
    );
  },
};

// ✅ Exports (Vite HMR safe)
export const getProfessionalMarkdownComponents = () =>
  professionalMarkdownComponents;
export default professionalMarkdownComponents;