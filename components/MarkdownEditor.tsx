
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Textarea, Button } from './ui/Common';
import { cn } from '../lib/utils';
import { Eye, Edit2 } from 'lucide-react';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    placeholder,
    className,
    minHeight = 'min-h-[100px]'
}) => {
    const [view, setView] = useState<'write' | 'preview'>('write');

    return (
        <div className={cn("space-y-2 border rounded-md p-2 bg-card", className)}>
            <div className="flex items-center justify-between border-b pb-2 mb-2">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={view === 'write' ? 'default' : 'ghost'}
                        onClick={() => setView('write')}
                        className="h-7 text-xs"
                    >
                        <Edit2 className="w-3 h-3 mr-1" /> Write
                    </Button>
                    <Button
                        size="sm"
                        variant={view === 'preview' ? 'default' : 'ghost'}
                        onClick={() => setView('preview')}
                        className="h-7 text-xs"
                    >
                        <Eye className="w-3 h-3 mr-1" /> Preview
                    </Button>
                </div>
            </div>

            <div className={cn("relative", minHeight)}>
                {view === 'write' ? (
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={cn("w-full h-full min-h-[inherit] bg-transparent border-none focus-visible:ring-0 p-0 resize-y", minHeight)}
                    />
                ) : (
                    <div className={cn("prose prose-invert prose-sm max-w-none p-2 overflow-auto", minHeight)}>
                        {value ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ node, ...props }) => <p className="mb-2 text-foreground" {...props} />,
                                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 text-foreground" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 text-foreground" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-1 text-foreground" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 text-foreground" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 text-foreground" {...props} />,
                                    li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                    a: ({ node, ...props }) => <a className="text-blue-400 underline" {...props} />,
                                    code: ({ node, ...props }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                                    pre: ({ node, ...props }) => <pre className="bg-muted p-2 rounded overflow-x-auto text-xs font-mono mb-2" {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-muted-foreground pl-2 italic" {...props} />,
                                }}
                            >
                                {value}
                            </ReactMarkdown>
                        ) : (
                            <span className="text-muted-foreground italic">Nothing to preview</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarkdownEditor;
