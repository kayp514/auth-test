"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { useSocketAuth } from "@/app/providers/internal/SocketAuthCtx"

export function ConnectionProgress() {
  const { connectionState, authError, keyExchangeError } = useSocketAuth()

  // Calculate progress percentage based on connection state
  const getProgressPercentage = () => {
    switch (connectionState) {
      case "idle":
        return 0
      case "authenticating":
        return 25
      case "exchanging_keys":
        return 50
      case "ready_for_socket":
        return 100
      case "error":
        return 100
      default:
        return 0
    }
  }

  // Get status for each step
  const getAuthStatus = () => {
    if (connectionState === "error" && authError) return "error"
    if (["authenticating", "exchanging_keys", "ready_for_socket"].includes(connectionState)) return "complete"
    if (connectionState === "idle") return "pending"
    return "in_progress"
  }

  const getKeyExchangeStatus = () => {
    if (connectionState === "error" && keyExchangeError) return "error"
    if (["exchanging_keys", "ready_for_socket"].includes(connectionState)) return "in_progress"
    if (connectionState === "ready_for_socket") return "complete"
    return "pending"
  }

  const getConnectionStatus = () => {
    if (connectionState === "ready_for_socket") return "complete"
    return "pending"
  }

  // Render status icon
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-300" />
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Establishing Secure Connection</CardTitle>
        <CardDescription>Setting up an encrypted connection to the chat server</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={getProgressPercentage()} className="h-2" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon status={getAuthStatus()} />
              <span>Authentication</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {getAuthStatus() === "complete"
                ? "Complete"
                : getAuthStatus() === "error"
                  ? "Failed"
                  : getAuthStatus() === "in_progress"
                    ? "In progress"
                    : "Pending"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon status={getKeyExchangeStatus()} />
              <span>Key Exchange</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {getKeyExchangeStatus() === "complete"
                ? "Complete"
                : getKeyExchangeStatus() === "error"
                  ? "Failed"
                  : getKeyExchangeStatus() === "in_progress"
                    ? "In progress"
                    : "Pending"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon status={getConnectionStatus()} />
              <span>WebSocket Connection</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {getConnectionStatus() === "complete" ? "Complete" : "Pending"}
            </span>
          </div>
        </div>

        {(authError || keyExchangeError) && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{authError || keyExchangeError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {connectionState === "ready_for_socket"
          ? "Connection established successfully!"
          : connectionState === "error"
            ? "Connection failed. Please try again."
            : "Please wait while we establish a secure connection..."}
      </CardFooter>
    </Card>
  )
}

