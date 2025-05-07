import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";

const iconvVariants = cva(
  "rounded-full border flex items-center justify-center",
  {
    variants: {
      size: {
        default: "!size-9 min-w-9 rounded-full",
        sm: "!size-8 min-w-8 rounded-full",
        lg: "!size-10 min-w-10 rounded-full",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface ProfileProps extends VariantProps<typeof iconvVariants> {
  className?: string;
  url?: string;
  name: string;
}

const Profile = ({ className, url, name, size }: ProfileProps) => {
  const twoLettersName = name
    .split("-")
    .map((l) => l[0])
    .join("");

  return (
    <Avatar className={cn(iconvVariants({ size }), className)}>
      <AvatarImage src={url as string} />
      <AvatarFallback className="text-sm font-semibold rounded-md bg-gray-100 text-gray-500">
        {twoLettersName}
      </AvatarFallback>
    </Avatar>
  );
};

export default Profile;
