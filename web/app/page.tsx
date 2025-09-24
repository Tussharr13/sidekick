"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
  import {
    TrendingUp,
    Activity,
    DollarSign,
    BarChart3,
    Settings,
    Play,
    Pause,
    Plus,
    Trash2,
    Copy,
    ArrowRight,
    Target,
    Shield,
    Calendar,
    Clock,
    Zap,
    Wallet,
    AlertCircle,
    CheckCircle,
    Link,
    Unlink,
    AlertTriangle,
    Lock,
  } from "lucide-react"

  // Types
  type ConditionType = "entry" | "exit"
  interface StrategyCondition {
    id: number
    type: ConditionType
    indicator: string
    condition: string
    value: string
  }

  interface RiskSettings {
    maxDailyLoss: number
    maxPositionSize: number
    enableStopLoss: boolean
    emergencyStop: boolean
  }

  interface PaperPortfolio {
    cash: number
    totalValue: number
    dayPnL: number
    totalPnL: number
  }

  interface Position {
    symbol: string
    shares: number
    avgPrice: number
    currentPrice: number
    pnl: number
    pnlPercent: number
  }

  interface OrderHistoryItem {
    id: number
    symbol: string
    type: "BUY" | "SELL"
    shares: number
    price: number
    time: string
    status: "Filled" | "Pending" | string
  }

  interface LiveAccount {
    cash: number
    totalValue: number
    dayPnL: number
    totalPnL: number
    buyingPower: number
  }

  interface LiveStrategy {
    id: number
    name: string
    status: "Active" | "Paused" | string
    allocated: number
    pnl: number
    trades: number
  }

  interface StrategyRecord {
    id: number
    name: string
    description?: string
    status: "active" | "paused" | "draft" | string
    entry_conditions?: StrategyCondition[]
    exit_conditions?: StrategyCondition[]
    created_at?: string
  }

  interface BacktestTrade {
    symbol: string
    action: "BUY" | "SELL"
    price: number
    date: string
    pnl: number
    status: "Win" | "Loss" | string
  }

  interface BacktestResults {
    totalReturn: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    totalTrades: number
    profitFactor: number
    avgWin: number
    avgLoss: number
    trades: BacktestTrade[]
  }

  interface BacktestRecord {
    id: number
    name: string
    strategy_id: number | null
    start_date: string
    end_date: string
    initial_capital: number
    commission: number
    status: "running" | "completed" | string
    results?: BacktestResults
    created_at?: string
  }

  interface TradeRecord {
    id: number
    symbol: string
    side: "buy" | "sell" | string
    quantity: number
    price: number
    trade_type: string
    created_at?: string
  }

  interface StrategyInput {
    name?: string
    description?: string
    stopLoss?: number
    takeProfit?: number
    positionSize?: number
    status?: string
  }

  interface OrderInput {
    symbol: string
    type: "BUY" | "SELL"
    shares: number
    price: number
  }

export default function TradingDashboard() {
  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const [showStrategyBuilder, setShowStrategyBuilder] = useState<boolean>(false)
  const [showOrderDialog, setShowOrderDialog] = useState<boolean>(false)
  const [showBrokerDialog, setShowBrokerDialog] = useState<boolean>(false)
  const [strategyConditions, setStrategyConditions] = useState<StrategyCondition[]>([
    { id: 1, type: "entry", indicator: "RSI", condition: "crosses_below", value: "30" },
  ])
  const [backtestRunning, setBacktestRunning] = useState<boolean>(false)
  const [backtestProgress, setBacktestProgress] = useState<number>(0)
  const [backtestResults, setBacktestResults] = useState<BacktestResults | null>(null)

  const [paperPortfolio, setPaperPortfolio] = useState<PaperPortfolio>({
    cash: 100000,
    totalValue: 102450.75,
    dayPnL: 1245.5,
    totalPnL: 2450.75,
  })

  const [positions, setPositions] = useState<Position[]>([
    { symbol: "AAPL", shares: 50, avgPrice: 175.23, currentPrice: 178.45, pnl: 161.0, pnlPercent: 1.84 },
    { symbol: "TSLA", shares: 25, avgPrice: 245.89, currentPrice: 242.67, pnl: -80.5, pnlPercent: -1.31 },
    { symbol: "NVDA", shares: 10, avgPrice: 892.34, currentPrice: 915.78, pnl: 234.4, pnlPercent: 2.63 },
  ])

  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([
    { id: 1, symbol: "AAPL", type: "BUY", shares: 25, price: 175.23, time: "10:30 AM", status: "Filled" },
    { id: 2, symbol: "TSLA", type: "SELL", shares: 10, price: 245.89, time: "11:15 AM", status: "Filled" },
    { id: 3, symbol: "NVDA", type: "BUY", shares: 5, price: 892.34, time: "2:45 PM", status: "Pending" },
  ])

  const [brokerConnected, setBrokerConnected] = useState<boolean>(false)
  const [liveAccount, setLiveAccount] = useState<LiveAccount>({
    cash: 25000,
    totalValue: 28450.75,
    dayPnL: 345.5,
    totalPnL: 3450.75,
    buyingPower: 50000,
  })

  const [liveStrategies, setLiveStrategies] = useState<LiveStrategy[]>([
    { id: 1, name: "RSI Momentum", status: "Active", allocated: 5000, pnl: 234.56, trades: 12 },
    { id: 2, name: "Mean Reversion", status: "Paused", allocated: 3000, pnl: -45.23, trades: 8 },
  ])

  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    maxDailyLoss: 1000,
    maxPositionSize: 10000,
    enableStopLoss: true,
    emergencyStop: false,
  })

  const [strategies, setStrategies] = useState<StrategyRecord[]>([])
  const [backtests, setBacktests] = useState<BacktestRecord[]>([])
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (): Promise<void> => {
    try {
      // Load strategies
      const { data: strategiesData } = await supabase
        .from("strategies")
        .select("*")
        .order("created_at", { ascending: false })

      // Load backtests
      const { data: backtestsData } = await supabase
        .from("backtests")
        .select("*")
        .order("created_at", { ascending: false })

      // Load trades
      const { data: tradesData } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      setStrategies((strategiesData as unknown as StrategyRecord[]) || [])
      setBacktests((backtestsData as unknown as BacktestRecord[]) || [])
      setTrades((tradesData as unknown as TradeRecord[]) || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addCondition = (type: ConditionType) => {
    const newCondition = {
      id: Date.now(),
      type,
      indicator: "RSI",
      condition: "crosses_below",
      value: "30",
    }
    setStrategyConditions([...strategyConditions, newCondition])
  }

  const updateCondition = (
    id: number,
    field: keyof Pick<StrategyCondition, "indicator" | "condition" | "value" | "type">,
    value: string | ConditionType,
  ) => {
    setStrategyConditions(
      strategyConditions.map((condition) => (condition.id === id ? { ...condition, [field]: value } : condition)),
    )
  }

  const removeCondition = (id: number) => {
    setStrategyConditions(strategyConditions.filter((condition) => condition.id !== id))
  }

  const saveStrategy = async (strategyData: StrategyInput) => {
    try {
      const { data, error } = await supabase
        .from("strategies")
        .insert([
          {
            name: strategyData.name || "New Strategy",
            description: strategyData.description || "",
            entry_conditions: strategyConditions.filter((c) => c.type === "entry"),
            exit_conditions: strategyConditions.filter((c) => c.type === "exit"),
            risk_management: {
              stop_loss: strategyData.stopLoss || 2,
              take_profit: strategyData.takeProfit || 5,
              position_size: strategyData.positionSize || 10,
            },
            status: "draft",
          },
        ])
        .select()

      if (error) throw error

      console.log("[v0] Strategy saved successfully:", data)
      setShowStrategyBuilder(false)
      loadData() // Reload data
      return data[0]
    } catch (error) {
      console.error("[v0] Error saving strategy:", error)
      const message = error instanceof Error ? error.message : String(error)
      alert("Error saving strategy: " + message)
    }
  }

  const runBacktest = async () => {
    setBacktestRunning(true)
    setBacktestProgress(0)

    try {
      // Simulate backtest progress
      const progressInterval = setInterval(() => {
        setBacktestProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 10
        })
      }, 500)

      // Save backtest to database
      const { data: backtestData, error } = await supabase
        .from("backtests")
        .insert([
          {
            name: "Backtest " + new Date().toLocaleString(),
            strategy_id: strategies[0]?.id || null,
            start_date: "2024-01-01",
            end_date: "2024-12-31",
            initial_capital: 100000,
            commission: 1.0,
            status: "running",
          },
        ])
        .select()

      if (error) throw error

      // Simulate backtest completion after 5 seconds
      setTimeout(async () => {
        const mockResults = {
          totalReturn: 15.67,
          sharpeRatio: 1.45,
          maxDrawdown: -8.23,
          winRate: 68.5,
          totalTrades: 156,
          profitFactor: 1.78,
          avgWin: 2.34,
          avgLoss: -1.45,
          trades: [
            { symbol: "AAPL", action: "BUY", price: 175.23, date: "2024-01-15", pnl: 45.67, status: "Win" },
            { symbol: "TSLA", action: "SELL", price: 245.89, date: "2024-01-16", pnl: -23.45, status: "Loss" },
            { symbol: "NVDA", action: "BUY", price: 892.34, date: "2024-01-17", pnl: 123.45, status: "Win" },
          ],
        } as BacktestResults

        // Update backtest with results
        await supabase
          .from("backtests")
          .update({
            results: mockResults,
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", backtestData[0].id)

        setBacktestResults(mockResults)
        setBacktestRunning(false)
        loadData()
        console.log("[v0] Backtest completed successfully")
      }, 5000)
    } catch (error) {
      console.error("[v0] Error running backtest:", error)
      setBacktestRunning(false)
      const message = error instanceof Error ? error.message : String(error)
      alert("Error running backtest: " + message)
    }
  }

  const executeOrder = async (orderData: OrderInput) => {
    try {
      const { data, error } = await supabase
        .from("trades")
        .insert([
          {
            symbol: orderData.symbol,
            side: orderData.type.toLowerCase(),
            quantity: orderData.shares,
            price: orderData.price,
            trade_type: "paper",
            status: "filled",
            executed_at: new Date().toISOString(),
          },
        ])
        .select()

      if (error) throw error

      console.log("[v0] Paper trade executed:", data)

      // Update local state
      const newOrder = {
        id: data[0].id,
        symbol: orderData.symbol,
        type: orderData.type,
        shares: orderData.shares,
        price: orderData.price,
        time: new Date().toLocaleTimeString(),
        status: "Filled",
      } as OrderHistoryItem

      setOrderHistory([newOrder, ...orderHistory])
      setShowOrderDialog(false)

      // Update portfolio
      const tradeValue = orderData.shares * orderData.price
      if (orderData.type === "BUY") {
        setPaperPortfolio((prev) => ({
          ...prev,
          cash: prev.cash - tradeValue,
          totalValue: prev.totalValue + 50, // Simulate small gain
        }))
      }

      loadData()
    } catch (error) {
      console.error("[v0] Error executing order:", error)
      const message = error instanceof Error ? error.message : String(error)
      alert("Error executing order: " + message)
    }
  }

  const connectBroker = async () => {
    try {
      // Simulate broker connection
      setTimeout(() => {
        setBrokerConnected(true)
        setShowBrokerDialog(false)
        console.log("[v0] Broker connected successfully")
        alert("Broker connected successfully! (Mock connection)")
      }, 2000)
    } catch (error) {
      console.error("[v0] Error connecting broker:", error)
      const message = error instanceof Error ? error.message : String(error)
      alert("Error connecting broker: " + message)
    }
  }

  const deployStrategy = async (strategyId: number) => {
    try {
      const strategy = liveStrategies.find((s) => s.id === strategyId)
      if (!strategy) return

      const newStatus = strategy.status === "Active" ? "Paused" : "Active"

      // Update strategy status in database
      await supabase.from("strategies").update({ status: newStatus.toLowerCase() }).eq("id", strategyId)

      // Update local state
      setLiveStrategies((prev) => prev.map((s) => (s.id === strategyId ? { ...s, status: newStatus } : s)))

      console.log("[v0] Strategy deployment updated:", { strategyId, newStatus })
      loadData()
    } catch (error) {
      console.error("[v0] Error deploying strategy:", error)
      const message = error instanceof Error ? error.message : String(error)
      alert("Error updating strategy: " + message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trading platform...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">TradePro</h1>
              </div>
              <Badge variant="secondary">Beta</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-lg font-semibold text-green-600">$125,430.50</p>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="paper-trading">Paper Trading</TabsTrigger>
            <TabsTrigger value="live-trading">Live Trading</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$125,430.50</div>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2.5% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Strategies</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{strategies.filter((s) => s.status === "active").length}</div>
                  <p className="text-xs text-muted-foreground">{strategies.length} total strategies</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">+$1,234.56</div>
                  <p className="text-xs text-muted-foreground">+0.98% return</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trades.length}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest trades and strategy updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trades.slice(0, 3).map((trade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={trade.side === "buy" ? "default" : "secondary"}>
                          {trade.side.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{trade.symbol}</p>
                          <p className="text-sm text-muted-foreground">{trade.trade_type} trade</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${trade.price}</p>
                        <p className="text-sm text-green-600">+$45.67</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(trade.created_at ?? Date.now()).toLocaleTimeString()}</p>
                    </div>
                  ))}
                  {trades.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent trades. Start trading to see activity here.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Trading Strategies</h2>
                <p className="text-muted-foreground">Create and manage your algorithmic trading strategies</p>
              </div>
              <Dialog open={showStrategyBuilder} onOpenChange={setShowStrategyBuilder}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Strategy
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Strategy Builder</DialogTitle>
                    <DialogDescription>
                      Build your trading strategy using our no-code visual interface
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Strategy Basic Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Strategy Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="strategy-name">Strategy Name</Label>
                            <Input id="strategy-name" placeholder="My Trading Strategy" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="strategy-symbol">Trading Symbol</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select symbol" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AAPL">AAPL</SelectItem>
                                <SelectItem value="TSLA">TSLA</SelectItem>
                                <SelectItem value="NVDA">NVDA</SelectItem>
                                <SelectItem value="MSFT">MSFT</SelectItem>
                                <SelectItem value="GOOGL">GOOGL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="timeframe">Timeframe</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timeframe" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1m">1 Minute</SelectItem>
                                <SelectItem value="5m">5 Minutes</SelectItem>
                                <SelectItem value="15m">15 Minutes</SelectItem>
                                <SelectItem value="1h">1 Hour</SelectItem>
                                <SelectItem value="1d">1 Day</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="position-size">Position Size (%)</Label>
                            <Input id="position-size" type="number" placeholder="10" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Entry Conditions */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-lg">Entry Conditions</CardTitle>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => addCondition("entry")}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Condition
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {strategyConditions
                          .filter((c) => c.type === "entry")
                          .map((condition, index) => (
                            <div key={condition.id} className="flex items-center gap-4 p-4 border rounded-lg">
                              <div className="flex-1 grid grid-cols-4 gap-3">
                                <Select
                                  value={condition.indicator}
                                  onValueChange={(value) => updateCondition(condition.id, "indicator", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="RSI">RSI</SelectItem>
                                    <SelectItem value="MACD">MACD</SelectItem>
                                    <SelectItem value="SMA">Simple MA</SelectItem>
                                    <SelectItem value="EMA">Exponential MA</SelectItem>
                                    <SelectItem value="BB">Bollinger Bands</SelectItem>
                                    <SelectItem value="STOCH">Stochastic</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={condition.condition}
                                  onValueChange={(value) => updateCondition(condition.id, "condition", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="crosses_above">Crosses Above</SelectItem>
                                    <SelectItem value="crosses_below">Crosses Below</SelectItem>
                                    <SelectItem value="greater_than">Greater Than</SelectItem>
                                    <SelectItem value="less_than">Less Than</SelectItem>
                                    <SelectItem value="equals">Equals</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Input
                                  value={condition.value}
                                  onChange={(e) => updateCondition(condition.id, "value", e.target.value)}
                                  placeholder="Value"
                                />

                                <Button size="sm" variant="outline" onClick={() => removeCondition(condition.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        {strategyConditions.filter((c) => c.type === "entry").length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No entry conditions defined. Click "Add Condition" to get started.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Exit Conditions */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-5 w-5 text-red-600" />
                            <CardTitle className="text-lg">Exit Conditions</CardTitle>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => addCondition("exit")}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Condition
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {strategyConditions
                          .filter((c) => c.type === "exit")
                          .map((condition, index) => (
                            <div key={condition.id} className="flex items-center gap-4 p-4 border rounded-lg">
                              <div className="flex-1 grid grid-cols-4 gap-3">
                                <Select
                                  value={condition.indicator}
                                  onValueChange={(value) => updateCondition(condition.id, "indicator", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="RSI">RSI</SelectItem>
                                    <SelectItem value="MACD">MACD</SelectItem>
                                    <SelectItem value="SMA">Simple MA</SelectItem>
                                    <SelectItem value="EMA">Exponential MA</SelectItem>
                                    <SelectItem value="BB">Bollinger Bands</SelectItem>
                                    <SelectItem value="STOCH">Stochastic</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={condition.condition}
                                  onValueChange={(value) => updateCondition(condition.id, "condition", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="crosses_above">Crosses Above</SelectItem>
                                    <SelectItem value="crosses_below">Crosses Below</SelectItem>
                                    <SelectItem value="greater_than">Greater Than</SelectItem>
                                    <SelectItem value="less_than">Less Than</SelectItem>
                                    <SelectItem value="equals">Equals</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Input
                                  value={condition.value}
                                  onChange={(e) => updateCondition(condition.id, "value", e.target.value)}
                                  placeholder="Value"
                                />

                                <Button size="sm" variant="outline" onClick={() => removeCondition(condition.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        {strategyConditions.filter((c) => c.type === "exit").length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No exit conditions defined. Click "Add Condition" to get started.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Risk Management */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg">Risk Management</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                            <Input id="stop-loss" type="number" placeholder="2" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="take-profit">Take Profit (%)</Label>
                            <Input id="take-profit" type="number" placeholder="5" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="max-trades">Max Daily Trades</Label>
                            <Input id="max-trades" type="number" placeholder="10" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="max-loss">Max Daily Loss (%)</Label>
                            <Input id="max-loss" type="number" placeholder="5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setShowStrategyBuilder(false)}>
                        Cancel
                      </Button>
                      <Button variant="outline" onClick={() => saveStrategy({ name: "Draft Strategy" })}>
                        <Copy className="h-4 w-4 mr-2" />
                        Save as Draft
                      </Button>
                      <Button onClick={() => saveStrategy({ name: "New Strategy", status: "active" })}>
                        <Play className="h-4 w-4 mr-2" />
                        Create & Test
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.map((strategy, index) => (
                <Card key={strategy.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <Badge
                        variant={
                          strategy.status === "active"
                            ? "default"
                            : strategy.status === "paused"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {strategy.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Entry Conditions</p>
                        <p className="font-medium">{strategy.entry_conditions?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Exit Conditions</p>
                        <p className="font-medium">{strategy.exit_conditions?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">{new Date(strategy.created_at ?? Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        {strategy.status === "active" ? (
                          <Pause className="h-3 w-3 mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        {strategy.status === "active" ? "Pause" : "Start"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {strategies.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Strategies Yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first trading strategy to get started.</p>
                    <Button onClick={() => setShowStrategyBuilder(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Strategy
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ... existing code for other tabs ... */}
          <TabsContent value="backtest" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Backtesting Engine</h2>
                <p className="text-muted-foreground">Test your strategies against historical market data</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Backtest Configuration */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Backtest Configuration</CardTitle>
                    <CardDescription>Set up your backtest parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="backtest-strategy">Select Strategy</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          {strategies.map((strategy) => (
                            <SelectItem key={strategy.id} value={String(strategy.id)}>
                              {strategy.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backtest-symbol">Trading Symbol</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select symbol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AAPL">AAPL</SelectItem>
                          <SelectItem value="TSLA">TSLA</SelectItem>
                          <SelectItem value="NVDA">NVDA</SelectItem>
                          <SelectItem value="MSFT">MSFT</SelectItem>
                          <SelectItem value="GOOGL">GOOGL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input id="start-date" type="date" defaultValue="2024-01-01" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input id="end-date" type="date" defaultValue="2024-12-31" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="initial-capital">Initial Capital ($)</Label>
                      <Input id="initial-capital" type="number" placeholder="100000" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commission">Commission per Trade ($)</Label>
                      <Input id="commission" type="number" placeholder="1.00" step="0.01" />
                    </div>

                    <Button className="w-full" onClick={runBacktest} disabled={backtestRunning}>
                      {backtestRunning ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Running Backtest...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Backtest
                        </>
                      )}
                    </Button>

                    {backtestRunning && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{backtestProgress}%</span>
                        </div>
                        <Progress value={backtestProgress} className="w-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Backtest Results */}
              <div className="lg:col-span-2 space-y-6">
                {backtestResults ? (
                  <>
                    {/* Performance Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Summary</CardTitle>
                        <CardDescription>Key metrics from your backtest</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-green-600">+{backtestResults.totalReturn}%</div>
                            <p className="text-sm text-muted-foreground">Total Return</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{backtestResults.sharpeRatio}</div>
                            <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{backtestResults.maxDrawdown}%</div>
                            <p className="text-sm text-muted-foreground">Max Drawdown</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{backtestResults.winRate}%</div>
                            <p className="text-sm text-muted-foreground">Win Rate</p>
                          </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{backtestResults.totalTrades}</div>
                            <p className="text-sm text-muted-foreground">Total Trades</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">{backtestResults.profitFactor}</div>
                            <p className="text-sm text-muted-foreground">Profit Factor</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">+{backtestResults.avgWin}%</div>
                            <p className="text-sm text-muted-foreground">Avg Win</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-red-600">{backtestResults.avgLoss}%</div>
                            <p className="text-sm text-muted-foreground">Avg Loss</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Equity Curve Placeholder */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Equity Curve</CardTitle>
                        <CardDescription>Portfolio value over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">Interactive equity curve chart</p>
                            <p className="text-sm text-muted-foreground">Shows portfolio growth over backtest period</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Trade History */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Trade History</CardTitle>
                        <CardDescription>Detailed list of all trades executed during backtest</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {backtestResults.trades.map((trade, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant={trade.action === "BUY" ? "default" : "secondary"}>{trade.action}</Badge>
                                <div>
                                  <p className="font-medium">{trade.symbol}</p>
                                  <p className="text-sm text-muted-foreground">{trade.date}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${trade.price}</p>
                                <p className={`text-sm ${trade.status === "Win" ? "text-green-600" : "text-red-600"}`}>
                                  {trade.pnl > 0 ? "+" : ""}${trade.pnl}
                                </p>
                              </div>
                              <Badge variant={trade.status === "Win" ? "default" : "destructive"}>{trade.status}</Badge>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-center">
                          <Button variant="outline" size="sm">
                            Load More Trades
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Ready to Backtest</h3>
                        <p className="text-muted-foreground mb-4">
                          Configure your backtest parameters and click "Run Backtest" to analyze your strategy's
                          historical performance.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
                          <div className="text-center">
                            <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                            <p className="text-sm font-medium">Historical Data</p>
                            <p className="text-xs text-muted-foreground">5+ years available</p>
                          </div>
                          <div className="text-center">
                            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-1" />
                            <p className="text-sm font-medium">Performance Metrics</p>
                            <p className="text-xs text-muted-foreground">Comprehensive analysis</p>
                          </div>
                          <div className="text-center">
                            <Activity className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                            <p className="text-sm font-medium">Trade Details</p>
                            <p className="text-xs text-muted-foreground">Every transaction</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="paper-trading" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Paper Trading</h2>
                <p className="text-muted-foreground">Practice trading with virtual money in real market conditions</p>
              </div>
              <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Place Order
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Place Paper Trade Order</DialogTitle>
                    <DialogDescription>Execute a virtual trade with simulated market conditions</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="order-symbol">Symbol</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select symbol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AAPL">AAPL - $178.45</SelectItem>
                            <SelectItem value="TSLA">TSLA - $242.67</SelectItem>
                            <SelectItem value="NVDA">NVDA - $915.78</SelectItem>
                            <SelectItem value="MSFT">MSFT - $412.34</SelectItem>
                            <SelectItem value="GOOGL">GOOGL - $142.56</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="order-type">Order Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BUY">BUY</SelectItem>
                            <SelectItem value="SELL">SELL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shares">Shares</Label>
                        <Input id="shares" type="number" placeholder="100" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input id="price" type="number" placeholder="Market Price" step="0.01" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => executeOrder({ symbol: "AAPL", type: "BUY", shares: 25, price: 178.45 })}>
                        Place Order
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Portfolio Overview */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      <CardTitle>Virtual Portfolio</CardTitle>
                    </div>
                    <CardDescription>Your paper trading account balance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Cash Available</span>
                        <span className="font-medium">${paperPortfolio.cash.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Portfolio Value</span>
                        <span className="font-semibold text-lg">${paperPortfolio.totalValue.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Today's P&L</span>
                        <span
                          className={`font-medium ${paperPortfolio.dayPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {paperPortfolio.dayPnL >= 0 ? "+" : ""}${paperPortfolio.dayPnL.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total P&L</span>
                        <span
                          className={`font-medium ${paperPortfolio.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {paperPortfolio.totalPnL >= 0 ? "+" : ""}${paperPortfolio.totalPnL.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Market Data */}
                <Card>
                  <CardHeader>
                    <CardTitle>Live Market Data</CardTitle>
                    <CardDescription>Real-time stock prices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { symbol: "AAPL", price: 178.45, change: 2.34, changePercent: 1.33 },
                        { symbol: "TSLA", price: 242.67, change: -3.22, changePercent: -1.31 },
                        { symbol: "NVDA", price: 915.78, change: 23.44, changePercent: 2.63 },
                        { symbol: "MSFT", price: 412.34, change: 5.67, changePercent: 1.39 },
                        { symbol: "GOOGL", price: 142.56, change: -1.23, changePercent: -0.86 },
                      ].map((stock, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{stock.symbol}</p>
                            <p className="text-sm text-muted-foreground">${stock.price}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-medium ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {stock.change >= 0 ? "+" : ""}
                              {stock.change}
                            </p>
                            <p className={`text-xs ${stock.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {stock.changePercent >= 0 ? "+" : ""}
                              {stock.changePercent}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Positions and Orders */}
              <div className="lg:col-span-2 space-y-6">
                {/* Current Positions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Positions</CardTitle>
                    <CardDescription>Your active paper trading positions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {positions.map((position, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{position.symbol}</p>
                              <p className="text-sm text-muted-foreground">
                                {position.shares} shares @ ${position.avgPrice}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">${position.currentPrice}</p>
                            <p className="text-sm text-muted-foreground">Current Price</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${position.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {position.pnl >= 0 ? "+" : ""}${position.pnl}
                            </p>
                            <p className={`text-sm ${position.pnlPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {position.pnlPercent >= 0 ? "+" : ""}
                              {position.pnlPercent}%
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Close
                          </Button>
                        </div>
                      ))}
                      {positions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No open positions. Place your first paper trade to get started.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Order History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>Recent paper trading orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orderHistory.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={order.type === "BUY" ? "default" : "secondary"}>{order.type}</Badge>
                            <div>
                              <p className="font-medium">{order.symbol}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.shares} shares @ ${order.price}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">{order.time}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {order.status === "Filled" ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : order.status === "Pending" ? (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            ) : null}
                            <Badge variant={order.status === "Filled" ? "default" : "secondary"}>{order.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Chart Placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Performance</CardTitle>
                    <CardDescription>Your paper trading portfolio value over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-muted-foreground">Portfolio performance chart</p>
                        <p className="text-sm text-muted-foreground">Track your virtual trading progress</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Live Trading Tab */}
          <TabsContent value="live-trading" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Live Trading</h2>
                <p className="text-muted-foreground">Execute real trades with your strategies using live market data</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {brokerConnected ? (
                    <Link className="h-4 w-4 text-green-600" />
                  ) : (
                    <Unlink className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${brokerConnected ? "text-green-600" : "text-red-600"}`}>
                    {brokerConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <Dialog open={showBrokerDialog} onOpenChange={setShowBrokerDialog}>
                  <DialogTrigger asChild>
                    <Button variant={brokerConnected ? "outline" : "default"}>
                      {brokerConnected ? "Manage Connection" : "Connect Broker"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Broker Connection</DialogTitle>
                      <DialogDescription>Connect to your brokerage account for live trading</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="broker">Select Broker</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose your broker" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alpaca">Alpaca Markets</SelectItem>
                            <SelectItem value="interactive">Interactive Brokers</SelectItem>
                            <SelectItem value="td">TD Ameritrade</SelectItem>
                            <SelectItem value="schwab">Charles Schwab</SelectItem>
                            <SelectItem value="demo">Demo Broker (Mock)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input id="api-key" type="password" placeholder="Enter your API key" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api-secret">API Secret</Label>
                        <Input id="api-secret" type="password" placeholder="Enter your API secret" />
                      </div>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Live trading involves real money. Please ensure you understand the risks before proceeding.
                        </AlertDescription>
                      </Alert>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowBrokerDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={connectBroker}>{brokerConnected ? "Update Connection" : "Connect"}</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {brokerConnected ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Account Overview */}
                <div className="lg:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <CardTitle>Live Account</CardTitle>
                      </div>
                      <CardDescription>Your real trading account balance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Cash Available</span>
                          <span className="font-medium">${liveAccount.cash.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Buying Power</span>
                          <span className="font-medium">${liveAccount.buyingPower.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Account Value</span>
                          <span className="font-semibold text-lg">${liveAccount.totalValue.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Today's P&L</span>
                          <span
                            className={`font-medium ${liveAccount.dayPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {liveAccount.dayPnL >= 0 ? "+" : ""}${liveAccount.dayPnL.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total P&L</span>
                          <span
                            className={`font-medium ${liveAccount.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {liveAccount.totalPnL >= 0 ? "+" : ""}${liveAccount.totalPnL.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Management */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <CardTitle>Risk Management</CardTitle>
                      </div>
                      <CardDescription>Live trading protection settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="emergency-stop">Emergency Stop</Label>
                          <Switch
                            id="emergency-stop"
                            checked={riskSettings.emergencyStop}
                            onCheckedChange={(checked) => setRiskSettings({ ...riskSettings, emergencyStop: checked })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-daily-loss">Max Daily Loss ($)</Label>
                          <Input
                            id="max-daily-loss"
                            type="number"
                            value={riskSettings.maxDailyLoss}
                            onChange={(e) => setRiskSettings({ ...riskSettings, maxDailyLoss: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-position">Max Position Size ($)</Label>
                          <Input
                            id="max-position"
                            type="number"
                            value={riskSettings.maxPositionSize}
                            onChange={(e) =>
                              setRiskSettings({ ...riskSettings, maxPositionSize: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="stop-loss-enabled">Enable Stop Loss</Label>
                          <Switch
                            id="stop-loss-enabled"
                            checked={riskSettings.enableStopLoss}
                            onCheckedChange={(checked) => setRiskSettings({ ...riskSettings, enableStopLoss: checked })}
                          />
                        </div>
                      </div>
                      {riskSettings.emergencyStop && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>Emergency stop is active. All live trading is paused.</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Live Strategies and Trading */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Live Strategy Deployment */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Live Strategy Deployment</CardTitle>
                      <CardDescription>Deploy and manage your strategies in live trading</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {liveStrategies.map((strategy) => (
                          <div key={strategy.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {strategy.status === "Active" ? (
                                  <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
                                ) : (
                                  <div className="h-2 w-2 bg-gray-400 rounded-full" />
                                )}
                                <div>
                                  <p className="font-medium">{strategy.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    ${strategy.allocated.toLocaleString()} allocated
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className={`font-medium ${strategy.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {strategy.pnl >= 0 ? "+" : ""}${strategy.pnl}
                              </p>
                              <p className="text-sm text-muted-foreground">{strategy.trades} trades</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={strategy.status === "Active" ? "default" : "secondary"}>
                                {strategy.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deployStrategy(strategy.id)}
                                disabled={riskSettings.emergencyStop}
                              >
                                {strategy.status === "Active" ? (
                                  <>
                                    <Pause className="h-3 w-3 mr-1" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3 w-3 mr-1" />
                                    Deploy
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}

                        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                          <div className="space-y-2">
                            <Plus className="h-8 w-8 text-muted-foreground mx-auto" />
                            <p className="text-sm font-medium">Deploy New Strategy</p>
                            <p className="text-xs text-muted-foreground">
                              Select a strategy from your library to deploy to live trading
                            </p>
                            <Button size="sm" variant="outline" disabled={riskSettings.emergencyStop}>
                              Browse Strategies
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live Positions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Live Positions</CardTitle>
                      <CardDescription>Your current live trading positions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {positions.slice(0, 2).map((position, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium">{position.symbol}</p>
                                <p className="text-sm text-muted-foreground">
                                  {position.shares} shares @ ${position.avgPrice}
                                </p>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">${position.currentPrice}</p>
                              <p className="text-sm text-muted-foreground">Current Price</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${position.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {position.pnl >= 0 ? "+" : ""}${position.pnl}
                              </p>
                              <p className={`text-sm ${position.pnlPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {position.pnlPercent >= 0 ? "+" : ""}
                                {position.pnlPercent}%
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" disabled={riskSettings.emergencyStop}>
                                Close
                              </Button>
                              <Button size="sm" variant="outline" disabled={riskSettings.emergencyStop}>
                                Modify
                              </Button>
                            </div>
                          </div>
                        ))}
                        {positions.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No live positions. Deploy strategies to start live trading.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live Trading Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Live Trading Activity</CardTitle>
                      <CardDescription>Recent live trades and strategy actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          {
                            strategy: "RSI Momentum",
                            action: "BUY",
                            symbol: "AAPL",
                            shares: 10,
                            price: 178.45,
                            time: "1 min ago",
                            status: "Filled",
                          },
                          {
                            strategy: "Mean Reversion",
                            action: "SELL",
                            symbol: "TSLA",
                            shares: 5,
                            price: 242.67,
                            time: "3 min ago",
                            status: "Filled",
                          },
                          {
                            strategy: "RSI Momentum",
                            action: "BUY",
                            symbol: "NVDA",
                            shares: 2,
                            price: 915.78,
                            time: "8 min ago",
                            status: "Filled",
                          },
                        ].map((trade, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant={trade.action === "BUY" ? "default" : "secondary"}>{trade.action}</Badge>
                              <div>
                                <p className="font-medium">{trade.symbol}</p>
                                <p className="text-sm text-muted-foreground">{trade.strategy}</p>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">
                                {trade.shares} @ ${trade.price}
                              </p>
                              <p className="text-sm text-muted-foreground">{trade.time}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <Badge variant="default">{trade.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Connect Your Broker</h3>
                    <p className="text-muted-foreground mb-6">
                      To start live trading, you need to connect your brokerage account. We support major brokers with
                      secure API integration.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                      <div className="text-center">
                        <Shield className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm font-medium">Secure Connection</p>
                        <p className="text-xs text-muted-foreground">Bank-level encryption</p>
                      </div>
                      <div className="text-center">
                        <Activity className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="text-sm font-medium">Real-time Trading</p>
                        <p className="text-xs text-muted-foreground">Live market execution</p>
                      </div>
                      <div className="text-center">
                        <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                        <p className="text-sm font-medium">Risk Management</p>
                        <p className="text-xs text-muted-foreground">Built-in protections</p>
                      </div>
                    </div>
                    <Alert className="max-w-md mx-auto mb-6">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Live trading involves real money and risk. Please ensure you understand the risks and start with
                        small amounts.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => setShowBrokerDialog(true)}>
                      <Link className="h-4 w-4 mr-2" />
                      Connect Broker Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>Detailed performance analysis and reports</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
