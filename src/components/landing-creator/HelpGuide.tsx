"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HelpCircle, Plus, Layers, Palette, Smartphone, Save, Undo, Redo, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export function HelpGuide({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack?: () => void }) {
  const t = useTranslations('LandingPageCreator')
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onClose()
                  onBack()
                }}
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                style={{ cursor: 'pointer' }}
                title={t('back', 'Voltar')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="flex-1">Landing Page Creator - Help & Guide</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-6">
          <section>
            <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Welcome to the Landing Page Creator! Use the floating action button (FAB) in the bottom right to access all builder features.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Quick Actions</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Plus className="w-5 h-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Add Element</p>
                  <p className="text-sm text-muted-foreground">Add text, images, buttons, forms, and more to your page.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Add Section</p>
                  <p className="text-sm text-muted-foreground">Add pre-built sections like headers, hero sections, forms, and footers.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Palette className="w-5 h-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Change Theme</p>
                  <p className="text-sm text-muted-foreground">Customize colors, fonts, and overall appearance of your page.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Toggle View</p>
                  <p className="text-sm text-muted-foreground">Switch between desktop and mobile views to see how your page looks on different devices.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Editing Elements</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Click on any element on the page to select it. Once selected:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
              <li>Click directly on text to edit it inline</li>
              <li>Use the element panel to adjust styles and properties</li>
              <li>Elements are automatically saved as you edit</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Saving & History</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Save className="w-5 h-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Auto-Save</p>
                  <p className="text-sm text-muted-foreground">Your page is automatically saved after every change.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Undo className="w-5 h-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Undo/Redo</p>
                  <p className="text-sm text-muted-foreground">Use undo and redo buttons to navigate through your editing history.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Tips & Best Practices</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
              <li>Start with a preset template to save time</li>
              <li>Use section presets for common layouts</li>
              <li>Test your page in both desktop and mobile views</li>
              <li>Keep your color palette consistent throughout</li>
              <li>Use clear, compelling headlines and CTAs</li>
              <li>Export HTML when you're ready to publish</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Keyboard Shortcuts</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
              <li><kbd className="px-2 py-1 bg-muted rounded">Ctrl+Z</kbd> - Undo</li>
              <li><kbd className="px-2 py-1 bg-muted rounded">Ctrl+Y</kbd> - Redo</li>
              <li><kbd className="px-2 py-1 bg-muted rounded">Ctrl+S</kbd> - Save</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}


