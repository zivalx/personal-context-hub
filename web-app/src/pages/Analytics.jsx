import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { analyticsAPI, topicsAPI } from '@/api/client';
import {
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  Zap,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Analytics() {
  const [activeItem, setActiveItem] = useState('Analytics');
  const [timeRange, setTimeRange] = useState(30); // days

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => analyticsAPI.getOverview(timeRange),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: analyticsAPI.getStats,
  });

  const { data: topicsData } = useQuery({
    queryKey: ['topics'],
    queryFn: topicsAPI.getAll,
  });

  const topics = topicsData?.data?.topics || [];
  const analytics = analyticsData?.data || {};
  const stats = statsData?.data?.stats || {};
  const activity = analytics.activity || {};

  // Calculate statistics
  const totalEvents = analytics.totalEvents || 0;
  const avgEventsPerDay = totalEvents / timeRange || 0;

  // Find most active day and hour
  const mostActiveDay = activity.byDayOfWeek?.reduce((max, curr) =>
    curr.count > max.count ? curr : max, { day: 'N/A', count: 0 }
  );

  const mostActiveHourData = activity.byHour?.map((count, hour) => ({ hour, count })) || [];
  const mostActiveHour = mostActiveHourData.reduce((max, curr) =>
    curr.count > max.count ? curr : max, { hour: 0, count: 0 }
  );

  // Format activity by day for chart
  const activityByDay = Object.entries(activity.byDay || {})
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-14); // Last 14 days

  // Format activity by type
  const activityByType = Object.entries(activity.byType || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5 event types

  const loading = analyticsLoading || statsLoading;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeItem={activeItem}
        onItemSelect={setActiveItem}
        topics={topics}
        onCreateTopic={() => {}}
      />

      <div className="flex-1 flex flex-col">
        <Header
          title="Analytics"
          subtitle={`Your activity over the last ${timeRange} days`}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Time Range Selector */}
          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Time range:</span>
            <div className="flex gap-2">
              {[7, 30, 90].map((days) => (
                <Button
                  key={days}
                  variant={timeRange === days ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(days)}
                  className={timeRange === days ? 'ai-gradient-bg' : ''}
                >
                  {days} days
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Events
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalEvents}</div>
                    <p className="text-xs text-muted-foreground">
                      {avgEventsPerDay.toFixed(1)} per day
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Captures
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCaptures || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {(stats.averageCapturesPerDay || 0).toFixed(1)} per day avg
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Most Active Day
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mostActiveDay?.day || 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">
                      {mostActiveDay?.count || 0} events
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Most Active Hour
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {mostActiveHour.hour}:00
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {mostActiveHour.count} events
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Over Time */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Activity Over Time
                  </CardTitle>
                  <CardDescription>
                    Daily activity for the last 14 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activityByDay.length > 0 ? (
                    <div className="space-y-2">
                      {activityByDay.map(([date, count]) => {
                        const maxCount = Math.max(...activityByDay.map(([, c]) => c), 1);
                        const percentage = (count / maxCount) * 100;
                        return (
                          <div key={date} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-24">
                              {new Date(date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                              <div
                                className="h-full ai-gradient-bg flex items-center justify-end pr-3"
                                style={{ width: `${percentage}%` }}
                              >
                                <span className="text-xs font-medium text-white">
                                  {count}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No activity data available
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Event Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Top Event Types
                    </CardTitle>
                    <CardDescription>
                      Most frequent actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activityByType.length > 0 ? (
                      <div className="space-y-3">
                        {activityByType.map(([type, count]) => {
                          const maxCount = Math.max(...activityByType.map(([, c]) => c), 1);
                          const percentage = (count / maxCount) * 100;
                          return (
                            <div key={type}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium capitalize">
                                  {type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {count}
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No event type data available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Captures by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Captures by Type
                    </CardTitle>
                    <CardDescription>
                      Distribution of capture types
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.capturesByType && Object.keys(stats.capturesByType).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(stats.capturesByType)
                          .sort((a, b) => b[1] - a[1])
                          .map(([type, count]) => {
                            const total = Object.values(stats.capturesByType).reduce((a, b) => a + b, 0);
                            const percentage = ((count / total) * 100).toFixed(1);
                            return (
                              <div key={type}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium capitalize">
                                    {type}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {count} ({percentage}%)
                                  </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full ai-gradient-bg"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No capture type data available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Activity by Hour */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Activity by Hour
                    </CardTitle>
                    <CardDescription>
                      When you're most active
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mostActiveHourData.length > 0 ? (
                      <div className="space-y-1">
                        {mostActiveHourData
                          .filter((item) => item.count > 0)
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 10)
                          .map((item) => {
                            const maxCount = Math.max(...mostActiveHourData.map((h) => h.count), 1);
                            const percentage = (item.count / maxCount) * 100;
                            return (
                              <div key={item.hour} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-16">
                                  {item.hour}:00 - {item.hour}:59
                                </span>
                                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                                  <div
                                    className="h-full bg-primary flex items-center justify-end pr-2"
                                    style={{ width: `${percentage}%` }}
                                  >
                                    {percentage > 15 && (
                                      <span className="text-xs font-medium text-white">
                                        {item.count}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {percentage <= 15 && (
                                  <span className="text-xs text-muted-foreground w-8">
                                    {item.count}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No hourly activity data available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Quick Stats
                    </CardTitle>
                    <CardDescription>
                      Your overall performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Topics</span>
                        <span className="text-xl font-bold">{stats.totalTopics || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Resources</span>
                        <span className="text-xl font-bold">{stats.totalResources || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Searches</span>
                        <span className="text-xl font-bold">{stats.totalSearches || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Active</span>
                        <span className="text-sm font-medium">
                          {stats.lastActiveAt
                            ? new Date(stats.lastActiveAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
