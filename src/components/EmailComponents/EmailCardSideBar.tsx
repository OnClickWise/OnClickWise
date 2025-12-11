import { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface PropsEmailCard {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: "10:30";
  avatar: string;
}

export default function EmailCardSideBar(listEmail: PropsEmailCard): ReactNode {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={listEmail.avatar} alt={listEmail.from} />
          <AvatarFallback>{listEmail.from.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3>{listEmail.from}</h3>

          <span className="text-xs text-gray-500">{listEmail.timestamp}</span>
        </div>

        <p className="text-sm font-medium text-gray-900 truncate mb-1">
          {listEmail.subject}
        </p>
        <p className="text-sm text-gray-600 truncate">{listEmail.preview}</p>
      </div>
    </div>
  );
}
