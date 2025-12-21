import { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface PropsEmailCard {
  id: number;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  avatar: string;
  isRead: boolean;
}

export default function EmailCardSideBar(email: PropsEmailCard): ReactNode {
  return (
    <>
      <div className="flex-shrink-0">
        <Avatar className="w-14 h-14">
          <AvatarImage src={email.avatar} alt={email.from} />

          <AvatarFallback>{email.from.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3
            className={`text-sm truncate ${
              !email.isRead ? "font-bold" : "font-thin"
            }`}
          >
            {email.from}
          </h3>

          <span className="text-xs text-gray-500">{email.timestamp}</span>
        </div>

        <p
          className={`text-sm font-medium text-gray-900 truncate mb-1 ${
            !email.isRead ? "font-bold" : "font-thin text-xs"
          }`}
        >
          {email.subject}
        </p>

        <p className="text-xs text-gray-600 truncate">{email.preview}</p>

        {!email.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
        )}
      </div>
    </>
  );
}
