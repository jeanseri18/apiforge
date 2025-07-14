import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Eye } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const parseMarkdown = (text: string): string => {
    let html = text;
    
    // Échapper les caractères HTML
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Titres
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 mt-4">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-5">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-6">$1</h1>');
    
    // Gras et italique
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Code inline
    html = html.replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Liens
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Citations
    html = html.replace(/^> (.*)$/gim, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 my-2">$1</blockquote>');
    
    // Listes à puces
    html = html.replace(/^\* (.*)$/gim, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/^- (.*)$/gim, '<li class="ml-4 list-disc">$1</li>');
    
    // Listes numérotées
    html = html.replace(/^\d+\. (.*)$/gim, '<li class="ml-4 list-decimal">$1</li>');
    
    // Regrouper les éléments de liste
    html = html.replace(/(<li[^>]*>.*<\/li>)\s*(?=<li)/g, '$1');
    html = html.replace(/(<li[^>]*>.*<\/li>)/g, '<ul class="my-2">$1</ul>');
    html = html.replace(/<\/ul>\s*<ul[^>]*>/g, '');
    
    // Blocs de code
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto my-3"><code class="text-sm font-mono">$1</code></pre>');
    
    // Lignes horizontales
    html = html.replace(/^---$/gim, '<hr class="border-gray-300 dark:border-gray-600 my-4">');
    
    // Sauts de ligne
    html = html.replace(/\n\n/g, '</p><p class="mb-3">');
    html = html.replace(/\n/g, '<br>');
    
    // Envelopper dans des paragraphes
    if (html && !html.startsWith('<')) {
      html = '<p class="mb-3">' + html + '</p>';
    }
    
    return html;
  };
  
  const createMarkup = () => {
    return { __html: parseMarkdown(content) };
  };
  
  if (!content.trim()) {
    return (
      <div className="p-4 h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2"><Eye className="w-10 h-10 text-gray-400" /></div>
          <p>L'aperçu apparaîtra ici</p>
          <p className="text-sm mt-1">Commencez à écrire dans l'éditeur</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 h-full overflow-y-auto">
      <div 
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={createMarkup()}
        style={{
          color: 'inherit',
          lineHeight: '1.6'
        }}
      />
    </div>
  );
};