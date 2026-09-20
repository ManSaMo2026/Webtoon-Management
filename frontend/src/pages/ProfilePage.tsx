import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { CalendarDays, LockKeyhole, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { MainLayout } from "../components/layout/MainLayout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/FormField";
import { useAuth } from "../contexts/AuthContext";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", penName: "", currentPassword: "", newPassword: "", newPasswordConfirm: "" });

  useEffect(() => {
    if (user) setForm((prev) => ({ ...prev, name: user.name, penName: user.penName }));
  }, [user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.newPassword && form.newPassword !== form.newPasswordConfirm) {
      toast.error("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      await updateUser({ name: form.name, penName: form.penName, currentPassword: form.currentPassword || undefined, newPassword: form.newPassword || undefined });
      setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", newPasswordConfirm: "" }));
      toast.success("회원정보가 수정되었습니다.");
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(message || "회원정보 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <MainLayout pageTitle="회원정보">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6"><h2 className="text-xl font-bold">내 계정 관리</h2><p className="mt-1 text-sm text-muted-foreground">프로필 정보와 로그인 비밀번호를 변경할 수 있습니다.</p></div>
        <form onSubmit={submit} className="space-y-5">
          <Card>
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-4"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary"><UserRound size={19} /></span><div><h3 className="text-sm font-bold">기본 정보</h3><p className="text-xs text-muted-foreground">서비스에서 사용할 이름입니다.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><Input label="이름" required value={form.name} onChange={update("name")} /><Input label="작가명" value={form.penName} onChange={update("penName")} placeholder="선택 입력" /><Input className="sm:col-span-2" label="이메일" value={user?.email || ""} disabled hint="이메일은 현재 변경할 수 없습니다." /></div>
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-muted-foreground"><CalendarDays size={14} />가입일 {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("ko-KR") : "-"}</div>
          </Card>
          <Card>
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-4"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary"><LockKeyhole size={19} /></span><div><h3 className="text-sm font-bold">비밀번호 변경</h3><p className="text-xs text-muted-foreground">변경하지 않으려면 아래 항목을 비워두세요.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><Input className="sm:col-span-2" label="현재 비밀번호" type="password" value={form.currentPassword} onChange={update("currentPassword")} autoComplete="current-password" /><Input label="새 비밀번호" type="password" minLength={8} value={form.newPassword} onChange={update("newPassword")} placeholder="8자 이상" autoComplete="new-password" /><Input label="새 비밀번호 확인" type="password" minLength={8} value={form.newPasswordConfirm} onChange={update("newPasswordConfirm")} autoComplete="new-password" /></div>
          </Card>
          <div className="flex justify-end"><Button type="submit" loading={loading}><Save size={15} />변경사항 저장</Button></div>
        </form>
      </div>
    </MainLayout>
  );
}
