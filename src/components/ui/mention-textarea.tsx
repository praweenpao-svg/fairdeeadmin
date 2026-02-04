import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { mockStaffMembers } from "@/data/mockStaff";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";

export interface MentionTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

const MentionTextarea = React.forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ className, value, onChange, placeholder, ...props }, ref) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Combine refs
    const combinedRef = useCallback((node: HTMLTextAreaElement | null) => {
      (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);

    // Get all staff names for mention
    const allStaffNames = mockStaffMembers.map(s => s.name);

    // Filter staff based on search query
    const filteredStaff = allStaffNames.filter(name =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart || 0;
      
      onChange(newValue);
      setCursorPosition(cursorPos);

      // Check if we're in a mention context
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        // Check if there's a space between @ and cursor
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        const hasSpaceOrNewline = /[\s\n]/.test(textAfterAt);
        
        if (!hasSpaceOrNewline) {
          setMentionStartIndex(lastAtIndex);
          setSearchQuery(textAfterAt);
          setShowDropdown(true);
          setSelectedIndex(0);
        } else {
          setShowDropdown(false);
          setMentionStartIndex(-1);
        }
      } else {
        setShowDropdown(false);
        setMentionStartIndex(-1);
      }
    };

    const insertMention = (name: string) => {
      if (mentionStartIndex === -1) return;

      const beforeMention = value.slice(0, mentionStartIndex);
      const afterMention = value.slice(cursorPosition);
      const newValue = `${beforeMention}@${name} ${afterMention}`;
      
      onChange(newValue);
      setShowDropdown(false);
      setMentionStartIndex(-1);
      setSearchQuery('');

      // Focus back on textarea and move cursor
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = mentionStartIndex + name.length + 2; // @name + space
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showDropdown || filteredStaff.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredStaff.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredStaff.length - 1
          );
          break;
        case 'Enter':
          if (showDropdown && filteredStaff[selectedIndex]) {
            e.preventDefault();
            insertMention(filteredStaff[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowDropdown(false);
          break;
        case 'Tab':
          if (showDropdown && filteredStaff[selectedIndex]) {
            e.preventDefault();
            insertMention(filteredStaff[selectedIndex]);
          }
          break;
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          textareaRef.current &&
          !textareaRef.current.contains(event.target as Node)
        ) {
          setShowDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative">
        <textarea
          ref={combinedRef}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          {...props}
        />
        
        {showDropdown && filteredStaff.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
          >
            <ScrollArea className="max-h-[200px]">
              <div className="py-1">
                {filteredStaff.map((name, index) => (
                  <button
                    key={name}
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors",
                      index === selectedIndex && "bg-muted"
                    )}
                    onClick={() => insertMention(name)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  }
);

MentionTextarea.displayName = "MentionTextarea";

export { MentionTextarea };
