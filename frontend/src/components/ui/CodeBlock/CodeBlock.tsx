import type { ReactNode, FC } from 'react';

interface CodeBlockProps {
  children: ReactNode;
}

export const CodeBlock: FC<CodeBlockProps> = ({ children }) => {
  return (
    <pre className="font-mono text-mono font-normal leading-[1.5] bg-[#F0F0F0] text-black px-md py-sm rounded-sm overflow-x-auto whitespace-pre-wrap break-words">
      <code>{children}</code>
    </pre>
  );
};
