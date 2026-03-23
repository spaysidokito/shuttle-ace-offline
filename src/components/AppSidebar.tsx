import { LayoutGrid, Users, Trophy, DollarSign, Settings, Zap, CalendarDays } from 'lucide-react';
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border elevation-2">
      <SidebarContent>
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-sidebar-border ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-primary/30 rounded-lg blur-md" />
            <div className="relative bg-primary/20 border border-primary/40 rounded-lg p-1.5">
              <Zap className="h-5 w-5 text-primary" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-xl tracking-widest text-foreground leading-none">RallyQ</span>
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">Admin</span>
            </div>
          )}
        </div>

        <SidebarGroup className="pt-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11 p-0">
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-all duration-200 group"
                      activeClassName="bg-primary/15 text-primary border border-primary/20 elevation-1"
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      {!collapsed && <span className="text-sm font-body font-medium tracking-wide">{item.title}</span>}
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
