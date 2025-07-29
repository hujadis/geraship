import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface PositionsTableControlsProps {
  onSearch: (searchTerm: string) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPage: number;
  totalItems?: number;
}

const PositionsTableControls = ({
  onSearch = () => {},
  onItemsPerPageChange = () => {},
  itemsPerPage = 10,
  totalItems = 0,
}: PositionsTableControlsProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleItemsPerPageChange = (value: string) => {
    onItemsPerPageChange(Number(value));
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 p-4 rounded-lg border bg-background">
      <div className="relative w-full sm:w-auto flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search positions..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-8 w-full"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {totalItems > 0 ? `${totalItems} items` : "Loading..."}
        </span>
        <span className="text-sm text-muted-foreground">|</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Show:
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default PositionsTableControls;
