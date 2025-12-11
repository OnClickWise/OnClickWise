"use client";
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type Props = {
  users: User[];
  onSelect?: (user: User) => void;
};

export default function UserAvatarList({ users, onSelect }: Props) {
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
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white text-sm font-medium">
              {user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col justify-center leading-tight">
            <span className="text-base font-medium text-slate-900 dark:text-white">
              {user.name}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {user.email}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
