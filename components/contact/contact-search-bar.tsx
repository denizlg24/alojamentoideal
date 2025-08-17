import { Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export const ContactSearchBar = ({ placeholder }: { placeholder: string }) => {
  return (
    <div className="w-full relative flex-col items-center">
      <Input className="w-full rounded-full! p-6!" placeholder={placeholder} />
      <Button
        className="absolute rounded-full! h-10! w-auto! aspect-square! p-0! right-1.5 top-1/2 -translate-y-1/2 z-10 hover:cursor-pointer"
        size={"lg"}
      >
        <Search />
      </Button>
    </div>
  );
};
