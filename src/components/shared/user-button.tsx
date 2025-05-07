"use client";

import Profile from "@/components/shared/user-profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogoutModal } from "@/hooks/use-logout";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";

const routes = [
  {
    name: "Settings",
    path: "/settings",
  },
  {
    name: "Logs",
    path: "/logs",
  },
];

interface UserButtonProps {
  showName?: boolean;
}

const UserButton = ({ showName = true }: UserButtonProps) => {
  const { data: session } = useSession();
  const { setIsOpen } = useLogoutModal();

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 p-1 py-1 rounded cursor-pointer outline-none">
        <Profile
          name={user.name as string}
          url={user.image as string}
          className="cursor-pointer"
          size="lg"
        />
        {showName && (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-gray-500 text-start">Admin</p>
            </div>

            <ChevronDown className="size-4" />
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {routes.map((route) => (
          <DropdownMenuItem key={route.name} asChild>
            <Link href={route.path}>{route.name}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(true)}
            className="w-full cursor-pointer"
          >
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
