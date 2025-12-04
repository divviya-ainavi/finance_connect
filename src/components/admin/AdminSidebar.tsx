import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  GraduationCap,
  IdCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const navItems = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Workers', href: '/admin/workers', icon: Users },
  { title: 'Businesses', href: '/admin/businesses', icon: Building2 },
  { 
    title: 'Verification', 
    href: '/admin/verification',
    icon: ShieldCheck,
    children: [
      { title: 'Tests', href: '/admin/verification/tests', icon: GraduationCap },
      { title: 'References', href: '/admin/verification/references', icon: FileText },
      { title: 'ID Checks', href: '/admin/verification/id-checks', icon: IdCard },
      { title: 'Qualifications', href: '/admin/verification/qualifications', icon: GraduationCap },
    ]
  },
  { title: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { title: 'Disputes', href: '/admin/disputes', icon: AlertTriangle },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
  { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const location = useLocation();
  const { signOut } = useAdminAuth();

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <span className="font-semibold text-foreground">Admin Portal</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.href}>
            {item.children ? (
              <>
                <button
                  onClick={() => setExpandedItem(expandedItem === item.title ? null : item.title)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform',
                          expandedItem === item.title && 'rotate-90'
                        )}
                      />
                    </>
                  )}
                </button>
                {!collapsed && expandedItem === item.title && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.href}
                        to={child.href}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )
                        }
                      >
                        <child.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{child.title}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={signOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}
