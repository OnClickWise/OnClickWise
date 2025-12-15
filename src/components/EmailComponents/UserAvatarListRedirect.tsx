"use client";
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type User = {
  id: string;
  fromName: string;
  fromEmail: string;
  avatarUrl?: string;
};

type Props = {
  users: User[];
  onSelect?: (user: User) => void;
};

export default function UserAvatarListRedirect({ users, onSelect }: Props) {
  return (
    <div className="flex flex-col w-full bg-white rounded-md overflow-hidden">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelect?.(user)}
          className="flex items-center w-full text-left p-3 gap-3 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Avatar className="h-10 w-10 rounded-full shrink-0">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.fromName} />
            ) : null}

            <AvatarFallback className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white text-sm font-medium">
              {user.fromName?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={"text-sm font-medium truncate"}>
                {user.fromName}
              </h3>

              <span className="text-xs text-gray-500">{user.fromEmail}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
