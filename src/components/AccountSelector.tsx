"use client"

import * as React from "react"
import { Check, Sparkles } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Account {
  id: string
  name: string
  icon?: React.ReactNode
  color?: string
  description?: string
}

interface AccountSelectorProps {
  accounts: Account[]
  value: string | null
  onSelect: (accountId: string | null) => void
}

export function AccountSelector({
  accounts,
  value,
  onSelect,
}: AccountSelectorProps) {
  const selectedAccount = accounts.find((acc) => acc.id === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer shrink-0"
        >
          <div className="flex items-center gap-2">
            {selectedAccount?.icon || (
              <Sparkles className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-xs sm:text-sm">
              {selectedAccount?.name || "Todas as contas"}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem
          onClick={() => onSelect(null)}
          className="cursor-pointer flex items-center gap-2"
        >
          <Check
            className={cn(
              "h-4 w-4",
              value === null ? "opacity-100" : "opacity-0"
            )}
          />
          <div >
            <div className="font-medium text-sm">Todas as contas</div>
            <div className="text-xs text-muted-foreground">
              Ver leads de todas as fontes
            </div>
          </div>
        </DropdownMenuItem>

        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => onSelect(account.id)}
            className="cursor-pointer flex items-center gap-2"
          >
            <Check
              className={cn(
                "h-4 w-4",
                value === account.id ? "opacity-100" : "opacity-0"
              )}
            />
            <div>
              <div className="font-medium text-sm">{account.name}</div>
              {account.description && (
                <div className="text-xs text-muted-foreground">
                  {account.description}
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
