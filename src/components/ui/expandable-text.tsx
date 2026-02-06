import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/stores/languageStore";

interface ExpandableTextProps {
  text: string;
  className?: string;
  maxLines?: number;
  lineHeight?: number; // in pixels, default ~20px for text-sm
  variant?: 'default' | 'success'; // For different color themes
}

export function ExpandableText({ 
  text, 
  className, 
  maxLines = 3,
  lineHeight = 20,
  variant = 'default'
}: ExpandableTextProps) {
  const { language } = useLanguageStore();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [needsExpansion, setNeedsExpansion] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement>(null);

  const maxHeight = maxLines * lineHeight;

  React.useEffect(() => {
    if (textRef.current) {
      // Check if content overflows the max height
      const scrollHeight = textRef.current.scrollHeight;
      setNeedsExpansion(scrollHeight > maxHeight + 4); // +4 for small buffer
    }
  }, [text, maxHeight]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const buttonColorClass = variant === 'success' 
    ? 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400'
    : 'text-primary hover:text-primary/80';

  return (
    <div className="relative">
      <p
        ref={textRef}
        className={cn(
          "whitespace-pre-wrap transition-all duration-200",
          !isExpanded && needsExpansion && "overflow-hidden",
          className
        )}
        style={{
          maxHeight: !isExpanded && needsExpansion ? `${maxHeight}px` : undefined,
        }}
      >
        {text}
      </p>
      {needsExpansion && (
        <button
          onClick={toggleExpand}
          className={cn("flex items-center gap-1 text-xs mt-1 font-medium transition-colors", buttonColorClass)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              {language === 'th' ? 'ย่อ' : 'Show less'}
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              {language === 'th' ? 'ดูเพิ่มเติม' : 'See more'}
            </>
          )}
        </button>
      )}
    </div>
  );
}
