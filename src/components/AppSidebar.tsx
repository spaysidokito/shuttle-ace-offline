import { LayoutGrid, Users, Trophy, DollarSign, Settings, CalendarDays } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Courts', url: '/', icon: LayoutGrid },
  { title: 'Players', url: '/players', icon: Users },
  { title: 'Rankings', url: '/rankings', icon: Trophy },
  { title: 'Fees', url: '/fees', icon: DollarSign },
  { title: 'Sessions', url: '/sessions', icon: CalendarDays },
  { title: 'Settings', url: '/settings', icon: Settings },
];

function RallyQLogo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
      {/* Racket */}
      <ellipse cx="11" cy="11" rx="7" ry="7" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.9"/>
      <line x1="11" y1="8" x2="11" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
      <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
      <line x1="9" y1="9" x2="13" y2="13" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
      <line x1="13" y1="9" x2="9" y2="13" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
      <path d="M15 15L19 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Shuttlecock */}
      <path d="M24 8L21 12L24 13.5L27 12L24 8Z" fill="currentColor" opacity="0.9"/>
      <path d="M21 12L20 15L24 13.5L21 12Z" fill="currentColor" opacity="0.7"/>
      <path d="M27 12L28 15L24 13.5L27 12Z" fill="currentColor" opacity="0.7"/>
      <ellipse cx="24" cy="17" rx="2" ry="2.5" fill="currentColor"/>
    </svg>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className={`flex items-center gap-3 px-4 py-6 border-b border-sidebar-border ${collapsed ? 'justify-center' : ''}`}>
          <div className="text-primary shrink-0">
            <RallyQLogo />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight">RallyQ</span>
              <span className="text-xs text-muted-foreground font-medium">Queue Management</span>
            </div>
          )}
        </div>

        <SidebarGroup className="pt-4">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-3">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors font-medium"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
