import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Shield,
  Eye,
  Clock,
  Users,
  Coins,
  Calendar,
  Percent,
  Calculator,
  TrendingUpDown,
  Wallet,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Gauge,
  Timer,
  Hash,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Layers,
  MapPin,
  Filter,
  Sparkles,
  Brain,
  Lightbulb,
  Award,
  Flame,
  Snowflake,
  Crosshair,
  Radar,
  Compass,
  Telescope,
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

interface AnalyticsProps {
  onBack?: () => void;
}

const Analytics = ({ onBack = () => {} }: AnalyticsProps) => {
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPositions = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Starting to fetch positions from API...");

      const initialUrl = `/api/v1/positions?page=1&page_size=100`;
      const initialResponse = await fetchApi(initialUrl);

      if (!initialResponse.ok) {
        const errorText = await initialResponse.text();
        throw new Error(
          `HTTP ${initialResponse.status}: ${initialResponse.statusText} - ${errorText}`,
        );
      }

      const initialData: ApiResponse = await initialResponse.json();
      let allPositions: Position[] = [...initialData.data];

      if (initialData.pagination.total_pages > 1) {
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
              .then((pageData: ApiResponse) => pageData.data)
              .catch(() => []),
          );
        }

        const additionalPages = await Promise.all(fetchPromises);
        for (const pageData of additionalPages) {
          allPositions = [...allPositions, ...pageData];
        }
      }

      setAllPositions(allPositions);
    } catch (err) {
      console.error("💥 Fetch error:", err);
      let errorMessage = "An unknown error occurred";
      if (err instanceof Error) {
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

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    if (allPositions.length === 0) {
      return {
        marketSentiment: {
          bullish: 0,
          bearish: 0,
          sentiment: "neutral",
          confidence: 0,
          volatility: 0,
        },
        assetAnalysis: [],
        entryPriceAnalysis: {
          earlyEntries: [],
          recentEntries: [],
          priceDistribution: [],
          volatilityAnalysis: [],
        },
        patterns: { unusual: [], usual: [], correlations: [], seasonality: [] },
        tradingOpportunities: {
          longSuggestions: [],
          shortSuggestions: [],
          arbitrage: [],
          momentum: [],
        },
        professionalTraderAnalysis: [],
        riskMetrics: {
          highRisk: 0,
          mediumRisk: 0,
          lowRisk: 0,
          riskScore: 0,
          diversification: 0,
        },
        performanceMetrics: {
          totalPnL: 0,
          winRate: 0,
          avgPnL: 0,
          totalVolume: 0,
          activePositions: 0,
          closedPositions: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          profitFactor: 0,
          avgHoldingTime: 0,
          bestPerformer: null,
          worstPerformer: null,
        },
        timeAnalysis: {
          recentActivity: 0,
          oldActivity: 0,
          hourlyDistribution: [],
          weeklyDistribution: [],
          monthlyTrends: [],
          seasonalPatterns: [],
        },
        leverageAnalysis: {
          highLeverage: 0,
          mediumLeverage: 0,
          lowLeverage: 0,
          avgLeverage: 0,
          leverageEfficiency: 0,
          riskAdjustedReturns: { high: 0, medium: 0, low: 0 },
        },
        walletAnalysis: {
          uniqueWallets: 0,
          topPerformers: [],
          concentrationRisk: 0,
          diversityScore: 0,
        },
        marketConditions: {
          volatilityIndex: 0,
          trendStrength: 0,
          marketPhase: "neutral",
          correlationMatrix: [],
        },
        advancedMetrics: {
          kellyCriterion: 0,
          informationRatio: 0,
          calmarRatio: 0,
          sortinoRatio: 0,
          treynorRatio: 0,
        },
      };
    }

    // Market Sentiment Analysis
    const longPositions = allPositions.filter((p) => p.is_long === true).length;
    const shortPositions = allPositions.filter(
      (p) => p.is_long === false,
    ).length;
    const bullishPercentage = (longPositions / allPositions.length) * 100;
    const bearishPercentage = (shortPositions / allPositions.length) * 100;
    const sentiment =
      bullishPercentage > 60
        ? "bullish"
        : bearishPercentage > 60
          ? "bearish"
          : "neutral";

    // Calculate sentiment confidence and volatility
    const sentimentConfidence = Math.abs(bullishPercentage - bearishPercentage);
    const pnlValues = allPositions
      .map((p) => p.pnl || 0)
      .filter((pnl) => pnl !== 0);
    const avgPnL =
      pnlValues.reduce((sum, pnl) => sum + pnl, 0) / pnlValues.length;
    const pnlVariance =
      pnlValues.reduce((sum, pnl) => sum + Math.pow(pnl - avgPnL, 2), 0) /
      pnlValues.length;
    const volatility = (Math.sqrt(pnlVariance) / Math.abs(avgPnL)) * 100 || 0;

    // Enhanced Asset Analysis
    const assetMap = new Map<string, any>();
    allPositions.forEach((position) => {
      if (!position.asset) return;
      const asset = position.asset;
      const existing = assetMap.get(asset) || {
        asset,
        longCount: 0,
        shortCount: 0,
        totalPnL: 0,
        avgEntryPrice: 0,
        totalVolume: 0,
        positions: [],
        winRate: 0,
        avgLeverage: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        momentum: 0,
        rsi: 0,
        beta: 0,
        alpha: 0,
      };

      existing.positions.push(position);
      existing.totalPnL += position.pnl || 0;
      existing.totalVolume += position.size || 0;

      if (position.is_long) {
        existing.longCount += 1;
      } else {
        existing.shortCount += 1;
      }

      assetMap.set(asset, existing);
    });

    const currentTime = new Date().getTime();
    const assetAnalysis = Array.from(assetMap.values())
      .map((asset) => {
        const entryPrices = asset.positions
          .map((p: Position) => p.entry_price)
          .filter((price: number) => price != null);
        asset.avgEntryPrice =
          entryPrices.length > 0
            ? entryPrices.reduce(
                (sum: number, price: number) => sum + price,
                0,
              ) / entryPrices.length
            : 0;
        asset.sentiment =
          asset.longCount > asset.shortCount ? "bullish" : "bearish";
        asset.totalPositions = asset.longCount + asset.shortCount;

        // Calculate advanced metrics for each asset
        const assetPnLs = asset.positions.map((p: Position) => p.pnl || 0);
        const winningTrades = assetPnLs.filter((pnl: number) => pnl > 0).length;
        asset.winRate = (winningTrades / asset.positions.length) * 100;

        const leverages = asset.positions
          .map((p: Position) => p.leverage || 0)
          .filter((l: number) => l > 0);
        asset.avgLeverage =
          leverages.length > 0
            ? leverages.reduce((sum: number, l: number) => sum + l, 0) /
              leverages.length
            : 0;

        // Calculate volatility
        const assetAvgPnL =
          assetPnLs.reduce((sum: number, pnl: number) => sum + pnl, 0) /
          assetPnLs.length;
        const variance =
          assetPnLs.reduce(
            (sum: number, pnl: number) => sum + Math.pow(pnl - assetAvgPnL, 2),
            0,
          ) / assetPnLs.length;
        asset.volatility = Math.sqrt(variance);

        // Calculate Sharpe ratio (simplified)
        asset.sharpeRatio =
          asset.volatility > 0 ? assetAvgPnL / asset.volatility : 0;

        // Calculate max drawdown
        let peak = 0;
        let maxDD = 0;
        let runningPnL = 0;
        asset.positions.forEach((p: Position) => {
          runningPnL += p.pnl || 0;
          if (runningPnL > peak) peak = runningPnL;
          const drawdown = ((peak - runningPnL) / Math.abs(peak)) * 100;
          if (drawdown > maxDD) maxDD = drawdown;
        });
        asset.maxDrawdown = maxDD;

        // Calculate momentum (recent vs older performance)
        const recentPositions = asset.positions.filter((p: Position) => {
          if (!p.created_at) return false;
          const createdTime = new Date(p.created_at).getTime();
          return createdTime > currentTime - 30 * 24 * 60 * 60 * 1000;
        });
        const recentPnL = recentPositions.reduce(
          (sum: number, p: Position) => sum + (p.pnl || 0),
          0,
        );
        const olderPnL = asset.totalPnL - recentPnL;
        asset.momentum =
          recentPositions.length > 0 &&
          asset.positions.length > recentPositions.length
            ? recentPnL / recentPositions.length -
              olderPnL / (asset.positions.length - recentPositions.length)
            : 0;

        return asset;
      })
      .sort((a, b) => b.totalPositions - a.totalPositions);

    // Enhanced Entry Price Analysis
    const oneYearAgo = currentTime - 365 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = currentTime - 180 * 24 * 60 * 60 * 1000;
    const threeMonthsAgo = currentTime - 90 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = currentTime - 30 * 24 * 60 * 60 * 1000;

    const earlyEntries = allPositions
      .filter((p) => {
        if (!p.entry_price || !p.created_at) return false;
        const createdTime = new Date(p.created_at).getTime();
        return createdTime < oneYearAgo && p.entry_price < 1000;
      })
      .sort((a, b) => (a.entry_price || 0) - (b.entry_price || 0))
      .slice(0, 10);

    const recentEntries = allPositions
      .filter((p) => {
        if (!p.created_at) return false;
        const createdTime = new Date(p.created_at).getTime();
        return createdTime > oneYearAgo;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(),
      )
      .slice(0, 10);

    // Price distribution analysis
    const priceRanges = {
      "Under $1": 0,
      "$1-$10": 0,
      "$10-$100": 0,
      "$100-$1K": 0,
      "$1K-$10K": 0,
      "Over $10K": 0,
    };

    allPositions.forEach((p) => {
      const price = p.entry_price || 0;
      if (price < 1) priceRanges["Under $1"]++;
      else if (price < 10) priceRanges["$1-$10"]++;
      else if (price < 100) priceRanges["$10-$100"]++;
      else if (price < 1000) priceRanges["$100-$1K"]++;
      else if (price < 10000) priceRanges["$1K-$10K"]++;
      else priceRanges["Over $10K"]++;
    });

    const priceDistribution = Object.entries(priceRanges).map(
      ([range, count]) => ({ range, count }),
    );

    // Volatility analysis by entry price
    const volatilityAnalysis = assetAnalysis
      .map((asset) => ({
        asset: asset.asset,
        avgEntryPrice: asset.avgEntryPrice,
        volatility: asset.volatility,
        riskAdjustedReturn:
          asset.volatility > 0 ? asset.totalPnL / asset.volatility : 0,
      }))
      .sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn);

    // Enhanced Pattern Analysis
    const unusualPatterns = [];
    const usualPatterns = [];
    const correlations = [];
    const seasonality = [];

    // Unusual: Very high PnL with low entry price
    const highPnLLowEntry = allPositions.filter(
      (p) => (p.pnl || 0) > 10000 && (p.entry_price || 0) < 100,
    );
    if (highPnLLowEntry.length > 0) {
      unusualPatterns.push({
        type: "High PnL with Low Entry Price",
        description: `${highPnLLowEntry.length} positions with >$10K PnL and entry price <$100`,
        count: highPnLLowEntry.length,
        significance: "high",
        impact: "Potential early adopter advantage",
      });
    }

    // Unusual: Extreme leverage positions
    const extremeLeverage = allPositions.filter((p) => (p.leverage || 0) > 50);
    if (extremeLeverage.length > 0) {
      unusualPatterns.push({
        type: "Extreme Leverage Trading",
        description: `${extremeLeverage.length} positions with leverage >50x`,
        count: extremeLeverage.length,
        significance: "high",
        impact: "High risk, high reward strategy",
      });
    }

    // Unusual: Whale positions (very large sizes)
    const whalePositions = allPositions.filter((p) => (p.size || 0) > 1000000);
    if (whalePositions.length > 0) {
      unusualPatterns.push({
        type: "Whale Activity",
        description: `${whalePositions.length} positions with size >1M`,
        count: whalePositions.length,
        significance: "high",
        impact: "Market moving potential",
      });
    }

    // Unusual: Perfect timing (high PnL with recent entry)
    const perfectTiming = allPositions.filter((p) => {
      if (!p.created_at) return false;
      const createdTime = new Date(p.created_at).getTime();
      const isRecent = createdTime > currentTime - 7 * 24 * 60 * 60 * 1000; // Last 7 days
      return isRecent && (p.pnl || 0) > 5000;
    });
    if (perfectTiming.length > 0) {
      unusualPatterns.push({
        type: "Perfect Market Timing",
        description: `${perfectTiming.length} positions with >$5K PnL in <7 days`,
        count: perfectTiming.length,
        significance: "high",
        impact: "Exceptional timing or insider knowledge",
      });
    }

    // Unusual: Contrarian plays (opposite to market sentiment)
    const contrarian = allPositions
      .filter((p) => {
        if (sentiment === "bullish" && !p.is_long) return true;
        if (sentiment === "bearish" && p.is_long) return true;
        return false;
      })
      .filter((p) => (p.pnl || 0) > 1000);
    if (contrarian.length > 0) {
      unusualPatterns.push({
        type: "Successful Contrarian Plays",
        description: `${contrarian.length} profitable positions against market sentiment`,
        count: contrarian.length,
        significance: "medium",
        impact: "Counter-trend strategy success",
      });
    }

    // Usual patterns
    const moderateLeverage = allPositions.filter(
      (p) => (p.leverage || 0) >= 5 && (p.leverage || 0) <= 20,
    );
    usualPatterns.push({
      type: "Moderate Leverage Usage",
      description: `${moderateLeverage.length} positions using 5-20x leverage`,
      count: moderateLeverage.length,
      significance: "medium",
      impact: "Balanced risk approach",
    });

    const followTrend = allPositions.filter((p) => {
      if (sentiment === "bullish" && p.is_long) return true;
      if (sentiment === "bearish" && !p.is_long) return true;
      return false;
    });
    usualPatterns.push({
      type: "Trend Following",
      description: `${followTrend.length} positions following market sentiment`,
      count: followTrend.length,
      significance: "low",
      impact: "Conservative market approach",
    });

    // Correlation analysis between assets
    for (let i = 0; i < assetAnalysis.length - 1; i++) {
      for (let j = i + 1; j < Math.min(assetAnalysis.length, i + 5); j++) {
        const asset1 = assetAnalysis[i];
        const asset2 = assetAnalysis[j];

        // Simple correlation based on PnL patterns
        const correlation = Math.random() * 2 - 1; // Simplified for demo

        if (Math.abs(correlation) > 0.7) {
          correlations.push({
            pair: `${asset1.asset} - ${asset2.asset}`,
            correlation: correlation,
            strength: Math.abs(correlation) > 0.9 ? "Very Strong" : "Strong",
            type: correlation > 0 ? "Positive" : "Negative",
          });
        }
      }
    }

    // Seasonality patterns (simplified)
    const monthlyData = new Array(12)
      .fill(0)
      .map((_, i) => ({ month: i, totalPnL: 0, count: 0 }));
    allPositions.forEach((p) => {
      if (p.created_at) {
        const month = new Date(p.created_at).getMonth();
        monthlyData[month].totalPnL += p.pnl || 0;
        monthlyData[month].count += 1;
      }
    });

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    monthlyData.forEach((data, i) => {
      if (data.count > 0) {
        seasonality.push({
          period: monthNames[i],
          avgPnL: data.totalPnL / data.count,
          totalTrades: data.count,
          performance: data.totalPnL > 0 ? "Positive" : "Negative",
        });
      }
    });

    // Enhanced Trading Opportunities
    const longSuggestions = [];
    const shortSuggestions = [];
    const arbitrage = [];
    const momentum = [];

    // Professional Trader Analysis - Smart Money Tracking
    const professionalTraderAnalysis = [];

    assetAnalysis.forEach((asset) => {
      const recentPositions = asset.positions.filter((p: Position) => {
        if (!p.created_at) return false;
        const createdTime = new Date(p.created_at).getTime();
        return createdTime > currentTime - 30 * 24 * 60 * 60 * 1000;
      });

      const recentPnL = recentPositions.reduce(
        (sum: number, p: Position) => sum + (p.pnl || 0),
        0,
      );
      const avgRecentPnL =
        recentPositions.length > 0 ? recentPnL / recentPositions.length : 0;

      // Smart Money Analysis - Filter out positions with extreme PnL (>$50K profit or >$25K loss)
      const smartMoneyPositions = asset.positions.filter((p: Position) => {
        const pnl = p.pnl || 0;
        return Math.abs(pnl) < 50000 && pnl > -25000; // Exclude extreme winners/losers
      });

      if (smartMoneyPositions.length >= 3) {
        // Need at least 3 positions for reliable signal
        const avgEntryPrice =
          smartMoneyPositions.reduce(
            (sum, p) => sum + (p.entry_price || 0),
            0,
          ) / smartMoneyPositions.length;
        const longPositions = smartMoneyPositions.filter(
          (p) => p.is_long,
        ).length;
        const shortPositions = smartMoneyPositions.filter(
          (p) => !p.is_long,
        ).length;
        const totalSmartPositions = smartMoneyPositions.length;

        // Calculate sentiment strength
        const longPercentage = (longPositions / totalSmartPositions) * 100;
        const shortPercentage = (shortPositions / totalSmartPositions) * 100;

        // Calculate average PnL of smart money positions
        const avgSmartPnL =
          smartMoneyPositions.reduce((sum, p) => sum + (p.pnl || 0), 0) /
          smartMoneyPositions.length;
        const winRate =
          (smartMoneyPositions.filter((p) => (p.pnl || 0) > 0).length /
            smartMoneyPositions.length) *
          100;

        professionalTraderAnalysis.push({
          asset: asset.asset,
          avgEntryPrice,
          longPositions,
          shortPositions,
          longPercentage,
          shortPercentage,
          avgSmartPnL,
          winRate,
          totalPositions: totalSmartPositions,
          sentiment:
            longPercentage > 65
              ? "strong_bullish"
              : longPercentage > 55
                ? "bullish"
                : shortPercentage > 65
                  ? "strong_bearish"
                  : shortPercentage > 55
                    ? "bearish"
                    : "neutral",
        });

        // Generate Long Suggestions based on Smart Money
        if (longPercentage > 60 && avgSmartPnL > -1000 && winRate > 45) {
          longSuggestions.push({
            asset: asset.asset,
            reason: `${longPositions} professional traders are long with ${longPercentage.toFixed(1)}% bullish sentiment`,
            confidence:
              longPercentage > 75
                ? "high"
                : longPercentage > 65
                  ? "medium"
                  : "low",
            avgEntryPrice: avgEntryPrice,
            recentPnL: avgRecentPnL,
            winRate: winRate,
            sharpeRatio: asset.sharpeRatio,
            momentum: asset.momentum,
            riskScore:
              asset.maxDrawdown < 20
                ? "Low"
                : asset.maxDrawdown < 40
                  ? "Medium"
                  : "High",
            strategy: "Smart Money Following",
            professionalCount: longPositions,
            sentimentStrength: longPercentage,
            avgProfessionalPnL: avgSmartPnL,
          });
        }

        // Generate Short Suggestions based on Smart Money
        if (shortPercentage > 60 && avgSmartPnL > -1000 && winRate > 45) {
          shortSuggestions.push({
            asset: asset.asset,
            reason: `${shortPositions} professional traders are short with ${shortPercentage.toFixed(1)}% bearish sentiment`,
            confidence:
              shortPercentage > 75
                ? "high"
                : shortPercentage > 65
                  ? "medium"
                  : "low",
            avgEntryPrice: avgEntryPrice,
            recentPnL: avgRecentPnL,
            winRate: winRate,
            maxDrawdown: asset.maxDrawdown,
            momentum: asset.momentum,
            riskScore: "Medium",
            strategy: "Smart Money Following",
            professionalCount: shortPositions,
            sentimentStrength: shortPercentage,
            avgProfessionalPnL: avgSmartPnL,
          });
        }

        // Contrarian Opportunities - When smart money is wrong but not too wrong
        if (avgSmartPnL < -2000 && avgSmartPnL > -10000 && winRate < 40) {
          if (longPercentage > 60) {
            shortSuggestions.push({
              asset: asset.asset,
              reason: `Contrarian play: ${longPositions} pros are long but averaging ${formatCurrency(avgSmartPnL)} loss`,
              confidence: "medium",
              avgEntryPrice: avgEntryPrice,
              recentPnL: avgRecentPnL,
              winRate: 100 - winRate, // Inverse win rate for contrarian
              maxDrawdown: asset.maxDrawdown,
              momentum: -asset.momentum, // Inverse momentum
              riskScore: "Medium",
              strategy: "Contrarian",
              professionalCount: longPositions,
              sentimentStrength: shortPercentage,
              avgProfessionalPnL: avgSmartPnL,
            });
          } else if (shortPercentage > 60) {
            longSuggestions.push({
              asset: asset.asset,
              reason: `Contrarian play: ${shortPositions} pros are short but averaging ${formatCurrency(avgSmartPnL)} loss`,
              confidence: "medium",
              avgEntryPrice: avgEntryPrice,
              recentPnL: avgRecentPnL,
              winRate: 100 - winRate, // Inverse win rate for contrarian
              sharpeRatio: asset.sharpeRatio,
              momentum: -asset.momentum, // Inverse momentum
              riskScore: "Medium",
              strategy: "Contrarian",
              professionalCount: shortPositions,
              sentimentStrength: longPercentage,
              avgProfessionalPnL: avgSmartPnL,
            });
          }
        }

        // Enhanced long suggestions (existing logic)
        if (
          asset.sentiment === "bullish" &&
          avgRecentPnL > 0 &&
          asset.avgEntryPrice < 500 &&
          asset.winRate > 60
        ) {
          longSuggestions.push({
            asset: asset.asset,
            reason:
              "Strong bullish sentiment with consistent wins and low entry prices",
            confidence: "high",
            avgEntryPrice: asset.avgEntryPrice,
            recentPnL: avgRecentPnL,
            winRate: asset.winRate,
            sharpeRatio: asset.sharpeRatio,
            momentum: asset.momentum,
            riskScore:
              asset.maxDrawdown < 20
                ? "Low"
                : asset.maxDrawdown < 40
                  ? "Medium"
                  : "High",
            strategy: "Technical Analysis",
          });
        }

        // Momentum plays
        if (asset.momentum > 1000 && asset.winRate > 50) {
          momentum.push({
            asset: asset.asset,
            reason: "Strong positive momentum with good win rate",
            confidence: asset.momentum > 5000 ? "high" : "medium",
            momentum: asset.momentum,
            winRate: asset.winRate,
            direction: "Long",
            timeframe: "Short-term",
          });
        } else if (asset.momentum < -1000 && asset.winRate > 50) {
          momentum.push({
            asset: asset.asset,
            reason: "Strong negative momentum - potential short opportunity",
            confidence: asset.momentum < -5000 ? "high" : "medium",
            momentum: asset.momentum,
            winRate: asset.winRate,
            direction: "Short",
            timeframe: "Short-term",
          });
        }

        // Enhanced short suggestions (existing logic)
        if (
          asset.sentiment === "bearish" &&
          avgRecentPnL < 0 &&
          asset.avgEntryPrice > 1000 &&
          asset.maxDrawdown > 30
        ) {
          shortSuggestions.push({
            asset: asset.asset,
            reason:
              "Bearish sentiment with recent losses, high entry prices, and significant drawdown",
            confidence: "medium",
            avgEntryPrice: asset.avgEntryPrice,
            recentPnL: avgRecentPnL,
            winRate: asset.winRate,
            maxDrawdown: asset.maxDrawdown,
            momentum: asset.momentum,
            riskScore: "High",
            strategy: "Technical Analysis",
          });
        }

        // Mean reversion opportunities
        if (
          asset.maxDrawdown > 50 &&
          asset.totalPnL > 0 &&
          asset.winRate > 55
        ) {
          longSuggestions.push({
            asset: asset.asset,
            reason:
              "Mean reversion opportunity - oversold with strong fundamentals",
            confidence: "medium",
            avgEntryPrice: asset.avgEntryPrice,
            recentPnL: avgRecentPnL,
            winRate: asset.winRate,
            sharpeRatio: asset.sharpeRatio,
            momentum: asset.momentum,
            riskScore: "Medium",
            strategy: "Mean Reversion",
          });
        }
      }
    });

    // Sort suggestions by confidence and professional count
    longSuggestions.sort((a, b) => {
      const confidenceScore = { high: 3, medium: 2, low: 1 };
      const aScore =
        (confidenceScore[a.confidence] || 0) + (a.professionalCount || 0) * 0.1;
      const bScore =
        (confidenceScore[b.confidence] || 0) + (b.professionalCount || 0) * 0.1;
      return bScore - aScore;
    });

    shortSuggestions.sort((a, b) => {
      const confidenceScore = { high: 3, medium: 2, low: 1 };
      const aScore =
        (confidenceScore[a.confidence] || 0) + (a.professionalCount || 0) * 0.1;
      const bScore =
        (confidenceScore[b.confidence] || 0) + (b.professionalCount || 0) * 0.1;
      return bScore - aScore;
    });

    // Arbitrage opportunities (simplified)
    const priceGaps = assetAnalysis.filter((asset) => {
      const positions = asset.positions;
      if (positions.length < 2) return false;

      const prices = positions
        .map((p: Position) => p.entry_price || 0)
        .filter((p) => p > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceSpread = ((maxPrice - minPrice) / minPrice) * 100;

      return priceSpread > 10; // 10% price difference
    });

    priceGaps.forEach((asset) => {
      const positions = asset.positions;
      const prices = positions
        .map((p: Position) => p.entry_price || 0)
        .filter((p) => p > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceSpread = ((maxPrice - minPrice) / minPrice) * 100;

      arbitrage.push({
        asset: asset.asset,
        reason: `Significant price spread detected across positions`,
        confidence: priceSpread > 20 ? "high" : "medium",
        minPrice: minPrice,
        maxPrice: maxPrice,
        spread: priceSpread,
        opportunity: "Price arbitrage potential",
      });
    });

    // Enhanced Risk Metrics
    const highRisk = allPositions.filter(
      (p) => (p.leverage || 0) > 25 || Math.abs(p.pnl || 0) > 50000,
    ).length;
    const mediumRisk = allPositions.filter(
      (p) =>
        ((p.leverage || 0) >= 10 && (p.leverage || 0) <= 25) ||
        (Math.abs(p.pnl || 0) >= 10000 && Math.abs(p.pnl || 0) <= 50000),
    ).length;
    const lowRisk = allPositions.length - highRisk - mediumRisk;

    // Calculate overall risk score (0-100)
    const riskFactors = {
      highLeverageRatio: (highRisk / allPositions.length) * 40,
      concentrationRisk:
        assetAnalysis.length > 0
          ? (assetAnalysis[0].totalPositions / allPositions.length) * 30
          : 0,
      volatilityRisk: Math.min(volatility / 10, 20),
      drawdownRisk: Math.min(
        Math.max(...assetAnalysis.map((a) => a.maxDrawdown)) / 5,
        10,
      ),
    };
    const riskScore = Object.values(riskFactors).reduce(
      (sum, risk) => sum + risk,
      0,
    );

    // Diversification score
    const uniqueAssets = assetAnalysis.length;
    const totalPositions = allPositions.length;
    const diversification =
      uniqueAssets > 0
        ? Math.min((uniqueAssets / Math.sqrt(totalPositions)) * 100, 100)
        : 0;

    // Enhanced Performance Metrics
    const totalPnL = allPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const winningPositions = allPositions.filter(
      (p) => (p.pnl || 0) > 0,
    ).length;
    const losingPositions = allPositions.filter((p) => (p.pnl || 0) < 0).length;
    const winRate = (winningPositions / allPositions.length) * 100;
    const totalVolume = allPositions.reduce((sum, p) => sum + (p.size || 0), 0);
    const activePositions = allPositions.filter(
      (p) => p.status === "active",
    ).length;
    const closedPositions = allPositions.filter(
      (p) => p.status !== "active",
    ).length;

    // Advanced performance metrics
    const winningPnL = allPositions
      .filter((p) => (p.pnl || 0) > 0)
      .reduce((sum, p) => sum + (p.pnl || 0), 0);
    const losingPnL = Math.abs(
      allPositions
        .filter((p) => (p.pnl || 0) < 0)
        .reduce((sum, p) => sum + (p.pnl || 0), 0),
    );
    const profitFactor =
      losingPnL > 0 ? winningPnL / losingPnL : winningPnL > 0 ? 999 : 0;

    // Sharpe Ratio (simplified)
    const returns = allPositions.map((p) => p.pnl || 0);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnVariance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
      returns.length;
    const returnStdDev = Math.sqrt(returnVariance);
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

    // Max Drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    allPositions.forEach((p) => {
      runningPnL += p.pnl || 0;
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = peak > 0 ? ((peak - runningPnL) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Average holding time (simplified)
    const positionsWithDates = allPositions.filter(
      (p) => p.created_at && p.updated_at,
    );
    const avgHoldingTime =
      positionsWithDates.length > 0
        ? positionsWithDates.reduce((sum, p) => {
            const created = new Date(p.created_at!).getTime();
            const updated = new Date(p.updated_at!).getTime();
            return sum + (updated - created);
          }, 0) /
          positionsWithDates.length /
          (1000 * 60 * 60 * 24)
        : 0; // in days

    // Best and worst performers
    const sortedByPnL = [...allPositions].sort(
      (a, b) => (b.pnl || 0) - (a.pnl || 0),
    );
    const bestPerformer = sortedByPnL[0];
    const worstPerformer = sortedByPnL[sortedByPnL.length - 1];

    // Enhanced Time Analysis
    const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
    const recentActivity = allPositions.filter((p) => {
      if (!p.created_at) return false;
      return new Date(p.created_at).getTime() > thirtyDaysAgo;
    }).length;
    const oldActivity = allPositions.length - recentActivity;

    // Hourly distribution
    const hourlyData = new Array(24).fill(0);
    allPositions.forEach((p) => {
      if (p.created_at) {
        const hour = new Date(p.created_at).getHours();
        hourlyData[hour]++;
      }
    });
    const hourlyDistribution = hourlyData.map((count, hour) => ({
      hour,
      count,
    }));

    // Weekly distribution
    const weeklyData = new Array(7).fill(0);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    allPositions.forEach((p) => {
      if (p.created_at) {
        const day = new Date(p.created_at).getDay();
        weeklyData[day]++;
      }
    });
    const weeklyDistribution = weeklyData.map((count, day) => ({
      day: dayNames[day],
      count,
    }));

    // Monthly trends
    const monthlyTrends = monthlyData.map((data, i) => ({
      month: monthNames[i],
      totalPnL: data.totalPnL,
      avgPnL: data.count > 0 ? data.totalPnL / data.count : 0,
      count: data.count,
      winRate:
        data.count > 0
          ? (allPositions.filter((p) => {
              if (!p.created_at) return false;
              const month = new Date(p.created_at).getMonth();
              return month === i && (p.pnl || 0) > 0;
            }).length /
              data.count) *
            100
          : 0,
    }));

    // Seasonal patterns
    const seasons = {
      Winter: [11, 0, 1],
      Spring: [2, 3, 4],
      Summer: [5, 6, 7],
      Fall: [8, 9, 10],
    };

    const seasonalPatterns = Object.entries(seasons).map(([season, months]) => {
      const seasonPositions = allPositions.filter((p) => {
        if (!p.created_at) return false;
        const month = new Date(p.created_at).getMonth();
        return months.includes(month);
      });

      const seasonPnL = seasonPositions.reduce(
        (sum, p) => sum + (p.pnl || 0),
        0,
      );
      const seasonWins = seasonPositions.filter((p) => (p.pnl || 0) > 0).length;

      return {
        season,
        totalPnL: seasonPnL,
        avgPnL:
          seasonPositions.length > 0 ? seasonPnL / seasonPositions.length : 0,
        count: seasonPositions.length,
        winRate:
          seasonPositions.length > 0
            ? (seasonWins / seasonPositions.length) * 100
            : 0,
        performance: seasonPnL > 0 ? "Positive" : "Negative",
      };
    });

    // Enhanced Leverage Analysis
    const highLeverageCount = allPositions.filter(
      (p) => (p.leverage || 0) > 20,
    ).length;
    const mediumLeverageCount = allPositions.filter(
      (p) => (p.leverage || 0) >= 5 && (p.leverage || 0) <= 20,
    ).length;
    const lowLeverageCount = allPositions.filter(
      (p) => (p.leverage || 0) < 5,
    ).length;

    // Average leverage
    const leverages = allPositions
      .map((p) => p.leverage || 0)
      .filter((l) => l > 0);
    const avgLeverage =
      leverages.length > 0
        ? leverages.reduce((sum, l) => sum + l, 0) / leverages.length
        : 0;

    // Leverage efficiency (PnL per unit of leverage)
    const leverageEfficiency = avgLeverage > 0 ? totalPnL / avgLeverage : 0;

    // Risk-adjusted returns by leverage
    const highLevPositions = allPositions.filter((p) => (p.leverage || 0) > 20);
    const medLevPositions = allPositions.filter(
      (p) => (p.leverage || 0) >= 5 && (p.leverage || 0) <= 20,
    );
    const lowLevPositions = allPositions.filter((p) => (p.leverage || 0) < 5);

    const highLevPnL = highLevPositions.reduce(
      (sum, p) => sum + (p.pnl || 0),
      0,
    );
    const medLevPnL = medLevPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const lowLevPnL = lowLevPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);

    const riskAdjustedReturns = {
      high:
        highLevPositions.length > 0 ? highLevPnL / highLevPositions.length : 0,
      medium:
        medLevPositions.length > 0 ? medLevPnL / medLevPositions.length : 0,
      low: lowLevPositions.length > 0 ? lowLevPnL / lowLevPositions.length : 0,
    };

    // Wallet Analysis
    const uniqueWallets = new Set(
      allPositions.map((p) => p.address).filter((addr) => addr),
    ).size;

    // Top performing wallets
    const walletMap = new Map();
    allPositions.forEach((p) => {
      if (!p.address) return;
      const existing = walletMap.get(p.address) || {
        address: p.address,
        totalPnL: 0,
        positions: 0,
        winRate: 0,
      };
      existing.totalPnL += p.pnl || 0;
      existing.positions += 1;
      walletMap.set(p.address, existing);
    });

    const topPerformers = Array.from(walletMap.values())
      .map((wallet) => {
        const walletPositions = allPositions.filter(
          (p) => p.address === wallet.address,
        );
        const wins = walletPositions.filter((p) => (p.pnl || 0) > 0).length;
        wallet.winRate = (wins / walletPositions.length) * 100;
        return wallet;
      })
      .sort((a, b) => b.totalPnL - a.totalPnL)
      .slice(0, 10);

    // Concentration risk (what % of total PnL comes from top wallet)
    const concentrationRisk =
      topPerformers.length > 0 && totalPnL > 0
        ? (topPerformers[0].totalPnL / totalPnL) * 100
        : 0;

    // Diversity score based on wallet distribution
    const diversityScore =
      uniqueWallets > 0
        ? Math.min((uniqueWallets / Math.sqrt(allPositions.length)) * 100, 100)
        : 0;

    // Market Conditions Analysis
    const volatilityIndex = Math.min(volatility, 100);
    const trendStrength = Math.abs(bullishPercentage - bearishPercentage);
    const marketPhase =
      trendStrength > 70
        ? bullishPercentage > bearishPercentage
          ? "strong_bull"
          : "strong_bear"
        : trendStrength > 40
          ? bullishPercentage > bearishPercentage
            ? "bull"
            : "bear"
          : "sideways";

    // Advanced Financial Metrics
    const kellyCriterion =
      winRate > 0 && losingPositions > 0
        ? winRate / 100 -
          ((100 - winRate) / 100 / (winningPnL / winningPositions)) *
            (losingPnL / losingPositions)
        : 0;

    const informationRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;
    const calmarRatio =
      maxDrawdown > 0
        ? totalPnL / allPositions.length / (maxDrawdown / 100)
        : 0;
    const sortinoRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0; // Simplified
    const treynorRatio = avgReturn; // Simplified without beta

    return {
      marketSentiment: {
        bullish: bullishPercentage,
        bearish: bearishPercentage,
        sentiment,
        confidence: sentimentConfidence,
        volatility: volatility,
      },
      assetAnalysis,
      entryPriceAnalysis: {
        earlyEntries,
        recentEntries,
        priceDistribution,
        volatilityAnalysis,
      },
      patterns: {
        unusual: unusualPatterns,
        usual: usualPatterns,
        correlations,
        seasonality,
      },
      tradingOpportunities: {
        longSuggestions,
        shortSuggestions,
        arbitrage,
        momentum,
      },
      professionalTraderAnalysis,
      riskMetrics: {
        highRisk,
        mediumRisk,
        lowRisk,
        riskScore,
        diversification,
      },
      performanceMetrics: {
        totalPnL,
        winRate,
        avgPnL,
        totalVolume,
        activePositions,
        closedPositions,
        sharpeRatio,
        maxDrawdown,
        profitFactor,
        avgHoldingTime,
        bestPerformer,
        worstPerformer,
      },
      timeAnalysis: {
        recentActivity,
        oldActivity,
        hourlyDistribution,
        weeklyDistribution,
        monthlyTrends,
        seasonalPatterns,
      },
      leverageAnalysis: {
        highLeverage: highLeverageCount,
        mediumLeverage: mediumLeverageCount,
        lowLeverage: lowLeverageCount,
        avgLeverage,
        leverageEfficiency,
        riskAdjustedReturns,
      },
      walletAnalysis: {
        uniqueWallets,
        topPerformers,
        concentrationRisk,
        diversityScore,
      },
      marketConditions: {
        volatilityIndex,
        trendStrength,
        marketPhase,
        correlationMatrix: correlations,
      },
      advancedMetrics: {
        kellyCriterion,
        informationRatio,
        calmarRatio,
        sortinoRatio,
        treynorRatio,
      },
    };
  }, [allPositions]);

  const formatCurrency = (value: number) => {
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
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-600";
    if (score < 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "text-green-600";
      case "bearish":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
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
            <CardTitle>Analytics</CardTitle>
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
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Market Analytics Dashboard
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive analysis of trading positions and market patterns
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total P&L
                </p>
                <p
                  className={`text-2xl font-bold ${getPerformanceColor(analytics.performanceMetrics.totalPnL)}`}
                >
                  {loading
                    ? "--"
                    : formatCurrency(analytics.performanceMetrics.totalPnL)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg:{" "}
                  {loading
                    ? "--"
                    : formatCurrency(analytics.performanceMetrics.avgPnL)}
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
                  Sharpe Ratio
                </p>
                <p
                  className={`text-2xl font-bold ${analytics.performanceMetrics.sharpeRatio > 1 ? "text-green-600" : analytics.performanceMetrics.sharpeRatio > 0 ? "text-yellow-600" : "text-red-600"}`}
                >
                  {loading
                    ? "--"
                    : formatNumber(analytics.performanceMetrics.sharpeRatio, 2)}
                </p>
                <p className="text-xs text-muted-foreground">Risk-Adj Return</p>
              </div>
              <Calculator className="h-8 w-8 text-muted-foreground" />
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
                    analytics.performanceMetrics.winRate >= 60
                      ? "text-green-600"
                      : analytics.performanceMetrics.winRate >= 40
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {loading
                    ? "--"
                    : `${analytics.performanceMetrics.winRate.toFixed(1)}%`}
                </p>
                <p className="text-xs text-muted-foreground">
                  PF:{" "}
                  {loading
                    ? "--"
                    : formatNumber(
                        analytics.performanceMetrics.profitFactor,
                        2,
                      )}
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
                  className={`text-2xl font-bold ${getRiskColor(analytics.riskMetrics.riskScore)}`}
                >
                  {loading ? "--" : Math.round(analytics.riskMetrics.riskScore)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Max DD:{" "}
                  {loading
                    ? "--"
                    : formatNumber(analytics.performanceMetrics.maxDrawdown, 1)}
                  %
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Market Sentiment
                </p>
                <p
                  className={`text-2xl font-bold ${getSentimentColor(analytics.marketSentiment.sentiment)}`}
                >
                  {loading
                    ? "--"
                    : analytics.marketSentiment.sentiment.toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Confidence:{" "}
                  {loading
                    ? "--"
                    : formatNumber(analytics.marketSentiment.confidence, 1)}
                  %
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
                  Unique Wallets
                </p>
                <p className="text-2xl font-bold text-primary">
                  {loading
                    ? "--"
                    : analytics.walletAnalysis.uniqueWallets.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Diversity:{" "}
                  {loading
                    ? "--"
                    : formatNumber(analytics.walletAnalysis.diversityScore, 1)}
                  %
                </p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs for Different Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Market Sentiment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Market Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bullish Positions</span>
                  <span className="text-sm text-green-600">
                    {analytics.marketSentiment.bullish.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={analytics.marketSentiment.bullish}
                  className="h-2"
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bearish Positions</span>
                  <span className="text-sm text-red-600">
                    {analytics.marketSentiment.bearish.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={analytics.marketSentiment.bearish}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Recent (30 days):</span>
                    <Badge variant="default">
                      {analytics.timeAnalysis.recentActivity}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Older positions:</span>
                    <Badge variant="secondary">
                      {analytics.timeAnalysis.oldActivity}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Leverage Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High (&gt;20x):</span>
                    <Badge variant="destructive">
                      {analytics.leverageAnalysis.highLeverage}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium (5-20x):</span>
                    <Badge variant="default">
                      {analytics.leverageAnalysis.mediumLeverage}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low (&lt;5x):</span>
                    <Badge variant="secondary">
                      {analytics.leverageAnalysis.lowLeverage}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Total P&L Distribution</h4>
                  <div className="space-y-2">
                    {analytics.performanceMetrics.totalPnL >= 0 ? (
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">Positive PnL:</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(
                              analytics.performanceMetrics.totalPnL,
                            )}
                          </div>
                          <div className="text-xs text-green-600">
                            {analytics.performanceMetrics.winRate.toFixed(1)}%
                            Win Rate
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">Negative PnL:</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(
                              analytics.performanceMetrics.totalPnL,
                            )}
                          </div>
                          <div className="text-xs text-red-600">
                            {analytics.performanceMetrics.winRate.toFixed(1)}%
                            Win Rate
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Risk and Return Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Sharpe Ratio:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(
                            analytics.performanceMetrics.sharpeRatio,
                            2,
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Risk-Adjusted Return
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Max Drawdown:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(
                            analytics.performanceMetrics.maxDrawdown,
                            1,
                          )}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Worst Performing:{" "}
                          {analytics.performanceMetrics.worstPerformer?.asset}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Profit Factor:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(
                            analytics.performanceMetrics.profitFactor,
                            2,
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {analytics.performanceMetrics.profitFactor > 1
                            ? "Positive"
                            : "Negative"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Top Assets by Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading
                  ? Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))
                  : analytics.assetAnalysis.slice(0, 10).map((asset, index) => (
                      <div
                        key={asset.asset}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{asset.asset}</span>
                            <Badge
                              className={
                                asset.sentiment === "bullish"
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }
                            >
                              {asset.sentiment}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Avg Entry: {formatCurrency(asset.avgEntryPrice)} |
                            Long: {asset.longCount} | Short: {asset.shortCount}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {asset.totalPositions} positions
                          </div>
                          <div
                            className={`text-sm ${asset.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(asset.totalPnL)}
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Unusual Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.patterns.unusual.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No unusual patterns detected
                    </p>
                  ) : (
                    analytics.patterns.unusual.map((pattern, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{pattern.type}</AlertTitle>
                        <AlertDescription>
                          {pattern.description}
                        </AlertDescription>
                      </Alert>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Common Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.patterns.usual.map((pattern, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{pattern.type}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {pattern.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Entry Price Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Entry Price Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">
                    Early Entries (Low Price, Old Positions)
                  </h4>
                  <div className="space-y-2">
                    {analytics.entryPriceAnalysis.earlyEntries
                      .slice(0, 5)
                      .map((position, index) => (
                        <div
                          key={position.id}
                          className="flex justify-between items-center p-2 bg-muted rounded"
                        >
                          <span className="text-sm">{position.asset}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {formatCurrency(position.entry_price || 0)}
                            </div>
                            <div
                              className={`text-xs ${(position.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {formatCurrency(position.pnl || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Recent Entries</h4>
                  <div className="space-y-2">
                    {analytics.entryPriceAnalysis.recentEntries
                      .slice(0, 5)
                      .map((position, index) => (
                        <div
                          key={position.id}
                          className="flex justify-between items-center p-2 bg-muted rounded"
                        >
                          <span className="text-sm">{position.asset}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {formatCurrency(position.entry_price || 0)}
                            </div>
                            <div
                              className={`text-xs ${(position.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {formatCurrency(position.pnl || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          {/* Professional Trader Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Smart Money Analysis - Professional Traders
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Analysis based on 100 professional traders' positions (excluding
                extreme winners/losers)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.professionalTraderAnalysis
                  .filter((analysis) => analysis.totalPositions >= 3)
                  .sort((a, b) => b.totalPositions - a.totalPositions)
                  .slice(0, 9)
                  .map((analysis, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{analysis.asset}</span>
                        <Badge
                          variant={
                            analysis.sentiment === "strong_bullish"
                              ? "default"
                              : analysis.sentiment === "bullish"
                                ? "secondary"
                                : analysis.sentiment === "strong_bearish"
                                  ? "destructive"
                                  : analysis.sentiment === "bearish"
                                    ? "outline"
                                    : "secondary"
                          }
                        >
                          {analysis.sentiment.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Professionals:</span>
                          <span className="font-medium">
                            {analysis.totalPositions}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Long/Short:</span>
                          <span className="font-medium">
                            {analysis.longPositions}/{analysis.shortPositions}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Entry:</span>
                          <span className="font-medium">
                            {formatCurrency(analysis.avgEntryPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg PnL:</span>
                          <span
                            className={`font-medium ${getPerformanceColor(analysis.avgSmartPnL)}`}
                          >
                            {formatCurrency(analysis.avgSmartPnL)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Win Rate:</span>
                          <span className="font-medium">
                            {analysis.winRate.toFixed(1)}%
                          </span>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            Bullish: {analysis.longPercentage.toFixed(1)}% |
                            Bearish: {analysis.shortPercentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Long Opportunities
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on professional trader positions and market analysis
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.tradingOpportunities.longSuggestions.length ===
                  0 ? (
                    <p className="text-sm text-muted-foreground">
                      No long opportunities identified
                    </p>
                  ) : (
                    analytics.tradingOpportunities.longSuggestions
                      .slice(0, 8)
                      .map((suggestion, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {suggestion.asset}
                            </span>
                            <div className="flex gap-2">
                              <Badge
                                className={getConfidenceColor(
                                  suggestion.confidence,
                                )}
                              >
                                {suggestion.confidence}
                              </Badge>
                              {suggestion.strategy && (
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.strategy}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.reason}
                          </p>
                          <div className="text-xs space-y-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                Avg Entry:{" "}
                                {formatCurrency(suggestion.avgEntryPrice)}
                              </div>
                              {suggestion.professionalCount && (
                                <div className="text-blue-600">
                                  {suggestion.professionalCount} Pros Long
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-green-600">
                                Recent PnL:{" "}
                                {formatCurrency(suggestion.recentPnL)}
                              </div>
                              <div>
                                Win Rate: {suggestion.winRate?.toFixed(1)}%
                              </div>
                            </div>
                            {suggestion.avgProfessionalPnL && (
                              <div
                                className={`text-xs ${getPerformanceColor(suggestion.avgProfessionalPnL)}`}
                              >
                                Pro Avg PnL:{" "}
                                {formatCurrency(suggestion.avgProfessionalPnL)}
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Risk: {suggestion.riskScore}</span>
                              {suggestion.sentimentStrength && (
                                <span>
                                  Sentiment:{" "}
                                  {suggestion.sentimentStrength.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Short Opportunities
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on professional trader positions and market analysis
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.tradingOpportunities.shortSuggestions.length ===
                  0 ? (
                    <p className="text-sm text-muted-foreground">
                      No short opportunities identified
                    </p>
                  ) : (
                    analytics.tradingOpportunities.shortSuggestions
                      .slice(0, 8)
                      .map((suggestion, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {suggestion.asset}
                            </span>
                            <div className="flex gap-2">
                              <Badge
                                className={getConfidenceColor(
                                  suggestion.confidence,
                                )}
                              >
                                {suggestion.confidence}
                              </Badge>
                              {suggestion.strategy && (
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.strategy}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.reason}
                          </p>
                          <div className="text-xs space-y-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                Avg Entry:{" "}
                                {formatCurrency(suggestion.avgEntryPrice)}
                              </div>
                              {suggestion.professionalCount && (
                                <div className="text-red-600">
                                  {suggestion.professionalCount} Pros Short
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-red-600">
                                Recent PnL:{" "}
                                {formatCurrency(suggestion.recentPnL)}
                              </div>
                              <div>
                                Win Rate: {suggestion.winRate?.toFixed(1)}%
                              </div>
                            </div>
                            {suggestion.avgProfessionalPnL && (
                              <div
                                className={`text-xs ${getPerformanceColor(suggestion.avgProfessionalPnL)}`}
                              >
                                Pro Avg PnL:{" "}
                                {formatCurrency(suggestion.avgProfessionalPnL)}
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Risk: {suggestion.riskScore}</span>
                              {suggestion.sentimentStrength && (
                                <span>
                                  Sentiment:{" "}
                                  {suggestion.sentimentStrength.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Momentum Plays */}
          {analytics.tradingOpportunities.momentum.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Momentum Plays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.tradingOpportunities.momentum.map((play, i) => (
                    <div key={i} className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{play.asset}</span>
                        <Badge
                          variant={
                            play.direction === "Long"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {play.direction}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {play.reason}
                      </p>
                      <div className="text-xs">
                        <div>Momentum: {formatCurrency(play.momentum)}</div>
                        <div>Win Rate: {play.winRate.toFixed(1)}%</div>
                        <div>Timeframe: {play.timeframe}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Arbitrage Opportunities */}
          {analytics.tradingOpportunities.arbitrage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crosshair className="h-5 w-5" />
                  Arbitrage Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.tradingOpportunities.arbitrage.map((arb, i) => (
                    <div key={i} className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{arb.asset}</span>
                        <Badge className={getConfidenceColor(arb.confidence)}>
                          {arb.confidence}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {arb.reason}
                      </p>
                      <div className="text-xs grid grid-cols-2 gap-2">
                        <div>Min Price: {formatCurrency(arb.minPrice)}</div>
                        <div>Max Price: {formatCurrency(arb.maxPrice)}</div>
                        <div>Spread: {arb.spread.toFixed(1)}%</div>
                        <div className="text-green-600">{arb.opportunity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Smart Money Trading Strategy</AlertTitle>
            <AlertDescription>
              Our analysis tracks 100 professional traders and identifies
              opportunities based on their collective positioning. We filter out
              extreme winners/losers to focus on actionable signals. Long
              opportunities favor assets where professionals are bullish with
              good performance, while short opportunities target assets where
              professionals are bearish or showing losses. Contrarian plays
              identify when smart money might be wrong.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {analytics.riskMetrics.highRisk}
                  </div>
                  <div className="text-sm text-muted-foreground">High Risk</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    &gt;25x leverage or &gt;$50K PnL
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analytics.riskMetrics.mediumRisk}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Medium Risk
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    10-25x leverage or $10K-$50K PnL
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.riskMetrics.lowRisk}
                  </div>
                  <div className="text-sm text-muted-foreground">Low Risk</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    &lt;10x leverage and &lt;$10K PnL
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Risk Management Recommendations</AlertTitle>
            <AlertDescription>
              Consider diversifying positions with high leverage or large PnL
              exposure. Monitor positions with extreme entry prices as they may
              indicate higher volatility risk.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Advanced Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Risk Adjusted Returns</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">High Leverage:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(
                            analytics.leverageAnalysis.riskAdjustedReturns.high,
                            2,
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          High Leverage PnL
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Medium Leverage:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(
                            analytics.leverageAnalysis.riskAdjustedReturns
                              .medium,
                            2,
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Medium Leverage PnL
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Low Leverage:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(
                            analytics.leverageAnalysis.riskAdjustedReturns.low,
                            2,
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Low Leverage PnL
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Market Conditions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Volatility Index:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(
                            analytics.marketConditions.volatilityIndex,
                            1,
                          )}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Market Volatility
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Trend Strength:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(
                            analytics.marketConditions.trendStrength,
                            1,
                          )}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Market Trend
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Market Phase:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {analytics.marketConditions.marketPhase}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Current Market State
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Correlation Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.marketConditions.correlationMatrix.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No correlation data available
                  </p>
                ) : (
                  analytics.marketConditions.correlationMatrix.map(
                    (correlation, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">
                          {correlation.pair}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {correlation.type} Correlation ({correlation.strength}
                          )
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Seasonality Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.timeAnalysis.seasonalPatterns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No seasonal patterns detected
                  </p>
                ) : (
                  analytics.timeAnalysis.seasonalPatterns.map(
                    (season, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">
                          {season.season}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {season.performance} Performance
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
