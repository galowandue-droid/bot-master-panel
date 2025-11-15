import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRequiredChannels } from "@/hooks/useRequiredChannels";
import { Skeleton } from "@/components/ui/skeleton";

interface ChannelSubscriptionCheckProps {
  userId: string;
  onSubscriptionVerified: (verified: boolean) => void;
}

export function ChannelSubscriptionCheck({ userId, onSubscriptionVerified }: ChannelSubscriptionCheckProps) {
  const { channels, checkSubscription } = useRequiredChannels();
  const [checking, setChecking] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    all_subscribed: boolean;
    subscriptions: Record<string, boolean>;
    channels: Array<{ id: string; name: string; username?: string }>;
  } | null>(null);

  const handleCheckSubscription = async () => {
    setChecking(true);
    try {
      const result = await checkSubscription.mutateAsync(userId);
      setSubscriptionStatus(result);
      onSubscriptionVerified(result.all_subscribed);
    } catch (error) {
      console.error("Error checking subscription:", error);
      onSubscriptionVerified(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (channels && channels.length > 0) {
      handleCheckSubscription();
    } else if (channels && channels.length === 0) {
      // No required channels, allow purchase
      onSubscriptionVerified(true);
    }
  }, [channels]);

  if (!channels) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (channels.length === 0) {
    return null;
  }

  if (!subscriptionStatus) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Проверка подписок...</AlertTitle>
        <AlertDescription>
          Проверяем вашу подписку на обязательные каналы
        </AlertDescription>
      </Alert>
    );
  }

  if (subscriptionStatus.all_subscribed) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">
          Подписки подтверждены
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          Вы подписаны на все обязательные каналы
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Требуется подписка на каналы</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>Для покупки необходимо подписаться на следующие каналы:</p>
        <div className="space-y-2">
          {subscriptionStatus.channels.map((channel) => {
            const isSubscribed = subscriptionStatus.subscriptions[channel.id];
            return (
              <div key={channel.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSubscribed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className={isSubscribed ? "text-green-600" : ""}>
                    {channel.name}
                  </span>
                </div>
                {!isSubscribed && channel.username && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={`https://t.me/${channel.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Подписаться <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <Button
          onClick={handleCheckSubscription}
          disabled={checking}
          className="w-full"
        >
          {checking ? "Проверяем..." : "Проверить снова"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
