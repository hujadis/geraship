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
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  AlertTriangle,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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

interface WalletDetailsProps {
  walletAddress: string;
  onBack?: () => void;
}

const WalletDetails = ({
  walletAddress,
  onBack = () => {},
}: WalletDetailsProps) => {
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "closed">("current");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    order: "desc",
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

  // Filter positions for this wallet
  const walletPositions = useMemo(() => {
    return allPositions.filter(
      (position) => position.address === walletAddress,
    );
  }, [allPositions, walletAddress]);

  // Calculate wallet statistics
  const walletStats = useMemo(() => {
    const positions = walletPositions;
    const totalTrades = positions.length;
    const activePositions = positions.filter(
      (p) => p.status === "active",
    ).length;
    const closedPositions = positions.filter(
      (p) => p.status !== "active",
    ).length;
    const totalPnL = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const winningTrades = positions.filter((p) => (p.pnl || 0) > 0).length;
    const losingTrades = positions.filter((p) => (p.pnl || 0) < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
    const maxWin = Math.max(...positions.map((p) => p.pnl || 0), 0);
    const maxLoss = Math.min(...positions.map((p) => p.pnl || 0), 0);
    const totalVolume = positions.reduce((sum, p) => sum + (p.size || 0), 0);

    // Trading style analysis
    const positionDurations = positions
      .filter((p) => p.created_at && p.updated_at)
      .map((p) => {
        const created = new Date(p.created_at!);
        const updated = new Date(p.updated_at!);
        return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
      });

    const avgPositionDuration =
      positionDurations.length > 0
        ? positionDurations.reduce((sum, duration) => sum + duration, 0) /
          positionDurations.length
        : 0;

    const dayTradingPositions = positionDurations.filter((d) => d < 1).length;
    const swingTradingPositions = positionDurations.filter(
      (d) => d >= 1 && d <= 7,
    ).length;
    const longTermPositions = positionDurations.filter((d) => d > 7).length;

    let tradingStyle = "Mixed";
    const totalAnalyzedPositions =
      dayTradingPositions + swingTradingPositions + longTermPositions;
    if (totalAnalyzedPositions > 0) {
      const dayTradingRatio = dayTradingPositions / totalAnalyzedPositions;
      const swingTradingRatio = swingTradingPositions / totalAnalyzedPositions;
      const longTermRatio = longTermPositions / totalAnalyzedPositions;

      if (dayTradingRatio > 0.6) tradingStyle = "Day Trader";
      else if (swingTradingRatio > 0.5) tradingStyle = "Swing Trader";
      else if (longTermRatio > 0.4) tradingStyle = "Long Term Trader";
    }

    // High PnL position holding analysis
    const highPnlActivePositions = positions.filter(
      (p) => p.status === "active" && (p.pnl || 0) > 1000,
    ).length;

    const avgLeverage =
      positions.filter((p) => p.leverage).length > 0
        ? positions
            .filter((p) => p.leverage)
            .reduce((sum, p) => sum + (p.leverage || 0), 0) /
          positions.filter((p) => p.leverage).length
        : 0;

    const riskTolerance =
      avgLeverage > 10
        ? "High Risk"
        : avgLeverage > 5
          ? "Medium Risk"
          : "Low Risk";

    // Calculate closed trades statistics
    const closedTradesPositions = positions.filter(
      (p) => p.status !== "active",
    );
    const closedTradesPnL = closedTradesPositions.reduce(
      (sum, p) => sum + (p.pnl || 0),
      0,
    );
    const closedWinningTrades = closedTradesPositions.filter(
      (p) => (p.pnl || 0) > 0,
    ).length;
    const closedLosingTrades = closedTradesPositions.filter(
      (p) => (p.pnl || 0) < 0,
    ).length;
    const closedWinRate =
      closedPositions > 0 ? (closedWinningTrades / closedPositions) * 100 : 0;

    // Calculate rating
    let rating = "C";
    if (winRate >= 80 && totalPnL > 10000) {
      rating = "A";
    } else if (winRate >= 70 && totalPnL > 5000) {
      rating = "B";
    } else if (winRate >= 60 && totalPnL > 0) {
      rating = "C";
    } else if (winRate >= 40) {
      rating = "D";
    } else {
      rating = "F";
    }

    // Calculate risk score
    const volatility = Math.abs(avgPnL) / Math.max(totalPnL, 1);
    const riskScore = Math.min(
      100,
      Math.max(0, 50 + volatility * 30 - winRate * 0.3),
    );

    return {
      totalTrades,
      activePositions,
      closedPositions,
      totalPnL,
      winningTrades,
      losingTrades,
      winRate,
      avgPnL,
      maxWin,
      maxLoss,
      totalVolume,
      rating,
      riskScore,
      closedTradesPnL,
      closedWinningTrades,
      closedLosingTrades,
      closedWinRate,
      avgPositionDuration,
      tradingStyle,
      dayTradingPositions,
      swingTradingPositions,
      longTermPositions,
      highPnlActivePositions,
      avgLeverage,
      riskTolerance,
    };
  }, [walletPositions]);

  // Filter positions based on active tab
  const filteredPositions = useMemo(() => {
    if (activeTab === "current") {
      return walletPositions.filter((p) => p.status === "active");
    } else {
      return walletPositions.filter((p) => p.status !== "active");
    }
  }, [walletPositions, activeTab]);

  // Apply sorting
  const sortedPositions = useMemo(() => {
    let sorted = [...filteredPositions];

    if (sortConfig.field) {
      sorted.sort((a, b) => {
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

    return sorted;
  }, [filteredPositions, sortConfig]);

  // Paginate the sorted data
  const paginatedPositions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedPositions.slice(startIndex, endIndex);
  }, [sortedPositions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedPositions.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
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
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const formatCurrencyBasic = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
    return (Math.abs(position.size) * position.entry_price) / position.leverage;
  };

  const calculateCorrectPnlPercentage = (position: Position) => {
    const initialValue = calculateInitialValue(position);
    if (!initialValue || position.pnl == null) {
      return null;
    }
    // For short positions, we need to invert the PNL calculation
    // because a negative price movement is profitable for shorts
    const pnlPercentage = (position.pnl / initialValue) * 100;
    return pnlPercentage;
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
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <CardTitle>Wallet Details</CardTitle>
          </div>
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
    <div className="w-full space-y-6 bg-background">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Wallet Details
                  <Badge className={getRatingColor(walletStats.rating)}>
                    {walletStats.rating}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  {walletAddress}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total P&L
                </p>
                <p
                  className={`text-2xl font-bold ${
                    walletStats.totalPnL >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {loading ? "--" : formatCurrencyBasic(walletStats.totalPnL)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Win Rate
                </p>
                <p
                  className={`text-2xl font-bold ${
                    walletStats.winRate >= 60
                      ? "text-green-600"
                      : walletStats.winRate >= 40
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {loading ? "--" : `${walletStats.winRate.toFixed(1)}%`}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Positions
                </p>
                <p className="text-2xl font-bold text-primary">
                  {loading ? "--" : walletStats.activePositions}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Risk Score
                </p>
                <p
                  className={`text-2xl font-bold ${getRiskColor(
                    walletStats.riskScore,
                  )}`}
                >
                  {loading ? "--" : walletStats.riskScore.toFixed(0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Closed Trades Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Closed Trades P&L
                </p>
                <p
                  className={`text-2xl font-bold ${
                    walletStats.closedTradesPnL >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {loading
                    ? "--"
                    : formatCurrencyBasic(walletStats.closedTradesPnL)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Closed Trades Win Rate
                </p>
                <p
                  className={`text-2xl font-bold ${
                    walletStats.closedWinRate >= 60
                      ? "text-green-600"
                      : walletStats.closedWinRate >= 40
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {loading ? "--" : `${walletStats.closedWinRate.toFixed(1)}%`}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Style Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Style Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Trading Style:</span>
                <Badge variant="outline" className="text-sm">
                  {loading ? "--" : walletStats.tradingStyle}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Avg Position Duration:
                </span>
                <span className="text-sm">
                  {loading
                    ? "--"
                    : `${walletStats.avgPositionDuration.toFixed(1)} days`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Tolerance:</span>
                <Badge
                  variant={
                    walletStats.riskTolerance === "High Risk"
                      ? "destructive"
                      : walletStats.riskTolerance === "Medium Risk"
                        ? "secondary"
                        : "default"
                  }
                >
                  {loading ? "--" : walletStats.riskTolerance}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Leverage:</span>
                <span className="text-sm font-medium">
                  {loading ? "--" : `${walletStats.avgLeverage.toFixed(1)}x`}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Day Trading:</span>
                  <span className="font-medium">
                    {loading ? "--" : walletStats.dayTradingPositions}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Swing Trading:</span>
                  <span className="font-medium">
                    {loading ? "--" : walletStats.swingTradingPositions}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Long Term:</span>
                  <span className="font-medium">
                    {loading ? "--" : walletStats.longTermPositions}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>High P&L Active:</span>
                  <span className="font-medium text-green-600">
                    {loading ? "--" : walletStats.highPnlActivePositions}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Trading Summary
              </p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Total Trades:</span>
                  <span className="text-sm font-medium">
                    {loading ? "--" : walletStats.totalTrades}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">Winning:</span>
                  <span className="text-sm font-medium text-green-600">
                    {loading ? "--" : walletStats.winningTrades}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-600">Losing:</span>
                  <span className="text-sm font-medium text-red-600">
                    {loading ? "--" : walletStats.losingTrades}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Performance
              </p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Avg P&L:</span>
                  <span className="text-sm font-medium">
                    {loading ? "--" : formatCurrencyBasic(walletStats.avgPnL)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">Best Trade:</span>
                  <span className="text-sm font-medium text-green-600">
                    {loading ? "--" : formatCurrencyBasic(walletStats.maxWin)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-600">Worst Trade:</span>
                  <span className="text-sm font-medium text-red-600">
                    {loading ? "--" : formatCurrencyBasic(walletStats.maxLoss)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Volume & Activity
              </p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Total Volume:</span>
                  <span className="text-sm font-medium">
                    {loading ? "--" : walletStats.totalVolume.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active:</span>
                  <span className="text-sm font-medium">
                    {loading ? "--" : walletStats.activePositions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Closed:</span>
                  <span className="text-sm font-medium">
                    {loading ? "--" : walletStats.closedPositions}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Positions</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
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
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === "current" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("current");
                setCurrentPage(1);
              }}
            >
              Current ({walletStats.activePositions})
            </Button>
            <Button
              variant={activeTab === "closed" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("closed");
                setCurrentPage(1);
              }}
            >
              Closed ({walletStats.closedPositions})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("id")}
                      className="h-auto p-0 font-medium"
                    >
                      ID{renderSortIcon("id")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("asset")}
                      className="h-auto p-0 font-medium"
                    >
                      Asset{renderSortIcon("asset")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("size")}
                      className="h-auto p-0 font-medium"
                    >
                      Size{renderSortIcon("size")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("entry_price")}
                      className="h-auto p-0 font-medium"
                    >
                      Entry Price{renderSortIcon("entry_price")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("leverage")}
                      className="h-auto p-0 font-medium"
                    >
                      Leverage{renderSortIcon("leverage")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const initialValueSort = (a: Position, b: Position) => {
                          const aValue = calculateInitialValue(a) || 0;
                          const bValue = calculateInitialValue(b) || 0;
                          return aValue - bValue;
                        };
                        setSortConfig((prev) => ({
                          field: "size", // Use size as proxy for initial value sorting
                          order:
                            prev.field === "size" && prev.order === "asc"
                              ? "desc"
                              : "asc",
                        }));
                        setCurrentPage(1);
                      }}
                      className="h-auto p-0 font-medium"
                    >
                      Initial Value{renderSortIcon("size")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="font-medium">Current Price</span>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("is_long")}
                      className="h-auto p-0 font-medium"
                    >
                      Direction{renderSortIcon("is_long")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("pnl")}
                      className="h-auto p-0 font-medium"
                    >
                      P&L{renderSortIcon("pnl")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("pnl_percentage")}
                      className="h-auto p-0 font-medium"
                    >
                      P&L %{renderSortIcon("pnl_percentage")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="h-auto p-0 font-medium"
                    >
                      Status{renderSortIcon("status")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("created_at")}
                      className="h-auto p-0 font-medium"
                    >
                      Created{renderSortIcon("created_at")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("updated_at")}
                      className="h-auto p-0 font-medium"
                    >
                      Updated{renderSortIcon("updated_at")}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-6 w-16" />
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
                          <Skeleton className="h-6 w-24 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-24 ml-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-6 w-16 mx-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-24 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-6 w-16 mx-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : paginatedPositions.length > 0 ? (
                  paginatedPositions.map((position) => (
                    <TableRow key={position.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {position.id ?? "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {position.asset ?? "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {position.size?.toLocaleString() ?? "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {position.entry_price != null
                          ? formatCurrency(position.entry_price)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {position.leverage != null
                          ? `${position.leverage}x`
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {calculateInitialValue(position) != null
                          ? formatCurrency(calculateInitialValue(position)!)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {calculateCurrentPrice(position) != null
                          ? formatCurrency(calculateCurrentPrice(position)!)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={position.is_long ? "default" : "secondary"}
                        >
                          {position.is_long ? "Long" : "Short"}
                        </Badge>
                      </TableCell>
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
                      <TableCell className="text-sm text-muted-foreground">
                        {position.created_at
                          ? new Date(position.created_at).toLocaleString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {position.updated_at
                          ? new Date(position.updated_at).toLocaleString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      {activeTab === "current"
                        ? "No active positions found"
                        : "No closed positions found"}
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
                {Math.min(currentPage * itemsPerPage, sortedPositions.length)}{" "}
                of {sortedPositions.length} results
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
    </div>
  );
};

export default WalletDetails;
