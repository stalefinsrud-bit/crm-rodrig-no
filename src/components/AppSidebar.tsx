import {
  LayoutDashboard,
  Users,
  Phone,
  TrendingUp,
  FileText,
  LogOut,
} from "lucide-react";
import rodrigLogo from "@/assets/rodrig-logo.png";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

type NavItem = { title: string; url: string; icon: any };

const navItemsAll: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Companies", url: "/companies", icon: Users },
  { title: "Call Mode", url: "/call-mode", icon: Phone },
  { title: "Forecast", url: "/forecast", icon: TrendingUp },
  { title: "Board Report", url: "/report", icon: FileText },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const { role, loading } = useRole();

  // mens rolle lastes: vis minimal meny (unngår “flash” av admin-lenker)
  const isAdmin = !loading && role === "owner";
  const navItems = isAdmin
    ? navItemsAll
    : navItemsAll.filter((i) => i.url === "/" || i.url === "/report");

  return (
    <Sidebar>
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <img src={rodrigLogo} alt="RodRig" className="h-12 w-auto" />
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground">
            RodRig CRM
          </p>
          <p className="text-xs text-sidebar-foreground/60">AWT</p>
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-xs tracking-wider">
            Navigation
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
