import { useState, useEffect } from "react";
import { Auth } from "@/api/auth";
import { Shield, User, KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// This app has a single local administrator (no visitor accounts, per the
// standalone/no-cloud design) — so "user management" is simply the admin's
// own account settings: display name + password.
export default function DevUsers() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const me = await Auth.me();
      setAdmin(me);
      setFullName(me.full_name || "");
    } catch (e) {
      toast.error("تعذّر تحميل بيانات الحساب");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("كلمتا المرور الجديدتان غير متطابقتين");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error("كلمة المرور يجب ألا تقل عن 6 أحرف");
      return;
    }
    setSaving(true);
    try {
      await Auth.updateMe({
        full_name: fullName,
        ...(newPassword && { current_password: currentPassword, new_password: newPassword }),
      });
      toast.success("تم حفظ بيانات الحساب ✓");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      load();
    } catch (e) {
      toast.error(e?.data?.message || "تعذّر حفظ التغييرات");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{admin?.username}</p>
          <p className="text-xs text-muted-foreground">حساب المدير الوحيد لهذا الموقع</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> الاسم المعروض
        </h3>
        <div>
          <Label>الاسم الكامل</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" /> تغيير كلمة المرور
        </h3>
        <p className="text-xs text-muted-foreground -mt-2">اتركها فارغة إن كنت لا تريد تغييرها</p>
        <div>
          <Label>كلمة المرور الحالية</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>كلمة المرور الجديدة</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>تأكيد كلمة المرور</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1.5" />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-xl gap-2 font-bold">
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        حفظ التغييرات
      </Button>
    </div>
  );
}
