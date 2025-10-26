import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getProfessionalMarkdownComponents, ProfessionalImageComponent } from '../../utils/markdownComponents';

const MarkdownView = ({ content, documentId, learningArea }) => {
  if (!content) {
    return (
      <div className="text-center py-8">
        <p>No content available</p>
      </div>
    );
  }

  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...getProfessionalMarkdownComponents(),
          img: (props) => (
            <ProfessionalImageComponent 
              {...props} 
              documentId={documentId}
              learningArea={learningArea}
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownView;