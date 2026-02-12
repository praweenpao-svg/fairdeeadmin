import { FileText, Image, X, Download } from 'lucide-react';
import { ReworkAttachment } from '@/types/pipeline';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';

async function handleDownloadAllZip(attachments: ReworkAttachment[]) {
  const zip = new JSZip();

  await Promise.all(
    attachments.map(async (att) => {
      try {
        const response = await fetch(att.url);
        const blob = await response.blob();
        zip.file(att.name, blob);
      } catch {
        // skip files that fail to fetch
      }
    })
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'attachments.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface AttachmentThumbnailsProps {
  attachments: ReworkAttachment[];
  onRemove?: (id: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function AttachmentThumbnails({ 
  attachments, 
  onRemove, 
  size = 'md',
  className 
}: AttachmentThumbnailsProps) {
  if (!attachments || attachments.length === 0) return null;

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  return (
    <div className={cn("flex flex-wrap gap-2 items-end", className)}>
      {attachments.map(att => {
        const isImage = att.type === 'png' || att.type === 'jpg';
        const isPdf = att.type === 'pdf';

        return (
          <div key={att.id} className="relative group">
            <a
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "block overflow-hidden rounded-md border border-border hover:border-primary transition-colors",
                sizeClasses[size]
              )}
            >
              {isImage ? (
                <>
                  <img 
                    src={att.url} 
                    alt={att.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Image className={cn("text-white opacity-0 group-hover:opacity-100 transition-opacity", iconSizes[size])} />
                  </div>
                </>
              ) : isPdf ? (
                <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-1 p-1">
                  <FileText className={cn("text-destructive", iconSizes[size])} />
                  <span className="text-[8px] text-muted-foreground text-center leading-tight line-clamp-2 px-0.5">
                    {att.name.length > 12 ? att.name.slice(0, 10) + '...' : att.name}
                  </span>
                </div>
              ) : null}
            </a>
            
            {/* Remove button */}
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(att.id);
                }}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
      {/* Download All button - only show for read-only (no onRemove) and 2+ attachments */}
      {!onRemove && attachments.length >= 2 && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDownloadAllZip(attachments);
          }}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-muted border border-border h-fit"
        >
          <Download className="w-3 h-3" />
          <span>All</span>
        </button>
      )}
    </div>
  );
}

// Read-only version for displaying attachments in threads
interface AttachmentDisplayProps {
  attachments?: ReworkAttachment[];
  size?: 'sm' | 'md';
  className?: string;
}

export function AttachmentDisplay({ attachments, size = 'md', className }: AttachmentDisplayProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={cn("mt-2", className)}>
      <AttachmentThumbnails attachments={attachments} size={size} />
    </div>
  );
}
