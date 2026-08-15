"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

import { recordPromptCopy } from "@/app/admin/prompts/actions";
import { copyTextToClipboard } from "@/lib/clipboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastPayload = { type: "success" | "error"; message: string };

export function PromptCopyButton({
  promptId,
  content,
  onToast,
  className,
  fullWidth = false,
}: {
  promptId: string;
  content: string;
  onToast: (toast: ToastPayload) => void;
  className?: string;
  fullWidth?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCopy() {
    startTransition(async () => {
      const ok = await copyTextToClipboard(content);
      if (!ok) {
        onToast({
          type: "error",
          message:
            "Não foi possível copiar. Verifique a permissão do navegador e tente novamente.",
        });
        return;
      }
      setCopied(true);
      onToast({
        type: "success",
        message: "Prompt copiado para a área de transferência!",
      });
      window.setTimeout(() => setCopied(false), 2000);
      const tracked = await recordPromptCopy(promptId);
      if (tracked.error) {
        // A cópia já ocorreu; o tracking é secundário.
      }
    });
  }

  return (
    <Button
      type="button"
      onClick={handleCopy}
      disabled={isPending}
      className={cn(
        "bg-brand-600 text-white hover:bg-brand-700",
        fullWidth && "w-full",
        className
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? "Copiado" : "Copiar Prompt"}
    </Button>
  );
}
