import { useState, useEffect } from "react";
import {
  Layers,
  Inbox,
  Bookmark,
  Sparkles,
  Settings,
  Search,
  Plus,
  LogOut,
  BarChart3,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { SearchModal } from "@/components/search/SearchModal";

const baseNavigation = [
  { name: "All Items", icon: Layers, path: "/" },
  { name: "Recent", icon: Inbox, path: "/" },
  { name: "Bookmarks", icon: Bookmark, path: "/" },
  { name: "Analytics", icon: BarChart3, path: "/analytics" },
];

const adminNavigation = [
  { name: "Admin Panel", icon: Shield, path: "/admin", adminOnly: true },
];

export function Sidebar({ activeItem = "All Items", onItemSelect, topics = [], onCreateTopic }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  // Combine navigation items, showing admin panel only for admin users
  const navigation = user?.role === 'admin'
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation;

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg ai-gradient-bg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg leading-tight">youtopical</span>
            <span className="text-xs text-muted-foreground leading-tight">your personal context hub</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted transition-colors text-sm"
        >
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="ml-auto font-mono text-xs bg-background/50 px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
      </div>

      {/* Search Modal */}
      <SearchModal open={showSearch} onOpenChange={setShowSearch} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                onItemSelect?.(item.name);
                navigate(item.path);
              }}
              className={cn(
                "nav-item w-full justify-between",
                activeItem === item.name && "active"
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.name}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Topics Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topics</span>
            {onCreateTopic && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Create Topic button clicked', onCreateTopic);
                  onCreateTopic();
                }}
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Create Topic"
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {topics.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No topics yet</p>
            ) : (
              topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => navigate(`/topic/${topic.id}`)}
                  className="nav-item w-full"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: topic.color || '#3B82F6' }}
                  />
                  <span className="text-sm truncate">{topic.title}</span>
                  {topic._count?.resources > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground font-mono">
                      {topic._count.resources}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {user && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {user.email}
          </div>
        )}
        <button className="nav-item w-full">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="nav-item w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
