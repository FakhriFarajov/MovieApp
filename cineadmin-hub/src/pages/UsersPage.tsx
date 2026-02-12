import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Ban, CheckCircle } from "lucide-react";
import { fetchActiveBannedUsers, banUser, unbanUser } from "@/api/api";
import { User } from "@/types";
import { toast } from "sonner";

export function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banExpiry, setBanExpiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [banLoading, setBanLoading] = useState(false);
  const [unbanLoading, setUnbanLoading] = useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleBanClick = (user: User) => {
    setSelectedUser(user);
    setBanReason("");
    setBanExpiry("");
    setBanDialogOpen(true);
  };

  const handleBanSubmit = async () => {
    if (!selectedUser || !banReason) return;
    setBanLoading(true);
    try {
      const payload = {
        clientProfileId: selectedUser.id,
        adminProfileId: null,
        reason: banReason,
        expiresAt: banExpiry || null,
      };
      const res = await banUser(payload);

      // Try to find ban data in response, fall back to local generated ban
      const returnedBan = res?.data || res?.ban || res?.activeBan || {
        id: `b${Date.now()}`,
        clientProfileId: selectedUser.id,
        reason: banReason,
        expiresAt: banExpiry || undefined,
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, status: 'banned' as const, ban: returnedBan }
          : u
      ));

      toast.success(`${selectedUser.name} has been banned`);
      setBanDialogOpen(false);
    } catch (err: any) {
      console.error('Ban request failed', err);
      toast.error(err?.message || 'Failed to ban user');
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnban = async (user: User) => {
    setUnbanLoading(true);
    try {
      await unbanUser(user.id);
      setUsers((prev) => prev.map(u =>
        u.id === user.id
          ? { ...u, status: 'active' as const, ban: undefined }
          : u
      ));
      toast.success(`${user.name} has been unbanned`);
    } catch (err: any) {
      console.error('Unban request failed', err);
      toast.error(err?.message || 'Failed to unban user');
    } finally {
      setUnbanLoading(false);
    }
  };

  // Map API user shape to local User type
  const mapApiUserToUser = (u: any): User => {
    const id = u.clientId || u.id || String(u.clientProfileId || "");
    const fullName = [u.name, u.surname].filter(Boolean).join(" ") || u.name || "";
    const isBanned = !!u.isBanned || !!u.activeBanId;
    const banObj = u.activeBanId
      ? ({ id: u.activeBanId, clientProfileId: id, reason: u.reason || "", expiresAt: u.expiresAt, createdAt: u.banCreatedAt || new Date().toISOString() } as any)
      : undefined;

    return {
      id,
      name: fullName,
      email: u.email || "",
      status: isBanned ? "banned" : "active",
      createdAt: u.createdAt || u.dateOfBirth || new Date().toISOString(),
      ban: banObj,
    };
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchActiveBannedUsers();
        if (!mounted) return;
        // API returns array — map to User[] and set
        const mapped = Array.isArray(data) ? data.map(mapApiUserToUser) : [];
        setUsers(mapped);
      } catch (err: any) {
        console.error("Failed to load users:", err);
        toast.error(err?.message || "Failed to fetch users");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const columns = [
    { key: 'name', header: t('name'), render: (user: User) => (
      <div className="font-medium">{user.name}</div>
    )},
    { key: 'email', header: t('email') },
    { key: 'status', header: t('status'), render: (user: User) => (
      <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-banned'}`}>
        {t(user.status as 'active' | 'banned')}
      </span>
    )},
    { key: 'reason', header: t('reason'), render: (user: User) => (
      <span className="text-sm text-muted-foreground">{user.ban?.reason || '-'}</span>
    )},
    { key: 'actions', header: t('actions'), render: (user: User) => (
      <div className="flex gap-2">
        {user.status === 'active' ? (
          <Button variant="outline" size="sm" onClick={() => handleBanClick(user)} className="gap-2 text-destructive hover:text-destructive">
            <Ban className="w-4 h-4" />
            {t('ban')}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => handleUnban(user)} disabled={unbanLoading} className="gap-2 text-success hover:text-success">
            <CheckCircle className="w-4 h-4" />
            {t('unban')}
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title={t('users')}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </PageHeader>

      {loading ? (
        <div className="p-6 text-center text-muted-foreground">Loading users...</div>
      ) : (
        <DataTable columns={columns} data={filteredUsers} keyExtractor={(u) => u.id} />
      )}

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('banUser')}: {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">{t('reason')} *</Label>
              <Textarea
                id="reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter ban reason..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="expiry">{t('expiresAt')}</Label>
              <Input
                id="expiry"
                type="datetime-local"
                value={banExpiry}
                onChange={(e) => setBanExpiry(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleBanSubmit} disabled={!banReason || banLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('ban')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
