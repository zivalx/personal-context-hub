import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { adminAPI, topicsAPI } from '@/api/client';
import {
  Users,
  Activity,
  TrendingUp,
  Calendar,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Admin() {
  const [activeItem, setActiveItem] = useState('Admin');
  const [timeRange, setTimeRange] = useState(30);
  const [usersPage, setUsersPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'events'

  // Fetch topics for sidebar
  const { data: topicsData } = useQuery({
    queryKey: ['topics'],
    queryFn: topicsAPI.getAll,
  });

  // Fetch platform analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics', timeRange],
    queryFn: () => adminAPI.getPlatformAnalytics(timeRange),
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', usersPage],
    queryFn: () => adminAPI.getUsers({ page: usersPage, limit: 50 }),
  });

  // Fetch events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events', eventsPage, timeRange],
    queryFn: () => adminAPI.getAllEvents({ page: eventsPage, limit: 100, days: timeRange }),
  });

  const topics = topicsData?.data?.topics || [];
  const analytics = analyticsData?.data || {};
  const overview = analytics.overview || {};
  const users = usersData?.data?.users || [];
  const usersPagination = usersData?.data?.pagination || {};
  const events = eventsData?.data?.events || [];
  const eventsPagination = eventsData?.data?.pagination || {};

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
          title="Admin Panel"
          subtitle="Platform analytics and user management"
          icon={<Shield className="h-6 w-6" />}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Tab Navigation */}
          <div className="mb-6 flex items-center gap-3 border-b border-border">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'ai-gradient-bg' : ''}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('users')}
              className={activeTab === 'users' ? 'ai-gradient-bg' : ''}
            >
              Users
            </Button>
            <Button
              variant={activeTab === 'events' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('events')}
              className={activeTab === 'events' ? 'ai-gradient-bg' : ''}
            >
              Events
            </Button>
          </div>

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

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {analyticsLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading analytics...</p>
                </div>
              ) : (
                <>
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{overview.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          +{overview.newUsers || 0} in last {timeRange} days
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{overview.activeUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          Last {timeRange} days
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Captures</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{overview.totalCaptures || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {overview.totalTopics || 0} topics
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{overview.totalEvents || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          All time activity
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Event Types */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle>Top Event Types</CardTitle>
                      <CardDescription>Most frequent user actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.eventsByType?.length > 0 ? (
                        <div className="space-y-3">
                          {analytics.eventsByType.slice(0, 10).map((event) => {
                            const maxCount = Math.max(...analytics.eventsByType.map((e) => e.count), 1);
                            const percentage = (event.count / maxCount) * 100;
                            return (
                              <div key={event.eventType}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium capitalize">
                                    {event.eventType.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {event.count}
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
                          No event data available
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Users */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Most Active Users</CardTitle>
                      <CardDescription>Top 10 users by activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.topUsers?.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="text-right">Events</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analytics.topUsers.map((user) => (
                              <TableRow key={user.userId}>
                                <TableCell className="font-mono text-sm">{user.email}</TableCell>
                                <TableCell>{user.name || 'N/A'}</TableCell>
                                <TableCell className="text-right font-bold">
                                  {user.eventCount}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No user data available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {usersPagination.total || 0} total users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : users.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Seen</TableHead>
                          <TableHead className="text-right">Activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono text-xs">
                              {user.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateShort(user.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateShort(user.lastSeenAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-xs space-y-1">
                                <div>
                                  {user._count.captures} captures, {user._count.topics} topics
                                </div>
                                <div className="text-muted-foreground">
                                  {user._count.analyticsEvents} events
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {usersPagination.page} of {usersPagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                          disabled={usersPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUsersPage((p) => p + 1)}
                          disabled={usersPage >= usersPagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <Card>
              <CardHeader>
                <CardTitle>All Events</CardTitle>
                <CardDescription>
                  {eventsPagination.total || 0} events in last {timeRange} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading events...</p>
                  </div>
                ) : events.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Event Type</TableHead>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="text-xs">
                              {formatDate(event.createdAt)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {event.user?.email || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {event.eventType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{event.eventName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {event.source || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {eventsPagination.page} of {eventsPagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
                          disabled={eventsPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEventsPage((p) => p + 1)}
                          disabled={!eventsPagination.hasMore}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No events found</p>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
