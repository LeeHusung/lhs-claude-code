"use client";

import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";

interface DeleteConfirmDialogProps {
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({
  taskTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on mount (safe default)
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onCancel();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <Trash2 size={16} className="text-danger" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">업무 삭제</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-3">
          <p className="text-sm text-text-secondary leading-relaxed">
            아래 업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
            <p className="text-sm font-medium text-text-primary truncate">
              &quot;{taskTitle}&quot;
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border-subtle bg-surface-raised/50">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-danger hover:bg-danger/80 text-white transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
