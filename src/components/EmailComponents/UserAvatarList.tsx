"use client";
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type User = {
  id: number;
  fromName: string;
  avatarUrl?: string;
  isRead?: boolean;
  timestampLatest?: string;
  subject?: string;
  preview?: string;
};

export default function UserAvatarList(userDetail: User) {
  return (
    <button className="flex items-center w-full text-left p-3 gap-3 hover:bg-slate-100 transition-colors cursor-pointer">
      <Avatar className="h-10 w-10 rounded-full shrink-0">
        {userDetail.avatarUrl ? (
          <AvatarImage src={userDetail.avatarUrl} alt={userDetail.fromName} />
        ) : null}

        <AvatarFallback className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white text-sm font-medium">
          {userDetail.fromName?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3
            className={`text-sm font-medium truncate ${
              !userDetail.isRead ? "font-bold" : ""
            }`}
          >
            {userDetail.fromName}
          </h3>

          <span className="text-xs text-gray-500">
            {userDetail.timestampLatest}
          </span>
        </div>

        <p className="text-sm font-medium text-gray-900 truncate mb-1">
          {userDetail.subject}
        </p>
        <p className="text-sm text-gray-600 truncate">{userDetail.preview}</p>

        {!userDetail.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
        )}
      </div>
    </button>
  );
}
