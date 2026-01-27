'use client'

import { Upload, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EvidenceUploaderProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
}

export function EvidenceUploader({ files, onFilesChange, disabled }: EvidenceUploaderProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      onFilesChange([...files, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-md p-4 bg-muted/20">
        <input
          type="file"
          id="evidence"
          multiple
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        <label
          htmlFor="evidence"
          className={`flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm">Click to upload or drag files here</span>
        </label>
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
