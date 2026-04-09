'use client'

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, ImagePlus,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo, Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TipTapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors text-sm
        ${isActive ? 'bg-forest text-white' : 'text-forest/60 hover:bg-forest/10 hover:text-forest'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  )
}

export default function TipTapEditor({ content, onChange, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-forest underline hover:text-forest-dark',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Bắt đầu viết bài hoặc paste nội dung từ Word/website...',
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
      // Handle paste - keep formatting including images
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        const hasImage = items.some(item => item.type.startsWith('image/'))

        if (hasImage) {
          event.preventDefault()
          items.forEach(item => {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile()
              if (file) {
                const reader = new FileReader()
                reader.onload = () => {
                  const src = reader.result as string
                  // Insert image at cursor position
                  const { state } = view
                  const { tr } = state
                  const node = state.schema.nodes.image.create({ src })
                  const pos = state.selection.from
                  tr.insert(pos, node)
                  view.dispatch(tr)
                }
                reader.readAsDataURL(file)
              }
            }
          })
          return true
        }

        // For text paste, let Tiptap handle it (preserves formatting)
        return false
      },
    },
  })

  if (!editor) return null

  const addImage = () => {
    const url = prompt('Nhập URL ảnh (hoặc để trống để upload):')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href
    const url = prompt('Nhập URL liên kết:', prev || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="border border-forest/20 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-forest/10 px-2 py-1.5 flex items-center gap-0.5 flex-wrap">
        {/* Undo/Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Hoàn tác">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Làm lại">
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-forest/10 mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Tiêu đề 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Tiêu đề 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Tiêu đề 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-forest/10 mx-1" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Gạch ngang"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Gạch ngang">
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-forest/10 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Danh sách"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Danh sách số"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-forest/10 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Căn trái"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Căn giữa"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Căn phải"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Căn đều 2 bên"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-forest/10 mx-1" />

        {/* Image & Link */}
        <ToolbarButton onClick={addImage} title="Chèn ảnh">
          <ImagePlus className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive('link')}
          title="Chèn liên kết"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Bubble Menu (selection menu) */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center gap-0.5 bg-white rounded-lg shadow-lg border border-forest/10 px-1 py-1">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="In đậm">
              <Bold className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="In nghiêng">
              <Italic className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Gạch chân">
              <UnderlineIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Liên kết">
              <LinkIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
          </div>
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Tip */}
      <div className="px-4 py-2 bg-forest/5 text-xs text-forest/50 border-t border-forest/10">
        💡 Mẹo: Copy bài viết từ Word, Google Docs hoặc website → Paste (Ctrl+V) giữ nguyên định dạng và ảnh
      </div>
    </div>
  )
}
