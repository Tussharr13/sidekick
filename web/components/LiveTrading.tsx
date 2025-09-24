"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Link,
  Lock,
  Pause,
  Play,
  Shield,
  Unlink,
  Wallet,
} from "lucide-react"

// Props typed structurally to avoid external type dependencies
export interface LiveTradingProps {
  brokerConnected: boolean
  showBrokerDialog: boolean
  setShowBrokerDialog: (open: boolean) => void
  connectBroker: () => Promise<void> | void
  liveAccount: {
    cash: number
    totalValue: number
    dayPnL: number
    totalPnL: number
    buyingPower: number
  }
  riskSettings: {
    maxDailyLoss: number
    maxPositionSize: number
    enableStopLoss: boolean
    emergencyStop: boolean
  }
  setRiskSettings: (next: LiveTradingProps["riskSettings"]) => void
  liveStrategies: Array<{
    id: number
    name: string
    status: string
    allocated: number
    pnl: number
    trades: number
  }>
  deployStrategy: (strategyId: number) => Promise<void> | void
  positions: Array<{
    symbol: string
    shares: number
    avgPrice: number
    currentPrice: number
    pnl: number
    pnlPercent: number
  }>
}

export default function LiveTrading({
  brokerConnected,
  showBrokerDialog,
  setShowBrokerDialog,
  connectBroker,
  liveAccount,
  riskSettings,
  setRiskSettings,
  liveStrategies,
  deployStrategy,
  positions,
}: LiveTradingProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Trading</h2>
          <p className="text-muted-foreground">Execute real trades with your strategies using live market data</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {brokerConnected ? <Link className="h-4 w-4 text-green-600" /> : <Unlink className="h-4 w-4 text-red-600" />}
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
                <div className="rounded-lg border p-3 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <p>
                    Live trading involves real money. Please ensure you understand the risks before proceeding.
                  </p>
                </div>
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
                    <span className={`font-medium ${liveAccount.dayPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {liveAccount.dayPnL >= 0 ? "+" : ""}${liveAccount.dayPnL.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total P&L</span>
                    <span className={`font-medium ${liveAccount.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
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
                      onChange={(e) => setRiskSettings({ ...riskSettings, maxPositionSize: Number(e.target.value) })}
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
                  <div className="rounded-lg border p-3 text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <p>Emergency stop is active. All live trading is paused.</p>
                  </div>
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
                            <p className="text-sm text-muted-foreground">${strategy.allocated.toLocaleString()} allocated</p>
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
                        <Badge variant={strategy.status === "Active" ? "default" : "secondary"}>{strategy.status}</Badge>
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
                      <Play className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium">Deploy New Strategy</p>
                      <p className="text-xs text-muted-foreground">Select a strategy from your library to deploy to live trading</p>
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
                To start live trading, you need to connect your brokerage account. We support major brokers with secure
                API integration.
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
              <div className="rounded-lg border p-3 text-sm flex items-start gap-2 max-w-md mx-auto mb-6">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <p>
                  Live trading involves real money and risk. Please ensure you understand the risks and start with small
                  amounts.
                </p>
              </div>
              <Dialog open={showBrokerDialog} onOpenChange={setShowBrokerDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Link className="h-4 w-4 mr-2" />
                    Connect Broker Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Broker Connection</DialogTitle>
                    <DialogDescription>Connect to your brokerage account for live trading</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="broker-2">Select Broker</Label>
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
                      <Label htmlFor="api-key-2">API Key</Label>
                      <Input id="api-key-2" type="password" placeholder="Enter your API key" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api-secret-2">API Secret</Label>
                      <Input id="api-secret-2" type="password" placeholder="Enter your API secret" />
                    </div>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
