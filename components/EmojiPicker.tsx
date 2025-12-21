'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Smile, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Dynamically import emoji picker to avoid SSR issues
const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
)

interface EmojiPickerProps {
  onEmojiClick: (emoji: string) => void
}

export function EmojiPickerComponent({ onEmojiClick }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Smile className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <EmojiPicker
          onEmojiClick={(emojiData) => {
            onEmojiClick(emojiData.emoji)
            setOpen(false)
          }}
          theme="dark"
        />
      </PopoverContent>
    </Popover>
  )
}

