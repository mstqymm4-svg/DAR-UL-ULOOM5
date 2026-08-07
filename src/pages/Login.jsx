import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error("يرجى إدخال كلمة المرور");
      return;
    }
    setLoading(true);
    try {
      await login("admin", password);
      toast.success("تم تسجيل الدخول بنجاح");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || "بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5"
          dir="rtl"
        >
          <div className="text-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">دخول لوحة الإدارة</h1>
            <p className="text-xs text-muted-foreground mt-1">هذه المنطقة مخصصة لمدير الموقع فقط</p>
          </div>

          <div>
            <Label>كلمة المرور</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-9"
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold">
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </Button>

          <Link to="/" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            العودة إلى الموقع
          </Link>
        </form>
      </div>
    </div>
  );
}
