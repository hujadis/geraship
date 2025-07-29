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
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Eye,
  ArrowLeft,
} from "lucide-react";

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

interface WalletData {
  address: string;
  rating: string;
  winRate: number;
  totalPnL: number;
  activePositions: number;
  lastTrade: string;
  riskScore: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgPnL: number;
  maxDrawdown: number;
  closedTrades: number;
  closedTradePnL: number;
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

type SortField = keyof WalletData;
type SortOrder = "asc" | "desc";

interface SortConfig {
  field: SortField | null;
  order: SortOrder;
}

interface FilterConfig {
  search: string;
  rating: string;
  winRateRange: string;
  pnlRange: string;
  riskRange: string;
  positionStatus: string;
}

interface WalletListProps {
  onWalletSelect?: (address: string) => void;
  onBack?: () => void;
}

const WalletList = ({ onWalletSelect = () => {}, onBack }: WalletListProps) => {
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
    rating: "all",
    winRateRange: "all",
    pnlRange: "all",
    riskRange: "all",
    positionStatus: "all",
  });

  const fetchAllPositions = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Starting to fetch positions from API...");

      // First, get the first page to understand pagination
      const initialUrl = `/api/v1/positions?page=1&page_size=100`;
      console.log(`📄 Fetching initial page: ${initialUrl}`);

      const initialResponse = await fetch(initialUrl);

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
            fetch(pageUrl)
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

  // Calculate wallet data from positions
  const walletData = useMemo(() => {
    const walletMap = new Map<string, WalletData>();

    allPositions.forEach((position) => {
      if (!position.address) return;

      const address = position.address;
      const existing = walletMap.get(address) || {
        address,
        rating: "C",
        winRate: 0,
        totalPnL: 0,
        activePositions: 0,
        lastTrade: "",
        riskScore: 50,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        avgPnL: 0,
        maxDrawdown: 0,
        closedTrades: 0,
        closedTradePnL: 0,
      };

      existing.totalTrades += 1;
      existing.totalPnL += position.pnl || 0;

      if ((position.pnl || 0) > 0) {
        existing.winningTrades += 1;
      } else if ((position.pnl || 0) < 0) {
        existing.losingTrades += 1;
      }

      if (position.status === "active") {
        existing.activePositions += 1;
      } else if (position.status === "closed") {
        existing.closedTrades += 1;
        existing.closedTradePnL += position.pnl || 0;
      }

      // Update last trade date
      if (
        position.updated_at &&
        (!existing.lastTrade || position.updated_at > existing.lastTrade)
      ) {
        existing.lastTrade = position.updated_at;
      }

      walletMap.set(address, existing);
    });

    // Calculate derived metrics
    const wallets = Array.from(walletMap.values()).map((wallet) => {
      wallet.winRate =
        wallet.totalTrades > 0
          ? (wallet.winningTrades / wallet.totalTrades) * 100
          : 0;
      wallet.avgPnL =
        wallet.totalTrades > 0 ? wallet.totalPnL / wallet.totalTrades : 0;

      // Calculate rating based on win rate and total PnL
      if (wallet.winRate >= 80 && wallet.totalPnL > 10000) {
        wallet.rating = "A";
      } else if (wallet.winRate >= 70 && wallet.totalPnL > 5000) {
        wallet.rating = "B";
      } else if (wallet.winRate >= 60 && wallet.totalPnL > 0) {
        wallet.rating = "C";
      } else if (wallet.winRate >= 40) {
        wallet.rating = "D";
      } else {
        wallet.rating = "F";
      }

      // Calculate risk score (0-100, lower is better)
      const volatility = Math.abs(wallet.avgPnL) / Math.max(wallet.totalPnL, 1);
      wallet.riskScore = Math.min(
        100,
        Math.max(0, 50 + volatility * 30 - wallet.winRate * 0.3),
      );

      return wallet;
    });

    return wallets;
  }, [allPositions]);

  // Apply filters and sorting
  const filteredAndSortedWallets = useMemo(() => {
    let filtered = [...walletData];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((wallet) =>
        wallet.address.toLowerCase().includes(searchLower),
      );
    }

    if (filters.rating !== "all") {
      filtered = filtered.filter((wallet) => wallet.rating === filters.rating);
    }

    if (filters.winRateRange !== "all") {
      filtered = filtered.filter((wallet) => {
        switch (filters.winRateRange) {
          case "high":
            return wallet.winRate >= 70;
          case "medium":
            return wallet.winRate >= 50 && wallet.winRate < 70;
          case "low":
            return wallet.winRate < 50;
          default:
            return true;
        }
      });
    }

    if (filters.pnlRange !== "all") {
      filtered = filtered.filter((wallet) => {
        switch (filters.pnlRange) {
          case "profitable":
            return wallet.totalPnL > 0;
          case "loss":
            return wallet.totalPnL < 0;
          case "high-profit":
            return wallet.totalPnL > 10000;
          case "high-loss":
            return wallet.totalPnL < -10000;
          default:
            return true;
        }
      });
    }

    if (filters.riskRange !== "all") {
      filtered = filtered.filter((wallet) => {
        switch (filters.riskRange) {
          case "low":
            return wallet.riskScore <= 30;
          case "medium":
            return wallet.riskScore > 30 && wallet.riskScore <= 70;
          case "high":
            return wallet.riskScore > 70;
          default:
            return true;
        }
      });
    }

    if (filters.positionStatus !== "all") {
      filtered = filtered.filter((wallet) => {
        switch (filters.positionStatus) {
          case "closed-only":
            return wallet.closedTrades > 0;
          case "active-only":
            return wallet.activePositions > 0;
          case "mixed":
            return wallet.activePositions > 0 && wallet.closedTrades > 0;
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
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.order === "desc" ? -comparison : comparison;
      });
    }

    return filtered;
  }, [walletData, filters, sortConfig]);

  // Paginate the filtered and sorted data
  const paginatedWallets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedWallets.slice(startIndex, endIndex);
  }, [filteredAndSortedWallets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedWallets.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterConfig, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "A":
        return "bg-green-500 text-white";
      case "B":
        return "bg-blue-500 text-white";
      case "C":
        return "bg-yellow-500 text-black";
      case "D":
        return "bg-orange-500 text-white";
      case "F":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-green-600";
    if (score <= 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (error) {
    return (
      <Card className="w-full bg-background">
        <CardHeader>
          <CardTitle>Wallet List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-destructive mb-4 text-lg font-semibold">
              Error occurred:
            </div>
            <div className="text-sm text-muted-foreground mb-4 max-w-2xl whitespace-pre-line">
              {error}
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
        <div className="flex items-center gap-4">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <CardTitle>Wallet List</CardTitle>
        </div>
        <div className="flex gap-6 mt-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">
              {loading ? "--" : walletData.length.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">Total Wallets</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">
              {loading
                ? "--"
                : filteredAndSortedWallets.length.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              Filtered Results
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">
              {loading
                ? "--"
                : walletData
                    .filter((w) => w.rating === "A" || w.rating === "B")
                    .length.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              Top Rated (A-B)
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
                placeholder="Search wallets..."
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

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>

            <Select
              value={filters.rating}
              onValueChange={(value) => handleFilterChange("rating", value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.winRateRange}
              onValueChange={(value) =>
                handleFilterChange("winRateRange", value)
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Win Rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Win Rates</SelectItem>
                <SelectItem value="high">High (&gt;70%)</SelectItem>
                <SelectItem value="medium">Medium (50-70%)</SelectItem>
                <SelectItem value="low">Low (&lt;50%)</SelectItem>
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
                <SelectItem value="profitable">Profitable</SelectItem>
                <SelectItem value="loss">Loss</SelectItem>
                <SelectItem value="high-profit">
                  High Profit (&gt;$10K)
                </SelectItem>
                <SelectItem value="high-loss">High Loss (&lt;-$10K)</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.riskRange}
              onValueChange={(value) => handleFilterChange("riskRange", value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.positionStatus}
              onValueChange={(value) =>
                handleFilterChange("positionStatus", value)
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Position Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="closed-only">Closed Only</SelectItem>
                <SelectItem value="active-only">Active Only</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>

            {(filters.search ||
              filters.rating !== "all" ||
              filters.winRateRange !== "all" ||
              filters.pnlRange !== "all" ||
              filters.riskRange !== "all" ||
              filters.positionStatus !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    search: "",
                    rating: "all",
                    winRateRange: "all",
                    pnlRange: "all",
                    riskRange: "all",
                    positionStatus: "all",
                  });
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("address")}
                    className="h-auto p-0 font-medium"
                  >
                    Address{renderSortIcon("address")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("rating")}
                    className="h-auto p-0 font-medium"
                  >
                    Rating{renderSortIcon("rating")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("winRate")}
                    className="h-auto p-0 font-medium"
                  >
                    Win Rate{renderSortIcon("winRate")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("totalPnL")}
                    className="h-auto p-0 font-medium"
                  >
                    Total P&L{renderSortIcon("totalPnL")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("activePositions")}
                    className="h-auto p-0 font-medium"
                  >
                    Active Positions{renderSortIcon("activePositions")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("lastTrade")}
                    className="h-auto p-0 font-medium"
                  >
                    Last Trade{renderSortIcon("lastTrade")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("closedTrades")}
                    className="h-auto p-0 font-medium"
                  >
                    Closed Trades{renderSortIcon("closedTrades")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("closedTradePnL")}
                    className="h-auto p-0 font-medium"
                  >
                    Closed Trade P&L{renderSortIcon("closedTradePnL")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("riskScore")}
                    className="h-auto p-0 font-medium"
                  >
                    Risk Score{renderSortIcon("riskScore")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(10)
                  .fill(0)
                  .map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-8 mx-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-24 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-16 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-24 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-8 w-20 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : paginatedWallets.length > 0 ? (
                paginatedWallets.map((wallet) => (
                  <TableRow key={wallet.address} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getRatingColor(wallet.rating)}>
                        {wallet.rating}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          wallet.winRate >= 60
                            ? "text-green-600"
                            : wallet.winRate >= 40
                              ? "text-yellow-600"
                              : "text-red-600"
                        }
                      >
                        {wallet.winRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          wallet.totalPnL >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency(wallet.totalPnL)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {wallet.activePositions}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {wallet.lastTrade
                        ? new Date(wallet.lastTrade).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      {wallet.closedTrades}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          wallet.closedTradePnL >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency(wallet.closedTradePnL)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={getRiskColor(wallet.riskScore)}>
                        {wallet.riskScore.toFixed(0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onWalletSelect(wallet.address)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    {filteredAndSortedWallets.length === 0
                      ? filters.search ||
                        filters.rating !== "all" ||
                        filters.winRateRange !== "all" ||
                        filters.pnlRange !== "all" ||
                        filters.riskRange !== "all" ||
                        filters.positionStatus !== "all"
                        ? "No wallets match the current filters"
                        : "No wallets found"
                      : "No wallets on this page"}
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
                filteredAndSortedWallets.length,
              )}{" "}
              of {filteredAndSortedWallets.length} results
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

export default WalletList;
