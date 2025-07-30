import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "./ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Settings,
} from "lucide-react";
import { fetchApi } from "../lib/api";

interface Position {
  id: number;
  asset?: string;
  size?: number;
  entry_price?: number;
  leverage?: number;
  is_long?: boolean;
  pnl?: number;
  pnl_percentage?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  address?: string;
}

interface ApiResponse {
  data: Position[];
  pagination: {
    current_page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

type SortField = keyof Position;
type SortOrder = "asc" | "desc";

interface SortConfig {
  field: SortField | null;
  order: SortOrder;
}

interface FilterConfig {
  search: string;
  status: string;
  direction: string;
  asset: string;
  leverage: string;
  pnlRange: string;
  sizeRange: string;
}

interface ColumnVisibility {
  id: boolean;
  asset: boolean;
  size: boolean;
  entry_price: boolean;
  leverage: boolean;
  initial_value: boolean;
  current_price: boolean;
  direction: boolean;
  pnl: boolean;
  pnl_percentage: boolean;
  status: boolean;
  created_at: boolean;
  updated_at: boolean;
  address: boolean;
}

const PositionsTable = () => {
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    order: "asc",
  });

  // Filter state
  const [filters, setFilters] = useState<FilterConfig>({
    search: "",
    status: "all",
    direction: "all",
    asset: "all",
    leverage: "all",
    pnlRange: "all",
    sizeRange: "all",
  });

  // Column visibility state - ID, Created at, Updated at hidden by default
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    id: false,
    asset: true,
    size: true,
    entry_price: true,
    leverage: true,
    initial_value: true,
    current_price: true,
    direction: true,
    pnl: true,
    pnl_percentage: true,
    status: true,
    created_at: false,
    updated_at: false,
    address: true,
  });

  const fetchAllPositions = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Starting to fetch positions from API...");

      // First, get the first page to understand pagination
      const initialUrl = `/api/v1/positions?page=1&page_size=100`;
      console.log(`📄 Fetching initial page: ${initialUrl}`);

      const initialResponse = await fetchApi(initialUrl);

      if (!initialResponse.ok) {
        const errorText = await initialResponse.text();
        throw new Error(
          `HTTP ${initialResponse.status}: ${initialResponse.statusText} - ${errorText}`,
        );
      }

      const initialData: ApiResponse = await initialResponse.json();
      console.log(`📋 Initial API response:`, {
        totalItems: initialData.pagination.total_items,
        totalPages: initialData.pagination.total_pages,
        currentPage: initialData.pagination.current_page,
        pageSize: initialData.pagination.page_size,
        dataLength: initialData.data.length,
      });

      let allPositions: Position[] = [...initialData.data];

      // If there are more pages, fetch them all
      if (initialData.pagination.total_pages > 1) {
        console.log(
          `📄 Found ${initialData.pagination.total_pages} total pages, fetching remaining pages...`,
        );

        const fetchPromises = [];
        for (let page = 2; page <= initialData.pagination.total_pages; page++) {
          const pageUrl = `/api/v1/positions?page=${page}&page_size=100`;
          fetchPromises.push(
            fetchApi(pageUrl)
              .then((response) => {
                if (response.ok) {
                  return response.json();
                }
                throw new Error(`Failed to fetch page ${page}`);
              })
              .then((pageData: ApiResponse) => {
                console.log(
                  `📊 Fetched page ${page}: ${pageData.data.length} positions`,
                );
                return pageData.data;
              })
              .catch((error) => {
                console.warn(`⚠️ Failed to fetch page ${page}:`, error);
                return [];
              }),
          );
        }

        // Wait for all pages to be fetched
        const additionalPages = await Promise.all(fetchPromises);

        // Combine all positions
        for (const pageData of additionalPages) {
          allPositions = [...allPositions, ...pageData];
        }
      }

      console.log(
        `✅ Final result: ${allPositions.length} positions loaded out of ${initialData.pagination.total_items} total`,
      );
      console.log(`📋 Sample position data:`, allPositions[0]);

      setAllPositions(allPositions);
    } catch (err) {
      console.error("💥 Fetch error:", err);

      let errorMessage = "An unknown error occurred";

      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        errorMessage = `Network Error: Cannot connect to API. This could be due to:\n• CORS policy blocking the request\n• Server is not running\n• Network connectivity issues\n• Mixed content policy (HTTPS site trying to access HTTP API)`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setAllPositions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPositions();
  }, []);

  // Get unique values for filter dropdowns
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(allPositions.map((p) => p.status).filter(Boolean));
    return Array.from(statuses);
  }, [allPositions]);

  const uniqueAssets = useMemo(() => {
    const assets = new Set(allPositions.map((p) => p.asset).filter(Boolean));
    return Array.from(assets).sort();
  }, [allPositions]);

  const uniqueLeverages = useMemo(() => {
    const leverages = new Set(
      allPositions.map((p) => p.leverage).filter((l) => l != null),
    );
    return Array.from(leverages).sort((a, b) => a - b);
  }, [allPositions]);

  // Apply filters and sorting
  const filteredAndSortedPositions = useMemo(() => {
    let filtered = [...allPositions];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (position) =>
          position.asset?.toLowerCase().includes(searchLower) ||
          position.address?.toLowerCase().includes(searchLower) ||
          position.id?.toString().includes(searchLower),
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (position) => position.status === filters.status,
      );
    }

    if (filters.direction !== "all") {
      const isLong = filters.direction === "long";
      filtered = filtered.filter((position) => position.is_long === isLong);
    }

    if (filters.asset !== "all") {
      filtered = filtered.filter(
        (position) => position.asset === filters.asset,
      );
    }

    if (filters.leverage !== "all") {
      const leverageValue = parseFloat(filters.leverage);
      filtered = filtered.filter(
        (position) => position.leverage === leverageValue,
      );
    }

    if (filters.pnlRange !== "all") {
      filtered = filtered.filter((position) => {
        const pnl = position.pnl || 0;
        switch (filters.pnlRange) {
          case "positive":
            return pnl > 0;
          case "negative":
            return pnl < 0;
          case "large-gain":
            return pnl > 1000;
          case "large-loss":
            return pnl < -1000;
          default:
            return true;
        }
      });
    }

    if (filters.sizeRange !== "all") {
      filtered = filtered.filter((position) => {
        const size = position.size || 0;
        switch (filters.sizeRange) {
          case "small":
            return size < 1000;
          case "medium":
            return size >= 1000 && size < 10000;
          case "large":
            return size >= 10000 && size < 100000;
          case "xlarge":
            return size >= 100000;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (sortConfig.field) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.field!];
        const bValue = b[sortConfig.field!];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        let comparison = 0;
        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
          comparison = aValue === bValue ? 0 : aValue ? 1 : -1;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.order === "desc" ? -comparison : comparison;
      });
    }

    return filtered;
  }, [allPositions, filters, sortConfig]);

  // Paginate the filtered and sorted data
  const paginatedPositions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedPositions.slice(startIndex, endIndex);
  }, [filteredAndSortedPositions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(
    filteredAndSortedPositions.length / itemsPerPage,
  );

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterConfig, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Handle column visibility changes
  const handleColumnVisibilityChange = (
    column: keyof ColumnVisibility,
    visible: boolean,
  ) => {
    setColumnVisibility((prev) => ({ ...prev, [column]: visible }));
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          items.push(i);
        }
        items.push("ellipsis");
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1);
        items.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          items.push(i);
        }
      } else {
        items.push(1);
        items.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(i);
        }
        items.push("ellipsis");
        items.push(totalPages);
      }
    }

    return items;
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.order === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const uniqueAddresses = new Set(
    allPositions
      .map((position) => position.address)
      .filter((address) => address && address.trim() !== ""),
  ).size;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const calculateInitialValue = (position: Position) => {
    if (!position.size || !position.entry_price || !position.leverage) {
      return null;
    }
    return (position.size * position.entry_price) / position.leverage;
  };

  const calculateCorrectPnlPercentage = (position: Position) => {
    const initialValue = calculateInitialValue(position);
    if (!initialValue || position.pnl == null) {
      return null;
    }
    return (position.pnl / initialValue) * 100;
  };

  const calculateCurrentPrice = (position: Position) => {
    if (
      !position.entry_price ||
      position.pnl == null ||
      !position.size ||
      position.size === 0 ||
      !position.leverage
    ) {
      return null;
    }

    // Calculate the initial investment (margin)
    const initialValue =
      Math.abs(position.size * position.entry_price) / position.leverage;

    // Calculate the percentage return on the initial investment
    const returnPercentage = position.pnl / initialValue;

    // Calculate current price based on position direction
    // For long positions: current_price = entry_price * (1 + return_percentage / leverage)
    // For short positions: current_price = entry_price * (1 - return_percentage / leverage)
    const currentPrice = position.is_long
      ? position.entry_price * (1 + returnPercentage / position.leverage)
      : position.entry_price * (1 - returnPercentage / position.leverage);

    return currentPrice;
  };

  if (error) {
    return (
      <Card className="w-full bg-background">
        <CardHeader>
          <CardTitle>Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-destructive mb-4 text-lg font-semibold">
              Error occurred:
            </div>
            <div className="text-sm text-muted-foreground mb-4 max-w-2xl whitespace-pre-line">
              {error}
            </div>
            <div className="text-xs text-muted-foreground mb-4 p-4 bg-muted rounded-lg max-w-2xl">
              <strong>Debug Info:</strong>
              <br />
              • API URL: /api/v1/positions (proxied to http://159.65.127.209)
              <br />• Current page protocol: {window.location.protocol}
              <br />• Current page host: {window.location.host}
              <br />• Check browser console for detailed logs
            </div>
            <Button onClick={fetchAllPositions}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-background">
      <CardHeader>
        <CardTitle>Positions</CardTitle>
        <div className="flex gap-6 mt-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">
              {loading ? "--" : allPositions.length.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              Total Positions
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">
              {loading
                ? "--"
                : filteredAndSortedPositions.length.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              Filtered Results
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">
              {loading ? "--" : uniqueAddresses.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              Unique Wallets
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters and Controls */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search and Items Per Page */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-auto flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search positions..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Show:
              </span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Dropdowns and Column Visibility */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.direction}
              onValueChange={(value) => handleFilterChange("direction", value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.asset}
              onValueChange={(value) => handleFilterChange("asset", value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {uniqueAssets.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.leverage}
              onValueChange={(value) => handleFilterChange("leverage", value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Leverage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leverage</SelectItem>
                {uniqueLeverages.map((leverage) => (
                  <SelectItem key={leverage} value={leverage.toString()}>
                    {leverage}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.pnlRange}
              onValueChange={(value) => handleFilterChange("pnlRange", value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="P&L Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All P&L</SelectItem>
                <SelectItem value="positive">Profitable</SelectItem>
                <SelectItem value="negative">Loss</SelectItem>
                <SelectItem value="large-gain">Large Gain (&gt;$1K)</SelectItem>
                <SelectItem value="large-loss">
                  Large Loss (&lt;-$1K)
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sizeRange}
              onValueChange={(value) => handleFilterChange("sizeRange", value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="small">Small (&lt;1K)</SelectItem>
                <SelectItem value="medium">Medium (1K-10K)</SelectItem>
                <SelectItem value="large">Large (10K-100K)</SelectItem>
                <SelectItem value="xlarge">X-Large (&gt;100K)</SelectItem>
              </SelectContent>
            </Select>

            {(filters.search ||
              filters.status !== "all" ||
              filters.direction !== "all" ||
              filters.asset !== "all" ||
              filters.leverage !== "all" ||
              filters.pnlRange !== "all" ||
              filters.sizeRange !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    search: "",
                    status: "all",
                    direction: "all",
                    asset: "all",
                    leverage: "all",
                    pnlRange: "all",
                    sizeRange: "all",
                  });
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}

            {/* Column Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.id}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("id", checked)
                  }
                >
                  ID
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.asset}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("asset", checked)
                  }
                >
                  Asset
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.size}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("size", checked)
                  }
                >
                  Size
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.entry_price}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("entry_price", checked)
                  }
                >
                  Entry Price
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.leverage}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("leverage", checked)
                  }
                >
                  Leverage
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.initial_value}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("initial_value", checked)
                  }
                >
                  Initial Value
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.current_price}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("current_price", checked)
                  }
                >
                  Current Price
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.direction}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("direction", checked)
                  }
                >
                  Direction
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.pnl}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("pnl", checked)
                  }
                >
                  P&L
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.pnl_percentage}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("pnl_percentage", checked)
                  }
                >
                  P&L %
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.status}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("status", checked)
                  }
                >
                  Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.created_at}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("created_at", checked)
                  }
                >
                  Created
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.updated_at}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("updated_at", checked)
                  }
                >
                  Updated
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.address}
                  onCheckedChange={(checked) =>
                    handleColumnVisibilityChange("address", checked)
                  }
                >
                  Address
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columnVisibility.id && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("id")}
                      className="h-auto p-0 font-medium"
                    >
                      ID{renderSortIcon("id")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.asset && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("asset")}
                      className="h-auto p-0 font-medium"
                    >
                      Asset{renderSortIcon("asset")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.size && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("size")}
                      className="h-auto p-0 font-medium"
                    >
                      Size{renderSortIcon("size")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.entry_price && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("entry_price")}
                      className="h-auto p-0 font-medium"
                    >
                      Entry Price{renderSortIcon("entry_price")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.leverage && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("leverage")}
                      className="h-auto p-0 font-medium"
                    >
                      Leverage{renderSortIcon("leverage")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.initial_value && (
                  <TableHead className="text-right">
                    <span className="font-medium">Initial Value</span>
                  </TableHead>
                )}
                {columnVisibility.current_price && (
                  <TableHead className="text-right">
                    <span className="font-medium">Current Price</span>
                  </TableHead>
                )}
                {columnVisibility.direction && (
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("is_long")}
                      className="h-auto p-0 font-medium"
                    >
                      Direction{renderSortIcon("is_long")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.pnl && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("pnl")}
                      className="h-auto p-0 font-medium"
                    >
                      P&L{renderSortIcon("pnl")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.pnl_percentage && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("pnl_percentage")}
                      className="h-auto p-0 font-medium"
                    >
                      P&L %{renderSortIcon("pnl_percentage")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.status && (
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="h-auto p-0 font-medium"
                    >
                      Status{renderSortIcon("status")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.created_at && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("created_at")}
                      className="h-auto p-0 font-medium"
                    >
                      Created{renderSortIcon("created_at")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.updated_at && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("updated_at")}
                      className="h-auto p-0 font-medium"
                    >
                      Updated{renderSortIcon("updated_at")}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.address && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("address")}
                      className="h-auto p-0 font-medium"
                    >
                      Address{renderSortIcon("address")}
                    </Button>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(10)
                  .fill(0)
                  .map((_, index) => (
                    <TableRow key={index}>
                      {columnVisibility.id && (
                        <TableCell>
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                      )}
                      {columnVisibility.asset && (
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                      )}
                      {columnVisibility.size && (
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-16 ml-auto" />
                        </TableCell>
                      )}
                      {columnVisibility.entry_price && (
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-24 ml-auto" />
                        </TableCell>
                      )}
                      {columnVisibility.leverage && (
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-16 ml-auto" />
                        </TableCell>
                      )}
                      {columnVisibility.initial_value && (
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-24 ml-auto" />
                        </TableCell>
                      )}
                      {columnVisibility.current_price && (
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-24 ml-auto" />
                        </TableCell>
                      )}
                      {columnVisibility.direction && (
                        <TableCell className="text-center">
                          <Skeleton className="h-6 w-16 mx-auto" />
                        </TableCell>
                      )}
                      {columnVisibility.pnl && (
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-24 ml-auto" />
                        </TableCell>
                      )}
                      {columnVisibility.pnl_percentage && (
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-16 ml-auto" />
                        </TableCell>
                      )}
                      {columnVisibility.status && (
                        <TableCell className="text-center">
                          <Skeleton className="h-6 w-16 mx-auto" />
                        </TableCell>
                      )}
                      {columnVisibility.created_at && (
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                      )}
                      {columnVisibility.updated_at && (
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                      )}
                      {columnVisibility.address && (
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
              ) : paginatedPositions.length > 0 ? (
                paginatedPositions.map((position) => (
                  <TableRow key={position.id} className="hover:bg-muted/50">
                    {columnVisibility.id && (
                      <TableCell className="font-mono text-sm">
                        {position.id ?? "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.asset && (
                      <TableCell className="font-medium">
                        {position.asset ?? "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.size && (
                      <TableCell className="text-right">
                        {position.size?.toLocaleString() ?? "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.entry_price && (
                      <TableCell className="text-right">
                        {position.entry_price != null
                          ? formatCurrency(position.entry_price)
                          : "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.leverage && (
                      <TableCell className="text-right">
                        {position.leverage != null
                          ? `${position.leverage}x`
                          : "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.initial_value && (
                      <TableCell className="text-right">
                        {calculateInitialValue(position) != null
                          ? formatCurrency(calculateInitialValue(position)!)
                          : "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.current_price && (
                      <TableCell className="text-right">
                        {calculateCurrentPrice(position) != null
                          ? formatCurrency(calculateCurrentPrice(position)!)
                          : "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.direction && (
                      <TableCell className="text-center">
                        <Badge
                          variant={position.is_long ? "default" : "secondary"}
                        >
                          {position.is_long ? "Long" : "Short"}
                        </Badge>
                      </TableCell>
                    )}
                    {columnVisibility.pnl && (
                      <TableCell className="text-right">
                        <span
                          className={
                            (position.pnl ?? 0) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {position.pnl != null
                            ? formatCurrency(position.pnl)
                            : "N/A"}
                        </span>
                      </TableCell>
                    )}
                    {columnVisibility.pnl_percentage && (
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            (calculateCorrectPnlPercentage(position) ?? 0) >= 0
                              ? "default"
                              : "destructive"
                          }
                        >
                          {calculateCorrectPnlPercentage(position) != null
                            ? formatPercentage(
                                calculateCorrectPnlPercentage(position)!,
                              )
                            : "N/A"}
                        </Badge>
                      </TableCell>
                    )}
                    {columnVisibility.status && (
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            position.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {position.status ?? "N/A"}
                        </Badge>
                      </TableCell>
                    )}
                    {columnVisibility.created_at && (
                      <TableCell className="text-sm text-muted-foreground">
                        {position.created_at
                          ? new Date(position.created_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.updated_at && (
                      <TableCell className="text-sm text-muted-foreground">
                        {position.updated_at
                          ? new Date(position.updated_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.address && (
                      <TableCell className="font-mono text-xs">
                        {position.address ?? "N/A"}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={
                      Object.values(columnVisibility).filter(Boolean).length
                    }
                    className="text-center py-8"
                  >
                    {filteredAndSortedPositions.length === 0
                      ? filters.search ||
                        filters.status !== "all" ||
                        filters.direction !== "all" ||
                        filters.asset !== "all" ||
                        filters.leverage !== "all" ||
                        filters.pnlRange !== "all" ||
                        filters.sizeRange !== "all"
                        ? "No positions match the current filters"
                        : "No positions found"
                      : "No positions on this page"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                filteredAndSortedPositions.length,
              )}{" "}
              of {filteredAndSortedPositions.length} results
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      currentPage > 1 && handlePageChange(currentPage - 1)
                    }
                    className={
                      currentPage <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {generatePaginationItems().map((item, index) => (
                  <PaginationItem key={index}>
                    {item === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => handlePageChange(item as number)}
                        isActive={currentPage === item}
                        className="cursor-pointer"
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      currentPage < totalPages &&
                      handlePageChange(currentPage + 1)
                    }
                    className={
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PositionsTable;
